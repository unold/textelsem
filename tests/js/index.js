$(document).ready(function() {

    var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";
    var query = "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>"

    // Query for all resolved toponyms that are listed as nearby
    + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
    + "SELECT ?t1 ?t2 ?t1_lat ?t1_lon ?t2_lat ?t2_lon\n"
    + "WHERE { "
    + "  ?t1 higeomes:isNearOf ?t2 ."
    + "  ?t1 higeomes:hasFindspot ?f1 ."
    + "  ?t2 higeomes:hasFindspot ?f2 ."
    + "  ?f1 higeomes:lat ?t1_lat ."
    + "  ?f1 higeomes:lng ?t1_lon ."
    + "  ?f2 higeomes:lat ?t2_lat ."
    + "  ?f2 higeomes:lng ?t2_lon ."
    + " }";

    var iconStyle = new ol.style.Style({
        image: new ol.style.Icon(({
            anchor: [0.5, 0.5],
            anchorOrigin: 'bottom-right',
            opacity: 0.75,
            src: './img/map-marker-2-xxl.png',
            scale: .1
        }))
    });

    var lineStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            // color: rand_color,
            color: '#000000',
            width: 3
        })
    });

    var map = new ol.Map({
        target: 'map',
    });

    var coords = [];

    $.ajax({
        url: repo,
        dataType: 'jsonp',
        data: {
            queryLn: 'SPARQL',
            query: query,
            Accept: 'application/json'
        },
        success: function(data) {
            var row = data.results.bindings;
            var globe_sphere = new ol.Sphere(6378137);
            var regex_filter = /(toponym)\D\d+/;
            var baghdad = ol.proj.transform([40.3615, 35.7128],"EPSG:4326", "EPSG:3857");


            for(var i in row)
            {
                // Calculate Distance
                var coordinate_1 = ol.proj.transform([parseFloat(row[i].t1_lon.value), parseFloat(row[i].t1_lat.value)], "EPSG:4326", "EPSG:3857");
                var coordinate_2 = ol.proj.transform([parseFloat(row[i].t2_lon.value), parseFloat(row[i].t2_lat.value)], "EPSG:4326", "EPSG:3857");
                var distance = globe_sphere.haversineDistance(coordinate_1, coordinate_2)/1000;

                coords.push([row[i].t1.value, coordinate_1, row[i].t2.value, coordinate_2]);

                $('#table_details').append("<tr><td><div  id='row' class='ui toggle checkbox'><input type='checkbox' value='"+i+"'><label></label></div></td><td>" + "<a href ="+row[i].t1.value + ">" + regex_filter.exec(row[i].t1.value)[0] +"</a></td><td><a href =" +row[i].t2.value + ">" + regex_filter.exec(row[i].t2.value)[0] + "</td><td>" + distance + " km</td></tr>");
            }

            var vectorLayer;
            var lineLayer;
            var features_list = [];
            var line_list = [];

            //Working to add "Select All" funcitonality

            // $("#select_all").checkbox({
            //     onChecked: function() {
            //         if($(this).checkbox('is checked') == true)
            //             $(".ui.checkbox#row").checkbox('set checked');
            //     }
            // });

            $(".ui.checkbox#row").checkbox({
                onChecked: function() {

                    var index = $(this).val();
                    console.log(coords[index][1]);
                    features_list.push(new ol.Feature({
                        geometry: new ol.geom.Point(coords[index][1]),
                        name: coords[index][0]
                    }));
                    features_list.push(new ol.Feature({
                        geometry: new ol.geom.Point(coords[index][3]),
                        name: coords[index][2]
                    }));
                    line_list.push(new ol.Feature({
                        geometry: new ol.geom.LineString([coords[index][1], coords[index][3]]),
                        name: 'Line'
                    }));

                    // console.log(features_list);

                    for(var i in features_list)
                    {
                        features_list[i].setStyle(iconStyle);
                    }

                    for(var i in line_list)
                    {
                        line_list[i].setStyle(lineStyle);
                    }

                    var vectorSource = new ol.source.Vector({
                        features: features_list
                    });

                    var lineSource = new ol.source.Vector({
                        features: line_list
                    });

                    vectorLayer = new ol.layer.Vector({
                        source: vectorSource
                    });

                    lineLayer = new ol.layer.Vector({
                        source: lineSource
                    });


                    map.addLayer(vectorLayer);
                    map.addLayer(lineLayer);

                },

                onUnchecked: function() {
                    vectorLayer.getSource().clear();
                    lineLayer.getSource().clear();
                    features_list = [];
                    line_list = [];


                }
            });


            var osmLayer = new ol.layer.Tile({
                source: new ol.source.OSM()
            });

            var view = new ol.View({
                center: baghdad,
                zoom: 7
            });

            map.addLayer(osmLayer);
            map.setView(view);
        }
    });



});
