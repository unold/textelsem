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

    function draw_map(r_coords, u_coords, n_coords, complete_list)
    {
        var line_list = [];
        var features_list = [];
        var circle_list = [];
        var index;


// ===============================================================================================================================================
        var styles = {
            'Point': new ol.style.Style({
                image: new ol.style.Icon(({
                    anchor: [0.5, 0.5],
                    anchorOrigin: 'bottom-right',
                    opacity: 0.75,
                    src: './img/map-marker-2-xxl.png',
                    scale: .1
                }))
            }),
            'LineString': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#000000',
                    width: 3
                })
            }),
            'Circle': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'green',
                    width: 2
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(0,180,0,0.1)'
                })
            })
        };

        var styleFunction = function(feature) {
            return styles[feature.getGeometry().getType()];
        };

        var vectorSource = new ol.source.Vector({
            features: features_list
        });

        var vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style: styleFunction
        });

        var lineSource = new ol.source.Vector({
            features: line_list
        });

        var lineLayer = new ol.layer.Vector({
            source: lineSource,
            style: styleFunction
        });

        var circleSource = new ol.source.Vector({
            features: circle_list
        });

        var circleLayer = new ol.layer.Vector({
            source: circleSource,
            style: styleFunction
        });

        var map = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                }),
                vectorLayer, lineLayer, circleLayer],
            view: new ol.View({
                center: ol.proj.transform([40.3615, 35.7128],"EPSG:4326", "EPSG:3857"),
                zoom: 7
            })
        });

// =======================================================================================================================================================================

        $('.ui.accordion').accordion();

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

            features_list.push(new ol.Feature({
                geometry: new ol.geom.Point(n_coords[index][1]),
                type: 'Point',
                name: n_coords[index][0],
                id: new_id
            }));

            // var geoJSONObject = {
            //     'type': 'FeatureCollection',
            //     'crs': {
            //         'type': 'name',
            //         'properties': {
            //             'name': 'EPSG:3857'
            //         }
            //     },
            //     'features': [{
            //         'type': 'Feature',
            //         'geometry': {
            //             'type': 'Point',
            //             'coordinates': new ol.geom.Point(n_coords[index][1]),
            //             'name': n_coords[index][0],
            //             'id': new_id
            //         }
            //     }]
            // };

            features_list[features_list.length - 1].setId(new_id);
            features_list[features_list.length - 1].set('class','Toponym Estimate');
            features_list[features_list.length - 1].set('desc', (prob.toFixed(2)*100) + "%");
            features_list[features_list.length - 1].set('status', "Unresolved");
            vectorLayer.getSource().addFeature(features_list[features_list.length - 1]);
            map.addLayer(vectorLayer);

        });

        $('.remove').click(function()
        {
            var big_id = $(this).attr('id');
            $('div#'+ big_id.toString() +'.item').css({'font-weight': 'normal', 'color': 'rgba(0,0,0,.4)'});

            big_id = big_id.split("-");
            var new_id = big_id[0] + big_id[1];

            vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(new_id));
            features_list.splice(features_list.indexOf(vectorLayer.getSource().getFeatureById(new_id)), 1);

        });

        $(".ui.checkbox#row").checkbox({
            onChecked: function() {

                index = $(this).val();
                var first_id = index + 0;
                var sec_id = index + 1;

                var point1 = ol.proj.transform([r_coords[index][1][0], r_coords[index][1][1]], "EPSG:4326", "EPSG:3857");
                var point2 = ol.proj.transform([r_coords[index][5][0], r_coords[index][5][1]], "EPSG:4326", "EPSG:3857");
                features_list.push([new ol.Feature({
                    geometry: new ol.geom.Point(point1),
                    type: 'Point',
                    name: r_coords[index][0],
                    id: first_id
                }),
                new ol.Feature({
                    geometry: new ol.geom.Point(point2),
                    name: r_coords[index][4],
                    type: 'Point',
                    id: sec_id
                })]);
                line_list.push(new ol.Feature({
                    geometry: new ol.geom.LineString([point1, point2]),
                    name: 'Distance',
                    type: 'LineString',
                    id: index
                }));


                line_list[line_list.length - 1].setId(index);
                line_list[line_list.length - 1].set('distance', r_coords[index][8]);
                features_list[features_list.length - 1][0].setId(first_id);
                features_list[features_list.length - 1][0].set('status', "Resolved");
                features_list[features_list.length - 1][0].set('country',r_coords[index][2]);
                features_list[features_list.length - 1][0].set('class',r_coords[index][3]);
                features_list[features_list.length - 1][0].set('location',r_coords[index][1][0] + " N" + ", " + r_coords[index][1][1] + " E");
                features_list[features_list.length - 1][0].set('desc', features_list[features_list.length - 1][0].get('name') + " is listed as nearby " + features_list[features_list.length - 1][1].get('name') + ".");
                features_list[features_list.length - 1][1].setId(sec_id);
                features_list[features_list.length - 1][1].set('status', "Resolved");
                features_list[features_list.length - 1][1].set('country',r_coords[index][6]);
                features_list[features_list.length - 1][1].set('class',r_coords[index][7]);
                features_list[features_list.length - 1][1].set('location',r_coords[index][5]);
                features_list[features_list.length - 1][1].set('desc', features_list[features_list.length - 1][1].get('name') + " is listed as nearby " + features_list[features_list.length - 1][0].get('name') + ".");
                vectorLayer.getSource().addFeature(features_list[features_list.length - 1][0]);
                vectorLayer.getSource().addFeature(features_list[features_list.length - 1][1]);
                lineLayer.getSource().addFeature(line_list[line_list.length - 1]);
                map.addLayer(vectorLayer);
                map.addLayer(lineLayer);
            },

            onUnchecked: function() {

                index = $(this).val();

                vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(index+'0'));
                vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(index+'1'));
                lineLayer.getSource().removeFeature(lineLayer.getSource().getFeatureById(index));
                features_list.splice(features_list.indexOf(vectorLayer.getSource().getFeatureById(index)), 1);
                line_list.splice(line_list.indexOf(lineLayer.getSource().getFeatureById(index)), 1);
            }
        });

        $(".ui.checkbox#urow").checkbox({
            onChecked: function() {
                var wgs84Sphere = new ol.Sphere(6378137);
                index = $(this).val();

                console.log(u_coords[index][2]);
                circle_list.push(new ol.Feature({
                    geometry: new ol.geom.Circle(u_coords[index][1], 40000),
                    type: 'Circle',
                    id: "circle" + index
                }));
                features_list.push(new ol.Feature({
                    geometry: new ol.geom.Point(u_coords[index][1]),
                    type: 'Point',
                    name: u_coords[index][3],
                    id: index
                }));


                features_list[features_list.length - 1].setId(index);
                circle_list[features_list.length - 1].setId("circle"+index);
                features_list[features_list.length - 1].set('status', "Unresolved");
                features_list[features_list.length - 1].set('class',u_coords[index][0]);
                features_list[features_list.length - 1].set('location',u_coords[index][2][0] + " N, " + u_coords[index][2][1] + " E");
                features_list[features_list.length - 1].set('desc', features_list[features_list.length - 1].get('name') + " is an unresolved findspot.");

                circleLayer.getSource().addFeature(circle_list[circle_list.length - 1]);
                vectorLayer.getSource().addFeature(features_list[features_list.length - 1]);


            },

            onUnchecked: function() {
                index = $(this).val();
                vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(index));
                circleLayer.getSource().removeFeature(circleLayer.getSource().getFeatureById("circle"+index));
                features_list.splice(features_list.indexOf(vectorLayer.getSource().getFeatureById(index)), 1);
                circle_list.splice(circle_list.indexOf(vectorLayer.getSource().getFeatureById("circle"+index)), 1);
            }
        });

        $(".ui.checkbox#nrow").checkbox({
            onChecked: function() {

                index = $(this).val();
                features_list.push(new ol.Feature({
                    geometry: new ol.geom.Point(n_coords[index][1]),
                    type: 'Point',
                    name: n_coords[index][0],
                    id: index

                }));

                features_list[features_list.length - 1].setId(index);
                features_list[features_list.length - 1].set('status', "Resolved");
                features_list[features_list.length - 1].set('class',n_coords[index][2]);
                features_list[features_list.length - 1].set('country',n_coords[index][4]);
                features_list[features_list.length - 1].set('location', n_coords[index][3][0] + " N, " + n_coords[index][3][1] + " E");
                features_list[features_list.length - 1].set('desc', features_list[features_list.length - 1].get('name') + " is a resolved findspot with the toponym x that is listed as nearby the unresolved toponym x");
                console.log(features_list);
                vectorSource.addFeature(features_list[features_list.length - 1]);
                vectorLayer.getSource().refresh();
            },

            onUnchecked: function() {
                index = $(this).val();
                vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(index));
                features_list.splice(features_list.indexOf(vectorLayer.getSource().getFeatureById(index)), 1);
            }
        });

        var element = document.getElementById('popup');

        var popup = new ol.Overlay({
          element: element,
          positioning: 'top-left',
          stopEvent: false
        });

        var hover = new ol.Overlay({
          element: document.getElementById('hover'),
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
                    + "<div class='left floated country'></div><div class='right floated status' data-toggle='tooltip' data-placement='bottom'>"
                    + "</div></div></div>");

                    if(feature.get('status') == "Unresolved")
                    {
                        $('.right.floated.status').html("Status: <i class='remove circle outline icon'></i>");
                        $('.right.floated.status').attr('title', 'Unresolved');
                    }
                    else if(feature.get('status') == "Resolved") {
                        $('.right.floated.status').html("Status: <i class='check circle outline green icon'></i>");
                        $('.right.floated.status').attr('title', 'Resolved');
                    }

                    if(feature.U.hasOwnProperty('country'))
                    {
                        $('.country').html("Country: " + feature.get('country') + " <i class='"+ l_country + " flag'></i>")
                    }

                    if(feature.U.hasOwnProperty('distance'))
                    {
                        $('.dist').html("<div class='ui statistic'>"
                        + "<div class='value'>"+feature.get('distance').toFixed(2)+"</div>"
                        + "<div class='label'>Kilometers</div>"
                        + "</div>"
                        );
                    }

                    if(feature.get('class') == 'Toponym Estimate')
                    {
                        $('.stats').html("<div class='ui statistic'>"
                        + "<div class='value'>"+feature.get('desc')+"</div>"
                        + "<div class='label'>Probability</div>"
                        + "</div>");

                        if(feature.get('desc').replace('%', '') <= 20)
                        {
                            $('.ui.statistic').addClass('red');
                        }
                        else if(feature.get('desc').replace('%', '') >= 80)
                        {
                            $('.ui.statistic').addClass('green');
                        }
                        else {
                            $('.ui.statistic').addClass('yellow');
                        }
                    }
                    else {
                        $('.description').append(feature.get('desc'));
                    }

                    $('.ui.remove.icon').click(function() {
                        $('#popup').html("");
                    });

                } else {
                    $('#popup').html("");
                }
            });

        map.addOverlay(popup);


    }

    function callback(data)
    {
        var row = data.results.bindings;

        var regex_filter = /(toponym)\D\d+/;
        var regex_filter2 = /(Findspot)\/\d+/;
        var units = "kilometers";
        var complete = [];


        var html = [];

          for(var i in row)
          {
              if (row[i].hasOwnProperty('top1'))
              {
                    var normal_coords1 = [parseFloat(row[i].f1_lon.value), parseFloat(row[i].f1_lat.value)];
                    var transformed_coords = ol.proj.transform([parseFloat(row[i].f1_lon.value), parseFloat(row[i].f1_lat.value)], "EPSG:4326", "EPSG:3857");
                    findspot_coordinates.push([row[i].name.value, transformed_coords, regex_filter.exec(row[i].top2.value)[0], normal_coords1, row[i].country.value]);

                  //   Add row to table
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
                  var euro_distance = distance.toFixed(2).replace(/\./g, ',');
                  var point_1 = ol.proj.fromLonLat([parseFloat(row[i].t1_lon.value), parseFloat(row[i].t1_lat.value)]);
                  var point_2 = ol.proj.fromLonLat([parseFloat(row[i].t2_lon.value), parseFloat(row[i].t2_lat.value)]);

                  resolved_distances.push(distance);
                  resolved_coords.push([row[i].f1_name.value, [parseFloat(row[i].t1_lon.value), parseFloat(row[i].t1_lat.value)], row[i].f1_country.value, regex_filter.exec(row[i].t1.value)[0], row[i].f2_name.value, [parseFloat(row[i].t2_lon.value), parseFloat(row[i].t2_lat.value)], row[i].f2_country.value, regex_filter.exec(row[i].t2.value)[0], distance]);

                //   Add row to table
                  $('#toponym_dist_table>#table_details').append("<tr><td><div id='row' class='ui fitted toggle checkbox'><input type='checkbox' value='"+i+"'><label></label></div></td>"
                  + "<td><a href ="+row[i].t1.value + ">" + row[i].f1_name.value +"</a></td>"
                  +"<td><a href =" +row[i].t2.value + ">" + row[i].f2_name.value + "</td><td>" + euro_distance + " km</td></tr>");


                  resolved_distances.sort();

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

                //   Add row to table
                  $('#unresolved_table>#table_details').append("<tr><td><div id='urow' class='ui fitted toggle checkbox'><input type='checkbox' value='"+i+"'><label></label></div></td>"
                  +"<td><a href ="+row[i].f1.value + ">" + row[i].name.value + "</a></td>"
                  + "<td><div class='ui accordion'><div class='title'><i class='dropdown icon'></i>Show All results</div>"
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
                  temp_array.push({"dist": turf.distance(unresolved_findspot, resolved_findspot, units), "nearby_top_name": findspot_coordinates[j][2]});
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
              for(var i = 0; i < 8; i++)
              {
                  $('#probability'+ key).append("<i id='"+key+"-"+i+"' class='remove link icon'></i><div class='item' id='"+key+"-"+i+"'>Probability for " + unresolved_coords[key][0] + " to be " + regex_filter.exec(obj[i]["nearby_top_name"])[0].toString() + ": " + obj[i]["prob"].toFixed(2) + "</div>");
              }
          }

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
