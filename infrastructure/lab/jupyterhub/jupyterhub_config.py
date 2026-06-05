import os
import stat
from pathlib import Path

from dockerspawner import DockerSpawner
from llbridge_authenticator import LLBridgeAuthenticator


WORKSPACE_UID = 1000
WORKSPACE_GID = 100
PERMISSION_MARKER = ".jupyterhub-permissions-v1"


def env(name, default=None):
    value = os.environ.get(name)

    if (value is None or value == "") and default is not None:
        return default

    if value is None or value == "":
        raise RuntimeError(f"Missing required environment variable: {name}")

    return value


def env_int(name, default):
    return int(env(name, str(default)))


container_workspaces = Path(env("JUPYTERHUB_CONTAINER_WORKSPACES", "/srv/jupyterhub/workspaces"))
host_workspaces = env("JUPYTERHUB_HOST_WORKSPACES")
host_singleuser_config = env("JUPYTERHUB_HOST_SINGLEUSER_CONFIG")
shared_dir = container_workspaces / "shared"
users_dir = container_workspaces / "users"

for directory in (container_workspaces, shared_dir, users_dir):
    try:
        directory.mkdir(parents=True, exist_ok=True)
        directory.chmod(0o755)
    except Exception as e:
        print(f"Warning: Failed to setup directory {directory}: {e}")


def apply_user_ownership(path, directory=False):
    if path.is_symlink():
        return

    try:
        os.chown(path, WORKSPACE_UID, WORKSPACE_GID)
    except (PermissionError, OSError):
        pass

    try:
        mode = stat.S_IMODE(path.stat().st_mode)
        required_bits = 0o700 if directory else 0o600
        path.chmod(mode | required_bits)
    except (FileNotFoundError, PermissionError, OSError):
        pass


def repair_existing_workspace(user_dir):
    marker = user_dir / PERMISSION_MARKER

    if marker.exists():
        apply_user_ownership(marker)
        return

    for root, dirs, files in os.walk(user_dir):
        root_path = Path(root)

        for dirname in dirs:
            apply_user_ownership(root_path / dirname, directory=True)

        for filename in files:
            apply_user_ownership(root_path / filename)

    marker.write_text("ok\n", encoding="utf-8")
    apply_user_ownership(marker)


async def report_usage(type, username, action=None, details=None, metrics=None):
    secret = os.environ.get("JUPYTERHUB_SHARED_SECRET")
    # Use internal service name for communication within Docker
    web_url = "http://llbridge-web:3000"
    api_url = f"{web_url}/api/jupyter/report"
    
    payload = {
        "type": type,
        "username": username,
        "action": action,
        "details": details,
        "metrics": metrics
    }
    
    from tornado.httpclient import AsyncHTTPClient, HTTPRequest
    import json
    
    client = AsyncHTTPClient()
    try:
        req = HTTPRequest(
            api_url,
            method="POST",
            body=json.dumps(payload),
            headers={
                "Authorization": f"Bearer {secret}",
                "Content-Type": "application/json"
            },
            validate_cert=False
        )
        await client.fetch(req)
    except Exception as e:
        print(f"Failed to report usage for {username}: {e}")

async def prepare_user_workspace(spawner):
    auth_state = await spawner.user.get_auth_state()
    role = (auth_state or {}).get("role", "STUDENT")

    # Role-based resource allocation
    if role == "ADMIN":
        spawner.cpu_limit = 4
        spawner.mem_limit = "4G"
    elif role == "COACH":
        spawner.cpu_limit = 2
        spawner.mem_limit = "2G"
    else:
        spawner.cpu_limit = 1
        spawner.mem_limit = "1G"

    username = spawner.user.name
    user_dir = users_dir / username
    user_dir.mkdir(parents=True, exist_ok=True)

    apply_user_ownership(user_dir, directory=True)
    user_dir.chmod(0o770)

    readme = user_dir / "README.md"
    if not readme.exists():
        readme.write_text(
            f"# {username}\n\nThis private folder is mounted as /home/jovyan/work. Role: {role}\n",
            encoding="utf-8",
        )
    apply_user_ownership(readme)
    repair_existing_workspace(user_dir)
    
    # CRITICAL FIX: Remove stale containers to prevent 500 Network errors
    try:
        import docker
        client = docker.from_env()
        container_name = spawner.name_template.format(username=spawner.user.name)
        try:
            stale = client.containers.get(container_name)
            print(f">>> Removing stale container: {container_name}")
            stale.remove(force=True)
        except docker.errors.NotFound:
            pass
    except Exception as e:
        print(f"Cleanup check failed: {e}")

    # Report Lab Spawn
    await report_usage("ACTIVITY", username, action="LAB_SPAWN", details={"role": role})

async def initialize_instrumentation(spawner):
    """Run setup.sh inside the container after it starts"""
    username = spawner.user.name
    try:
        import asyncio
        await asyncio.sleep(5) # Give more time for container to settle
        
        # We need to get the container ID again as it might have changed
        import docker
        client = docker.from_env()
        container_name = spawner.name_template.format(username=spawner.user.name)
        container = client.containers.get(container_name)
        
        exec_res = container.exec_run(
            "/bin/bash /opt/llbridge/instrumentation/setup.sh",
            user="root"
        )
        print(f"Instrumentation initialized for {username}: {exec_res.exit_code}")
    except Exception as e:
        print(f"Failed to initialize instrumentation for {username}: {e}")

async def clean_up_after_stop(spawner):
    username = spawner.user.name
    await report_usage("ACTIVITY", username, action="LAB_STOP")

# ... rest ...

c.JupyterHub.spawner_class = DockerSpawner
c.DockerSpawner.image = env("JUPYTER_SINGLEUSER_IMAGE", "jupyter/datascience-notebook:latest")
c.DockerSpawner.network_name = env("DOCKER_NETWORK_NAME")
c.DockerSpawner.remove = True # Back to default stable behavior
c.DockerSpawner.use_internal_ip = True
c.DockerSpawner.name_template = "llbridge-lab-{username}"
c.DockerSpawner.notebook_dir = "/home/jovyan/work"
c.DockerSpawner.default_url = "/lab"
c.DockerSpawner.volumes = {
    f"{host_workspaces}/users/{{raw_username}}": {
        "bind": "/home/jovyan/work",
        "mode": "rw",
    },
    env("JUPYTERHUB_HOST_SHARED_CONTENT", f"{host_workspaces}/shared"): {
        "bind": "/home/jovyan/shared",
        "mode": "ro",
    },
    f"{host_singleuser_config}/lab-settings/overrides.json": {
        "bind": "/opt/conda/share/jupyter/lab/settings/overrides.json",
        "mode": "ro",
    },
    f"{env('LLBRIDGE_PROJECT_ROOT')}/infrastructure/lab/jupyterlab/instrumentation": {
        "bind": "/opt/llbridge/instrumentation",
        "mode": "ro",
    },
}

c.DockerSpawner.environment = {
    "LLBRIDGE_LOG_HOST": "llbridge-log-collector",
    "LLBRIDGE_LOG_PORT": "514"
}

c.Spawner.pre_spawn_hook = prepare_user_workspace
c.Spawner.post_spawn_hook = initialize_instrumentation
c.Spawner.post_stop_hook = clean_up_after_stop
c.Spawner.default_url = "/lab"
c.Spawner.start_timeout = env_int("JUPYTERHUB_START_TIMEOUT", 900)
c.Spawner.http_timeout = env_int("JUPYTERHUB_HTTP_TIMEOUT", 120)
