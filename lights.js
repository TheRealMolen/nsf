
(function() {
    var width = 1150,
        height = 30;

    var svg = d3.select("#lights").append("svg")
            .attr("width", width)
            .attr("height", height)
        .append("g")
            .attr("transform","translate(0," + (height/2) + ")");


    // all lights start ON
    var lights = [];
    for( var i=0; i<100; i++ ) {
        lights.push( 1 );
    }


    function refresh() {
        update();
        draw();
    }

    function update() {
        var newlights = [];

        lights.forEach( function( on, i ) {

            // RULES: if on, 50% chance to turn off
            //        if off and neighbour on, 60% chance to turn on

            var newlight = lights[i];

            if( on ) {
                if( Math.random() < 0.5 )
                    newlight = 0;
            }
            else {
                var neighbourOn = false;
                if( i > 0 && lights[i-1] != 0 )
                    neighbourOn = true;
                if( i < lights.length-1 && lights[i+1] != 0 ) 
                    neighbourOn = true;

                if( neighbourOn ) {
                    if( Math.random() < 0.6 )
                        newlight = 1;
                }
            }

            newlights.push( newlight );
        });

        lights = newlights;
    }

    function draw() {

        var border = 20;
        var x = d3.scale.linear()
            .domain([0, lights.length])
            .range([border, width-border]);

        var sprites = svg.selectAll( "circle" )
                .data( lights );

        // add all new ones
        sprites.enter().append("g")
                .attr("transform", function(d,i) { return "translate(" + x(i) + ",0)"; } )
            .append( "circle" )
                //.attr( "x", function(d,i) { return x(i); } )
                .attr( "r", 4 );

        // update all existing ones
        sprites.attr( "fill", function(d) { return ( (d != 0) ? "#FE804C" : "#444" ); } );
    }



    refresh();
    setInterval( refresh, 400 );

})();

