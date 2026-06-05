import os
import json
import socket
import datetime
import sys
from IPython import get_ipython

LOG_SERVER = os.environ.get("LLBRIDGE_LOG_HOST", "llbridge-log-collector")
LOG_PORT = int(os.environ.get("LLBRIDGE_LOG_PORT", 514))
USER = os.environ.get("JUPYTERHUB_USER", "unknown")

def send_log(msg_dict):
    try:
        # Inject standard metadata
        msg_dict["user"] = USER
        msg_dict["timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"
        
        timestamp = msg_dict["timestamp"]
        host = socket.gethostname()
        msg_json = json.dumps(msg_dict)
        
        # Syslog format (RFC5424-ish)
        syslog_msg = f"<14>1 {timestamp} {host} llbridge-notebook {os.getpid()} - - {msg_json}"
        
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(syslog_msg.encode('utf-8'), (LOG_SERVER, LOG_PORT))
        sock.close()
    except:
        pass

def get_notebook_path():
    try:
        # Try to get path from ipykernel if available
        import ipykernel
        from notebook.services.contents.filemanager import FileContentsManager
        # This is often complex in Lab, but we can try to guess from env or CWD
        return os.getcwd()
    except:
        return "unknown"

def post_run_cell(result):
    try:
        msg = {
            "event": "CELL_EXECUTION",
            "path": get_notebook_path(),
            "code": result.info.raw_cell,
            "success": result.success,
            "execution_count": result.execution_count,
            "cell_id": getattr(result.info, 'cell_id', 'unknown')
        }
        if not result.success and result.error_in_exec:
            msg["error_type"] = type(result.error_in_exec).__name__
            msg["error_msg"] = str(result.error_in_exec)
            
        send_log(msg)
    except:
        pass

# Register the hook
ip = get_ipython()
if ip:
    ip.events.register('post_run_cell', post_run_cell)
    # Send Heartbeat on startup
    send_log({"event": "KERNEL_START", "kernel": "python3"})
    print(">>> LearnLab Insight: Notebook tracking active.")
