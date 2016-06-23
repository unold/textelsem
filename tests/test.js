$(document).ready(function() {

    $(".ui.dropdown").dropdown({
        onChange: function() {
            var value = $(".ui.dropdown").dropdown('get value');
            var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";

            $.ajax({
                url: repo,
                dataType: 'jsonp',
                data: {
                    queryLn: 'SPARQL',
                    query: query(value),
                    Accept: 'application/json'
                },
                success: callback
        }
    }

    function query_func(condition)
    {

        var options = {
            "nearby": function() {
                return "  ?t1 higeomes:isNearOf ?t2 .";
            },
            "north": function () {
                return "  ?t1 higeomes:isNorthOf ?t2 .";
            },
            "south": function () {
                return "  ?t1 higeomes:isSouthOf ?t2 .";
            },
            "east": function () {
                return "  ?t1 higeomes:isEastOf ?t2 .";
            },
            "west": function() {
                return "  ?t1 higeomes:isWestOf ?t2 .";
            }
        }

        return "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>"
        + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
        + "SELECT ?t1 ?t2 ?t1_lat ?t1_lon ?t2_lat ?t2_lon\n"
        + "WHERE { "
        + options[condition]()
        + "  ?t1 higeomes:hasFindspot ?f1 ."
        + "  ?t2 higeomes:hasFindspot ?f2 ."
        + "  ?f1 higeomes:lat ?t1_lat ."
        + "  ?f1 higeomes:lng ?t1_lon ."
        + "  ?f2 higeomes:lat ?t2_lat ."
        + "  ?f2 higeomes:lng ?t2_lon ."
        + " }";
    }

    var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";

    var s_distances = [];

    $.ajax({
        url: repo,
        dataType: 'jsonp',
        data: {
            queryLn: 'SPARQL',
            query: query,
            Accept: 'application/json'
        },
        success: function(data)
        {
            var row = data.results.bindings;
            var angle;

            for(var i in row)
            {
                // Calculate Distance
                var coordinate_1 = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [parseFloat(row[i].t1_lon.value), parseFloat(row[i].t1_lat.value)]
                    }
                };

                var coordinate_2 = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [parseFloat(row[i].t2_lon.value), parseFloat(row[i].t2_lat.value)]
                    }
                };

                angle = angleFromCoordinate(parseFloat(row[i].t1_lat.value), parseFloat(row[i].t1_lon.value), parseFloat(row[i].t2_lat.value), parseFloat(row[i].t2_lon.value))

                s_distances.push(turf.distance(coordinate_1, coordinate_2, "kilometers"));


            }

            console.log(s_distances);

            s_distances = s_distances.sort(function(a,b) {
                return a- b;
            });

            var ctx = document.getElementById("myChart");
            console.log(s_distances);

            var colors = [];
            var borders = [];
            var labels = [];

            for(var i in s_distances)
            {
                colors.push('rgba(255, 99, 132, 0.2)');
                borders.push('rgba(255, 99, 132, 1)');
                labels.push('No. ' + i);
            }
            var myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Distances (isSouthOf)',
                        data: s_distances,
                        backgroundColor: colors,
                        borderColor: borders,
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero:true
                            }
                        }]
                    }
                }
            });

            function toDegrees (angle)
            {
                return angle * (180 / Math.PI);
            }

            function toRadians (angle)
            {
                return angle * (Math.PI / 180);
            }

            function angleFromCoordinate(lat1, long1, lat2, long2)
            {
                var phi1 = toRadians(lat1);
                var phi2 = toRadians(lat2);
                var lambda1 = toRadians(long1);
                var lambda2 = toRadians(long2);

                var y = Math.sin(lambda2-lambda1) * Math.cos(phi2);
                var x = Math.cos(phi1)*Math.sin(phi2) - Math.sin(phi1)*Math.cos(phi2)*Math.cos(lambda2-lambda1);
                var brng = toDegrees(Math.atan2(y, x)).toFixed(2);

                return brng;
            }

        }
    });


});
