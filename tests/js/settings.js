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


                        // var color_lookup = {
                        //     "all": function () {
                        //         return ['rgba(255, 159, 64, 0.2)', 'rgba(255, 159, 64, 1)']
                        //     },
                        //     "nearby": function () {
                        //         return ['rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 1)']
                        //     },
                        //     "north": function () {
                        //         return ['rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 1)']
                        //     },
                        //     "south": function () {
                        //         return ['rgba(255, 206, 86, 0.2)', 'rgba(255, 206, 86, 1)']
                        //     },
                        //     "east": function () {
                        //         return ['rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)']
                        //     },
                        //     "west": function () {
                        //         return ['rgba(153, 102, 255, 0.2)', 'rgba(153, 102, 255, 1)']
                        //     }
                        // };
                        //
                        // var colors = [];
                        // var borders = [];
                        // var labels = [];
                        //
                        // for(var i in sorted_distances)
                        // {
                        //     colors.push(color_lookup[values[x]]()[0]);
                        //     borders.push(color_lookup[values[x]]()[1]);
                        //     labels.push('No. ' + i);
                        // }
                        //
                        // var ctx = document.getElementById(values[x]);
                        //
                        // var myChart = new Chart(ctx, {
                        //     type: 'bar',
                        //     data: {
                        //         labels: labels,
                        //         datasets: [{
                        //             label: 'Distances (' + values[x] + ")",
                        //             data: sorted_distances,
                        //             backgroundColor: colors,
                        //             borderColor: borders,
                        //             borderWidth: 1
                        //         }]
                        //     },
                        //     options: {
                        //         scales: {
                        //             yAxes: [{
                        //                 ticks: {
                        //                     beginAtZero:true,
                        //                     steps: 10,
                        //                     stepValue: 20,
                        //                     max: 700
                        //                 }
                        //             }]
                        //         }
                        //     }
                        // });
                        //
                        // var ctx2 = document.getElementById(values[x] + "2");
                        //
                        // var myChart2 = new Chart(ctx2, {
                        //     type: 'bubble',
                        //     data: {
                        //         labels: labels,
                        //         datasets: [{
                        //             label: 'Angles (' + values[x] + ")",
                        //             data: sorted_angles,
                        //             backgroundColor: colors,
                        //             borderColor: borders,
                        //             borderWidth: 1
                        //         }]
                        //     },
                        //     options: {
                        //         scales: {
                        //             yAxes: [{
                        //                 ticks: {
                        //                     beginAtZero:true
                        //
                        //                 }
                        //             }]
                        //         }
                        //     }
                        // });
});
