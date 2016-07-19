$(document).ready(function() {

    var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";
    var findspot_regex = /Findspot\/\d+/;
    var toponym_regex = /toponym\W\d+/;

    var findspots = [];
    var toponyms = [];

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

    // console.log(query);
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



    $('.table').tablesort();

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

        console.log(findspots, toponyms);
    }

    function significance(data, full_table, row_totals)
    {
        var significance = [];
        for(var i in data)
        {
            var obj = full_table[data[i].pop_label.value];
            for(var j in obj)
            {
                for(var k in row_totals)
                {
                    if(obj[j]["kind_name"] == k)
                    {
                        obj[j].significance = (obj[j]["count"] / row_totals[k]);
                    }
                }
            }
        }

        return full_table;
    }

});
