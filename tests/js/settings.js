$(document).ready(function() {
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


});
