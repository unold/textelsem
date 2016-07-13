$(document).ready(function() {

    var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";

    var query = "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>"
            +"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
            +"SELECT ?t1 ?f1 ?kind_label ?pop_label ?category\n"
            +"WHERE {"
            +"    ?t1 higeomes:hasFindspot ?f1 ."
            +"    ?f1 higeomes:state ?statement ."
            +"    ?statement higeomes:kind ?kind ."
            +"    ?kind rdfs:label ?kind_label ."
            +"    ?related higeomes:definedTopo ?t1 ."
            +"    ?related higeomes:definedPopulation ?pop ."
            +"    ?pop higeomes:hasCategory ?category ."
            +"    ?pop rdfs:label ?pop_label ."
            +"}"

    $.ajax({
        url: repo,
        dataType: 'jsonp',
        data: {
            queryLn: 'SPARQL',
            query: query,
            Accept: 'application/json'
        },
        success: function(data) {
            var row = data.results.bindings;
            console.log(row);

            var population = [];
            var kind = [];
            for(var i in row)
            {
                population.push(row[i].pop_label.value);
                kind.push(row[i].kind_label.value);
            }

            $.unique(population);
            $.unique(kind);

            for(var i in kind)
            {
                $('#header_details>tr').append("<th class='two wide'>"+ kind[i] +"</th>")
            }

            for(var i in population)
            {

                $('#table_details').append("<tr id='"+ population[i].replace(/\s+|\W+/g, '') +"'><td>"+ population[i] +"</td></tr>");
                for(var j in kind)
                {
                    $('#' + population[i].replace(/\s+|\W+/g, '')).append("<td id='"+ kind[j].replace(/\s+|\W+/g, '') +"'></td>")
                }
            }

            for(var i in row)
            {
                $("#" + row[i].pop_label.value.replace(/\s+|\W+/g, '') + ">#" + row[i].kind_label.value.replace(/\s+|\W+/g, '')).append("<i class='mini circle icon'></i>");
            }
        }
    })
});
