$(document).ready(function() {

    var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";
    var query = "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>"
                +"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
                +"SELECT DISTINCT ?t1 ?f1 ?kind ?pop\n"
                +"WHERE {"
                +    "?t1 higeomes:hasFindspot ?f1 ."
  	            +    "?f1 higeomes:state ?statement ."
  	            +    "?statement higeomes:kind ?kind ."
  	            +    "?related higeomes:definedTopo ?t1 ."
  	            +    "?related higeomes:definedPopulation ?pop ."
                +"}";

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
            var values = [];
            var compare = row[0].pop.value;
            var regex = /-\d+/;

            for(var i in row)
            {
                if(row[i].pop.value == compare) {
                    continue;
                }
                else {
                    values.push(compare);
                    compare = row[i].pop.value
                }
            }

            values = values.sort(function(a, b) {
                console.log(a);
                return parseFloat(regex.exec(a).replace('-', '')) < parseFloat(regex.exec(b).replace('-', ''));
            });

            console.log(values);
        }
    })
});
