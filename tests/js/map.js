$(document).ready(function() {
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

    function draw_map(r_coords, u_coords, n_coords, complete_list)
    {

        var line_list = [];
        var features_list = [];
        var circle_list = [];
        var index;

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

                if(n_coords[index].length < 7)
                {
                    map.getView().setCenter(n_coords[index][1]);
                    map.getView().setZoom(10);
                }
                else {
                    map.getView().setCenter(ol.proj.transform(n_coords[index][11]['geometry']['coordinates'],"EPSG:4326", "EPSG:3857"));
                    map.getView().setZoom(8);
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
            var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
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
        });
    }
});
