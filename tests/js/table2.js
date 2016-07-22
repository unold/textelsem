$(document).ready(function() {

    var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";
    var findspot_regex = /Findspot\/\d+/;
    var toponym_regex = /toponym\W\d+/;

    var findspots = [];
    var toponyms = [];
    var grid = [];

    function getProperties() {
        return $.ajax({
            url: repo,
            dataType: 'jsonp',
            data: {
                queryLn: 'SPARQL',
                query: "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>\n"
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
                        +"}",
                Accept: 'application/json'
            }
        });
    }

    function getFindspots() {
        return $.ajax({
            url: repo,
            dataType: 'jsonp',
            data: {
                queryLn: 'SPARQL',
                query: "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>\n"
                        +"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
                        +"SELECT ?t1 ?f1 ?kind_label ?pop_label ?category\n"
                        +"WHERE {\n"
                        +"?f1 higeomes:id ?id .\n"
                      	+"FILTER NOT EXISTS {\n"
                      	+"	?f1 higeomes:hasToponym ?t1 .\n"
                      	+"}\n"
                        +"?f1 higeomes:state ?state .\n"
                        +"?state higeomes:kind ?kind .\n"
                        +"?kind rdfs:label ?kind_label .\n"
                        +"}",
                Accept: 'application/json'
            }
        });
    }

    function getToponyms() {
        return $.ajax({
            url: repo,
            dataType: 'jsonp',
            data: {
                queryLn: 'SPARQL',
                query: "PREFIX higeomes: <http://higeomes.i3mainz.hs-mainz.de/textelsem/ArchDB/>\n"
                        +"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
                        +"SELECT ?t1 ?pop_label\n"
                        +"WHERE {\n"
                        +"    ?t1 rdf:type higeomes:Toponym.\n"
                        +"  	FILTER NOT EXISTS {\n"
                        +"  		?t1 higeomes:hasFindspot ?f1 .\n"
                        +"  	}\n"
                        +"?related higeomes:definedTopo ?t1 ."
                        +"?related higeomes:definedPopulation ?pop ."
                        +"?pop rdfs:label ?pop_label ."
                        +"}",
                Accept: 'application/json'
            }
        });
    }

    $.when(getProperties(), getFindspots(), getToponyms()).then(function(resp1, resp2, resp3) {
        var properties = resp1[0].results.bindings;
        var f_results = resp2[0].results.bindings;
        var t_results = resp3[0].results.bindings;

        var kind = [];
        var population = [];
        var full = [];


        var population_list = [];
        var kind_list = [];
        var total = [];
        var categories = [];

        for(var i in properties)
        {
            population_list.push(properties[i].pop_label.value);
            kind_list.push(properties[i].kind_label.value);
            categories.push(properties[i].category.value);
        }

        $.unique(population_list);
        $.unique(kind_list);
        $.unique(categories);

        for(var i in population_list)
        {
            grid[population_list[i]] = [];
            for(var j in kind_list)
            {
                grid[population_list[i]].push({"kind_name": kind_list[j], "count": 0, "related_toponyms": []});
            }
        }

        console.log(grid);

        for(var i in kind_list)
        {
            total[kind_list[i]] = 0;
        }

        for(var i in properties)
        {
            for(var x in categories)
            {
                grid[properties[i].pop_label.value].category = properties[i].category.value;
            }

            for(var j in grid[properties[i].pop_label.value])
            {
                if(grid[properties[i].pop_label.value][j]["kind_name"] == properties[i].kind_label.value)
                {
                    grid[properties[i].pop_label.value][j]["count"]++;
                    grid[properties[i].pop_label.value][j]["related_toponyms"].push(properties[i].t1.value)
                }
            }
            total[properties[i].kind_label.value]++;
        }

        grid = significance(properties, grid, total);

        for(var i in f_results)
        {
            $('#header_details>tr').append("<th>"+ findspot_regex.exec(f_results[i].f1.value).toString().replace('Findspot/', 'F') +"</th>");
            // findspots.push(f_results[i].f1.value);
            kind.push(f_results[i].kind_label.value);
        }

        $.unique(kind);

        for(var i in t_results)
        {
            $('#table_details').append("<tr id='"+ toponym_regex.exec(t_results[i].t1.value).toString().replace('toponym-','T') +"'><td>"+ toponym_regex.exec(t_results[i].t1.value).toString().replace('toponym-','T') +"</td></tr>");
            // toponyms.push(i);
            population.push(t_results[i].pop_label.value);
        }

        for(var i in t_results)
        {
            for(var j in f_results)
            {
                full.push({'population': t_results[i].pop_label.value, 'kind': f_results[j].kind_label.value})
            }
        }

        var distinct = [];
        var init = full[0];
        for(var i = 1; i < full.length; i++)
        {
            if(init["kind"] == full[i]["kind"] && init["population"] == full[i]["population"])
            {
                continue;
            }
            else {
                distinct.push(init);
                init = full[i];
            }
        }

        for(var i in distinct)
        {
            distinct[i].sig = 0;
        }

        for(var i in distinct)
        {
            for(var j in grid)
            {
                for(var k in grid[j])
                {
                    if(grid[j][k]['kind_name'] == distinct[i]['kind'] && j == distinct[i]['population'])
                    {
                        distinct[i]['sig'] = grid[j][k]['significance'];
                    }
                }
            }
        }
        console.log(distinct);

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

    $('.table').tablesort();


});
