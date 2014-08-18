
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
            setDirty();
            } );


    var refreshVis = function() {
        var misfitEls = svgMisfits.selectAll( ".misfit" )
                .data( misfits );

        misfitEls.enter().append("circle")
            .classed( "misfit", 1 )
            .attr( "r", 16 )
            .attr( "fill", "#FE804C" )
            .call( draggable )
            .on( "click", function(d) {
                currentMisfit = indexOfMisfitId( d.id );
                showQuickLink();
            } );

        misfitEls
            .attr("cx", function(d) { return d.x; } )
            .attr("cy", function(d) { return d.y; } )
            .attr( "alt", function(d) { return d.name; } )
            .classed( "current", function(d,i) { return i===currentMisfit; } );

        misfitEls.exit().remove();


        var linkEls = svgLinks.selectAll( ".link" )
                .data( links );

        linkEls.enter().append( "line" )
            .classed( "link", 1 );

        linkEls
            .attr("x1", function(d) { return getMisfitById( d.a ).x; } )
            .attr("y1", function(d) { return getMisfitById( d.a ).y; } )
            .attr("x2", function(d) { return getMisfitById( d.b ).x; } )
            .attr("y2", function(d) { return getMisfitById( d.b ).y; } )
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
        refreshVis();
    };


    // ---------- add misfit editor -------------
    var showAddMisfit = function() {
        currentMisfit = -1;
        hideAllEditors();
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

        var link = findLink( misfit.id, linkable.id );
        currentLinkStrength = (link !== null) ? link.strength : 0;

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

        if( keycode == 13 || keycode === 39 ) { // enter / right: move to next misfit
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
        addLink( misfit.id, linked.id, currentLinkStrength );

        refreshLinkEditor();
        refreshVis();
    };


    // ------------ misfit management -----------
    var misfits = [];
    var links = [];
    var nextLinkId = 1;

    var addMisfit = function( name ) {
        var x = 50 + Math.random() * (width-100);
        var y = 50 + Math.random() * (height-100);
        misfits.push( {id:nextLinkId, name:name, x:x, y:y} );
        nextLinkId += 1;

        saveState();

        refreshVis();

        currentMisfit = misfits.length - 1;
        showQuickLink();
    };

    var getMisfitById = function( id ) {
        var matching = misfits.filter( function(misfit) { return misfit.id === id; } );
        if( matching.length > 0 )
            return matching[0];
        return null;
    };

    var indexOfMisfitId = function( id ) {
        for( var i=0; i<misfits.length; i++ ) {
            if( misfits[i].id === id )
                return i;
        }
        return -1;
    };
    
    var addLink = function( a, b, strength ) {
        removeLink( a, b );

        if( strength ) {
            links.push( { a:a, b:b, strength:strength } );
        }

        setDirty();
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


    // ----------- load/save ----------------
    var dirtySaveTimer = null;
    var setDirty = function() {
       if( dirtySaveTimer ) {
          clearTimeout( dirtySaveTimer );
       }

      dirtySaveTimer = setTimeout( saveState, 1000 );
    };

    var saveState = function() {
        localStorage.nsfProgram = JSON.stringify( {
            misfits: misfits,
            links: links,
            nextLinkId: nextLinkId
        } );

        if( dirtySaveTimer ) {
            clearTimeout( dirtySaveTimer );
            dirtySaveTimer = null;
        }
    };

    var loadState = function() {
        if( typeof( localStorage.nsfProgram ) !== 'undefined' ) {
            var state = JSON.parse( localStorage.nsfProgram );
            misfits = state.misfits;
            links = state.links;
            nextLinkId = state.nextLinkId;
        }
    };


    // ------------- INIT -------------------

    // load old state
    loadState();

    // initial draw
    initEditors();
    refreshVis();

})();

