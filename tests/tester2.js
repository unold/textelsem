$(document).ready(function() {

    var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";
    var findspot_regex = /Findspot\/\d+/;
    var toponym_regex = /toponym\W\d+/;

    var findspots = [];
    var toponyms = [];
    var data_var = [];

        /**
     * Grid-light theme for Highcharts JS
     * @author Torstein Honsi
     */

    // Load the fonts
    Highcharts.createElement('link', {
       href: 'https://fonts.googleapis.com/css?family=Dosis:400,600',
       rel: 'stylesheet',
       type: 'text/css'
    }, null, document.getElementsByTagName('head')[0]);

    Highcharts.theme = {
       colors: ["#7cb5ec", "#f7a35c", "#90ee7e", "#7798BF", "#aaeeee", "#ff0066", "#eeaaee",
          "#55BF3B", "#DF5353", "#7798BF", "#aaeeee"],
       chart: {
          backgroundColor: null,
          style: {
             fontFamily: "Dosis, sans-serif"
          }
       },
       title: {
          style: {
             fontSize: '16px',
             fontWeight: 'bold',
             textTransform: 'uppercase'
          }
       },
       tooltip: {
          borderWidth: 0,
          backgroundColor: 'rgba(219,219,216,0.8)',
          shadow: false
       },
       legend: {
          itemStyle: {
             fontWeight: 'bold',
             fontSize: '13px'
          }
       },
       xAxis: {
          gridLineWidth: 1,
          labels: {
             style: {
                fontSize: '12px'
             }
          }
       },
       yAxis: {
          minorTickInterval: 'auto',
          title: {
             style: {
                textTransform: 'uppercase'
             }
          },
          labels: {
             style: {
                fontSize: '12px'
             }
          }
       },
       plotOptions: {
          candlestick: {
             lineColor: '#404048'
          }
       },


       // General
       background2: '#F0F0EA'

    };

    // Apply the theme
    Highcharts.setOptions(Highcharts.theme);

    var query = "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>\n"
            +"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
            +"SELECT ?t1 ?f1 ?kind_label ?pop_label ?category\n"
            +"WHERE {\n"
            +"?f1 higeomes:id ?id .\n"
            +"FILTER NOT EXISTS {\n"
            +"	?f1 higeomes:hasToponym ?t1 .\n"
            +"}\n"
            +"}"

    $.ajax({
        url: repo,
        dataType: 'jsonp',
        data: {
            queryLn: 'SPARQL',
            query: query,
            Accept: 'application/json'
        },
        success: callback

    });

    var query = "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>\n"
            +"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
            +"SELECT ?t1\n"
            +"WHERE {\n"
            +"    ?t1 rdf:type higeomes:Toponym.\n"
            +"  	FILTER NOT EXISTS {\n"
            +"  		?t1 higeomes:hasFindspot ?f1 .\n"
            +"  	}\n"
            +"}"

    $.ajax({
        url: repo,
        dataType: 'jsonp',
        async: false,
        data: {
            queryLn: 'SPARQL',
            query: query,
            Accept: 'application/json'
        },
        success: callback
    });

    function callback(data) {

        var row = data.results.bindings;

        if(row.length > 1000)
        {
            for(var i in row)
            {
                $('#header_details>tr').append("<th>"+ findspot_regex.exec(row[i].f1.value).toString().replace('Findspot/', 'F') +"</th>");
                findspots.push(row[i].f1.value);
            }
        }
        else {
            for(var i in row)
            {
                $('#table_details').append("<tr><td>"+ toponym_regex.exec(row[i].t1.value).toString().replace('toponym-','T') +"</td></tr>");
                toponyms.push(row[i].t1.value);
            }
        }



        for(var i in findspots)
        {
            for(var j in toponyms)
            {
                data_var.push([parseFloat(findspot_regex.exec(findspots[i]).toString().replace('Findspot/', '')), parseFloat(toponym_regex.exec(toponyms[j]).toString().replace('toponym-',''))])
                // data_var.push({'x': parseFloat(findspot_regex.exec(findspots[i]).toString().replace('Findspot/', '')), 'y': parseFloat(toponym_regex.exec(toponyms[j]).toString().replace('toponym-','')), 'r': Math.floor((Math.random() * 100) + 1)})
            }
        }

        if(data_var.length != 0)
            drawchart();

    }

    function drawchart()
    {
        console.log('sup');
        $('#container').highcharts({
            chart: {
                type: 'scatter',
                zoomType: 'xy'
            },
            title: {
                text: 'Probability for Findspots'
            },
            xAxis: {
                title: {
                    enabled: true,
                    text: 'Findspot ID'
                },
                startOnTick: true,
                endOnTick: true,
                showLastLabel: true
            },
            yAxis: {
                title: {
                    text: 'Toponym ID'
                }
            },
            legend: {
                layout: 'vertical',
                align: 'left',
                verticalAlign: 'top',
                x: 100,
                y: 70,
                floating: true,
                backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                borderWidth: 1
            },
            plotOptions: {
                scatter: {
                    marker: {
                        radius: 5,
                        states: {
                            hover: {
                                enabled: true,
                                lineColor: 'rgb(100,100,100)'
                            }
                        }
                    },
                    states: {
                        hover: {
                            marker: {
                                enabled: false
                            }
                        }
                    },
                    tooltip: {
                        headerFormat: '<b>{series.name}</b><br>',
                        pointFormat: '{point.x} cm, {point.y} kg'
                    }
                }
            },
            series: [{
                name: '< 20% Probability',
                color: 'rgba(223, 83, 83, .5)',
                data: data_var.slice(0,20000)
            },
            {
                name: '20% - 40% Probability',
                color: 'rgba(119, 152, 191, .5)',
                data: data_var.slice(20000,40000)
            },
            {
                name: '40% - 60% Probability',
                color: 'rgba(119, 152, 191, .5)',
                data: data_var.slice(40000,60000)
            },
            {
                name: '60% - 80% Probability',
                color: 'rgba(119, 152, 191, .5)',
                data: data_var.slice(60000,80000)
            }]
        });
    }
});
