#!/bin/sh
set -e
PORT="${PORT:-8080}"
export PORT
# Sadece PORT değiştirilir; nginx $uri / $host değişkenleri bozulmaz
envsubst '${PORT}' < /etc/nginx/template.conf > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
