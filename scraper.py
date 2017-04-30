import os
import time
from datetime import datetime, timedelta
from threading import Timer
import tweepy
import simplejson as json
from numpy import log10

from firebase import firebase
firebase = firebase.FirebaseApplication('https://twitter-spx-volatility.firebaseio.com/', None)

log = []

# Variables that contains the user credentials to access Twitter API
access_token = "2548477472-9kgCjy3QOzCZeKFnQ3tz5tB3UNbUg59UiUElgkz"
access_token_secret = "sH83F35fZIXHaYP36oIz7onGTlVOmCIjc2hp7teMpL8EX"
consumer_key = "7FKLNfiVrqnLZHXymxo2MBYFI"
consumer_secret = "wNkow5JwIGb3bGkBsvgVAmVOR1KNmLz6RlrtkfkQKRXQNJW1bl"

tweet_collection = []

dictP = ["bottomed", "bull", "buy", "climb", "dip", "helped", "high", "increas", "more", "overs", "positiv", "recover", "rise",
         "up", "call"]
dictN = ["bear", "cloud", "decelera", "decreas", "down", "less", "liquidat", "low", "negativ", "overb", "risk", "sell",
         "small", "sold", "uncertain", "weak"]

def nrmodel(Num):
    if Num == 0:
        return 0
    else:
        model = [
            [1, 0.159043],
            [log10(Num), 0.017836]
        ]
        output = 0
        for entry in model:
            output += float(entry[0] * float(entry[1]))

        return output


def rtmodel(tweet_data):
    structure = {
        'eval': 'Neg',
        'compare': 0.5,
        'lt': {
            'eval': 'Ave',
            'compare': 0.5,
            'lt': {
                'eval': 'Num',
                'compare': 0.5,
                'lt': 0.4625,
                'gte': 0.4939
            },
            'gte': {
                'eval': 'Ave',
                'compare': 1.5,
                'lt': 0.4534,
                'gte': 0.4079
            }
        },
        'gte': {
            'eval': 'Ave',
            'compare': -2.5,
            'lt': 0.1188,
            'gte': 0.5194
        }
    }

    def rec(tweet_data, structure):
        val = tweet_data[structure['eval']]
        if val < structure['compare']:
            n = 'lt'
        else:
            n = 'gte'

        if isinstance(structure[n], float):
            return structure[n]
        else:
            return rec(tweet_data, structure[n])

    return rec(tweet_data, structure)

def isDead():
    global log
    hasFlatlined = True

    for entry in log:
        if entry > 0:
            hasFlatlined = False
            break

    if hasFlatlined == True:
        os._exit(0)

def processing(pro):
    global log
    dt = datetime.now() + timedelta(minutes=1)

    Twit = ",".join(pro)
    Pos = sum(map(Twit.lower().count, (dictP)))
    Neg = sum(map(Twit.lower().count, (dictN)))
    Sum = Pos - Neg
    Num = len(pro)

    if Num != 0:
        Ave = float(Sum) / float(Num)
    else:
        Ave = 0
    
    prediction_daphne = rtmodel({'Ave': Ave, 'Neg': Neg, 'Num': Num, 'Pos': Pos, 'Sum': Sum})
    prediction_natalie = nrmodel(Num)

    log.apend(Num)
    if len(log) > 10:
        log.pop(0)
        isDead()

    firebase.post('/scraper/', {
        'timestamp': time.mktime(dt.timetuple()),
        'count': Num,
        'neg': Neg,
        'pos': Pos,
        'sum': Sum,
        'ave': Ave,
        'dp': prediction_daphne,
        'np': prediction_natalie
    })

def go(flag=False):

    global tweet_collection

    offset = int(time.mktime(datetime.now().timetuple())) % 60
    Timer(60 - offset, go).start()

    # Timer(60, go).start()
    # Timer(1, go).start() #DEBUG!

    # make a copy so we can clear
    temp = tweet_collection[:]
    tweet_collection = []

    if flag == False:
        processing(temp)
    else:
        print 'RUNNING...'


class StdOutListener(tweepy.streaming.StreamListener):

    def on_connect(self):
        offset = int(time.mktime(datetime.now().timetuple())) % 60
        Timer(60 - offset, lambda: go(True)).start()
        # Timer(0, lambda: go(True)).start() #DEBUG!

    def on_data(self, data):
        global tweet_collection
        try:
            json_load = json.loads(data)
            text = json_load["text"].encode(
                "utf-8").replace('\n', ' ').replace('\t', ' ').replace('\r', ' ')
            tweet_collection.append(text)

        except KeyError:
            print data
        return True

    def on_error(self, status):
        print status

# This handles Twitter authetification and the connection to Twitter
# Streaming API
l = StdOutListener()
auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)
stream = tweepy.Stream(auth, l)

# This line filters Twitter streams to capture data by the keywords
stream.filter(languages=["en"], track=['$SPX', '$ES', '$SPY'], async=True)
# stream.filter(languages=["en"], track=['#photography'], async=True) #DEBUG!
print 'INIT....'