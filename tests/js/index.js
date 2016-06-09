$(document).ready(function() {

    var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";
    var resolved_distances = [];
<<<<<<< HEAD
=======
    var coords = [];
>>>>>>> origin/master
    var resolved_coords = [];

    query_resolved();
    query_unresolved();

<<<<<<< HEAD
    if (typeof(Number.prototype.toRad) === "undefined") {
        Number.prototype.toRad = function() {
            return this * Math.PI / 180;
        }
    }
=======
>>>>>>> origin/master

    function query_resolved()
    {
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
            success: resolved_data_handler
        });
    }

    function query_unresolved() {

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

      console.log(query);

        // query = "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>"
        // + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
        // + "SELECT ?t1 ?t2 ?f2 ?f2_lat ?f2_lon\n"
        // + "WHERE {"
	      //  + "?t1 higeomes:isNearOf ?t2 ."
  	    // +    "FILTER NOT EXISTS"
  	    // +    "{"
    	  // +      "?t1 higeomes:hasFindspot ?f1 ."
  	    // +    "}"
        // +   "OPTIONAL {"
        // +       "?t2 higeomes:hasFindspot ?f2 ."
        // +       "?f2 higeomes:lng ?f2_lon ."
        // +       "?f2 higeomes:lat ?f2_lat ."
        // +   "}"
        // + "}";

        $.ajax({
            url: repo,
            dataType: 'jsonp',
            data: {
                queryLn: 'SPARQL',
                query: query,
                Accept: 'application/json'
            },
            success: unresolved_data_hander
        });
    }

    var baghdad = ol.proj.transform([40.3615, 35.7128],"EPSG:4326", "EPSG:3857");

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

    var vectorLayer;
    var lineLayer;
    var features_list = [];
    var line_list = [];

    function draw_map2(coordinates)
    {

        var baghdad = ol.proj.transform([40.3615, 35.7128],"EPSG:4326", "EPSG:3857");

        var iconStyle = new ol.style.Style({
            image: new ol.style.Icon(({
                anchor: [0.5, 0.5],
                anchorOrigin: 'bottom-right',
                opacity: 0.75,
                src: './img/map-marker-2-xxl.png',
                scale: .1
            }))
        });

        $('.ui.accordion').accordion('toggle');

        var vectorLayer;
        var features_list = [];

        $(".ui.checkbox#urow").checkbox({
            onChecked: function() {

                var index = $(this).val();
                console.log(coordinates[index][1]);
                features_list.push(new ol.Feature({
                    geometry: new ol.geom.Point(coordinates[index][1]),
                    name: coordinates[index][0]
                }));

                for(var i in features_list)
                {
                    features_list[i].setStyle(iconStyle);
                }

                var vectorSource = new ol.source.Vector({
                    features: features_list
                });

                vectorLayer = new ol.layer.Vector({
                    source: vectorSource
                });

                map.addLayer(vectorLayer);

            },

            onUnchecked: function() {
                vectorLayer.getSource().clear();
                features_list = [];
                console.log(features_list)
            }
        });
    }
    var globe_sphere = new ol.Sphere(6378137);

    function draw_map(coordinates)
    {
        $(".ui.checkbox#row").checkbox({
            onChecked: function() {

                var index = $(this).val();
                console.log(coordinates[index][1]);
                features_list.push(new ol.Feature({
                    geometry: new ol.geom.Point(coordinates[index][1]),
                    name: coordinates[index][0]
                }));
                features_list.push(new ol.Feature({
                    geometry: new ol.geom.Point(coordinates[index][3]),
                    name: coordinates[index][2]
                }));
                line_list.push(new ol.Feature({
                    geometry: new ol.geom.LineString([coordinates[index][1], coordinates[index][3]]),
                    name: 'Line'
                }));

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
                console.log(features_list)
            }
        });
    }


    var osmLayer = new ol.layer.Tile({
        source: new ol.source.OSM()
    });

    var view = new ol.View({
        // projection: new ol.proj.Projection({
        // code: 'EPSG:4326',
        // units: 'm'
        // }),
        center: baghdad,
        zoom: 7
    });

    map.addLayer(osmLayer);
    map.setView(view);

    function resolved_data_handler(data)
    {

        var row = data.results.bindings;
        var regex_filter = /(toponym)\D\d+/;

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

              var units = "kilometers";

              var distance = turf.distance(coordinate_1, coordinate_2, units);
              var point_1 = ol.proj.fromLonLat([parseFloat(row[i].t1_lon.value), parseFloat(row[i].t1_lat.value)]);

              var point_2 = ol.proj.fromLonLat([parseFloat(row[i].t2_lon.value), parseFloat(row[i].t2_lat.value)]);
            //   var distance = globe_sphere.haversineDistance(coordinate_1, coordinate_2)/1000;

              resolved_distances.push(distance);

<<<<<<< HEAD
              resolved_coords.push([row[i].t1.value, point_1, row[i].t2.value, point_2]);
=======
              resolved_coords.push([row[i].t1.value, coordinate_1, row[i].t2.value, coordinate_2]);
>>>>>>> origin/master

              $('#toponym_dist_table>#table_details').append("<tr><td><div  id='row' class='ui toggle collapsing checkbox'><input type='checkbox' value='"+i+"'><label></label></div></td><td>" + "<a href ="+row[i].t1.value + ">" + regex_filter.exec(row[i].t1.value)[0] +"</a></td><td><a href =" +row[i].t2.value + ">" + regex_filter.exec(row[i].t2.value)[0] + "</td><td>" + distance + " km</td></tr>");
          }

<<<<<<< HEAD
          resolved_distances.sort();
=======
        resolved_distances.sort();
>>>>>>> origin/master
        draw_map(resolved_coords);
    }

    function unresolved_data_hander(data)
    {
<<<<<<< HEAD
        var coords = [];
=======
    //   console.log("in function");

>>>>>>> origin/master
        var row = data.results.bindings;

        // console.log(data);

        var globe_sphere = new ol.Sphere(6378137);
        var regex_filter2 = /(Findspot)\/\d+/;

        var id = "#unresolved_table"

        var findspot_name;
        var findspot_name1;
        var findspot_loc;

        for(var i in row)
        {

            var normal_coords = [parseFloat(row[i].f1_lon.value), parseFloat(row[i].f1_lat.value)];
            findspot_loc = ol.proj.transform([parseFloat(row[i].f1_lon.value), parseFloat(row[i].f1_lat.value)], "EPSG:4326", "EPSG:3857");
            findspot_name = row[i].f1.value;

            findspot_name1 = regex_filter2.exec(findspot_name)[0].toString();
            findspot_name1 = findspot_name1.replace(/\//, " ");


<<<<<<< HEAD
            $(id+'>#table_details').append("<tr><td><div id='urow' class='ui collapsing toggle checkbox'><input type='checkbox' value='"+i+"'><label></label></div></td><td>" + "<a href ="+row[i].f1.value + ">" + findspot_name1 +"</a></td><td><div class='ui fluid accordion'><div class='title'><i class='dropdown icon'></i>Show All Results</div><div class='content'><p>Testing to see if this works!</p></div></div></td></tr>");
=======
            $(id+'>#table_details').append("<tr><td><div id='urow' class='ui toggle checkbox'><input type='checkbox' value='"+i+"'><label></label></div></td><td>" + "<a href ="+row[i].f1.value + ">" + findspot_name1 +"</a></td><td>"+row[i].f1_lon.value+" N, "+ row[i].f1_lat.value+" E</td><td id='prob"+i+"'></td></tr>");
>>>>>>> origin/master

            coords.push([findspot_name1, findspot_loc]);

        }

<<<<<<< HEAD
        var probability_array = [];
        var unresolved_table = [];
        var full_list = [];

        //
        // for(var i in coords)
        // {
        //     for(var j in reoslved_coords)
        //     {
        //         unresolved_table.push([resolved_coords[j][0], globe_sphere.haversineDistance(resolved_coords[j][1], coords[i][1])/1000, resolved_coords[j][2], globe_sphere.haversineDistance(resolved_coords[j][3], coords[i][1])/1000]);
        //     }
        //     full_list.push([unresolved_table[i]]);
        //     for(var item in full_list)
        //     {
        //         probability_array.push([probability(resolved_distances, full_list[item][1]), full_list[item][0], probability(resolved_distances, full_list[item][3]), full_list[item][2]]);
        //     }
        // }
        // probability_array""
=======
        var unresolved_distance = [];

        // for(var x in resolved_coords)
        // {
        //     unresolved_distance.push(globe_sphere.haversineDistance(resolved_coords[x][1], coords[i][1])/1000);
        // }
>>>>>>> origin/master

        for(var i in coords)
        {
            for(var j in resolved_coords)
            {
                var distance = globe_sphere.haversineDistance(resolved_coords[j][1], coords[i][1])/1000;
            }
            var prob = probability(resolved_distances, distance);
            $('#prob'+i).append((Math.round(prob*10000)/100) + "%");


<<<<<<< HEAD
        // Caculate probability
        draw_map2(coords);
    }

=======
        }
        draw_map2(coords);
    }


>>>>>>> origin/master
    function probability(reference,value)
    {
        console.log("whatsup again");
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
