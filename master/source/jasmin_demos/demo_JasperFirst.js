// Jasper's first attempt to run any partly self created js at all

// Name of this demo

var demoName   = "demo_JasperFirst.js";
var canvas;
var spritemain_stim;
var spritefix;
var fb_sprite;
var expcon; //hier?


//laden van plaatjes
//laden van tekst


load = function() {
    getScripts( [
            jasminPath + "jasmin_ext/jquery.mobile.js",
            jasminPath + "jasmin_core/EventManager.js",
            jasminPath + "jasmin_core/ResponseManager.js",
            jasminPath + "jasmin_core/SyncTimer.js",
            jasminPath + "jasmin_core/ScalableCanvas.js",
            jasminPath + "jasmin_core/Statistics.js"
        ],
        JFirstFunction
    );
};

fail = function( message ) {
    report( demoName, message );
};

JFirstFunction = function() {
    
    report(demoName, "Succes!!!" );    
    setupSimon();
    //currentCallback = setupSimon; 
    //currentCallback();
};

// Initialise pointer fields and create eventManager
setupSimon = function() {
    
    
    report(demoName, "Setting up Simon" );
    
    spritemain_stim = {
        // The simon stim
        "mainstim_red" :
        {
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
      
    };
    
    
   
    
    spritefix = {
          "text_fix" : 
        {
            // Container DIV; text will be center aligned inside of this DIV
            "node" :        
                $( "<div>" ).attr( {} ).css( {
                    "z-index"          : 2,
                    "text-align"       : "center",
                    "color"            : "black",
                    "display"          : "table",
                    "font-weight"      : "bold",
                    "background-color" : "#FFFFFF"
                } ).append( 
                        // The actual text; change contents via id "my_text"
                        $( "<p>" ).attr( {
                            "id" : "my_text"
                        } ).css( {
                            "vertical-align"   : "middle",
                            "text-align"       : "center",
                            "display"          : "table-cell"
                        } ).text( "+" )
                ),
            // scale; all properties you want to scale
            "scale" :            
                {
                    "width"        :  .2,
                    "height"       :  .2,
                    "left"         :  .7,
                    "top"          :  .4,
                    "font-size"    :  .08
                }    
        }    
    };
    
    fb_sprite = {
      "feedback":  
              {
            // Container DIV; text will be center aligned inside of this DIV
            "node" :        
                $( "<div>" ).attr( {} ).css( {
                    "z-index"          : 3,
                    "text-align"       : "center",
                    "color"            : "008800",      //doesnt work?
                    "display"          : "table",
                    "font-weight"      : "bold",
                    "background-color" : "#FFFFFF"
                } ).append( 
                        // The actual text; change contents via id "my_text"
                        $( "<p>" ).attr( {
                            "id" : "my_text"
                        } ).css( {
                            "vertical-align"   : "middle",
                            "text-align"       : "center",
                            "display"          : "table-cell"
                        } ).text( "Correct!" )
                ),
            // scale; all properties you want to scale
            "scale" :            
                {
                    "width"        :  .2,
                    "height"       :  .2,
                    "left"         :  .7,
                    "top"          :  .4,
                    "font-size"    :  .06
                }    
        }    
    };
    
    canvas      = new jasmin.ScalableCanvas( 
        $( "#graphics_here" ),  // container div; note though that canvas scales to the window
        1.6                     // aspectRatio (x/y). A value of 1.6 gives this range of coordinates: x[0:1.6] and y[0:1]
        // rescaleInterval (number of ms between checking rescaling), 1000 by default
    );
    
    // Add sprites to canvas
    canvas.addSprites( spritefix );
    canvas.addSprites( spritemain_stim );
    canvas.addSprites( fb_sprite );
    
    // Start rescaling
    canvas.start();        
    
    // Create an EventManager. Attach window to allow the EventManager to respond 
    // to everything that happens in the window
    eventManager = new jasmin.EventManager( window );    
    
    expcon = [1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4];
    expcon = jasmin.Statistics.fisherYates(expcon); 
            
    currentEvent = 0;
    currentTrial = 1;
    currentColor = "red";
    eventManager.sync( function() {
        presentTrial();
    } );
    
};

showFix= function() {
    report( demoName, "Starting fix event");
    
    
    eventManager.startEvent(
        1000,                 // timeout      - No. of ms to time out
        function() {spritefix[ "text_fix" ][ "node" ].show();},           // callbackDraw - draw these graphics on refresh        
        presentTrial,    // callbackDone - called when event ends (due to response or timeout)                
        {},
        "event" + currentEvent
    );
    
};

ResponseStart = function() {
    report( demoName, "Starting event");
    canvas.start();    //restart to let reposition of main stim take effect
    
    var self = this;
    var activeResponses = {
        // vmouse
//        "vmousedown" : {
//            "type" : currentType,
//            "buttons" : {
//                "#simon_stim"  : "left",                
//            },
//        },
        // keyboard
       "keydown" : {
            "type"    : "all",
            "buttons" : {
                69 : "left",  
                73 : "right"  
            }
        }     
    };        
    
    
    
    eventManager.startEvent(
        2000,                 // timeout      - No. of ms to time out
        function() {spritemain_stim[ "mainstim_red" ][ "node" ].show();},           // callbackDraw - draw these graphics on refresh        
        presentTrial,    // callbackDone - called when event ends (due to response or timeout)                
        activeResponses,
        "event" + currentEvent
    );
};   

showFeedback = function() {
    
    var eventlog = eventManager.getEventLog();
    if (currentColor === "red")
    {
        if (eventlog.responseLabel === "left")
            {fb_sprite.feedback.node.text("correct!");}
        else
            {fb_sprite.feedback.node.text("incorrect!");}    
    }
    else
    {
        if (eventlog.responseLabel === "left")
            {fb_sprite.feedback.node.text("incorrect!");}
        else
            {fb_sprite.feedback.node.text("correct!");}    
    }
    
    eventManager.startEvent(
        1000,                 // timeout      - No. of ms to time out
        function() {fb_sprite[ "feedback" ][ "node" ].show();},           // callbackDraw - draw these graphics on refresh        
        presentTrial,    // callbackDone - called when event ends (due to response or timeout)                
        {},
        "event" + currentEvent
    );
    
};

showEmpty = function() {
   
    eventManager.startEvent(
        1000,                 // timeout      - No. of ms to time out
        function() {},        // callbackDraw - draw these graphics on refresh        
        presentTrial,         // callbackDone - called when event ends (due to response or timeout)                
        {},
        "event" + currentEvent
    );
};

// Called for each event
presentTrial = function() {
    
    //report( demoName, "event done");
    //report( demoName, "syncTimer       logs " + JSON.stringify( eventManager.syncTimer.getPrevTimeoutLog() ) );
    //report( demoName, "responseManager logs " + JSON.stringify( eventManager.responseManager.getResponseLog() ) );
    //report( demoName, "eventManager    logs " + JSON.stringify( eventManager.getEventLog() ) );
    
    var eventlog = eventManager.getEventLog();
       
    clearScreen();
    
    currentEvent++;
    switch( currentEvent ) {
        // Start: show fix
        case 1 :
            eventManager.sync( function() {showFix();} );
            break;
        case 2 :
            if (expcon[currentTrial] <3)
                {
                    spritemain_stim.mainstim_red.node.css("background-color" , "#FF0000");
                    currentColor = "red";            
                }   
            else
                {
                    spritemain_stim.mainstim_red.node.css("background-color" , "#00FF00");
                    currentColor = "green";            
                }
            if (expcon[currentTrial]%2 === 1)            
                {spritemain_stim.mainstim_red.scale["left"] = 0.4;}
            else
                {spritemain_stim.mainstim_red.scale["left"] = 1;}
            
            eventManager.sync( function() {ResponseStart();} );
            break;
        case 3 :
            if (eventlog.responseLabel !== undefined)
            {
                showFeedback();                
            }            
            else
            {   //miss, just go to next event
                presentTrial();
            }
            break;
        case 4 :
            showEmpty();            
            break;
        case 5 :
            nextTrial();
            break;
            
    } 
    
};

nextTrial = function() {
    currentEvent = 0;
    currentTrial++;
    if (currentTrial<13)
    {
        eventManager.sync( function() {presentTrial();} );
    }
};

clearScreen = function() {
    spritemain_stim[ "mainstim_red" ][ "node" ].hide();
    spritefix[ "text_fix" ][ "node" ].hide();    
    fb_sprite[ "feedback" ][ "node" ].hide();
};