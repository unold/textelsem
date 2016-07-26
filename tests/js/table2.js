$(document).ready(function() {

    var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";
    var findspot_regex = /Findspot\/\d+/;
    var toponym_regex = /toponym\W\d+/;

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

        var full = [];
        var findspot_names = [];

        var findspots = [];
        var toponyms = [];
        var grid = [];

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
            findspots.push({"name": f_results[i].f1.value, "kind":f_results[i].kind_label.value})
        }

        for(var i in t_results)
        {
            toponyms.push({"name": t_results[i].t1.value, "population":t_results[i].pop_label.value});
        }

        findspots.sort(function(a,b) {
            return parseFloat(findspot_regex.exec(a["name"]).toString().replace('Findspot/', '')) - parseFloat(findspot_regex.exec(b["name"]).toString().replace('Findspot/', ''))
        });

        findspots = create_table(findspots, "kinds");
        console.log(findspots);

        for(var i in findspots)
        {
            $('#header_details>tr').append("<th>"+ findspot_regex.exec(findspots[i]["name"]).toString().replace('Findspot/', 'F') +"</th>");
        }

        toponyms.sort(function(a,b) {
            return parseFloat(toponym_regex.exec(a["name"]).toString().replace('toponym-', '')) - parseFloat(toponym_regex.exec(b["name"]).toString().replace('toponym-', ''))
        });

        toponyms = create_table(toponyms, "populations")
        console.log(toponyms);

        for(var i in toponyms)
        {
            $('#table_details').append("<tr id='"+ toponym_regex.exec(toponyms[i]["name"]).toString().replace('toponym-','T') +"'><td>"+ toponym_regex.exec(toponyms[i]["name"]).toString().replace('toponym-','T') +"</td></tr>");
        }

        var test = [];

        for(var i in findspots)
        {
            for(var j in toponyms) //List of toponyms
            {
                test.push({"top_name": toponym_regex.exec(toponyms[j]["name"]).toString().replace('toponym-','T'), "find_name": findspot_regex.exec(findspots[i]["name"]).toString().replace('Findspot/', 'F'), "significance": 0})
                for(var k in findspots[i]["kinds"]) //List of kinds for each findspot
                {
                    for(var x in toponyms[j]["populations"]) //List of populations for each toponym
                    {
                        for(var y in full) //List of combos
                        {
                            if(full[y]["kind"] == findspots[i]["kinds"][k] && full[y]["population"] == toponyms[j]["populations"][x])
                            {
                                test[test.length - 1]["significance"] += full[y]["significance"];
                            }
                        }
                    }

                }
                // $("#"+toponym_regex.exec(big_list2[j]["name"]).toString().replace('toponym-','T')).append("<td><div class='circle' id='"+toponym_regex.exec(big_list2[j]["name"])+"'></div></td>");
                // resize_circle($("."+"circle#"+toponym_regex.exec(big_list2[j]["name"])), ((test[test.length - 1]["significance"] / (big_list2[j]["populations"].length * big_list[i]["kinds"].length)) * 100));
                $("#"+toponym_regex.exec(toponyms[j]["name"]).toString().replace('toponym-','T')).append("<td>"+ ((test[test.length - 1]["significance"] / (toponyms[j]["populations"].length * findspots[i]["kinds"].length)) * 100).toFixed(2) +"%</td>")
            }
        }

        console.log(test);

    });

    function create_table(table, id)
    {
        var init = table[0];
        var list = [];
        var big_list = [];


        for(var i = 1; i < table.length; i++)
        {
            Object.keys(table[i]);
            if(table[i][Object.keys(table[i])[0]] == init[Object.keys(table[i])[0]])
            {
                list.push(table[i][Object.keys(table[i])[1]])
            }
            else {
                list.push(init[Object.keys(table[i])[1]])
                big_list.push({"name": init[Object.keys(table[i])[0]]})
                big_list[big_list.length - 1][id] = list;
                init = table[i];
                list = [];
            }
        }

        return big_list;
    }

    function resize_circle(circle, sig)
    {
        var pixels = sig * 1.5;
        circle.css({"width": pixels, "height": pixels});

        return circle;
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
