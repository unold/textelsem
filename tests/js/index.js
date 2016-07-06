$(document).ready(function() {

    var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";

    var resolved_distances = [];
    var resolved_coords = [];
    var unresolved_coords = [];
    var findspot_coordinates = [];
    var complete = [];
    var full = [];

    if (typeof(Number.prototype.toRad) === "undefined") {
        Number.prototype.toRad = function() {
            return this * Math.PI / 180;
        }
    }

    var query_all = "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>"
    + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
    + "SELECT ?t1 ?t2 ?t1_lat ?t1_lon ?t2_lat ?t2_lon\n"
    + "WHERE { "
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
            query: query_all,
            Accept: 'application/json'
        },
        success: function(data) {
            var row = data.results.bindings;
            var angle;
            var angles = [];
            temp = [];
            var arr = [];


            for(var i in row)
            {
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

                angle = parseFloat(angleFromCoordinate(parseFloat(row[i].t1_lat.value), parseFloat(row[i].t1_lon.value), parseFloat(row[i].t2_lat.value), parseFloat(row[i].t2_lon.value)))
                arr.push({"dist": turf.distance(coordinate_1, coordinate_2, "kilometers"), "angle": angle});

            }

            var sorted_distances = [];
            var sorted_angles = [];

            arr = arr.sort(function (a,b)
            {
                return a.dist - b.dist;
            });

            for(var i in arr)
            {
                sorted_distances.push(arr[i]["dist"])
            }
            arr = arr.sort(function (a,b)
            {
                return a.angle - b.angle;
            });

            for(var i in arr)
            {
                sorted_angles.push(arr[i]["angle"])
            }

            full.dist = sorted_distances;
            full.angles = sorted_angles;
        }
    });

    $(".tabular.menu .item").tab();

    $('.message .close').on('click', function() {
        $(this).closest('.message').transition('fade');
    });

    $("#r_dropdown").dropdown({
        onChange: function() {

            $('#first_tab_dimmer').addClass('active');
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

                    $('#toponym_dist_table').removeClass('hidden');
                    $('.ui.message').addClass('hidden');

                    $('#r_dropdown').dropdown('hide');
                    $('#first_tab_dimmer').removeClass('active');

                    draw_map(resolved_coords, unresolved_coords, findspot_coordinates, complete)
                }

            });
        }
    });

    $('.item#u_tab').tab({
        onFirstLoad: function() {
            $("#p_dropdown").dropdown('set value', 'nearby');
            $("#p_dropdown").dropdown('set selected', 'nearby');
        }
    });

    $("#p_dropdown").dropdown({
        onChange: function() {

            $('#second_tab_dimmer').addClass('active');
            $.ajax({
                url: repo,
                dataType: 'jsonp',
                data: {
                    queryLn: 'SPARQL',
                    query: query_func3($("#p_dropdown").dropdown('get value').split(",")),
                    Accept: 'application/json'
                },
                success: function (data) {

                    var names = $("#p_dropdown").dropdown('get value').split(",");
                    var row = data.results.bindings;
                    var headings = data.head.vars;
                    var regex_filter = /(toponym)\D\d+/;
                    headings = headings.filter(function(a) {
                        return a.match(/f\d$/);
                    });

                    var complete = [];

                    var list = {
                        "f2": function()
                        {
                            return [row[x].f2_lon.value, row[x].f2_lat.value, row[x].f2_name.value, row[x].f2_country.value, row[x].t2.value];
                        },
                        "f3": function()
                        {
                            return [row[x].f3_lon.value, row[x].f3_lat.value, row[x].f3_name.value, row[x].f3_country.value, row[x].t3.value];
                        },
                        "f4": function()
                        {
                            return [row[x].f4_lon.value, row[x].f4_lat.value, row[x].f4_name.value, row[x].f4_country.value, row[x].t4.value];
                        },
                        "f5": function()
                        {
                            return [row[x].f5_lon.value, row[x].f5_lat.value, row[x].f5_name.value, row[x].f5_country.value, row[x].t5.value];
                        },
                        "f6": function()
                        {
                            return [row[x].f6_lon.value, row[x].f6_lat.value, row[x].f6_name.value, row[x].f6_country.value, row[x].t6.value];
                        }
                    };

                    var temp_array = [];
                    for(var y in unresolved_coords)
                    {
                        var unresolved_findspot = {
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": unresolved_coords[y][2]
                            }
                        };

                        for(var x in row)
                        {
                            for(var i in headings)
                            {
                                var variable = headings[i];
                                var prep = "";
                                var coordinate_2 = {
                                    "type": "Feature",
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [parseFloat(list[variable]()[0]), parseFloat(list[variable]()[1])]
                                    }
                                };
                                if(names[i] != "nearby")
                                    prep = " of ";
                                var angle = parseFloat(angleFromCoordinate(unresolved_coords[y][2][1], unresolved_coords[y][2][0], parseFloat(list[variable]()[1]), parseFloat(list[variable]()[0])));
                                temp_array.push({"angle": angle, "uTop_name": regex_filter.exec(row[x].t1.value)[0],"findspot_name": list[variable]()[2], "country": list[variable]()[3], "mid": turf.midpoint(unresolved_findspot, coordinate_2), "property": names[i] + prep, "coordinates": [parseFloat(list[variable]()[0]), parseFloat(list[variable]()[1])] , "dist": turf.distance(unresolved_findspot, coordinate_2, "kilometers"), "top-name": regex_filter.exec(list[variable]()[4])[0]});
                            }

                        }
                        complete.push([{"uFindspot_location": unresolved_coords[y][1], "uFindspot_name": unresolved_coords[y][3]}, temp_array]);
                        temp_array = [];
                     }

                     for(var x in complete)
                     {
                         var obj = complete[x][1];

                         for(var key in names)
                         {
                             var new_dist = [];
                             var new_list = obj.filter(function(a) {
                                if(a["property"].includes(names[key]))
                                return a;
                             });

                             for(var i in new_list)
                             {
                                new_dist.push(new_list[i]["dist"]);
                             }
                             new_dist = new_dist.sort(function (a, b) {
                                return a-b;
                             });

                             var myVar = "dist_meaningfulness_"+names[key];
                             complete[x][myVar] = similarity(new_dist, full);
                         }

                     }

                     console.log(complete);

                     for(var key in complete)
                     {
                         var obj = complete[key][1];
                         for(var i = 0; i < obj.length; i++)
                         {
                             for(var x in names)
                             {
                                 if(obj[i]["property"].includes(names[x]))
                                    obj[i].prob = complete[key]["dist_meaningfulness_"+names[x]] * probability(resolved_distances,obj[i]["dist"]);
                            }
                        }

                     }
                     $('#p_dropdown').dropdown('hide');
                     $('#second_tab_dimmer').removeClass('active');

                    draw_map(resolved_coords, unresolved_coords, findspot_coordinates, complete)
                }
            });
        }
    });

    $('.item#n_tab').tab({
        onFirstLoad: function() {
            $("#n_dropdown").dropdown('set value', 'nearby');
            $("#n_dropdown").dropdown('set text', 'Nearby');
        }
    });
    $("#n_dropdown").dropdown({
        onChange: function() {

            $('#third_tab_dimmer').addClass('active');

            var value = $("#n_dropdown").dropdown('get value');
            var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";
            $.ajax({
                url: repo,
                dataType: 'jsonp',
                data: {
                    queryLn: 'SPARQL',
                    query: query_func3(value),
                    Accept: 'application/json'
                },
                success: function (data) {

                    var row = data.results.bindings;

                    var regex_filter = /(toponym)\D\d+/;
                    var regex_filter2 = /(Findspot)\/\d+/;
                    var units = "kilometers";
                    // var complete = [];

                    $('#new_table>#table_details').html("");

                    findspot_coordinates = [];

                    for(var i in row)
                    {
                        if(row[i].hasOwnProperty("f3"))
                        {


                            $("#new_table").addClass("hidden");
                            $("#new_table2").removeClass("hidden");
                            var normal_coords1 = [parseFloat(row[i].f2_lon.value), parseFloat(row[i].f2_lat.value)];
                            var transformed_coords = ol.proj.transform([parseFloat(row[i].f2_lon.value), parseFloat(row[i].f2_lat.value)], "EPSG:4326", "EPSG:3857");
                            var normal_coords2 = [parseFloat(row[i].f3_lon.value), parseFloat(row[i].f3_lat.value)];
                            var transformed_coords2 = ol.proj.transform([parseFloat(row[i].f3_lon.value), parseFloat(row[i].f3_lat.value)], "EPSG:4326", "EPSG:3857");

                            var coordinate1 = {
                                "type": "Feature",
                                "geometry": {
                                    "type": "Point",
                                    "coordinates": normal_coords1
                                }
                            };

                            var coordinate2 = {
                                "type": "Feature",
                                "geometry": {
                                    "type": "Point",
                                    "coordinates": normal_coords2
                                }
                            };

                            findspot_coordinates.push([row[i].f2_name.value, transformed_coords, regex_filter.exec(row[i].t1.value)[0], normal_coords1, row[i].f2_country.value, regex_filter.exec(row[i].t2.value)[0], row[i].f3_name.value, transformed_coords2, normal_coords2, row[i].f3_country.value, regex_filter.exec(row[i].t2.value)[0], turf.midpoint(coordinate1, coordinate2)]);

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
                            findspot_coordinates.push([row[i].f2_name.value, transformed_coords, regex_filter.exec(row[i].t1.value)[0], normal_coords1, row[i].f2_country.value, regex_filter.exec(row[i].t2.value)[0]]);

                            $('#new_table>#table_details').append("<tr><td><div id='nrow' class='ui fitted toggle checkbox'><input type='checkbox' value='"+i+"'><label></label></div></td>"
                            + "<td><a href ="+row[i].t1.value + ">" + regex_filter.exec(row[i].t1.value)[0] +"</a></td>"
                            +"<td><a href =" +row[i].t2.value + ">" + regex_filter.exec(row[i].t2.value)[0] + "</a></td>"
                            + "<td><a href =" +row[i].f2.value + ">" + row[i].f2_name.value + "</a></td></tr>");

                        }
                    }

                    $('#third_tab_dimmer').removeClass('active');
                    $('#n_dropdown').dropdown('hide');
                    draw_map(resolved_coords, unresolved_coords, findspot_coordinates, complete);

                }
            });
        }
    });

    function addProperties(top, var1, num)
    {
        return "  ?"+top+" higeomes:hasFindspot ?"+ var1 +" .\n"
                + "  ?"+ var1 +" higeomes:lat ?"+ var1 +"_lat .\n"
                + "  ?"+ var1 +" higeomes:lng ?"+ var1 +"_lon .\n"
                + "  ?"+ var1 +" higeomes:name ?"+ var1 +"_name .\n"
                + "  ?"+ var1 +" higeomes:country ?country"+num+" .\n"
                + "  ?country"+ num +" rdfs:label ?"+ var1 +"_country .\n";
    }

    function query_func3(conditions)
    {
        if(conditions.includes(','))
        {
            conditions = conditions.split(',');
        }
        else if(!(conditions.constructor === Array)) {
            conditions = [conditions]
        }
        var properties = "";
        var variables = ["?t1"];
        var options = {
            "nearby": function() {
                return "  ?t1 higeomes:isNearOf ";
            },
            "north": function () {
                return "  ?t1 higeomes:isNorthOf ";
            },
            "south": function () {
                return "  ?t1 higeomes:isSouthOf ";
            },
            "east": function () {
                return "  ?t1 higeomes:isEastOf ";
            },
            "west": function() {
                return "  ?t1 higeomes:isWestOf ";
            }
        };

        for(var i in conditions)
        {
            variables.push("?t" + (parseFloat(i)+2), "?f" + (parseFloat(i)+2), "?f" + (parseFloat(i)+2) + "_lat", "?f" + (parseFloat(i)+2) + "_lon", "?f" + (parseFloat(i)+2) + "_name", "?f" + (parseFloat(i)+2) + "_country")
            properties += options[conditions[i]]() + "?t" + (parseFloat(i)+2) + " . \n"
            properties += addProperties("t" + (parseFloat(i)+2), "f" + (parseFloat(i)+2) , (parseFloat(i)+2));
        }

        return "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>\n"
        + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
        + "SELECT " + variables.join(' ') + "\n"
        + "WHERE { \n"
        + properties
        + "FILTER NOT EXISTS {\n"
        + " ?t1 higeomes:hasFindspot ?f1 .\n"
        + "}\n"
        + " }";

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
        };

            return "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>\n"
            + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
            + "SELECT ?t1 ?t2 ?t1_lat ?t1_lon ?t2_lat ?t2_lon ?f1_name ?f2_name ?f1_country ?f2_country\n"
            + "WHERE {\n "
            + options[condition]()
            + "  ?t1 higeomes:hasFindspot ?f1 .\n"
            + "  ?t2 higeomes:hasFindspot ?f2 .\n"
            + "  ?f1 higeomes:lat ?t1_lat .\n"
            + "  ?f1 higeomes:lng ?t1_lon .\n"
            + "  ?f2 higeomes:lat ?t2_lat .\n"
            + "  ?f2 higeomes:lng ?t2_lon .\n"
            + "  ?f1 higeomes:name ?f1_name .\n"
            + "  ?f2 higeomes:name ?f2_name .\n"
            + "  ?f1 higeomes:country ?country1 .\n"
            + "  ?country1 rdfs:label ?f1_country .\n"
            + "  ?f2 higeomes:country ?country2 .\n"
            + "  ?country2 rdfs:label ?f2_country .\n"
            + " }";

    }

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
        success: function(data) {
            var row = data.results.bindings;

            var regex_filter = /(toponym)\D\d+/;
            var regex_filter2 = /(Findspot)\/\d+/;
            var units = "kilometers";

            for(var i in row)
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
                + "<td id='test"+ i + "'><div class='ui accordion' id='"+ i +"'><div class='title'><i class='dropdown icon'></i>Show All results</div>"
                + "<div class='content'><div class='ui selection list'  id='probability" + i +"'></div></div></div></td></tr>");

                unresolved_coords.push([findspot_name1, findspot_loc, normal_coords, row[i].name.value]);
            }
        }
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

                var values = {
                    "nearby": "nearby ",
                    "north": "north of ",
                    "south": "south of ",
                    "east": "east of ",
                    "west": "west of "
                };


                vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 2].setId(first_id);
                vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].setId(sec_id);
                lineLayer.getSource().getFeatures()[lineLayer.getSource().getFeatures().length - 1].setId(index);

                vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 2].set('desc', vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 2].get('name')
                + " is listed as " +  values[$("#r_dropdown").dropdown('get value')] + vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].get('name') + ".");


                vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].set('desc', vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 2].get('name')
                + " is listed as " +  values[$("#r_dropdown").dropdown('get value')] + "this toponym, "+ vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].get('name') + ".");


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
                var angles = [];

                var obj = complete_list[index][1];

                var count = 0;

                $('#probability'+ index).html("");

                if($("td#test"+ index).hasClass("negative"))
                   $("td#test"+ index).removeClass("negative");

                for(var i = 0; i < obj.length; i++)
                {
                    if(obj[i].prob != 0)
                    {
                        count++
                    }

                    $('#probability'+ index).append("<i id='"+index+"-"+i+"' class='remove link icon'></i><div class='item' id='"+index+"-"+i+"'>Probability for " + u_coords[index][3] + " to be " + obj[i]["uTop_name"] + ": " + obj[i]["prob"].toFixed(2) + "</div>");
                }

                if(count > 0)
                {
                    $("td#test"+ index).addClass("positive");
                }
                else if(count == 0)
                {
                    $("td#test"+ index).addClass("negative");
                }

                $('.ui.accordion#'+ index).accordion('open', 0);

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
                            geometry: new ol.geom.Point(ol.proj.transform(complete_list[id][1][index]["coordinates"], "EPSG:4326", "EPSG:3857")),
                            type: 'Point',
                            name: complete_list[id][1][index]["findspot_name"],
                            class: complete_list[id][1][index]["top-name"],
                            prob: (prob.toFixed(2)*100) + "%",
                            status: "Resolved",
                            desc: complete_list[id][1][index]["findspot_name"] + ' is ' + distance.toFixed(2) + ' away from ' + u_coords[id][3] + ", which is listed as " + complete_list[id][1][index]["property"] + " the unresolved toponym " + complete_list[id][1][index]["uTop_name"],
                            country: complete_list[id][1][index]["country"]
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

                    vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(new_id));

                });

                vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].setId(index);
                circleLayer.getSource().getFeatures()[circleLayer.getSource().getFeatures().length - 1].setId("circle"+index);

                vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].set('desc', vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].get('name') + " is an unresolved findspot.");
                map.getView().setCenter(u_coords[index][1]);
                map.getView().setZoom(10);
            },

            onUnchecked: function() {
                index = $(this).val();
                $('#popup').html("");

                $('.ui.accordion#'+ index).accordion('close', 0);
                $('#probability'+ index).html("");
                $("td#test"+ index).removeClass("positive");
                $("td#test"+ index).removeClass("negative");

                vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(index));
                circleLayer.getSource().removeFeature(circleLayer.getSource().getFeatureById("circle"+index));
                // vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(':regex(id,\d+)'))
            }
        });


        $(".ui.checkbox#nrow").checkbox({
            onChecked: function() {

                index = $(this).val();

                var values = {
                    "nearby": ["nearby"],
                    "nearby,west": ["nearby", "west of"],
                    "nearby,east": ["nearby", "east of"],
                    "nearby,south": ["nearby", "south of"],
                    "nearby,north": ["nearby", "north of"]
                }

                vectorLayer.getSource().addFeature(
                    new ol.Feature({
                        geometry: new ol.geom.Point(n_coords[index][1]),
                        type: 'Point',
                        name: n_coords[index][0],
                        status: "Resolved",
                        class: n_coords[index][5],
                        country: n_coords[index][4]
                    })
                );

                vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].setId(index+'1');

                vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].set('desc', vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].get('name')
                + " is a resolved findspot that is listed as " + values[$('#n_dropdown').dropdown('get value')][0] + " the unresolved toponym, \"" + n_coords[index][2].replace('-', ' ') + "\".");

                if(n_coords[index].length > 6)
                {
                    vectorLayer.getSource().addFeature(
                        new ol.Feature({
                            geometry: new ol.geom.Point(n_coords[index][7]),
                            type: 'Point',
                            name: n_coords[index][6],
                            status: "Resolved",
                            class: n_coords[index][10],
                            country: n_coords[index][9]
                        })
                    );

                    vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].setId(index+'2');

                    vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].set('desc', vectorLayer.getSource().getFeatures()[vectorLayer.getSource().getFeatures().length - 1].get('name')
                    + " is a resolved findspot that is listed as " + values[$('#n_dropdown').dropdown('get value')][1] + " the unresolved toponym, \"" + n_coords[index][2].replace('-', ' ') + "\".");


                }


                if($('#selectAll_Nearby').checkbox('is unchecked'))
                {
                    if(n_coords[index].length < 7)
                    {
                        map.getView().setCenter(n_coords[index][1]);
                        map.getView().setZoom(10);
                    }
                    else {
                        map.getView().setCenter(ol.proj.transform(n_coords[index][11]['geometry']['coordinates'],"EPSG:4326", "EPSG:3857"));
                        map.getView().setZoom(8);
                    }
                }
            },

            onUnchecked: function() {
                $('#popup').html("");
                index = $(this).val();
                vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(index+'1'));
                if(vectorLayer.getSource().getFeatureById(index+'2'))
                    vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(index+'2'));
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

                    $('#popup').html("<div class='ui shape'><div class='sides'>"
                    + "<div class='side active'><div class='ui card'>"
                    + "<div class='content' id='front'>"
                    + "<i class='right floated large link remove icon'></i>"
                    + "<div class='header'>"+feature.get('name')+"</div>"
                    + "<div class='meta'>"+feature.get('class')+"</div>"
                    + "<div class='description'><div class='dist'></div><div class='stats'></div></div>"
                    + "</div><div class='extra content'>"
                    + "<div class='left floated radius'></div><div class='left floated country'></div><div class='right floated status' data-position='bottom left'>"
                    + "</div></div>"
                    + "<div class='ui bottom basic attached button'>"
                    + "Flip Over for more information<i class='long arrow right icon'></i></div></div></div>"
                    + "<div class='side'>"
                    + "<div class='ui card' id='backside'>"
                    + "<div class='content' id='back'>"
                    + "<i class='right floated large link remove icon'></i>"
                    + "<div class='header'>"+feature.get('name')+"</div>"
                    + "<div class='meta'>"+feature.get('class')+"</div>"
                    + "<div class='description'><div id='pop'>Population: </div><div id='admin'>Administration:</div></div>"
                    + "</div><div class='ui bottom basic attached button'>"
                    + "<i class='long arrow left icon'></i>Back</div>"
                    + "</div></div></div></div>");


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

                    $('.right.floated.large.link.remove.icon').click(function() {
                        $('#popup').html("");
                    });

                    $('.ui.bottom.basic.attached.button').click(function() {
                        $(".ui.shape").shape({
                            duration: "1ms"
                        });
                        $(".ui.shape").shape('flip over');
                    });

                    if(feature.get('status') == 'Unresolved')
                        $('.left.floated.radius').html('Shown Radius: 40km');

                    $('#front>.description').append(feature.get('desc'));

                }
                // else {
                //     $('#popup').html("");
                // }
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

    function similarity(arr1, arr2)
    {
        arr2 = arr2["dist"];
        var new_arr = arr2.filter(function(a) {
            if(a < arr1[arr1.length-1] && a > arr1[0])
            {
                return a;
            }
        });

        return 1-(new_arr.length/arr2.length);
    }

    function angle_similarity(arr1, arr2)
    {
        var names_list = {
            "nearby": function() {
                var new_arr = arr2;

                return new_arr;
            },
            "north": function() {
                var new_arr = arr2.filter(function(a) {
                    if(a < 270 && a > 90)
                    {
                        return a;
                    }
                });

                return new_arr;
            },
            "south": function() {
                var new_arr = arr2.filter(function(a) {
                    if(a > 270 || a < 90)
                    {
                        return a;
                    }
                });
                return new_arr;
            },
            "east": function() {
                var new_arr = arr2.filter(function(a) {
                    if(a > 180 && a < 360)
                    {
                        return a;
                    }
                });

                return new_arr;
            },
            "west": function() {
                var new_arr = arr2.filter(function(a) {
                    if(a < 180 && a > 0)
                    {
                        return a;
                    }
                });

                return new_arr;
            }
        }
        return names_list[name]().length/arr2.length;
    }
});
