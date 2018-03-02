#!/bin/bash

uwsgi --ini uwsgi.ini
systemctl start nginx

