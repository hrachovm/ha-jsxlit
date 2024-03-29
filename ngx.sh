#!/bin/sh

docker run -d --rm -v $PWD:/usr/share/nginx/html:ro -p 8083:80 nginx:1.25.3-alpine3.18-slim
