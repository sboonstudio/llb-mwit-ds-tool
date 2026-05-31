FROM jupyterhub/jupyterhub:4

RUN python -m pip install --no-cache-dir dockerspawner==13.0.0

COPY jupyterhub_config.py /opt/jupyterhub/jupyterhub_config.py
COPY llbridge_authenticator.py /opt/jupyterhub/llbridge_authenticator.py

WORKDIR /srv/jupyterhub

ENV PYTHONPATH=/opt/jupyterhub

CMD ["jupyterhub", "-f", "/opt/jupyterhub/jupyterhub_config.py"]
