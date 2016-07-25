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
                        +"SELECT DISTINCT ?t1 ?f1 ?kind_label ?pop_label ?category\n"
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
                        +"SELECT DISTINCT ?t1 ?pop_label\n"
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
        full_findspots = [];
        var findspot_names = [];


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

        for(var i in grid)
        {
            for(var j in grid[i])
            {
                if(!isNaN(j))
                {
                    full.push({"population": i, "kind": grid[i][j]["kind_name"], "significance": grid[i][j]["significance"]})
                }
            }
        }

        for(var i in f_results)
        {
            $('#header_details>tr').append("<th>"+ findspot_regex.exec(f_results[i].f1.value).toString().replace('Findspot/', 'F') +"</th>");
            findspots.push({"name": f_results[i].f1.value, "kind":f_results[i].kind_label.value})
            kind.push(f_results[i].kind_label.value);
        }

        $.unique(kind);

        for(var i in t_results)
        {
            $('#table_details').append("<tr id='"+ toponym_regex.exec(t_results[i].t1.value).toString().replace('toponym-','T') +"'><td>"+ toponym_regex.exec(t_results[i].t1.value).toString().replace('toponym-','T') +"</td></tr>");
            toponyms.push({"name": t_results[i].t1.value, "population":t_results[i].pop_label.value});
            population.push(t_results[i].pop_label.value);
        }

        // console.log(full);
        // console.log('Findspots', findspots);
        // console.log('Toponyms', toponyms);

        findspots.sort(function(a,b) {
            return parseFloat(findspot_regex.exec(a["name"]).toString().replace('Findspot/', '')) - parseFloat(findspot_regex.exec(b["name"]).toString().replace('Findspot/', ''))
        });

        var init = findspots[0];
        var new_kinds = [];
        var big_list = [];
        for(var i = 1; i < findspots.length; i++)
        {
            if(findspots[i]["name"] == init["name"])
            {
                new_kinds.push(findspots[i]["kind"])
            }
            else {
                new_kinds.push(init["kind"])
                big_list.push({"name": init["name"], "kinds": new_kinds})
                init = findspots[i];
                new_kinds = [];
            }
        }

        console.log(big_list);

        toponyms.sort(function(a,b) {
            return parseFloat(toponym_regex.exec(a["name"]).toString().replace('toponym-', '')) - parseFloat(toponym_regex.exec(b["name"]).toString().replace('toponym-', ''))
        });

        console.log(toponyms);

        var init2 = toponyms[0];
        var new_pops = [];
        var big_list2 = [];
        for(var i = 1; i < toponyms.length; i++)
        {
            if(toponyms[i]["name"] == init2["name"])
            {
                new_pops.push(toponyms[i]["population"])
            }
            else {
                new_pops.push(init["population"])
                big_list2.push({"name": init2["name"], "populations": new_pops})
                init2 = toponyms[i];
                new_pops = [];
            }
        }

        // console.log(big_list2)




        // for(var i in big_list)
        // {
        //     big_list[i].significance = 0;
        //     for(var j in big_list[i])
        //     {
        //         for(var k in full)
        //         {
        //             if(full[k]["kind"] == big_list[i]["name"] && full[k]["population"] == test[test.length - 1]["population"])
        //             big_list[i]["significance"] += full[k]["significance"];
        //         }
        //     }
        // }
        // for(var i in toponyms)
        // {
        //     for(var j in findspots)
        //     {
        //         test.push({"top_name": toponym_regex.exec(t_results[i].t1.value).toString().replace('toponym-','T'), "find_name": findspot_regex.exec(f_results[j].f1.value).toString().replace('Findspot/', 'F'), "population": toponyms[i].pop_label.value, "kind": findspots[j].kind_label.value})
        //         for(var k in full)
        //         {
        //             if(full[k]["kind"] == test[test.length - 1]["kind"] && full[k]["population"] == test[test.length - 1]["population"])
        //             {
        //                 test[test.length - 1].significance = full[k]["significance"];
        //                 break;
        //             }
        //         }
        //     }
        // }

        // console.log(test);

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
