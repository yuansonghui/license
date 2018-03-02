#!/bin/bash

uwsgi --stop uwsgi.pid
systemctl stop nginx
