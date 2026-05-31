import base64
import hashlib
import hmac
import json
import re
import time
from urllib.parse import urlencode, urlsplit, urlunsplit, parse_qsl

from jupyterhub.auth import Authenticator
from jupyterhub.handlers import BaseHandler
from jupyterhub.handlers.login import LogoutHandler
from jupyterhub.utils import url_path_join
from tornado import web
from traitlets import Unicode

USERNAME_PATTERN = re.compile(r"^[a-z0-9][a-z0-9._-]{0,79}$")

def b64url_decode(value):
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode((value + padding).encode("ascii"))

def b64url_encode(value):
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")

class LLBridgeLoginHandler(BaseHandler):
    async def get(self):
        token = self.get_argument("token", "")
        
        # Case 1: No token - User clicked "Sign in" on JupyterHub login page.
        # Redirect them to the Web Application's login endpoint.
        if not token:
            redirect_url = self.authenticator.get_dynamic_url(
                self.authenticator.login_redirect_url,
                host=self.request.host,
                request=self.request
            )
            
            if not redirect_url:
                raise web.HTTPError(500, "Login redirect URL not configured")
                
            self.redirect(redirect_url, permanent=False)
            return

        # Case 2: Token present - User returning from Web Application.
        fresh_login = self.get_argument("fresh", "") == "1"
        payload = self.authenticator.validate_launch_token(token)

        if not payload:
            raise web.HTTPError(403, "Invalid or expired LLBridge launch token")

        username = payload.get("sub")
        role = payload.get("role", "STUDENT")

        current_user = self.current_user
        current_username = getattr(current_user, "name", None)

        if current_username and current_username != username and not fresh_login:
            self.clear_login_cookie()
            query = urlencode({"token": token, "fresh": "1"})
            self.redirect(f"{url_path_join(self.hub.base_url, 'llbridge-login')}?{query}")
            return

        user = await self.login_user({"username": username, "role": role})

        if user is None or user.name != username:
            raise web.HTTPError(403, "JupyterHub login failed")

        self.redirect(url_path_join(self.hub.base_url, "spawn", user.name))

class LLBridgeHomeHandler(BaseHandler):
    async def get(self):
        redirect_url = self.authenticator.get_dynamic_url(
            self.authenticator.home_redirect_url,
            host=self.request.host,
            request=self.request
        )

        if not redirect_url:
            raise web.HTTPError(404)

        self.redirect(redirect_url, permanent=False)

class LLBridgeLogoutHandler(LogoutHandler):
    async def get(self):
        user = self.current_user
        username = getattr(user, "name", "")

        await self.default_handle_logout()

        redirect_url = None
        if username:
            redirect_url = self.authenticator.build_logout_redirect_url(
                username,
                host=self.request.host,
                request=self.request
            )

        if not redirect_url:
            redirect_url = self.authenticator.get_dynamic_url(
                self.authenticator.logout_fallback_redirect_url,
                host=self.request.host,
                request=self.request
            )

        if redirect_url:
            self.redirect(redirect_url, permanent=False)
            return

        await super().render_logout_page()

class LLBridgeAuthenticator(Authenticator):
    shared_secret = Unicode(config=True)
    home_redirect_url = Unicode(config=True)
    login_redirect_url = Unicode(config=True)
    logout_fallback_redirect_url = Unicode(config=True)
    logout_redirect_url = Unicode(config=True)
    login_service = "LearnLab Bridge"

    def login_url(self, base_url):
        return url_path_join(base_url, "llbridge-login")

    def logout_url(self, base_url):
        return url_path_join(base_url, "llbridge-logout")

    def get_handlers(self, app):
        return [
            (r"/home", LLBridgeHomeHandler),
            (r"/llbridge-login", LLBridgeLoginHandler),
            (r"/llbridge-logout", LLBridgeLogoutHandler),
            (r"/logout", LLBridgeLogoutHandler),
        ]

    async def authenticate(self, handler, data=None):
        username = (data or {}).get("username")
        role = (data or {}).get("role", "STUDENT")

        if username and USERNAME_PATTERN.match(username):
            return {
                "name": username,
                "auth_state": {"role": role},
            }

        return None

    def get_dynamic_url(self, base_url, host=None, request=None):
        if not base_url:
            return None

        parts = urlsplit(base_url)

        if not host:
            return base_url

        # Filter out internal Docker hostnames/IPs
        # Hex IDs like 'aaeef1aef37a' or internal names like 'llbridge-web'
        is_internal = (
            host.startswith("llbridge-") or 
            re.match(r"^[a-f0-9]{12}(:\d+)?$", host) or
            host.startswith("172.") or
            host.startswith("10.")
        )
        
        if is_internal:
            return base_url

        # Determine protocol first to correctly identify default ports
        protocol = parts.scheme
        if request:
            # Prefer X-Forwarded-Proto, then the actual request protocol
            protocol = request.headers.get("X-Forwarded-Proto", getattr(request, "protocol", protocol))

        # Compare ports effectively (handling default ports for http/https)
        current_host_parts = host.split(":")
        current_port_str = current_host_parts[1] if len(current_host_parts) > 1 else None
        
        def get_effective_port(port_str, scheme):
            if port_str:
                try:
                    return int(port_str)
                except (ValueError, TypeError):
                    pass
            return 443 if scheme == "https" else 80

        target_port = get_effective_port(parts.port, parts.scheme)
        current_port = get_effective_port(current_port_str, protocol)

        # In local development or cross-service redirects, if the ports are different, 
        # do not swap the host. This prevents redirecting between Hub (e.g. 8000) 
        # and Web (e.g. 3000) incorrectly when they are accessed directly.
        if target_port != current_port:
            return base_url

        protocol = parts.scheme
        if request:
            protocol = request.headers.get("X-Forwarded-Proto", protocol)

        clean_host = host.split("://")[-1]
        return urlunsplit((protocol, clean_host, parts.path, parts.query, parts.fragment))

    def build_logout_redirect_url(self, username, host=None, request=None):
        target_url = self.get_dynamic_url(self.logout_redirect_url, host=host, request=request)
        if not target_url:
            return None

        token = self.create_logout_token(username)
        parts = urlsplit(target_url)
        query = parse_qsl(parts.query, keep_blank_values=True)
        query.append(("token", token))

        return urlunsplit((
            parts.scheme,
            parts.netloc,
            parts.path,
            urlencode(query),
            parts.fragment,
        ))

    def create_logout_token(self, username):
        payload = {
            "sub": username or "unknown",
            "purpose": "logout",
            "exp": int(time.time()) + 120,
        }
        payload_b64 = b64url_encode(json.dumps(payload).encode("utf-8"))
        signature = hmac.new(
            self.shared_secret.encode("utf-8"),
            payload_b64.encode("ascii"),
            hashlib.sha256,
        ).digest()

        return f"{payload_b64}.{b64url_encode(signature)}"

    def validate_launch_token(self, token):
        try:
            payload_b64, signature = token.split(".", 1)
        except ValueError:
            return None

        expected_signature = hmac.new(
            self.shared_secret.encode("utf-8"),
            payload_b64.encode("ascii"),
            hashlib.sha256,
        ).digest()

        if not hmac.compare_digest(b64url_encode(expected_signature), signature):
            return None

        try:
            payload = json.loads(b64url_decode(payload_b64))
        except (json.JSONDecodeError, ValueError):
            return None

        if int(payload.get("exp", 0)) < int(time.time()):
            return None

        username = payload.get("sub")

        if not isinstance(username, str) or not USERNAME_PATTERN.match(username):
            return None

        return payload
