#!/bin/bash
echo "This is working..."
cd /home/ruth_heather_jones/twitter-spx-volatility

sudo pip install -r ./requirements.txt

until sudo screen -dm bash -c 'sudo python ./scraper.py'; do
    echo "'scraper.py' crashed with exit code $?. Restarting..." >&2
    sleep 1
done
