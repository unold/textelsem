for(var i in unresolved_coords)
{
    var unresolved_findspot = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": unresolved_coords[i][1]
        }
    };

    for(var j in findspot_coordinates)
    {

        var resolved_findspot = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": findspot_coordinates[j][1]
            }
        };

        complete.push({"uFindspot_location": unresolved_coords[i][1], "dist": turf.distance(unresolved_findspot, resolved_findspot, units)/1000, "uFindspot_name": findspot_coordinates[j][0]);
    }
}

for(var key in complete)
{
    complete[key].prob = probability(resolved_distances, complete[key]["dist"]);

  //   $('.ui.list').append("<div class='item'>Probability for " + regex_filter.exec(complete[key]["r2_name"])[0].toString() + ": " + complete[key]["r2_prob"].toFixed(2) + "</div>");
  //   $('.ui.list').append("<div class='item'>Probability for " + regex_filter.exec(complete[key]["r1_name"])[0].toString() + ": " + complete[key]["r1_prob"].toFixed(2) + "</div>");
}
