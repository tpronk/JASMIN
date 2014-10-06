Stroop.colors = [ "blue", "green", "yellow", "red" ];

Stroop.defaultSprites = function()
{
    var sprites = TaskManager.defaultSprites();
    
    // Move incorrect cross down a bit
    //sprites[ "incorrect" ][ "scalable" ][ "top" ] = .6;
    
    // Move up default instructions
    sprites[ "instruction" ][ "scalable" ][ "top" ] = .1;
    
    // Setup stimulus
    sprites[ "stimulus" ] =
    {
        "node" :
            $( "<div>" ).attr( {
                "id"   : "stimulus"
            } ).css( {
                "z-index"    : 10,
                "text-align" : "center",
                "display"    : "table",
                "color"      : "#FFFFFF"
            } ).append( 
                $( "<p>" ).attr( {
                    "id"        : "stimulusText"
                } ).css( {
                    "vertical-align"   : "middle",
                    "text-align"       : "center",
                    "display"          : "table-cell"
                } ).text( "init" ) 
            ),
        "scalable" :
            {
                "width"     : 1.4,
                "height"    :  .4,
                "left"      :  .1,
                "top"       :  .3,
                "font-size" :  .1
            }
    };	
    
    // Setup key labels
    var labels = Stroop.colors;
    for( var i in labels )
    {        
        sprites[ "label_" + labels[i] ] =
        {
            "node" :
                $( "<div>" ).attr( {
                    "id"   : "label_" + labels[i]
                } ).css( {
                    "z-index"    : 11 + i,
                    "text-align" : "center",
                    "display"    : "table"
                } ).append( 
                    $( "<p>" ).attr( {
                        "id"        : "label_" + labels[i] + "Text"
                    } ).css( {
                        "vertical-align"   : "middle",
                        "text-align"       : "center",
                        "display"          : "table-cell"
                    } ).text( "init" ) 
                ),
            "scalable" :
                {
                    "width"     : .3,
                    "height"    : .2,
                    "left"      : .4 * ( i ) + .05,
                    "top"       : .8,
                    "font-size" : .1
                }
        };	    
    }

    return sprites;
};

// **************
// *** Task
	
// Constructor
// Required globals:
//   translator
//   logger
function Stroop( 
    sprites
) {
    this.sprites     = sprites;

    var self = this;
    this.callbacks = {
        "initTask"               : function( config, managerCallbacks ) { self.initTask( config, managerCallbacks ) },
        "cleanup"                : function()                           { self.cleanup() },
        "showSlide"              : function()                           { self.showSlide() },
        "translationCallbacks"   : function()                           { return self.translationCallbacks() },
        "startBlock"             : function( blockConfig )              { self.startBlock( blockConfig ) },
        "initTrial"              : function( trialConfig )              { self.initTrial( trialConfig ) },
        "trialEvent"             : function( eventData )                { self.trialEvent( eventData ) },
        "stop"                   : function( reason )                   { self.stop( reason ) }
    };
    
    this.eventManager = new EventManager( window );
}

// Draw any sprites that still need drawing
Stroop.prototype.initTask = function( config, managerCallbacks )
{
    this.config           = config;
    this.managerCallbacks = managerCallbacks;    
    
    // Configure container
    this.container = $( "<div>" ).css( {
        "position"         : "absolute",
        "top"              : "2%",
        "left"             : "2%",
        "bottom"           : "2%",
        "right"            : "2%",
        "background-color" : "#000000"
    } );
    
    // Construct canvas
    this.canvas      = new ScalableCanvas( 
        this.container,   // container div
        1.6,              // aspectRatio
        1000              // rescaleInterval
    );
    
    // Add sprites
    this.canvas.addSprites( this.sprites );
    
    // Hide labels
    for( var i in Stroop.colors )
    {  
        this.sprites[ "label_" + Stroop.colors[i] ][ "node" ].hide();
    }       
}


Stroop.prototype.cleanup = function()
{
    this.sprites[ "fix"         ][ "node" ].hide();
    this.sprites[ "stimulus"    ][ "node" ].hide();
    this.sprites[ "incorrect"   ][ "node" ].hide();
    this.sprites[ "instruction" ][ "node" ].hide();
}

// Show instruction slide
Stroop.prototype.showSlide = function()
{
    this.sprites[ "instruction" ][ "node" ].show();
}


// Translation callbacks
Stroop.prototype.translationCallbacks = function()
{
    return this.config[ "translationCallbacks" ];
}

// Initialize a block
Stroop.prototype.startBlock = function( blockConfig )
{
    this.blockConfig = blockConfig; // Store current blockCOnfig
    // Setup key labels (if labels are not hidden)
    for( var i in Stroop.colors )
    {  
        if( this.blockConfig[ "block" ][ "labels" ] == "hide" )
        {
            this.sprites[ "label_" + Stroop.colors[i] ][ "node" ].hide();
        } else {
            // Setup label text
            $( "#label_" + Stroop.colors[i] + "Text" ).html( this.config[ "buttonNames" ][ Stroop.colors[i] ] );
            this.sprites[ "label_" + Stroop.colors[i] ][ "node" ].show();

            // Setup label color
            if( this.blockConfig[ "block" ][ "labels" ] == "color" )
            {
                $( "#label_" + Stroop.colors[i] + "Text" ).css( "color", Stroop.colors[i] );
            } else {
                $( "#label_" + Stroop.colors[i] + "Text" ).css( "color", "white" );
            }
        }    
    }
}

// Initialize a block
Stroop.prototype.initTrial = function( trialConfig )
{
    this.trialConfig    = trialConfig;

    // Setup stimulus
    // Text
    $( "#stimulusText" ).html( translator.translate(
        trialConfig[ "stim" ] 
    ) );
    $( "#stimulusText" ).css( {
        "color" : trialConfig[ "color" ]
    } );        
    
    // Start with event "start"
    this.event = "start";
}

// Run next event in trial
// callbacks -> callbacks for store (trial output), startTrial, and nextTrial
Stroop.prototype.trialEvent = function( eventData )
{
    // Determine which event to run
    switch( this.event )
    {
        case "start":
            // Goto prime event
            this.event = "fix";
            this.eventManager.startEvent(
                // responses - What are valid responses to this event
                {},
                500,                              // timeout   - When does this event timeout 
                this.trialEventCallback(),        // callback  - Function to return to after event
                null,                             // params   - State to pass to callback
                "start",                          // name
				false
            );    
            break;        
        case "fix":
            // Show fix
            this.sprites[ "fix" ][ "node" ].show();
            // Goto stimulus event
            var duration = 500 + 500 * Math.random();
            this.event = "stimulus";
            this.eventManager.startEvent(
                // responses - What are valid responses to this event
                {},
                duration,                         // timeout   - When does this event timeout 
                this.trialEventCallback(),        // callback  - Function to return to after event
                null,                             // params   - State to pass to callback
                "fix",                            // name
				false
            );    
            break;       
        // stimulus - Show stimulus
        case "stimulus":
            this.sprites[ "fix" ][ "node" ].hide();
            this.sprites[ "stimulus" ][ "node" ].show();

            // Goto response event
            this.event = "response";

            // Wait for response 
            this.eventManager.startEvent(
                // responses - What are valid resopnses to this event
                {
                    "keydown" :
                    {
                        "type"    : "all",
                        "buttons" : this.config[ "buttons" ]
                    }
                },
                this.config[ "responseWindow" ],  // timeout   - When does this event timeout 
                this.trialEventCallback(),        // callback  - Function to return to after event
                null,                             // params   - State to pass to callback
                "stimulus",                       // name
				false
            );    
            break;            
        case "response":
            // In first instance, hide incorrect
            this.sprites[ "incorrect" ][ "node" ].hide();
            
            // Check for a response (and store it)
            if( eventData[ "reason" ] == "timeout" )
            {
                // Timeout: Show "too slow"
                this.nextEvent = "retry";
                this.storeResponse( TaskManager.RESPONSE_TIMEOUT );
                this.invalidFeedback( "#[task_too_slow]", "too_slow" );
                return;
            }
            else
            {
                // There was a response...

                // A response, get label and rt. Was it a valid key?
                var rt    = eventData[ "response" ][ "rt" ];
                var label = eventData[ "response" ][ "label" ];  // Label: index of response button or null if invalid
                if( label === null )
                {
                    // Invalid, show "invalid key"
                    this.nextEvent = "retry";
                    this.storeResponse( TaskManager.RESPONSE_INVALID, rt );
                    this.invalidFeedback( "#[task_invalid_key]", "invalid" );
                    return;
                }
                else
                {
                    // Valid, process reponse
                    var targetButton = this.trialConfig[ "color" ];
 
                    // Check correct
                    if( label == targetButton )
                    {
                        // Correct
                        this.cleanup();
                        this.event = "keyup";                                       
                        this.nextEvent = "next";
                        this.storeResponse( TaskManager.RESPONSE_CORRECT, rt );
                    }
                    else
                    {
                        // Incorrect; retry from stimulus event
                        this.storeResponse( TaskManager.RESPONSE_INCORRECT, rt );
                        this.sprites[ "incorrect" ][ "node" ].show();
                        this.nextEvent = "retry";
                        this.invalidFeedback( "#[task_invalid_key]", "invalid", false );
                        return;
                    }
                    
                    // Next event

                    this.trialEvent( eventData );
                    return;
                }
            }
            break;
        case "feedback":
            // If response was "left", then reintroduce block
            this.sprites[ "instruction" ][ "node" ].hide();
            this.sprites[ "incorrect" ][ "node" ].hide();
            this.event = "keyup";
            this.trialEvent( eventData );
            return;
            break;
        case "keyup":
            this.event = "release_keys";
            this.waitForKeyUp( 1500, this.trialEventCallback(), "keyup" );
            return;
            break;
        case "release_keys":
            // Show "release keys" or continue. Hide incorrect
            if( eventData[ "reason" ] == "timeout" )
            {
                this.cleanup();
                $( "#instructionText" ).html( this.translate( "#[task_release_keys]" ) );
                this.sprites[ "instruction" ][ "node" ].show();                
                this.waitForKeyUp( -1, this.trialEventCallback(), "releasekeys" );
            }
            else
            {
                // keys released; done
                this.event = "done";
                this.trialEvent( eventData );
                return;
            }
            break;
        case "done":
            // Go to next event
            this.event = this.nextEvent;
            // Hide buttons and instructions
            this.sprites[ "instruction" ][ "node" ].hide();            
            this.trialEvent();
            break;
        case "retry":
            this.event = "start";
            this.trialEvent();
            break;
        case "next":
            this.managerCallbacks[ "nextTrial" ]();
            break;
    }
}

Stroop.prototype.invalidFeedback = function( message, name, show )
{
    this.cleanup();
    $( "#instructionText" ).html( 
        this.translate( 
              message + "<br><br>" 
            + this.config[ "keys" ] + "<br><br>" 
            + this.config[ "slideButtonTexts"][ "first" ] ) 
    );
    if( show === false )
    {
         $( "#instructionText" ).html( "" );
         this.sprites[ "incorrect" ][ "node" ].show();
    }
    this.sprites[ "instruction" ][ "node" ].show();

    this.event = "feedback";
    this.eventManager.startEvent(
        // responses - What are valid resopnses to this event
        {
            "keydown" :
            {
                "type"    : "specific",
                "buttons" : this.config[ "buttons" ]
            }
        },
        -1,                         // timeout   - When does this event timeout 
        this.trialEventCallback(),  // callback  - Function to return to after event
        null,                       // params   - State to pass to callback
        name,
		false
    );        
}

Stroop.prototype.waitForKeyUp = function( timeout, callback, name  )
{
    this.eventManager.startEvent(
        // responses - What are valid resopnses to this event
        {
            "keyup" :
            {
                "type"    : "all",
                "buttons" : this.config[ "buttons" ]
            }
        },
        timeout,                  // timeout   - When does this event timeout 
        callback,                 // callback  - Function to return to after event
        null,                     // params   - State to pass to callback
        name,
		false
    );     
}

Stroop.prototype.trialEventCallback = function()
{
    var self = this;
    return  function(  eventData ) { 
        self.trialEvent( eventData );
    };
}    

// Only store response if none yet
Stroop.prototype.storeResponse = function( response, rt )
{
    response = response === undefined? null: response;
    rt       = rt       === undefined? null: rt;
    
    this.managerCallbacks[ "storeResponse" ]( {
        "response" : response,
        "rt"       : rt
    } );
}
    
// Stop running events and cleanup
Stroop.prototype.stop = function( reason )
{
    this.eventManager.stopEvent( reason );
    this.cleanup();
    $('body').css('cursor', 'auto');
    
    // Alert manager
    this.managerCallbacks[ "stop" ]( reason );
}


Stroop.prototype.translate = function( term )
{
    return translator.substitute( 
        term,
        this.translationCallbacks()
    );
}
