FROM python:3.11-slim
WORKDIR /srv
COPY cloud/requirements.txt cloud/requirements.txt
RUN pip install --no-cache-dir -r cloud/requirements.txt
COPY cloud cloud
COPY app app
ENV PP_DATA_DIR=/data PORT=8080
EXPOSE 8080
WORKDIR /srv/cloud
# 1 worker keeps SQLite + alert timing simple; threads handle many traps at once
CMD gunicorn -w 1 --threads 8 -t 90 -b 0.0.0.0:${PORT} app:app
