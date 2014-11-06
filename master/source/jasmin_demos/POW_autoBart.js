// AutoBart task

// Name of this demo

var demoName   = "demo_POW_autoBart.js";
var canvas;
var spritemain_stim;
var loader_replies;
var balloonSize = .05;
var maxballoonscore = 10;
var current_balloonscore = 0;
var balloon_quality = 0;

if( jasmin === undefined ) { var jasmin = function() {}; }

load = function() {
    getScripts( [
            jasminPath + "jasmin_ext/jquery.mobile.js",
            jasminPath + "jasmin_core/EventManager.js",
            jasminPath + "jasmin_core/ResponseManager.js",            
            jasminPath + "jasmin_core/RequestManager.js",
            jasminPath + "jasmin_core/SyncTimer.js",
            jasminPath + "jasmin_core/ScalableCanvas.js",
            jasminPath + "jasmin_core/Statistics.js",
            jasminPath + "jasmin_core/Loader.js"
        ],
        setupBart
    );
};

fail = function( message ) {
    report( demoName, message );
};

// Initialise pointer fields and create eventManager
setupBart = function() {
    
    report(demoName, "Ready to do setup!!!" );   
    canvas      = new jasmin.ScalableCanvas( 
        $( "#graphics_here" ),  // container div; note though that canvas scales to the window
        1.6                     // aspectRatio (x/y). A value of 1.6 gives this range of coordinates: x[0:1.6] and y[0:1]
        // rescaleInterval (number of ms between checking rescaling), 1000 by default
    );
    io = new jasmin.RequestManager( fail, report, report );
    loader = new jasmin.Loader( io );
    
    // Load stuff
    var requests = {       
        "balloon"      : [ "img", "pictures/balloon.jpg" ],      
        "poppedballoon"      : [ "img", "pictures/poppedballoon.jpg" ]        
    };
    loader.load( requests, setup );
};

setup = function( replies ) {
    // Setup more JASMIN modules
    
    report( demoName, "All loaded");
    
    
    
    loader_replies = replies;
    
    spritemain_stim = {
        // The simon stim
        "balloon" :
        {
            "node" :
                $(  "<div>" ).append( replies[ "balloon" ].css( { 
                    "z-index"          : 1,
                    "width"            : "100%",
                    "height"           : "100%"
            } ) ),
            "scale":{
                "width"  : balloonSize,
                "height" : balloonSize,
                "left"   : "0.7",
                "top"    : "0.4"
            }
                    
        }
    };
    spritepopped_stim = {
        // The simon stim
        "poppedballoon" :
        {
            "node" :
                $(  "<div>" ).append( replies[ "poppedballoon" ].css( {
                  "z-index"          : 1,
                  "width"            : "100%",
                  "height"           : "100%"
            } ) ),
            "scale":{
                "width"  : balloonSize,
                "height" : balloonSize,
                "left"   : "0.7",
                "top"    : "0.4"
            }
                    
        }
    };    
    
    
    score_stim = {
         "text_box" : 
        {
            // Container DIV; text will be center aligned inside of this DIV
            "node" :        
                $( "<div>" ).attr( {} ).css( {
                    "z-index"          : 2,
                    "text-align"       : "center",
                    "color"            : "red",
                    "display"          : "table",
                    "font-weight"      : "bold",
                    "background-color" : "#44FFFF"
                } ).append( 
                        // The actual text; change contents via id "my_text"
                        $( "<p>" ).attr( {
                            "id" : "my_text",
                            "class" : "my_class"
                        } ).css( {
                            "vertical-align"   : "middle",
                            "text-align"       : "center",
                            "display"          : "table-cell"
                        } ).text( "Score" )
                ),
            // scale; all properties you want to scale
            "scale" :            
                {
                    "width"        :  .2,
                    "height"       :  .08,
                    "left"         :  .7,
                    "top"          :  .8,
                    "font-size"    :  .08
                }    
        }
    };
               
    var balloon_quality = jasmin.Statistics.randomInt(2,12);
    
        /*{
            // "node" contains the object and CSS properties that not need scaling
            "node" :
                $( "<div>" ).css( {
                    "z-index"          : 1,
                    "background-color" : "#FF0000",
                    "opacity"          : 1
                } ),
            // "scale" contains the object and CSS properties that do need scaling
            "scale" :
                {
                    "width"  : "0.2",
                    "height" : "0.2",
                    "left"   : "0.7",
                    "top"    : "0.4"
                }
        }
      
    };*/
    
    eventManager = new jasmin.EventManager( window );
    
    canvas.addSprites(spritemain_stim);
    canvas.addSprites(spritepopped_stim);
    canvas.addSprites(score_stim);
    
    canvas.start();
    
    spritemain_stim[ "balloon" ][ "node" ].hide();
    spritepopped_stim[ "poppedballoon" ][ "node" ].hide();
    
    eventManager.sync( function() {
        startBalloon();
    } );
    
    
    
    //$( "#graphics_here" )[ "balloon" ].hide();  
    /*taskEngine  = new jasmin.TaskEngine( 
        replies[ "sprites" ],
        {
            "balloon"     : replies[ "balloon"]            
        }
    );
    
    var stimulus = this.binaries[ this.configTrial[ "stim" ] ];
    */
};




redefine_mainstim = function() {
    
    balloonSize+=.05;
    current_balloonscore++;
    var a = Math.random();
  
    spritemain_stim.balloon.scale.width = balloonSize;
    spritemain_stim.balloon.scale.height = balloonSize;
    spritepopped_stim.poppedballoon.scale.width = balloonSize;
    spritepopped_stim.poppedballoon.scale.height = balloonSize;
    //score_stim.text_box.node.css("")
    
    $( "#my_text" ).text("Score: " + current_balloonscore);
//    $( ".my_class" )
//    $( "p" )
    //"my_text"
    
    canvas.rescaleSprite("balloon");
    canvas.rescaleSprite("poppedballoon");
    canvas.rescale();
    report( 
        demoName,
        balloonSize
    );
    report( 
        demoName,
        JSON.stringify( spritemain_stim.balloon.scale )
    );
    
    //canvas.addSprites(spritepopped_stim);
    
    //spritepopped_stim[ "balloon" ][ "node" ].hide();
    clearScreen();
    
   
    
    
};
determine_stim = function() {
    report( demoName, "determine_stim");
    //canvas.start();
    if (current_balloonscore<balloon_quality)
    {
        
        startBalloon();
    }
    else
    {
      
        showPopped();
    }
}

startBalloon = function() {
  
  report( demoName, "starting balloon");
  var activeResponses = {        
       "keydown" : {
            "type"    : "all",
            "buttons" : {
                69 : "left",  
                73 : "right"  
            }
        }     
    };        
  eventManager.startEvent(
    20000,                 // timeout      - No. of ms to time out
    function() {spritemain_stim[ "balloon" ][ "node" ].show();},           // callbackDraw - draw these graphics on refresh        
    redefine_mainstim,    // callbackDone - called when event ends (due to response or timeout)                
    activeResponses,
    "event"
  );
    
    
};

showPopped = function() {
   
    //spritemain_stim.balloon.node.$(  "<div>" ).css["width"]="200px";
    
    //spritemain_stim.mainstim_red.node.css("background-color" , "#00FF00");
    //spritemain_stim.balloon.scale[]
    
    canvas.start();    //restart to let reposition of main stim take effect
    eventManager.startEvent(
        1000,                 // timeout      - No. of ms to time out
        function() {spritepopped_stim[ "poppedballoon" ][ "node" ].show();},        // callbackDraw - draw these graphics on refresh        
        showScore,         // callbackDone - called when event ends (due to response or timeout)                
        {},
        "empty"
    );
};

clearScreen = function() {
    
    spritemain_stim[ "balloon" ][ "node" ].hide();
    spritepopped_stim[ "poppedballoon" ][ "node" ].hide();
    
    determine_stim();
    
    
};

showScore = function() {
    report( demoName, "score: " + current_balloonscore);
};


$( document ).ready( function() { 
    // Fail and report callbacks
    fail    = function(         message ) { console.log( "FAILED: "    + message ); };
    report  = function( source, message ) { console.log( source + ": " + message ); };

    //    alert(typeof(jasmin.RequestManager()));
    // Setup a loader
    //var io = new jasmin.RequestManager( fail, report, report );
    
} );