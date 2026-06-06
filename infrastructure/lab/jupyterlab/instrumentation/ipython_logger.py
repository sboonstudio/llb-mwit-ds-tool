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
    """
    Attempts to determine the active notebook path by inspecting multiple sources.
    """
    try:
        ip = get_ipython()
        if not hasattr(ip, 'kernel'):
            return "unknown"
            
        # 1. Try ipykernel parent header metadata (Most reliable in Lab)
        parent_msg = ip.kernel.get_parent()
        if parent_msg and 'metadata' in parent_msg:
            metadata = parent_msg['metadata']
            # Check common keys used by different Jupyter versions/frontends
            for key in ['path', 'filename', 'notebook_path']:
                if key in metadata:
                    return metadata[key]
        
        # 2. Try Jupyter Server API (Internal request)
        import urllib.request
        import json
        import ipykernel
        
        try:
            connection_file = os.path.basename(ipykernel.get_connection_file())
            kernel_id = connection_file.split('-', 1)[1].split('.', 1)[0] if '-' in connection_file else None
            
            if kernel_id:
                # Use environment variables to find the right URL and Token
                token = os.environ.get("JUPYTER_TOKEN", os.environ.get("JUPYTERHUB_API_TOKEN", ""))
                prefix = os.environ.get("JUPYTERHUB_SERVICE_PREFIX", "/")
                
                # Single-user server is usually at localhost:8888
                api_url = f"http://localhost:8888{prefix}api/sessions?token={token}"
                
                with urllib.request.urlopen(api_url, timeout=0.3) as response:
                    if response.getcode() == 200:
                        sessions = json.loads(response.read().decode())
                        for session in sessions:
                            if session.get("kernel", {}).get("id") == kernel_id:
                                return session.get("path", "unknown")
        except:
            pass

        # 3. Fallback to relpath from work root
        cwd = os.getcwd()
        work_root = "/home/jovyan/work"
        if cwd.startswith(work_root):
            rel = os.path.relpath(cwd, work_root)
            return rel if rel != "." else "work-root"
        
        return os.path.basename(cwd) or "unknown"
    except:
        return "unknown"

# Global to cache code for current execution
_current_code = "unknown"

def pre_run_cell(info):
    global _current_code
    try:
        _current_code = info.raw_cell
    except:
        _current_code = "unknown"

def post_run_cell(result):
    global _current_code
    try:
        # Prioritize result.info, fallback to cached _current_code
        code_content = _current_code
        if hasattr(result, 'info') and hasattr(result.info, 'raw_cell'):
            code_content = result.info.raw_cell
        
        # If still unknown, try history as last resort
        if code_content == "unknown" and hasattr(get_ipython(), 'history_manager'):
            hist = get_ipython().history_manager.input_hist_raw
            if hist:
                code_content = hist[-1]

        msg = {
            "event": "CELL_EXECUTION",
            "path": get_notebook_path(),
            "code": code_content,
            "success": result.success,
            "execution_count": getattr(result, 'execution_count', -1),
            "cell_id": getattr(result.info, 'cell_id', 'unknown') if hasattr(result, 'info') else 'unknown'
        }
        
        # Handle both execution and compilation (SyntaxError) errors
        error_obj = getattr(result, 'error_in_exec', None) or getattr(result, 'error_before_exec', None)
        
        if not result.success and error_obj:
            msg["error_type"] = type(error_obj).__name__
            msg["error_msg"] = str(error_obj)
            
        send_log(msg)
    except Exception as e:
        sys.stderr.write(f">>> LearnLab Logger Error: {str(e)}\n")
    finally:
        # Reset for next run
        _current_code = "unknown"

# Register hooks
ip = get_ipython()
if ip:
    ip.events.register('pre_run_cell', pre_run_cell)
    ip.events.register('post_run_cell', post_run_cell)
    # Send Heartbeat on startup
    send_log({"event": "KERNEL_START", "kernel": "python3"})
    print(">>> LearnLab Insight: Notebook tracking active.")
