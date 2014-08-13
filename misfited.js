
(function() {


    // ------------- node graph --------------
    var width = 850,
        height = 650;

    var svg = d3.select("#misfited #display").append("svg")
            .attr("width", width)
            .attr("height", height);
    var svgLinks = svg.append( "g" );
    var svgMisfits = svg.append( "g" );


    var draggable = d3.behavior.drag()
        .on( "drag", function(d) {
            d.x += d3.event.dx;
            d.y += d3.event.dy;
            refreshVis();
            } );


    var refreshVis = function() {
        var misfitEls = svgMisfits.selectAll( ".misfit" )
                .data( misfits );

        misfitEls.enter().append("circle")
            .classed( "misfit", 1 )
            .attr( "r", 16 )
            .attr( "fill", "#FE804C" )
            .call( draggable );

        misfitEls
            .attr("cx", function(d) { return d.x; } )
            .attr("cy", function(d) { return d.y; } )
            .attr( "alt", function(d) { return d.name; } );

        misfitEls.exit().remove();


        var linkEls = svgLinks.selectAll( ".link" )
                .data( links );

        linkEls.enter().append( "line" )
            .classed( "link", 1 );

        linkEls
            .attr("x1", function(d) { return getMisfit( d.a ).x; } )
            .attr("y1", function(d) { return getMisfit( d.a ).y; } )
            .attr("x2", function(d) { return getMisfit( d.b ).x; } )
            .attr("y2", function(d) { return getMisfit( d.b ).y; } )
            .classed( "positive", function(d) { return d.strength > 0; } )
            .classed( "negative", function(d) { return d.strength < 0; } );

        linkEls.exit().remove();
    };




    // ----------- editor management -----------------
    var currentEditor = "";
    var currentMisfit = -1;

    var initEditors = function() {

        d3.select("#addmisfit .mfname")
            .on("keyup", function() {
                if( d3.event.keyCode === 13 ) {
                    d3.event.stopPropagation();
                    addMisfit( this.value );
                    this.value = "";
                }
            } );

        d3.select("#editlinks #finished")
            .on("click", function() {
                showAddMisfit();
            } );

        d3.select("body")
            .on("keyup", function() {
                if( currentEditor === "editlinks" )
                    onKeyDown_EditLinks();
            } );

        // stop arrow keys from moving browser around
        window.addEventListener("keydown", function(e) {
            // space and arrow keys
            if([38, 40].indexOf(e.keyCode) > -1) {
                e.preventDefault();
            }
        }, false);

        hideAllEditors();
        showAddMisfit();
    };

    var hideAllEditors = function() {
        $("#inspector .editor").hide();
        currentEditor = "";
    };


    // ---------- add misfit editor -------------
    var showAddMisfit = function() {
        hideAllEditors();
        currentMisfit = -1;
        $("#addmisfit").show();
        currentEditor = "addmisfit";
        $("#addmisfit .mfname").focus();
    };


    // ----------- edit links editor ------------
    var currentLinkable = -1;
    var currentLinkStrength = 0;
    var showQuickLink = function() {
        hideAllEditors();

        $("#editlinks").show();
        currentEditor = "editlinks";
        
        currentLinkable = -1;
        moveToNextLinkable( 1 );
    };

    var indexOfNextLinkable = function( current, direction ) {
        var next = current + direction;
        if( next === currentMisfit )
            next += direction;
        if( next >= misfits.length )
            next = -1;
        // don't need to check for underflow - <0 means invalid
        return next;
    };

    var moveToNextLinkable = function( direction ) {
        currentLinkable = indexOfNextLinkable( currentLinkable, direction );
        
        if( currentLinkable < 0 ) {
            // nothing else to link
            showAddMisfit();
            return;
        }

        refreshLinkEditor();
    }

    var linkStrengths = [
        { desc: "Positively", strength:  1 },
        { desc: "It doesn't", strength:  0 },
        { desc: "Negatively", strength: -1 }
    ];

    var refreshLinkEditor = function() {
        var misfit = misfits[currentMisfit];
        var linkable = misfits[currentLinkable];

        $("#editlinks #instruction").html(
            "How does <span class='misfitname'>" + misfit.name + "</span> link to <span class='misfitname'>" + linkable.name + "</span>?"
            );

        var strengths = d3.select( "#editlinks #options").selectAll(".option")
                .data( linkStrengths );
        strengths.enter().append( "div" )
            .classed( "option", 1 )
            .html( function(d) { return d.desc; } );
        strengths
            .classed("selected", function(d) { return (d.strength === currentLinkStrength); } );
    }
    

    var onKeyDown_EditLinks = function() {
        // keycodes:: left=37, right=39, up=38, down=40, enter=13
        var keycode = d3.event.keyCode;

        if( keycode === 13 ) {  // enter: finish this misfit
            showAddMisfit();
        }
        else if( keycode === 39 ) { // right: move to next misfit
            moveToNextLinkable( 1 );
        }
        else if( keycode === 37 ) { // left: move to prev misfit
            moveToNextLinkable( -1 );
        }
        else if( keycode === 38 ) { // up: change link strength to be more +ve
            changeCurrentLinkStrength( 1 );
        }
        else if( keycode === 40 ) { // down: change link strength to be more -ve
            changeCurrentLinkStrength( -1 );
        }
        else {
            return;
        }

        // capture the keypress so the browser doesn't move around the place
        d3.event.preventDefault();
        d3.event.stopPropagation();
    };


    var changeCurrentLinkStrength = function( direction ) {
        currentLinkStrength += direction;
        if( currentLinkStrength > 1 )
            currentLinkStrength = 1;
        if( currentLinkStrength < -1 )
            currentLinkStrength = -1;

        var misfit = misfits[currentMisfit];
        var linked = misfits[currentLinkable];
        addLink( misfit.name, linked.name, currentLinkStrength );

        refreshLinkEditor();
        refreshVis();
    };


    // ------------ misfit management -----------
    var misfits = [];
    var links = [];
    var i = 1;

    var addMisfit = function( name ) {
        misfits.push( {name:name, x:60 * i, y:50} );
        i += 1;

        refreshVis();

        currentMisfit = misfits.length - 1;
        showQuickLink();
    };

    var getMisfit = function( name ) {
        var matching = misfits.filter( function(misfit) { return misfit.name === name; } );
        if( matching.length > 0 )
            return matching[0];
        return null;
    };
    
    var addLink = function( a, b, strength ) {
        removeLink( a, b );

        if( strength ) {
            links.push( { a:a, b:b, strength:strength } );
        }
    };

    var linkMatches= function( link, a, b ) {
        if( ( link.a === a && link.b === b ) ||
            ( link.a === b && link.b === a ) ) {
            return true;
        }
        return false;
    };

    var findLink = function( a, b ) {
        var matching = links.filter( function(link) { return linkMatches( link, a, b ); } );
        if( matching.length > 0 ) {
            return matching[0];
        }
        return null;
    };

    var removeLink = function( a, b ) {
        links = links.filter( function(link) { return !linkMatches( link, a, b ); } );
    };



    // initial draw
    initEditors();
    refreshVis();

})();

