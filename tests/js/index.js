$(document).ready(function() {

    var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";

    var resolved_distances = [];
    var resolved_coords = [];
    var unresolved_coords = [];
    var findspot_coordinates = [];

    if (typeof(Number.prototype.toRad) === "undefined") {
        Number.prototype.toRad = function() {
            return this * Math.PI / 180;
        }
    }

    $("#r_dropdown").dropdown({
        onChange: function() {
            var value = $("#r_dropdown").dropdown('get value');
            var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";
            $.ajax({
                url: repo,
                dataType: 'jsonp',
                data: {
                    queryLn: 'SPARQL',
                    query: query_func(value),
                    Accept: 'application/json'
                },
                success: function (data) {

                    var row = data.results.bindings;

                    var regex_filter = /(toponym)\D\d+/;
                    var regex_filter2 = /(Findspot)\/\d+/;
                    var units = "kilometers";
                    var complete = [];

                    $('#toponym_dist_table>#table_details').html("");
                    resolved_coords = [];
                    resolved_distances = [];

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

                        var distance = turf.distance(coordinate_1, coordinate_2, units);
                        var center = turf.midpoint(coordinate_1, coordinate_2);
                        var euro_distance = distance.toFixed(2).replace(/\./g, ',');
                        var point_1 = ol.proj.fromLonLat([parseFloat(row[i].t1_lon.value), parseFloat(row[i].t1_lat.value)]);
                        var point_2 = ol.proj.fromLonLat([parseFloat(row[i].t2_lon.value), parseFloat(row[i].t2_lat.value)]);
                        var euro_angle = angleFromCoordinate(parseFloat(row[i].t1_lat.value), parseFloat(row[i].t1_lon.value), parseFloat(row[i].t2_lat.value), parseFloat(row[i].t2_lon.value)).replace(/\./g, ',');

                        resolved_distances.push(distance);
                        resolved_coords.push([row[i].f1_name.value, [parseFloat(row[i].t1_lon.value), parseFloat(row[i].t1_lat.value)], row[i].f1_country.value, regex_filter.exec(row[i].t1.value)[0], row[i].f2_name.value, [parseFloat(row[i].t2_lon.value), parseFloat(row[i].t2_lat.value)], row[i].f2_country.value, regex_filter.exec(row[i].t2.value)[0], distance, center]);

                        // Add row to table
                        $('#toponym_dist_table>#table_details').append("<tr><td><div id='row' class='ui fitted toggle checkbox'><input type='checkbox' value='"+i+"'><label></label></div></td>"
                        + "<td><a href ="+row[i].t1.value + ">" + row[i].f1_name.value +"</a></td>"
                        + "<td><a href =" +row[i].t2.value + ">" + row[i].f2_name.value + "</td><td>" + euro_distance + " km</td>"
                        + "<td>"+ euro_angle +"&deg</td></tr>");
                    }

                    draw_map(resolved_coords, unresolved_coords, findspot_coordinates, complete)
                }

            });
        }
    });



    $("#n_dropdown").dropdown({
        onChange: function() {

            var value = $("#n_dropdown").dropdown('get value');
            console.log(value);
            var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";
            $.ajax({
                url: repo,
                dataType: 'jsonp',
                data: {
                    queryLn: 'SPARQL',
                    query: query_func2(value),
                    Accept: 'application/json'
                },
                success: function (data) {

                    var row = data.results.bindings;

                    var regex_filter = /(toponym)\D\d+/;
                    var regex_filter2 = /(Findspot)\/\d+/;
                    var units = "kilometers";
                    var complete = [];

                    $('#new_table>#table_details').html("");

                    findspot_coordinates = [];

                    for(var i in row)
                    {

                        if(row[i].hasOwnProperty("f3"))
                        {
                            $("#new_table").addClass("hidden");
                            $("#new_table2").removeClass("hidden");
                            var normal_coords1 = [parseFloat(row[i].t2_lon.value), parseFloat(row[i].t2_lat.value)];
                            var transformed_coords = ol.proj.transform([parseFloat(row[i].t2_lon.value), parseFloat(row[i].t2_lat.value)], "EPSG:4326", "EPSG:3857");
                            var normal_coords2 = [parseFloat(row[i].t3_lon.value), parseFloat(row[i].t3_lat.value)];
                            var transformed_coords2 = ol.proj.transform([parseFloat(row[i].t3_lon.value), parseFloat(row[i].t3_lat.value)], "EPSG:4326", "EPSG:3857");
                            findspot_coordinates.push([regex_filter.exec(row[i].t1.value)[0], transformed_coords, row[i].f2_name.value, normal_coords1, row[i].f2_country.value, row[i].f3_name.value, row[i].f3_country.value, transformed_coords2, normal_coords2]);

                            $('#new_table2>#table_details').append("<tr><td><div id='nrow' class='ui fitted toggle checkbox'><input type='checkbox' value='"+i+"'><label></label></div></td>"
                            + "<td><a href ="+row[i].t1.value + ">" + regex_filter.exec(row[i].t1.value)[0] +"</a></td>"
                            +"<td><a href =" +row[i].f2.value + ">" + row[i].f2_name.value + "</a></td>"
                            + "<td><a href =" +row[i].f3.value + ">" + row[i].f3_name.value + "</a></td></tr>");
                        }

                        else {
                            // Calculate Distance

                            $("#new_table2").addClass("hidden");
                            $("#new_table").removeClass("hidden");

                            // Add row to table
                            var normal_coords1 = [parseFloat(row[i].f2_lon.value), parseFloat(row[i].f2_lat.value)];
                            var transformed_coords = ol.proj.transform([parseFloat(row[i].f2_lon.value), parseFloat(row[i].f2_lat.value)], "EPSG:4326", "EPSG:3857");
                            findspot_coordinates.push([row[i].name.value, transformed_coords, regex_filter.exec(row[i].t1.value)[0], normal_coords1, row[i].country.value, regex_filter.exec(row[i].t2.value)[0]]);

                            $('#new_table>#table_details').append("<tr><td><div id='nrow' class='ui fitted toggle checkbox'><input type='checkbox' value='"+i+"'><label></label></div></td>"
                            + "<td><a href ="+row[i].t1.value + ">" + regex_filter.exec(row[i].t1.value)[0] +"</a></td>"
                            +"<td><a href =" +row[i].t2.value + ">" + regex_filter.exec(row[i].t2.value)[0] + "</a></td>"
                            + "<td><a href =" +row[i].f2.value + ">" + row[i].name.value + "</a></td></tr>");

                        }
                    }

                    draw_map(resolved_coords, unresolved_coords, findspot_coordinates, complete);

                }
            });
        }
    });

    $("#p_dropdown").dropdown({
        onChange: function() {
            console.log($("#p_dropdown").dropdown('get value'))
        }
    });

    function query_func2(condition)
    {
        var options = {
            "nearby": function() {
                return "  ?t1 higeomes:isNearOf ?t2 .";
            },
            "nearbynorth": function () {
                return  "  ?t1 higeomes:isNearOf ?t2 .\n  ?t1 higeomes:isNorthOf ?t3 .\n";
            },
            "nearbysouth": function () {
                return  "  ?t1 higeomes:isNearOf ?t2 .\n  ?t1 higeomes:isSouthOf ?t3 .\n";
            },
            "nearbyeast": function () {
                return  "  ?t1 higeomes:isNearOf ?t2 .\n  ?t1 higeomes:isEastOf ?t3 .\n";
            },
            "nearbywest": function() {
                return "  ?t1 higeomes:isNearOf ?t2 .\n  ?t1 higeomes:isWestOf ?t3 .\n";
            }
        }

        if(condition.length > 6)
        {
            return "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>"
            + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
            + "SELECT ?t1 ?t2 ?t3 ?f1 ?f2 ?f3 ?t2_lat ?t2_lon ?t3_lat ?t3_lon  ?f2_name ?f3_name ?f2_country ?f3_country\n"
            + "WHERE { "
            + options[condition]()
            + "  ?t2 higeomes:hasFindspot ?f2 ."
            + "  ?t3 higeomes:hasFindspot ?f3 ."
            + "  FILTER NOT EXISTS"
            + "  {"
            + "    ?t1 higeomes:hasFindspot ?f1 ."
            + "  }"
            + "  ?f2 higeomes:lat ?t2_lat ."
            + "  ?f2 higeomes:lng ?t2_lon ."
            + "  ?f3 higeomes:lat ?t3_lat ."
            + "  ?f3 higeomes:lng ?t3_lon ."
            + "  ?f2 higeomes:name ?f2_name ."
            + "  ?f3 higeomes:name ?f3_name ."
            + "  ?f2 higeomes:country ?country2 ."
            + "  ?country2 rdfs:label ?f2_country ."
            + "  ?f3 higeomes:country ?country3 ."
            + "  ?country3 rdfs:label ?f3_country ."
            + " }";
        }

        else {
            return "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>"
            + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
            + "SELECT ?t1 ?t2 ?f2 ?f2_lon ?f2_lat ?name ?country\n"
            + "WHERE {"
            + "?t1 higeomes:isNearOf ?t2 ."
            // + options[condition]()
            + "?t2 higeomes:hasFindspot ?f2 ."
            + "?f2 higeomes:country ?c ."
            + "?c rdfs:label ?country ."
            + "FILTER NOT EXISTS"
            + "{"
            +   "?t1 higeomes:hasFindspot ?f1 ."
            + "}"
            + "?f2 higeomes:lng ?f2_lon ."
            + "?f2 higeomes:lat ?f2_lat ."
            + "?f2 higeomes:name ?name ."
            + "}";
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
            + "SELECT ?t1 ?t2 ?t1_lat ?t1_lon ?t2_lat ?t2_lon ?f1_name ?f2_name ?f1_country ?f2_country\n"
            + "WHERE { "
            + options[condition]()
            + "  ?t1 higeomes:hasFindspot ?f1 ."
            + "  ?t2 higeomes:hasFindspot ?f2 ."
            + "  ?f1 higeomes:lat ?t1_lat ."
            + "  ?f1 higeomes:lng ?t1_lon ."
            + "  ?f2 higeomes:lat ?t2_lat ."
            + "  ?f2 higeomes:lng ?t2_lon ."
            + "  ?f1 higeomes:name ?f1_name ."
            + "  ?f2 higeomes:name ?f2_name ."
            + "  ?f1 higeomes:country ?country1 ."
            + "  ?country1 rdfs:label ?f1_country ."
            + "  ?f2 higeomes:country ?country2 ."
            + "  ?country2 rdfs:label ?f2_country ."
            + " }";

    }

    // Query for all resolved toponyms that are listed as nearby
    var query = "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>"
    + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
    + "SELECT ?t1 ?t2 ?t1_lat ?t1_lon ?t2_lat ?t2_lon ?f1_name ?f2_name ?f1_country ?f2_country\n"
    + "WHERE { "
    + "  ?t1 higeomes:isNearOf ?t2 ."
    + "  ?t1 higeomes:hasFindspot ?f1 ."
    + "  ?t2 higeomes:hasFindspot ?f2 ."
    + "  ?f1 higeomes:lat ?t1_lat ."
    + "  ?f1 higeomes:lng ?t1_lon ."
    + "  ?f2 higeomes:lat ?t2_lat ."
    + "  ?f2 higeomes:lng ?t2_lon ."
    + "  ?f1 higeomes:name ?f1_name ."
    + "  ?f2 higeomes:name ?f2_name ."
    + "  ?f1 higeomes:country ?country1 ."
    + "  ?country1 rdfs:label ?f1_country ."
    + "  ?f2 higeomes:country ?country2 ."
    + "  ?country2 rdfs:label ?f2_country ."
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

    // Query for all unresolved findspots
    query = "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>"
    + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
    + "SELECT ?f1 ?f1_lat ?f1_lon ?name\n"
    + "WHERE {"
    + "?f1 higeomes:id ?f2 ."
    + "FILTER NOT EXISTS"
    + "{"
    +   "?f1 higeomes:hasToponym ?t1 ."
    + "}"
    + "?f1 higeomes:name ?name ."
    + "?f1 higeomes:lng ?f1_lon ."
    + "?f1 higeomes:lat ?f1_lat ."
    + "}";

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

    // Query for all unresolved findspots
    query = "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>"
    + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
    + "SELECT ?top1 ?find1 ?f1_lon ?f1_lat ?top2 ?name ?country\n"
    + "WHERE {"
    + "?top1 higeomes:isNearOf ?top2 ."
    + "?top1 higeomes:hasFindspot ?find1 ."
    + "?find1 higeomes:country ?c ."
    + "?c rdfs:label ?country ."
    + "FILTER NOT EXISTS"
    + "{"
    +   "?top2 higeomes:hasFindspot ?find2 ."
    + "}"
    + "?find1 higeomes:lng ?f1_lon ."
    + "?find1 higeomes:lat ?f1_lat ."
    + "?find1 higeomes:name ?name ."
    + "}";

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

    var osm = new ol.layer.Tile({
        source: new ol.source.OSM()
    });

    var map = new ol.Map({
        target: 'map',
        view: new ol.View({
            center: ol.proj.transform([40.3615, 35.7128],"EPSG:4326", "EPSG:3857"),
            zoom: 7
        }),
        layers: [osm]
    });

    function draw_map(r_coords, u_coords, n_coords, complete_list)
    {

        var line_list = [];
        var features_list = [];
        var circle_list = [];
        var index;

        var styles = {
            'Point': new ol.style.Style({
                image: new ol.style.Icon(({
                    anchor: [0.5, 0.5],
                    anchorOrigin: 'bottom-right',
                    opacity: 1,
                    src: './img/svgs/circle-15.svg',
                    scale: 1
                })
            )}),
            'LineString': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(180, 0, 0, .3)',
                    width: 4
                })
            }),
            'Circle': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(161, 237, 181, 0.9)',
                    width: 3
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(161, 237, 181, 0.42)'
                })
            })
        }

        var vectorLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: function(feature) {
                return styles[feature.get('type')]
            }
        });

        var lineLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: function(feature) {
                return styles[feature.get('type')]
            }
        });


        var circleLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: function(feature) {
                return styles[feature.get('type')]
            }
        });

        map.addLayer(circleLayer);
        map.addLayer(lineLayer);
        map.addLayer(vectorLayer);

        $('.ui.accordion').accordion();

        $('#selectAll_Nearby').checkbox({
            onChecked: function() {
                $('#new_table>#table_details').find(".ui.checkbox#nrow").checkbox('check');
            },
            onUnchecked: function() {
                $('#new_table>#table_details').find(".ui.checkbox#nrow").checkbox('uncheck');
            }
        });





        $("#clear").checkbox({
            onChecked: function() {

                var features = vectorLayer.getSource().getFeatures();

                $(".ui.small.modal").modal('show');

                $(".ui.small.modal").modal({
                    onApprove: function() {
                        for(var i in features)
                        {
                            vectorLayer.getSource().removeFeature(features[i]);
                        }
                        $('#new_table>#table_details').find(".ui.checkbox#nrow").checkbox('uncheck');

                        $("#clear").checkbox('set unchecked');
                    }
                })

            }
        });



        $('#sat_toggle').checkbox({
            onChecked: function() {
                osm.setSource(new ol.source.MapQuest({layer: 'sat'}));

            },
            onUnchecked: function() {
                osm.setSource(new ol.source.OSM())
            }
        });

        $('.ui.selection.list>.item').click(function()
        {
            $(this).css({'font-weight': 'bold', 'color': 'black'});
            var big_id = $(this).attr('id');

            big_id = big_id.split("-");

            var new_id = big_id[0] + big_id[1];
            var id = big_id[0];
            var index = big_id[1];

            var distance = complete_list[id][1][index]["dist"];

            var prob = complete_list[id][1][index]["prob"];

            vectorLayer.getSource().addFeatures([
                new ol.Feature({
                    geometry: new ol.geom.Point(n_coords[index][1]),
                    type: 'Point',
                    name: n_coords[index][0],
                    class: "Resolved Toponym",
                    prob: (prob.toFixed(2)*100) + "%",
                    status: "Resolved",
                    desc: n_coords[index][0] + ' is ' + distance.toFixed(2) + ' away from ' + u_coords[id][3] + ', which is listed as nearby to ' + n_coords[index][2] + '.'
                })
            ]);

            vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].setId(new_id);


            if(distance > 100)
            {
                map.getView().setZoom(7);
                map.getView().setCenter(ol.proj.transform(complete_list[id][1][index]["mid"]['geometry']['coordinates'],"EPSG:4326", "EPSG:3857"));
            }
            else if(distance > 50 && distance < 100)
            {
                map.getView().setZoom(8);
                map.getView().setCenter(ol.proj.transform(complete_list[id][1][index]["mid"]['geometry']['coordinates'],"EPSG:4326", "EPSG:3857"));
            }
            else {
                map.getView().setZoom(9);
                map.getView().setCenter(ol.proj.transform(complete_list[id][1][index]["mid"]['geometry']['coordinates'],"EPSG:4326", "EPSG:3857"));
            }

        });

        $('.remove').click(function()
        {
            var big_id = $(this).attr('id');
            $('div#'+ big_id.toString() +'.item').css({'font-weight': 'normal', 'color': 'rgba(0,0,0,.4)'});

            big_id = big_id.split("-");
            var new_id = big_id[0] + big_id[1];

            $('#popup').html("");

            console.log(vectorLayer.getSource().getFeatures());
            vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(new_id));

        });

        $(".ui.checkbox#row").checkbox({
            onChecked: function() {

                index = $(this).val();
                var first_id = index + 0;
                var sec_id = index + 1;

                var point1 = ol.proj.transform([r_coords[index][1][0], r_coords[index][1][1]], "EPSG:4326", "EPSG:3857");
                var point2 = ol.proj.transform([r_coords[index][5][0], r_coords[index][5][1]], "EPSG:4326", "EPSG:3857");

                vectorLayer.getSource().addFeatures([
                    new ol.Feature({
                        geometry: new ol.geom.Point(point1),
                        type: 'Point',
                        name: r_coords[index][0],
                        distance: r_coords[index][8],
                        status: "Resolved",
                        country: r_coords[index][2],
                        class: r_coords[index][3]
                    }),
                    new ol.Feature({
                        geometry: new ol.geom.Point(point2),
                        name: r_coords[index][4],
                        type: 'Point',
                        distance: r_coords[index][8],
                        status: "Resolved",
                        country: r_coords[index][6],
                        class: r_coords[index][7]

                    })
                ]);

                lineLayer.getSource().addFeature(
                    new ol.Feature({
                        geometry: new ol.geom.LineString([point1, point2]),
                        name: 'Distance',
                        type: 'LineString',
                    })
                )

                var prep;

                if($(".ui.dropdown").dropdown('get value') == "")
                {
                    prep = "nearby ";
                }
                else if($(".ui.dropdown").dropdown('get value') == "nearby") {
                    prep = " ";
                }
                else {
                    prep = " of ";
                }

                vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 2].setId(first_id);
                vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].setId(sec_id);
                lineLayer.getSource().getFeatures()[lineLayer.getSource().getFeatures().length - 1].setId(index);

                vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 2].set('desc', vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 2].get('name')
                + " is listed as " +  $(".ui.dropdown").dropdown('get value') + prep + vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].get('name') + ".");


                // vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].set('desc', vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].get('name')
                // + " is listed as " +  $(".ui.dropdown").dropdown('get value') + prep + vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 2].get('name') + ".");


                map.getView().setCenter(ol.proj.transform(r_coords[index][9]['geometry']['coordinates'],"EPSG:4326", "EPSG:3857"));

                if(r_coords[index][8] > 70)
                {
                    map.getView().setZoom(9);
                }
                else {
                    map.getView().setZoom(11);
                }
            },

            onUnchecked: function() {

                index = $(this).val();
                $('#popup').html("");

                vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(index+'0'));
                vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(index+'1'));
                lineLayer.getSource().removeFeature(lineLayer.getSource().getFeatureById(index));
            }
        });

        $(".ui.checkbox#urow").checkbox({
            onChecked: function() {
                var wgs84Sphere = new ol.Sphere(6378137);
                index = $(this).val();

                circleLayer.getSource().addFeature(
                    new ol.Feature({
                        geometry: new ol.geom.Circle(u_coords[index][1], 40000),
                        type: 'Circle'
                    })
                );
                vectorLayer.getSource().addFeature(
                    new ol.Feature({
                        geometry: new ol.geom.Point(u_coords[index][1]),
                        type: 'Point',
                        name: u_coords[index][3],
                        status: "Unresolved",
                        class: u_coords[index][0]
                    })
                );

                vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].setId(index);
                circleLayer.getSource().getFeatures()[circleLayer.getSource().getFeatures().length - 1].setId("circle"+index);

                vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].set('desc', vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].get('name') + " is an unresolved findspot.");

                map.getView().setCenter(u_coords[index][1]);
                map.getView().setZoom(10);
            },

            onUnchecked: function() {
                index = $(this).val();
                $('#popup').html("");

                vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(index));
                circleLayer.getSource().removeFeature(circleLayer.getSource().getFeatureById("circle"+index));
            }
        });

        $(".ui.checkbox#nrow").checkbox({
            onChecked: function() {

                index = $(this).val();
                vectorLayer.getSource().addFeature(
                    new ol.Feature({
                        geometry: new ol.geom.Point(n_coords[index][1]),
                        type: 'Point',
                        name: n_coords[index][0],
                        status: "Resolved",
                        class: n_coords[index][2],
                        country: n_coords[index][4]
                    })
                );

                vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].setId(index);

                vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].set('desc', vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].get('name')
                + " is a resolved findspot that is listed as nearby the unresolved toponym, \"" + n_coords[index][5].replace('-', ' ') + "\".");

                if($('#selectAll_Nearby').checkbox('is unchecked'))
                {
                    map.getView().setCenter(n_coords[index][1]);
                    map.getView().setZoom(10);
                }


            },

            onUnchecked: function() {
                $('#popup').html("");
                index = $(this).val();
                vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(index));
            }
        });

        var popup = new ol.Overlay({
          element: document.getElementById('popup'),
          positioning: 'top-left',
          stopEvent: false
        });

        map.addOverlay(popup);

        map.on('click', function(evt) {
            var feature = map.forEachFeatureAtPixel(evt.pixel,
                function(feature, layer) {
                    return feature;
                });

                if (feature) {
                    var geometry = feature.getGeometry();
                    var coord = geometry.getCoordinates();
                    popup.setPosition(coord);

                    $('#popup').html("<div class='ui card'>"
                    + "<div class='content'>"
                    + "<i class='right floated large link remove icon'></i>"
                    + "<div class='header'>"+feature.get('name')+"</div>"
                    + "<div class='meta'>"+feature.get('class')+"</div>"
                    + "<div class='description'><div class='dist'></div><div class='stats'></div></div>"
                    + "</div><div class='extra content'>"
                    + "<div class='left floated radius'></div><div class='left floated country'></div><div class='right floated status' data-position='bottom left'>"
                    + "</div></div></div>");

                    if(feature.get('status') == "Unresolved")
                    {
                        $('.right.floated.status').html("Status: <i class='remove circle outline icon'></i>");
                        $('.right.floated.status').attr('data-content', 'Unresolved');
                        $('.right.floated.status').popup();
                    }
                    else if(feature.get('status') == "Resolved") {
                        $('.right.floated.status').html("Status: <i class='check circle outline green icon'></i>");
                        $('.right.floated.status').attr('data-content', 'Resolved');
                        $('.right.floated.status').popup();
                    }

                    if(feature.U.hasOwnProperty('country'))
                    {
                        $('.country').html("Country: " + feature.get('country') + " <i class='"+ feature.get('country').toString().toLowerCase() + " flag'></i>")
                    }

                    if(feature.U.hasOwnProperty('distance'))
                    {
                        $('.dist').html("<div class='ui center statistic' data-content='Average Distance of resolved nearby findspots: 27.34 km'  data-position='left center'>"
                        + "<div class='value'>"+feature.get('distance').toFixed(2)+"</div>"
                        + "<div class='label'>Kilometers Away</div>"
                        + "</div><div class='ui divider'><div>");

                        $('.ui.center.statistic').popup();
                    }

                    if(feature.U.hasOwnProperty('prob'))
                    {
                        $('.stats').html("<div class='ui statistic'>"
                        + "<div class='value'>"+feature.get('prob')+"</div>"
                        + "<div class='label'>Probability</div>"
                        + "</div><div class='ui divider'><div>");

                        if(feature.get('prob').replace('%', '') <= 20)
                        {
                            $('.ui.statistic').addClass('red');
                        }
                        else if(feature.get('prob').replace('%', '') >= 80)
                        {
                            $('.ui.statistic').addClass('green');
                        }
                        else {
                            $('.ui.statistic').addClass('yellow');
                        }
                    }

                    if(feature.get('status') == 'Unresolved')
                        $('.left.floated.radius').html('Shown Radius: 40km');

                    $('.description').append(feature.get('desc'));


                    $('.ui.remove.icon').click(function() {
                        $('#popup').html("");
                    });

                } else {
                    $('#popup').html("");
                }
            });
    }

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
        var brng = parseFloat(toDegrees(Math.atan2(y, x)));

        return ((brng + 360) % 360).toFixed(2);
    }

    function callback(data)
    {
        var row = data.results.bindings;

        var regex_filter = /(toponym)\D\d+/;
        var regex_filter2 = /(Findspot)\/\d+/;
        var units = "kilometers";
        var complete = [];


          for(var i in row)
          {
              if (row[i].hasOwnProperty('top1'))
              {
                    var normal_coords1 = [parseFloat(row[i].f1_lon.value), parseFloat(row[i].f1_lat.value)];
                    var transformed_coords = ol.proj.transform([parseFloat(row[i].f1_lon.value), parseFloat(row[i].f1_lat.value)], "EPSG:4326", "EPSG:3857");
                    findspot_coordinates.push([row[i].name.value, transformed_coords, regex_filter.exec(row[i].top1.value)[0], normal_coords1, row[i].country.value, regex_filter.exec(row[i].top2.value)[0]]);

                    $('#new_table>#table_details').append("<tr><td><div id='nrow' class='ui fitted toggle checkbox'><input type='checkbox' value='"+i+"'><label></label></div></td>"
                    + "<td><a href ="+row[i].top1.value + ">" + regex_filter.exec(row[i].top1.value)[0] +"</a></td>"
                    +"<td><a href =" +row[i].top2.value + ">" + row[i].name.value + "</a></td>"
                    + "<td><a href =" +row[i].find1.value + ">" + regex_filter.exec(row[i].top2.value)[0] + "</a></td></tr>");
              }

              else if(row[i].hasOwnProperty('t1'))
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

                  var distance = turf.distance(coordinate_1, coordinate_2, units);
                  var center = turf.midpoint(coordinate_1, coordinate_2);
                  var euro_distance = distance.toFixed(2).replace(/\./g, ',');
                  var point_1 = ol.proj.fromLonLat([parseFloat(row[i].t1_lon.value), parseFloat(row[i].t1_lat.value)]);
                  var point_2 = ol.proj.fromLonLat([parseFloat(row[i].t2_lon.value), parseFloat(row[i].t2_lat.value)]);
                  var euro_angle = angleFromCoordinate(parseFloat(row[i].t1_lat.value), parseFloat(row[i].t1_lon.value), parseFloat(row[i].t2_lat.value), parseFloat(row[i].t2_lon.value)).replace(/\./g, ',');

                  resolved_distances.push(distance);
                  resolved_coords.push([row[i].f1_name.value, [parseFloat(row[i].t1_lon.value), parseFloat(row[i].t1_lat.value)], row[i].f1_country.value, regex_filter.exec(row[i].t1.value)[0], row[i].f2_name.value, [parseFloat(row[i].t2_lon.value), parseFloat(row[i].t2_lat.value)], row[i].f2_country.value, regex_filter.exec(row[i].t2.value)[0], distance, center]);

                  $('#toponym_dist_table>#table_details').append("<tr><td><div id='row' class='ui fitted toggle checkbox'><input type='checkbox' value='"+i+"'><label></label></div></td>"
                  + "<td><a href ="+row[i].t1.value + ">" + row[i].f1_name.value +"</a></td>"
                  + "<td><a href =" +row[i].t2.value + ">" + row[i].f2_name.value + "</td><td>" + euro_distance + " km</td>"
                  + "<td>"+ euro_angle +"&deg</td></tr>");

              }
              else
              {
                  var findspot_name;
                  var findspot_name1;
                  var findspot_loc;

                  var normal_coords = [parseFloat(row[i].f1_lon.value), parseFloat(row[i].f1_lat.value)];
                  findspot_loc = ol.proj.transform([parseFloat(row[i].f1_lon.value), parseFloat(row[i].f1_lat.value)], "EPSG:4326", "EPSG:3857");
                  findspot_name = row[i].f1.value;

                  findspot_name1 = regex_filter2.exec(findspot_name)[0].toString();
                  findspot_name1 = findspot_name1.replace(/\//, " ");

                  $('#unresolved_table>#table_details').append("<tr><td><div id='urow' class='ui fitted toggle checkbox'><input type='checkbox' value='"+i+"'><label></label></div></td>"
                  +"<td><a href ="+row[i].f1.value + ">" + row[i].name.value + "</a></td>"
                  + "<td id='test"+ i + "'><div class='ui accordion'><div class='title'><i class='dropdown icon'></i>Show All results</div>"
                  + "<div class='content'><div class='ui selection list'  id='probability" + i +"'></div></div></div></td></tr>");

                  unresolved_coords.push([findspot_name1, findspot_loc, normal_coords, row[i].name.value]);
              }
          }

          for(var i in unresolved_coords)
          {
              var unresolved_findspot = {
                  "type": "Feature",
                  "geometry": {
                      "type": "Point",
                      "coordinates": unresolved_coords[i][2]
                  }
              };
              var temp_array = [];

              for(var j in findspot_coordinates)
              {
                  var resolved_findspot = {
                      "type": "Feature",
                      "geometry": {
                          "type": "Point",
                          "coordinates": findspot_coordinates[j][3]
                      }
                  };
                  temp_array.push({"dist": turf.distance(unresolved_findspot, resolved_findspot, units), "mid": turf.midpoint(unresolved_findspot, resolved_findspot), "nearby_top_name": findspot_coordinates[j][2]});
              }

              complete.push([{"uFindspot_location": unresolved_coords[i][1]}, temp_array]);
              temp_array = [];
          }

          for(var key in complete)
          {
              var obj = complete[key][1];
              for(var i = 0; i < 8; i++)
              {
                  obj[i].prob = probability(resolved_distances,obj[i]["dist"]);
              }
          }

          for(var key in complete)
          {
              var obj = complete[key][1];
              var count = 0;
              for(var i = 0; i < 8; i++)
              {
                  if(obj[i].prob == 0)
                  {
                      count++
                  }
                  $('#probability'+ key).append("<i id='"+key+"-"+i+"' class='remove link icon'></i><div class='item' id='"+key+"-"+i+"'>Probability for " + unresolved_coords[key][0] + " to be " + regex_filter.exec(obj[i]["nearby_top_name"])[0].toString() + ": " + obj[i]["prob"].toFixed(2) + "</div>");
              }
              if(count == 8)
              {
                  $("td#test"+ key).addClass("negative");
              }
          }

          resolved_distances = resolved_distances.sort(function (a,b)
          {
              return a - b;
          });

          draw_map(resolved_coords, unresolved_coords, findspot_coordinates, complete);
    }

    // Calculate probability of an unresolved findspot
    function probability(reference,value)
    {
        var index = reference.length;
        for (var i=0; i<reference.length; ++i) {
            if (value < reference[i]) {
                index = i;
                break;
            }
        }
        if (index <= reference.length/2)
            return (2-1.0/reference.length)*index/reference.length;
        else
            return (2-1.0/reference.length)*(reference.length-index)/reference.length;
    }

    $('.tabular.menu .item').tab();

});
