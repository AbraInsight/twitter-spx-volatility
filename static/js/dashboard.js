(function () {

    var fire = firebase.database();

    var current_period = 30;
    var current_data = [];
    var graphs = [{
        id: 'main',
        columns: ['dp', 'np'],
        colors: ['#00838F', '#D500F9']
    }, {
        id: 'sum',
        columns: ['sum'],
        colors: ['#FF9800']
    }, {
        id: 'num',
        columns: ['count'],
        colors: ['#F44336']
    }, {
        id: 'ave',
        columns: ['ave'],
        colors: ['#673AB7']
    }]

    // call the google charts api loader and callback on ready
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(getData);

    // setup change event on the date select
    $('#period_picker').on('change', function (e) {
        period = e.target.value;
        if (current_period !== period) {
            current_period = parseInt(period);
            getData();
        }
    });

    $(window).on('resize', drawAll);

    function drawAll() {
        graphs.forEach(function (config) {
            draw(config);
        });
    }

    function setWidgetValues() {
        var len = current_data.length;
        if (len) {
            var row = current_data[len - 1];
            var dp = new Big(row['dp']);
            var np = new Big(row['np']);
            $('#dt_box').text(dp.toPrecision(4)); 
            $('#rm_box').text(np.toPrecision(4));
        } else {
            $('#dt_box').text('--');
            $('#rm_box').text('--');
        }
    }

    /**
     * Get a new set of data from the server
     */
    function getData(period) {
        // on init we won't have a date so get it manually from the date select
        if (!period) {
            period = $('#period_picker').val();
        }

        fire.ref('/scraper').off();
        fire.ref('/scraper').limitToLast(parseInt(period) + 1).on('value', function (snap) {
            current_data = [];
            snap.forEach(function (child) {
                current_data.push(child.val())
            });
            setWidgetValues();
            drawAll();
        });
    }

    function getTickInterval() {
        switch (current_period) {
            case 30:
                return 5
                break;
            case 60:
                return 5
                break;
            case 180:
                return 15
                break;
        }
    }

    function getDesc(col) {
        switch (col) {
            case 'dp':
                return 'Regression Tree Prediction';
                break;
            case 'np':
                return 'Linear Regression Prediction'
                break;
            case 'sum':
                return 'Tweet Sentiment'
                break;
            case 'count':
                return 'Volume of Tweets'
                break;
            case 'ave':
                return 'Average Sentiment per Tweet'
                break;
        }
    }

    /**
     * Extract only the data we want to display on the graph from the full data set
     */
    function buildData(config) {
        var out = [];
        current_data.forEach(function (item) {
            var line = [];
            // line.push(moment.unix(item.timestamp).format("HH:mm") + ':00');
            line.push(moment.unix(item.timestamp).format("HH:mm:ss"));
            config.columns.forEach(function (col) {
                line.push(item[col]);
            });
            out.push(line);
        });
        return out;
    }

    /**
     * draw the graph
     */
    function draw(config) {
        var builder = new google.visualization.DataTable();
        builder.addColumn('string', 'Time');

        config.columns.forEach(function (col) {
            builder.addColumn('number', getDesc(col));
        });

        builder.addRows(buildData(config));

        var options = {
            colors: config.colors,
            hAxis: {
                slantedText: true,
                showTextEvery: getTickInterval()
            },
            chartArea: {
                top: 30,
                bottom: config.id === 'main' ? 120 : 80,
                left: 70,
                right: 40,
                width: '100%',
                height: '100%'
            },
            theme: {
                legend: {
                    position: 'bottom'
                }
            }
        };

        var chart = new google.visualization.LineChart(document.getElementById(config.id));

        chart.draw(builder, options);
    }

})();