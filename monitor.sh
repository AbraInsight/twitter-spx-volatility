#!/bin/bash
cd /home/ruth_heather_jones/twitter-spx-volatility
sudo -H pip install -r ./requirements.txt

#until sudo screen -dm bash -c 'sudo python ./scraper.py'; do
#    echo "'scraper.py' crashed with exit code $?. Restarting..." >&2
#    sleep 1
#done

#sudo screen -dm
bash -c $(cat <<-ENDOF
until sudo python ./scraper.py; do
    echo "restart"
    sleep 1
done
ENDOF
)
