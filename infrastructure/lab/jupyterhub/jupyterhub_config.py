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
    
    # Report Lab Spawn
    await report_usage("ACTIVITY", username, action="LAB_SPAWN", details={"role": role})

async def clean_up_after_stop(spawner):
    username = spawner.user.name
    
    # Try to collect metrics before full removal if possible
    # For DockerSpawner, we might get last known stats
    metrics = {"cpu": 0, "memory": 0}
    try:
        # Simple placeholder for metric collection
        # In a real scenario, we'd query docker stats before stopping
        pass
    except:
        pass
        
    await report_usage("ACTIVITY", username, action="LAB_STOP")
    await report_usage("METRICS", username, metrics=metrics)


c.JupyterHub.authenticator_class = LLBridgeAuthenticator
c.Authenticator.enable_auth_state = True
c.LLBridgeAuthenticator.shared_secret = env("JUPYTERHUB_SHARED_SECRET")
llbridge_public_base_url = env(
    "LLBRIDGE_PUBLIC_BASE_URL",
    "http://localhost:3000",
).rstrip("/")
c.LLBridgeAuthenticator.home_redirect_url = env(
    "LLBRIDGE_HOME_URL",
    f"{llbridge_public_base_url}/dashboard",
)
c.LLBridgeAuthenticator.login_redirect_url = env(
    "LLBRIDGE_LOGIN_URL",
    f"{llbridge_public_base_url}/api/jupyter/login",
)
c.LLBridgeAuthenticator.logout_fallback_redirect_url = env(
    "LLBRIDGE_LOGOUT_FALLBACK_URL",
    f"{llbridge_public_base_url}/api/jupyter/logout/complete",
)
c.LLBridgeAuthenticator.logout_redirect_url = env(
    "LLBRIDGE_LOGOUT_REDIRECT_URL",
    f"{llbridge_public_base_url}/api/jupyter/logout/complete",
)

c.JupyterHub.bind_url = "http://:8000"
c.JupyterHub.hub_ip = "0.0.0.0"
c.JupyterHub.hub_connect_ip = env("JUPYTERHUB_SERVICE_NAME", "jupyterhub")
c.JupyterHub.cookie_secret_file = "/srv/jupyterhub/jupyterhub_cookie_secret"
c.JupyterHub.db_url = "sqlite:////srv/jupyterhub/jupyterhub.sqlite"
c.JupyterHub.shutdown_on_logout = True

c.JupyterHub.spawner_class = DockerSpawner
c.DockerSpawner.image = env("JUPYTER_SINGLEUSER_IMAGE", "jupyter/datascience-notebook:latest")
c.DockerSpawner.network_name = env("DOCKER_NETWORK_NAME")
c.DockerSpawner.remove = True
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
}

c.Spawner.pre_spawn_hook = prepare_user_workspace
c.Spawner.post_stop_hook = clean_up_after_stop
c.Spawner.default_url = "/lab"
c.Spawner.start_timeout = env_int("JUPYTERHUB_START_TIMEOUT", 900)
c.Spawner.http_timeout = env_int("JUPYTERHUB_HTTP_TIMEOUT", 120)
