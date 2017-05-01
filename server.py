from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('dashboard.html', page={'title': 'Dashboard'})


@app.route('/docs')
def docs():
    return render_template('docs.html', page={'title': 'Documentation'})

# app.config['TEMPLATES_AUTO_RELOAD'] = True
# app.run()
