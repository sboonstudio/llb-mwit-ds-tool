import os
import json
import socket
import datetime
from IPython import get_ipython

LOG_SERVER = os.environ.get("LLBRIDGE_LOG_HOST", "llbridge-log-collector")
LOG_PORT = int(os.environ.get("LLBRIDGE_LOG_PORT", 514))

def send_log(msg_dict):
    try:
        timestamp = datetime.datetime.utcnow().isoformat() + "Z"
        host = socket.gethostname()
        msg_json = json.dumps(msg_dict)
        # Syslog format
        syslog_msg = f"<14>1 {timestamp} {host} llbridge-notebook {os.getpid()} - - {msg_json}"
        
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(syslog_msg.encode('utf-8'), (LOG_SERVER, LOG_PORT))
        sock.close()
    except Exception as e:
        pass

def post_run_cell(result):
    try:
        msg = {
            "event": "CELL_EXECUTION",
            "code": result.info.raw_cell,
            "success": result.success,
            "execution_count": result.execution_count
        }
        if not result.success and result.error_in_exec:
            msg["error"] = str(result.error_in_exec)
            
        send_log(msg)
    except:
        pass

# Register the hook
ip = get_ipython()
if ip:
    ip.events.register('post_run_cell', post_run_cell)
    print(">>> LearnLab Insight: Notebook tracking active.")
