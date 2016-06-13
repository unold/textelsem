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

    var id = "#toponym_dist_table";

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
    + "SELECT ?f1 ?f1_lat ?f1_lon\n"
    + "WHERE {"
    + "?f1 higeomes:id ?f2 ."
    + "FILTER NOT EXISTS"
    + "{"
    +   "?f1 higeomes:hasToponym ?t1 ."
    + "}"
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
    + "SELECT ?top1 ?find1 ?f1_lon ?f1_lat ?top2\n"
    + "WHERE {"
    + "?top1 higeomes:isNearOf ?top2 ."
    + "?top1 higeomes:hasFindspot ?find1 ."
    + "FILTER NOT EXISTS"
    + "{"
    +   "?top2 higeomes:hasFindspot ?find2 ."
    + "}"
    + "?find1 higeomes:lng ?f1_lon ."
    + "?find1 higeomes:lat ?f1_lat ."
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

// Create Map ================================================================

    var map = new ol.Map({
        target: 'map'
    });

    var vectorSource;
    var lineSource;
    var lineLayer;
    var vectorLayer;
    var features_list = [];
// ============================================================================



    function draw_map(r_coords, u_coords, n_coords)
    {

        var line_list = [];
        var resolved = false;
        var index;

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
                color: '#000000',
                width: 3
            })
        });

        vectorSource = new ol.source.Vector({
            // features: features
        });

        vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style: iconStyle
        });

        lineSource = new ol.source.Vector({
            // features: lines
        });

        lineLayer = new ol.layer.Vector({
            source: lineSource,
            style: lineStyle
        });

        map.addLayer(lineLayer);
        map.addLayer(vectorLayer);

        $('.ui.accordion').accordion();

        $('.ui.selection.list>.item').click(function()
        {
            var id = $(this).attr('id');
            index = id % 10;

            console.log(id % 10);
            features_list.push(new ol.Feature({
                geometry: new ol.geom.Point(n_coords[index][1]),
                name: n_coords[index][0],
                id: id
            }));

            features_list[features_list.length - 1].setId(id);
            vectorLayer.getSource().addFeature(features_list[features_list.length - 1]);
            map.addLayer(vectorLayer);
        });

        $('.remove').click(function()
        {
            var id = $(this).attr('id');
            vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(id));
            features_list.splice(features_list.indexOf(vectorLayer.getSource().getFeatureById(id)), 1)
        });

        $(".ui.checkbox#row").checkbox({
            onChecked: function() {

                resolved = true;
                index = $(this).val();
                var first_id = index + 0;
                var sec_id = index + 1;
                features_list.push([new ol.Feature({
                    geometry: new ol.geom.Point(r_coords[index][1]),
                    name: r_coords[index][0],
                    id: first_id
                }),
                new ol.Feature({
                    geometry: new ol.geom.Point(r_coords[index][3]),
                    name: r_coords[index][2],
                    id: sec_id
                })]);
                line_list.push(new ol.Feature({
                    geometry: new ol.geom.LineString([r_coords[index][1], r_coords[index][3]]),
                    name: 'Line',
                    id: index
                }));


                line_list[line_list.length - 1].setId(index);
                features_list[features_list.length - 1][0].setId(first_id);
                features_list[features_list.length - 1][1].setId(sec_id);
                console.log(line_list[line_list.length - 1]);
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
                // console.log(lineLayer.getSource().getFeatureById(index));
                lineLayer.getSource().removeFeature(lineLayer.getSource().getFeatureById(index));
                features_list.splice(features_list.indexOf(vectorLayer.getSource().getFeatureById(id)), 1);
                line_list.splice(line_list.indexOf(lineLayer.getSource().getFeatureById(id)), 1)
            }
        });

        $(".ui.checkbox#urow").checkbox({
            onChecked: function() {

                index = $(this).val();
                features_list.push(new ol.Feature({
                    geometry: new ol.geom.Point(u_coords[index][1]),
                    name: u_coords[index][0],
                    id: index
                }));

                features_list[features_list.length - 1].setId(index);
                vectorLayer.getSource().addFeature(features_list[features_list.length - 1]);
                map.addLayer(vectorLayer);
            },

            onUnchecked: function() {
                index = $(this).val();
                vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(index));
                features_list.splice(features_list.indexOf(vectorLayer.getSource().getFeatureById(index)), 1);
            }
        });

        $(".ui.checkbox#nrow").checkbox({
            onChecked: function() {

                index = $(this).val();
                features_list.push(new ol.Feature({
                    geometry: new ol.geom.Point(n_coords[index][1]),
                    name: n_coords[index][0],
                    id: index
                }));

                features_list[features_list.length - 1].setId(index);
                vectorSource.addFeature(features_list[features_list.length - 1]);
                map.addLayer(vectorLayer);
            },

            onUnchecked: function() {
                index = $(this).val();
                vectorLayer.getSource().removeFeature(vectorLayer.getSource().getFeatureById(index));
                features_list.splice(features_list.indexOf(vectorLayer.getSource().getFeatureById(index)), 1);
            }
        });

        var osmLayer = new ol.layer.Tile({
            source: new ol.source.OSM()
        });

        var map_view = new ol.View({
            center: ol.proj.transform([40.3615, 35.7128],"EPSG:4326", "EPSG:3857"),
            zoom: 7
        });

        map.addLayer(vectorLayer);
        map.addLayer(osmLayer);
        map.setView(map_view);

    }

    // function render_points(isResolved, features, lines)
    // {
    //     var iconStyle = new ol.style.Style({
    //         image: new ol.style.Icon(({
    //             anchor: [0.5, 0.5],
    //             anchorOrigin: 'bottom-right',
    //             opacity: 0.75,
    //             src: './img/map-marker-2-xxl.png',
    //             scale: .1
    //         }))
    //     });
    //
    //     var lineStyle = new ol.style.Style({
    //         stroke: new ol.style.Stroke({
    //             color: '#000000',
    //             width: 3
    //         })
    //     });
    //
    //     vectorSource = new ol.source.Vector({
    //         features: features
    //     });
    //
    //     vectorLayer = new ol.layer.Vector({
    //         source: vectorSource,
    //         style: iconStyle
    //     });
    //
    //     if(isResolved)
    //     {
    //         lineSource = new ol.source.Vector({
    //             features: lines
    //         });
    //
    //         lineLayer = new ol.layer.Vector({
    //             source: lineSource,
    //             style: lineStyle
    //         });
    //
    //         map.addLayer(lineLayer);
    //     }
    //
    //     map.addLayer(vectorLayer);
    // }

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
                    findspot_coordinates.push([row[i].find1.value, ol.proj.transform([parseFloat(row[i].f1_lon.value), parseFloat(row[i].f1_lat.value)], "EPSG:4326", "EPSG:3857"), row[i].top2.value]);

                  //   Add row to table
                    $('#new_table>#table_details').append("<tr><td><div id='nrow' class='ui fitted toggle checkbox'><input type='checkbox' value='"+i+"'><label></label></div></td>"
                    + "<td><a href ="+row[i].top1.value + ">" + regex_filter.exec(row[i].top1.value)[0] +"</a></td>"
                    +"<td><a href =" +row[i].top2.value + ">" + regex_filter2.exec(row[i].find1.value)[0].replace(/\//, " ") + "</a></td>"
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
                  resolved_coords.push([row[i].t1.value, point_1, row[i].t2.value, point_2]);

                //   Add row to table
                  $('#toponym_dist_table>#table_details').append("<tr><td><div id='row' class='ui fitted toggle checkbox'><input type='checkbox' value='"+i+"'><label></label></div></td>"
                  + "<td><a href ="+row[i].t1.value + ">" + regex_filter.exec(row[i].t1.value)[0] +"</a></td>"
                  +"<td><a href =" +row[i].t2.value + ">" + regex_filter.exec(row[i].t2.value)[0] + "</td><td>" + euro_distance + " km</td></tr>");

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
                  +"<td><a href ="+row[i].f1.value + ">" + findspot_name1+ "</a></td>"
                  + "<td><div class='ui accordion'><div class='title'><i class='dropdown icon'></i>Show All results</div>"
                  + "<div class='content'><div class='ui selection list'  id='probability" + i +"'></div></div></div></td></tr>");

                  unresolved_coords.push([findspot_name1, findspot_loc]);
              }
          }

          for(var i in unresolved_coords)
          {
              var unresolved_findspot = {
                  "type": "Feature",
                  "geometry": {
                      "type": "Point",
                      "coordinates": unresolved_coords[i][1]
                  }
              };
              var temp_array = [];

              for(var j in findspot_coordinates)
              {

                  var resolved_findspot = {
                      "type": "Feature",
                      "geometry": {
                          "type": "Point",
                          "coordinates": findspot_coordinates[j][1]
                      }
                  };

                  temp_array.push({"dist": turf.distance(unresolved_findspot, resolved_findspot, units)/1000, "nearby_top_name": findspot_coordinates[j][2]});
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
                  $('#probability'+ key).append("<i id='"+key+i+"' class='remove link icon'></i><div class='item' id='"+key+i+"'>Probability for " + regex_filter.exec(obj[i]["nearby_top_name"])[0].toString() + ": " + obj[i]["prob"].toFixed(2) + "</div>");
              }
          }

          console.log(complete);

        //   =============================================================================================================
          draw_map(resolved_coords, unresolved_coords, findspot_coordinates);
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
