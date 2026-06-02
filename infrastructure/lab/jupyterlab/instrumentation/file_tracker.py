import os
import json
import socket
import datetime
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from tornado import web

LOG_SERVER = os.environ.get("LLBRIDGE_LOG_HOST", "llbridge-log-collector")
LOG_PORT = int(os.environ.get("LLBRIDGE_LOG_PORT", 514))

def send_to_syslog(msg_dict):
    try:
        timestamp = datetime.datetime.utcnow().isoformat() + "Z"
        host = socket.gethostname()
        msg_json = json.dumps(msg_dict)
        syslog_msg = f"<14>1 {timestamp} {host} llbridge-file-event {os.getpid()} - - {msg_json}"
        
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(syslog_msg.encode('utf-8'), (LOG_SERVER, LOG_PORT))
        sock.close()
    except:
        pass

class FileEventHandler(APIHandler):
    @web.authenticated
    async def post(self):
        data = self.get_json_body()
        # Events like: open, save, delete
        event_type = data.get("event")
        path = data.get("path")
        
        send_to_syslog({
            "event": f"FILE_{event_type.upper()}",
            "path": path
        })
        self.finish(json.dumps({"status": "ok"}))

def load_jupyter_server_extension(server_app):
    """
    Called when the extension is loaded.
    """
    web_app = server_app.web_app
    host_pattern = ".*$"
    route_pattern = url_path_join(web_app.settings["base_url"], "llbridge", "file-event")
    web_app.add_handlers(host_pattern, [(route_pattern, FileEventHandler)])
    server_app.log.info(">>> LearnLab Bridge File Tracking Extension Loaded")
