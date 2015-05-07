// Name of this demo
var demoName   = "demo_PointerEvents.js";

// Called on page load
load = function() {
    getScripts( [
            pathExt + "jquery.mobile.js"
        ],
        setupDemo
    );
};

// Initialise pointer fields and create eventManager
setupDemo = function() {
    $( "#graphics_here" ).append( 
        $( "<div>" ).attr( {
                "id" : "field_left"
            } ).css( {
                "width"  : "100px",
                "height" : "100px",
                "position" : "relative",
                "left" : "0px",
                "background-color" : "red"
        } )
    );

    var events = [
        "vclick",
        "vmousedown",
        "vmouseup",
        "vmousecancel",
        "touchstart",
        "touchend",
        "touchcancel",
        "taphold"
    ];
    var closure = function (eventType) {
        return function(event) {
            event.preventDefault();
            report(demoName, eventType);
        };
    };
    for( var i in events ) {
        $( "#field_left" ).bind( 
            events[i],
            events[i],
            closure( events[i] )
        );  
    }
};

