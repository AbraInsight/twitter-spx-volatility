#!/bin/bash
until sudo python ./scraper.py; do
    echo "'scraper.py' crashed with exit code $?. Restarting..." >&2
    sleep 1
done