var geoJSONObject = {
    'type': 'FeatureCollection',
    'crs': {
        'type': 'name',
        'properties': {
            'name': 'EPSG:3857'
        }
    },
    'features': [{
        'type': 'Feature',
        'properties': {
            'name': row[i].f1_name.value,
            'country':
            'distance':
        }
        'geometry': {
            'type': 'Point',
            'coordinates': [parseFloat(row[i].t1_lon.value), parseFloat(row[i].t1_lat.value)],

        }
    }
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': [parseFloat(row[i].t2_lon.value), parseFloat(row[i].t2_lat.value)],
            'name': row[i].f2_name.value,
            'country': row[i].f2_country.value,
            'distance':
        }
    }]
};
