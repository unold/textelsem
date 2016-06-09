var map = new ol.Map({
    target: 'map',
    view: map_view
});

function draw_map(coordinates)
{
    var vectorSource;
    var lineSource;
    var lineLayer;
    var vectorLayer;
    var features_list = [];
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

    if(coordinates.length > 2)
    {
        $(".ui.checkbox#row").checkbox({
            onChecked: function() {

                resolved = true;
                index = $(this).val();
                draw_coordinates(coordinates);
                features_list.push(new ol.Feature({
                    geometry: new ol.geom.Point(coordinates[index][3]),
                    name: coordinates[index][2]
                }));
                line_list.push(new ol.Feature({
                    geometry: new ol.geom.LineString([coordinates[index][1], coordinates[index][3]]),
                    name: 'Line'
                }));
                render_map(resolved, map);
            }

            onUnchecked: function() {
                vectorLayer.getSource().clear();
                lineLayer.getSource().clear();
                features_list = [];
                line_list = [];
                console.log(features_list)
            }

        }
    }

    else
    {
        $(".ui.checkbox#urow").checkbox({
            onChecked: function() {

                index = $(this).val();
                draw_coordinates(coodinates, index);
                render_map(resolved);
            },

            onUnchecked: function() {
                vectorLayer.getSource().clear();
                features_list = [];
                console.log(features_list)
            }
        }
    }

}

function draw_coordinates(coords_1, i)
{
    console.log(coords_1[i][1]);
    features_list.push(new ol.Feature({
        geometry: new ol.geom.Point(coords_1[i][1]),
        name: coords_1[i][0]
    }));
}

function render_map(isResolved)
{
    var osmLayer = new ol.layer.Tile({
        source: new ol.source.OSM()
    });

    var map_view = new ol.View({
        center: baghdad,
        zoom: 7
    });


    vectorSource = new ol.source.Vector({
        features: features_list
    });

    vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: iconStyle
    });

    if(isResolved)
    {
        lineSource = new ol.source.Vector({
            features: line_list
        });

        lineLayer = new ol.layer.Vector({
            source: lineSource,
            style: lineStyle
        });
    }

    map.addLayer(vectorLayer);
    map.addLayer(lineLayer);
    map.addLayer(osmLayer);
}
