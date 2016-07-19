$(document).ready(function() {

    var repo = "http://higeomes.i3mainz.hs-mainz.de/openrdf-sesame/repositories/textelsem";
    var toponym_regex = /toponym\W\d+/;

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

    console.log(query);
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
            var grid = [];
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
                $('#header_details>tr').append("<th>"+ kind[i] +"</th>");
                total[kind[i]] = 0;
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

            for(var i in row)
            {
                for(var j in kind)
                {
                    if(grid[row[i].pop_label.value][j]["significance"] > 0.4)
                    {
                        $("#" + row[i].pop_label.value.replace(/\s+|\W+/g, '') + ">#" + kind[j].replace(/\s+|\W+/g, '')).addClass('warning');
                        $("#" + row[i].pop_label.value.replace(/\s+|\W+/g, '') + ">#" + kind[j].replace(/\s+|\W+/g, '')).attr('data-content', 'Significance: ' + grid[row[i].pop_label.value][j]["significance"]*100 + '%');
                    }
                }
            }


            // $('.ui.button').popup();

            $('.message .close').on('click', function() {
                $(this).closest('.message').transition('fade');
            });

            $('#information').click(function() {
                $('.message').addClass('visible');
            })

            $("#table_details>tr").click(function() {

                $(".modal>.content>.header").html($(this).text().toString()[0].toUpperCase() + $(this).text().toString().slice(1));
                $(".content>.meta").html(grid[$(this).text()]["category"] + "<div class='ui divider'></div>");
                $(".content>.description").html("<div class='ui text'>Click to show related toponyms.</div><br><div class='ui fluid styled accordion'></div>");
                for(var i in kind)
                {
                    if($("#" + $(this).text().replace(/\s+|\W+/g, '') + ">#" + kind[i].replace(/\s+|\W+/g, '')).hasClass('warning'))
                        $('.ui.fluid.styled.accordion').append("<div class='warning title'><i class='dropdown icon'></i>" + kind[i] + " - HIGH SIGNIFICANCE! " + (grid[$(this).text()][i]["significance"]*100).toFixed(2) + " %</div><div class='content'><div class='ui relaxed divided selection list' id='" + kind[i].replace(/\s+|\W+/g, '') + "_list'></div>Number of Occurences: " + grid[$(this).text()][i]["count"] + "<br>Number of Total Occurences: " + total[kind[i]] + "</div>");
                    else
                        $('.ui.fluid.styled.accordion').append("<div class=' title'><i class='dropdown icon'></i>" + kind[i] + "</div><div class='content'><div class='ui relaxed divided selection list' id='" + kind[i].replace(/\s+|\W+/g, '') + "_list'></div>Number of Occurences: " + grid[$(this).text()][i]["count"] + "<br>Number of Total Occurences: " + total[kind[i]] + "</div>");
                }

                for(var i in grid[$(this).text()].slice(0, grid[$(this).text()].length))
                {

                    if(grid[$(this).text()][i]["related_toponyms"].length == 0 )
                    {
                        $("#" + grid[$(this).text()][i]["kind_name"].replace(/\s+|\W+/g, '') + "_list").html("No related toponyms.");
                    }
                    for(var j in grid[$(this).text()][i]["related_toponyms"])
                    {
                        $("#" + grid[$(this).text()][i]["kind_name"].replace(/\s+|\W+/g, '') + "_list").append("<div class='item'><i class='marker icon'></i><div class='content'>"+toponym_regex.exec(grid[$(this).text()][i]["related_toponyms"][j])+"</div></div>");
                    }
                }
                $(".ui.modal").modal('show');
                $('.ui.accordion').accordion();
            });

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


});
