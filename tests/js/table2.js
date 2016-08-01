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

        var significance_table = {};
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
                    significance_table[i + "_" + grid[i][j]["kind_name"]] = grid[i][j]["significance"];
                }
            }
        }

        for(var i in f_results)
        {
            findspots.push({"name": f_results[i].f1.value, "kind":f_results[i].kind_label.value});
            kind_list.push(f_results[i].kind_label.value);
        }

        for(var i in t_results)
        {
            toponyms.push({"name": t_results[i].t1.value, "population":t_results[i].pop_label.value});
            population_list.push(t_results[i].pop_label.value);

        }

        for(var i in population_list)
        {
            for(var j in kind_list)
            {
                if(significance_table[population_list[i] + "_" + kind_list[j]] === undefined)
                {
                    significance_table[population_list[i] + "_" + kind_list[j]] = 0;
                }
            }
        }

        findspots.sort(function(a,b) {
            return parseFloat(findspot_regex.exec(a["name"]).toString().replace('Findspot/', '')) - parseFloat(findspot_regex.exec(b["name"]).toString().replace('Findspot/', ''))
        });

        findspots = create_table(findspots, "kinds");

        for(var i in findspots)
        {
            $('#header_details>tr').append("<th>"+ findspot_regex.exec(findspots[i]["name"]).toString().replace('Findspot/', 'F') +"</th>");
        }

        toponyms.sort(function(a,b) {
            return parseFloat(toponym_regex.exec(a["name"]).toString().replace('toponym-', '')) - parseFloat(toponym_regex.exec(b["name"]).toString().replace('toponym-', ''))
        });

        toponyms = create_table(toponyms, "populations")

        for(var i in toponyms)
        {
            $('#table_details').append("<tr id='"+ toponym_regex.exec(toponyms[i]["name"]).toString().replace('toponym-','T') +"'><td>"+ toponym_regex.exec(toponyms[i]["name"]).toString().replace('toponym-','T') +"</td></tr>");
        }

        var final = [];

        for(var i in findspots)
        {
            for(var j in toponyms) //List of toponyms
            {
                final.push({"top_name": toponym_regex.exec(toponyms[j]["name"]).toString().replace('toponym-','T'), "find_name": findspot_regex.exec(findspots[i]["name"]).toString().replace('Findspot/', 'F'), "kinds": findspots[i]["kinds"],"populations": toponyms[j]["populations"],"significance": 0})
                for(var k in findspots[i]["kinds"]) //List of kinds for each findspot
                {
                    for(var x in toponyms[j]["populations"]) //List of populations for each toponym
                    {
                        final[final.length - 1]["significance"] += significance_table[toponyms[j]["populations"][x] + "_" + findspots[i]["kinds"][k]];
                    }
                }
                $("#"+toponym_regex.exec(toponyms[j]["name"]).toString().replace('toponym-','T')).append("<td id='"+ toponym_regex.exec(toponyms[j]["name"]).toString().replace('toponym-','T') + "_" + findspot_regex.exec(findspots[i]["name"]).toString().replace('Findspot/', 'F') +"' class='circle'></td>");
                calc_circle("#"+toponym_regex.exec(toponyms[j]["name"]).toString().replace('toponym-','T') + "_" + findspot_regex.exec(findspots[i]["name"]).toString().replace('Findspot/', 'F'), ((final[final.length - 1]["significance"] / (toponyms[j]["populations"].length * findspots[i]["kinds"].length)) * 100).toFixed(2))
            }

        }

        $('.ui.inverted.dimmer').removeClass('active');

        $('.ui.toggle.checkbox').checkbox({
            onChange: function() {
                $('.ui.compact.segments').toggleClass('hidden');
            }
        });
    });

    function calc_circle(id, sig)
    {
        if(sig < 10)
        {
            $(id).addClass('w0');
            $(id).addClass('a1');
        }
        else if(sig > 10 && sig < 20)
        {
            $(id).addClass('w1');
            $(id).addClass('a2');
        }
        else if(sig > 20 && sig < 30)
        {
            $(id).addClass('w2');
            $(id).addClass('a3');
        }
        else {
            $(id).addClass('w3');
            $(id).addClass('a4');
        }
    }

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
