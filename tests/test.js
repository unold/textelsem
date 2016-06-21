$(document).ready(function() {

    var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";

    // Query for all resolved toponyms that are listed as nearby
    var query = "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>"
    + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
    + "SELECT ?t1 ?t2 ?t1_lat ?t1_lon ?t2_lat ?t2_lon\n"
    + "WHERE { "
    + "  ?t1 higeomes:isSouthOf ?t2 ."
    + "  ?t1 higeomes:hasFindspot ?f1 ."
    + "  ?t2 higeomes:hasFindspot ?f2 ."
    + "  ?f1 higeomes:lat ?t1_lat ."
    + "  ?f1 higeomes:lng ?t1_lon ."
    + "  ?f2 higeomes:lat ?t2_lat ."
    + "  ?f2 higeomes:lng ?t2_lon ."
    + " }";

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

    function callback(data)
    {
        var row = data.results.bindings;
        var distances = [];
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

            distances.push({"dist": turf.distance(coordinate_1, coordinate_2, "kilometers"), "angle": angle});
        }

        distances.sort(function(a,b) {
            return a.dist - b.dist;
        });

        for(var i in distances)
        {
            $('body').append("<div>Distance: "+ distances[i]["dist"] +"-----Angle: "+ distances[i]["angle"] +"</div>");
        }
    }

    function toDegrees (angle)
    {
        return angle * (180 / Math.PI);
    }

    function angleFromCoordinate(lat1, long1, lat2, long2)
    {
        var dLon = (long2 - long1);

        var y = Math.sin(dLon) * Math.cos(lat2);
        var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

        var brng = Math.atan2(y, x);

        brng = toDegrees(brng);
        brng = (brng + 360) % 360;
        brng = 360 - brng;
        brng = brng.toFixed(2) + "%"

        return brng;
    }
});
