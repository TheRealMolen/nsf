
(function() {

    var width = 850,
        height = 650;

    var svg = d3.select("#misfited #display").append("svg")
            .attr("width", width)
            .attr("height", height);


    var draggable = d3.behavior.drag()
        .on( "drag", function(d) {
            d.x += d3.event.dx;
            d.y += d3.event.dy;
            refresh();
            } );


    var refresh = function() {
        var misfitEls = svg.selectAll( ".misfit" )
                .data( misfits );

        misfitEls.enter().append("circle")
            .classed( "misfit", 1 )
            .attr( "r", 18 )
            .attr( "fill", "#FE804C" )
            .call( draggable );

        misfitEls
            .attr("cx", function(d) { return d.x; } )
            .attr("cy", function(d) { return d.y; } )
            .attr( "alt", function(d) { return d.name; } );

        misfitEls.exit().remove();
    };



    var misfits = [];
    var i = 1;


    var initEditors = function() {

        d3.select("#addmisfit")
            .on("keyup", function() {
                if( d3.event.keyCode === 13 ) {
                    addMisfit( this.value );
                    this.value = "";
                }
            } );

        d3.select("#editlinks #finished")
            .on("click", function() {
                showAddMisfit();
            } );

        hideAllEditors();
        showAddMisfit();
    }

    var hideAllEditors = function() {
        $("#inspector .editor").hide();
    };

    var showAddMisfit = function() {
        hideAllEditors();
        $("#addmisfit").show();
    };

    var showQuickLink = function( misfit ) {
        hideAllEditors();
        $("#editlinks").show();
    };


    var addMisfit = function( name ) {
        misfits.push( {name:name, x:40, y:i * 40} );
        i += 1;

        refresh();

        showQuickLink();
    };



    // initial draw
    initEditors();
    refresh();

})();

