(function () {

    var fire = firebase.database();

    // setup
    var graphs = {
        graph: {
            data: [],
            date: '',
            type: 'sum'
        },
        graph2: {
            data: [],
            date: ''
        }
    }

    // call the google charts api loader and callback on ready
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(getData);

    // setup change event on the date select
    $('#date_picker').on('change', function (e) {
        var date = e.target.value;
        if (graphs.graph.date !== date) {
            graphs.graph.date = date;
            getData(date, 'graph');
        }
    });

    // setup change event on the date select
    $('#date_picker2').on('change', function (e) {
        var date = e.target.value;
        if (graphs.graph2.date !== date) {
            graphs.graph2.date = date;
            getData(date, 'graph2');
        }
    });

    $('#type_picker').on('change', function (e) {
        var type = e.target.value;
        if (graphs.graph.type !== type) {
            graphs.graph.type = type;
            setTitle();
            draw();
        }
    });

    function drawAll() {
        draw();
        draw2();
    }

    $(window).on('resize', drawAll);

    /**
     * Get a new set of data from the server (fired on date select change and init load)
     */
    function getData(date, graph_id) {
        // on init we won't have a date so get it manually from the date select
        if (!date) {
            date = '2017-02-27';
        }

        fire.ref('/historic/' + date).once('value', function (snap) {
            if (!graph_id) {
                graphs.graph.data = [];
                graphs.graph2.data = [];
                snap.forEach(function (child) {
                    graphs.graph.data.push(child.val())
                    graphs.graph2.data.push(child.val())
                });
                drawAll();
            } else {
                graphs[graph_id].data = [];
                snap.forEach(function (child) {
                    graphs[graph_id].data.push(child.val())
                });
                if (graph_id === 'graph') {
                    draw()
                } else {
                    draw2();
                }
            }
            setTitle();
        })
    }

    function getDesc(type) {
        switch (type) {
            case 'volatility':
                return 'Index Volatility'
                break;
            case 'sum':
                return 'Tweet Sentiment'
                break;
            case 'num':
                return 'Volume of Tweets'
                break;
            case 'ave':
                return 'Average Sentiment per Tweet'
                break;
            case 'np':
                return 'Linear Regression Prediction'
                break;
            case 'dp':
                return 'Regression Tree Prediction'
                break;
        }
    }

    function getColor(type) {
        switch (type) {
            case 'volatility':
                return 'black'
                break;
            case 'sum':
                return '#8BC34A'
                break;
            case 'num':
                return '#F44336'
                break;
            case 'ave':
                return '#FF9800'
                break;
            case 'np':
                return '#D500F9'
                break;
            case 'dp':
                return '#00838F'
                break;
        }
    }

    function setTitle() {
        var title = 'SPX Volatility and ' + getDesc(graphs.graph.type) + ' by Day';
        $('#graph_title').text(title);
    }

    /**
     * Extract only the data we want to display on the graph from the full data set
     */
    function buildData() {
        var out = [];
        graphs.graph.data.forEach(function (item) {
            var line = [moment.unix(item.timestamp).format("HH:mm") + ':00', item[graphs.graph.type], item['volatility']];
            out.push(line);
        });
        return out;
    }

    function buildData2() {
        var out = [];
        graphs.graph2.data.forEach(function (item) {
            var line = [moment.unix(item.timestamp).format("HH:mm") + ':00', item['volatility'], item['np'], item['dp']];
            out.push(line);
        });
        return out;
    }

    /**
     * draw the graph
     */
    function draw() {
        var builder = new google.visualization.DataTable();
        builder.addColumn('string', 'Time');
        builder.addColumn('number', getDesc(graphs.graph.type));
        builder.addColumn('number', getDesc('volatility'));

        builder.addRows(buildData());

        var options = {
            colors: [getColor(graphs.graph.type), getColor('volatility')],
            hAxis: {
                slantedText: true,
                showTextEvery: 30
            },
            vAxis: {
                gridlines: {
                    count: 11
                },
                viewWindow: {
                    min: -5,
                    max: 5
                }
            },
            chartArea: {
                top: 30,
                bottom: 120,
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

        var chart = new google.visualization.LineChart(document.getElementById('graph'));

        chart.draw(builder, options);
    }

    function draw2() {
        var builder = new google.visualization.DataTable();
        builder.addColumn('string', 'Time');
        builder.addColumn('number', getDesc('volatility'));
        builder.addColumn('number', getDesc('np'));
        builder.addColumn('number', getDesc('dp'));

        builder.addRows(buildData2());

        var options = {
            colors: [getColor('volatility'), getColor('np'), getColor('dp')],
            hAxis: {
                slantedText: true,
                showTextEvery: 30
            },
            chartArea: {
                top: 30,
                bottom: 120,
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

        var chart = new google.visualization.LineChart(document.getElementById('graph2'));

        chart.draw(builder, options);
    }

})();