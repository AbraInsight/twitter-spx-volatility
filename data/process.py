import pandas as pd
from datetime import datetime
from numpy import log10

from firebase import firebase
firebase = firebase.FirebaseApplication('https://twitter-spx-volatility.firebaseio.com/', None)

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
            output += float(entry[0]) * float(entry[1])

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

if __name__ == '__main__':

    firebase.delete('/historic/', '')

    stock = pd.read_csv('./sources/full_historic_dataset_with_prediction.csv')
    # stock = pd.read_csv('./sources/small.csv')

    out = {}

    np = 0
    dp = 0

    for row in stock.itertuples():

        if row[1] < 1489276800:
            date = row[1]
        else:
            date = row[1] + 3600

        datestring = datetime.fromtimestamp(date).strftime('%Y-%m-%d')

        Volatility = row[2]
        Neg = row[5] 
        Pos = row[4]
        Num = row[7]
        Sum = row[6]
        Ave = row[8]

        if (datestring in out) == False:
            out[datestring] = []

        out[datestring].append({
            'timestamp': int(date),
            'volatility': float(Volatility),
            'sum': int(Sum),
            'ave': float(Ave),
            'dp': dp,
            'np': np,
            'num': int(Num)
        })

        np = float(nrmodel(Num))
        dp = float(rtmodel({'Ave': Ave, 'Neg': Neg, 'Num': Num, 'Pos': Pos, 'Sum': Sum}))

    firebase.put('','/historic/', out)
    # print out