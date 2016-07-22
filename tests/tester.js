$(document).ready(function() {

    var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";
    var findspot_regex = /Findspot\/\d+/;
    var toponym_regex = /toponym\W\d+/;

    var findspots = [];
    var toponyms = [];
    var data_var = [];

    var query = "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>\n"
            +"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
            +"SELECT ?t1 ?f1 ?kind_label ?pop_label ?category\n"
            +"WHERE {\n"
            +"?f1 higeomes:id ?id .\n"
            +"FILTER NOT EXISTS {\n"
            +"	?f1 higeomes:hasToponym ?t1 .\n"
            +"}\n"
            +"}"

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

    var query = "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>\n"
            +"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
            +"SELECT ?t1\n"
            +"WHERE {\n"
            +"    ?t1 rdf:type higeomes:Toponym.\n"
            +"  	FILTER NOT EXISTS {\n"
            +"  		?t1 higeomes:hasFindspot ?f1 .\n"
            +"  	}\n"
            +"}"

    $.ajax({
        url: repo,
        dataType: 'jsonp',
        async: false,
        data: {
            queryLn: 'SPARQL',
            query: query,
            Accept: 'application/json'
        },
        success: callback
    });

    function callback(data) {

        var row = data.results.bindings;

        if(row.length > 1000)
        {
            for(var i in row)
            {
                $('#header_details>tr').append("<th>"+ findspot_regex.exec(row[i].f1.value).toString().replace('Findspot/', 'F') +"</th>");
                findspots.push(row[i].f1.value);
            }
        }
        else {
            for(var i in row)
            {
                $('#table_details').append("<tr><td>"+ toponym_regex.exec(row[i].t1.value).toString().replace('toponym-','T') +"</td></tr>");
                toponyms.push(row[i].t1.value);
            }
        }



        for(var i in findspots)
        {
            for(var j in toponyms)
            {
                data_var.push([parseFloat(findspot_regex.exec(findspots[i]).toString().replace('Findspot/', '')), parseFloat(toponym_regex.exec(toponyms[j]).toString().replace('toponym-',''))])
                // data_var.push({'x': parseFloat(findspot_regex.exec(findspots[i]).toString().replace('Findspot/', '')), 'y': parseFloat(toponym_regex.exec(toponyms[j]).toString().replace('toponym-','')), 'r': Math.floor((Math.random() * 100) + 1)})
            }
        }

        console.log(data_var);

        // var groups = [
        //     {'0-20': data_var.filter(function(a) {
        //         return a.r <= 20;
        //     })},
        //     {'20-40': data_var.filter(function(a) {
        //         return a.r > 20 && a.r <= 40;
        //     })},
        //     {'40-60': data_var.filter(function(a) {
        //         return a.r > 40 && a.r <= 60;
        //     })},
        //     {'60-80': data_var.filter(function(a) {
        //         return a.r > 60 && a.r <= 80;
        //     })},
        //     {'80-100': data_var.filter(function(a) {
        //         return a.r > 80 && a.r <= 100;
        //     })}
        // ];
        //
        // var keys = [];
        // for(var i in groups)
        // {
        //     keys.push(Object.keys(groups[i])[0]);
        // }

        // console.log(keys);

        // console.log(data_var.slice(0,10));
        var ctx = $("#myChart");

        // var data = {
        //     labels: keys,
        //     datasets: [
        //         {
        //             label: 'Probability Bar Chart',
        //             data: [65, 59, 80, 81, 56, 55, 40],
        //             borderColor: "rgba(75, 192, 192, 1)",
        //             borderWidth: 1,
        //             backgroundColor: "rgba(75, 192, 192, 0.2)"
        //             // hoverBackgroundColor: "rgba(75, 192, 192, 1)",
        //         }]
        //     };
        //
        // var myBubbleChart = new Chart(ctx,{
        //     type: 'bar',
        //     data: data
        // });

        var scatterChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Scatter Dataset',
                    data: [{
                        x: -10,
                        y: 0
                    }, {
                        x: 0,
                        y: 10
                    }, {
                        x: 10,
                        y: 5
                    }]
                }]
            },
            options: {
                scales: {
                    xAxes: [{
                        type: 'linear',
                        position: 'bottom'
                    }]
                }
            }
        });
    }





});
