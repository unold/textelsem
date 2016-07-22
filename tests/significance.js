// $(document).ready(function() {

    var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";
    var toponym_regex = /toponym\W\d+/;

    var grid = [];


    var query = "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>\n"
            +"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
            +"SELECT ?t1 ?f1 ?kind_label ?pop_label ?category\n"
            +"WHERE {\n"
            +"    ?t1 higeomes:hasFindspot ?f1 .\n"
            +"    ?f1 higeomes:state ?statement .\n"
            +"    ?statement higeomes:kind ?kind .\n"
            +"    ?kind rdfs:label ?kind_label .\n"
            +"    ?related higeomes:definedTopo ?t1 .\n"
            +"    ?related higeomes:definedPopulation ?pop .\n"
            +"    ?pop higeomes:hasCategory ?category .\n"
            +"    ?pop rdfs:label ?pop_label .\n"
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

            var population = [];
            var kind = [];
            var total = [];
            var categories = [];

            for(var i in row)
            {
                population.push(row[i].pop_label.value);
                kind.push(row[i].kind_label.value);
                categories.push(row[i].category.value);
            }

            $.unique(population);
            $.unique(kind);
            $.unique(categories);

            console.log(categories);

            for(var i in population)
            {
                grid[population[i]] = [];
                for(var j in kind)
                {
                    grid[population[i]].push({"kind_name": kind[j], "count": 0, "related_toponyms": []});
                }
            }

            for(var i in kind)
            {
                total[kind[i]] = 0;
            }

            for(var i in row)
            {
                for(var x in categories)
                {
                    grid[row[i].pop_label.value].category = row[i].category.value;
                }

                for(var j in grid[row[i].pop_label.value])
                {
                    if(grid[row[i].pop_label.value][j]["kind_name"] == row[i].kind_label.value)
                    {
                        grid[row[i].pop_label.value][j]["count"]++;
                        grid[row[i].pop_label.value][j]["related_toponyms"].push(row[i].t1.value)
                    }
                }
                total[row[i].kind_label.value]++;
            }

            grid = significance(row, grid, total);

            console.log(grid);



        }
    });

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

// });
