import os
import time
import json
import docker
import urllib.request
import datetime
import re

# Configuration
SHARED_SECRET = os.environ.get("JUPYTERHUB_SHARED_SECRET")
WEB_URL = "http://llbridge-web:3000/api/jupyter/report"
INTERVAL = 30  # Seconds
NAME_PREFIX = "llbridge-lab-"

client = docker.from_env()

def unescape_username(name):
    # DockerSpawner escapes non-alphanumeric characters as -XX (hex)
    # We need to reverse this to match our normalized usernames
    try:
        return re.sub(r'-([a-f0-9]{2})', lambda m: chr(int(m.group(1), 16)), name)
    except:
        return name

def calculate_cpu_percent(stats):
    cpu_stats = stats.get("cpu_stats", {})
    precpu_stats = stats.get("precpu_stats", {})
    
    cpu_delta = cpu_stats.get("cpu_usage", {}).get("total_usage", 0) - precpu_stats.get("cpu_usage", {}).get("total_usage", 0)
    system_delta = cpu_stats.get("system_cpu_usage", 0) - precpu_stats.get("system_cpu_usage", 0)
    
    if system_delta > 0 and cpu_delta > 0:
        return (cpu_delta / system_delta) * cpu_stats.get("online_cpus", 1) * 100.0
    return 0.0

def report_metrics(username, cpu, memory):
    payload = {
        "type": "METRICS",
        "username": username,
        "metrics": {
            "cpu": cpu,
            "memory": memory # In MB
        },
        "recordedAt": datetime.datetime.utcnow().isoformat() + "Z"
    }
    
    try:
        req = urllib.request.Request(
            WEB_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {SHARED_SECRET}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            pass
    except Exception as e:
        print(f"Failed to report metrics for {username}: {e}")

def monitor():
    print(f">>> LearnLab Resource Monitor: Starting (Interval: {INTERVAL}s)")
    while True:
        try:
            containers = client.containers.list()
            for container in containers:
                if container.name.startswith(NAME_PREFIX):
                    escaped_name = container.name[len(NAME_PREFIX):]
                    username = unescape_username(escaped_name)
                    try:
                        # Use a small timeout for stats to avoid blocking
                        stats = container.stats(stream=False)
                        cpu_percent = calculate_cpu_percent(stats)
                        mem_usage_bytes = stats.get("memory_stats", {}).get("usage", 0)
                        mem_usage_mb = mem_usage_bytes / (1024 * 1024)
                        
                        report_metrics(username, cpu_percent, mem_usage_mb)
                    except Exception as e:
                        # Silently ignore transient errors for specific containers
                        pass
        except Exception as e:
            print(f"Monitor Loop Error: {e}")
        
        time.sleep(INTERVAL)

if __name__ == "__main__":
    monitor()
