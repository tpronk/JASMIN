Gvpt.dimensions = {
    "probe_left"   :  .375,
    "probe_right"  : 1.125
};

Gvpt.defaultSprites = function()
{
    var sprites = TaskManager.defaultSprites();
    
    // Stimulus ( scaled 2.25 by 1; two square stimuli sized 1x1 with .25 space between them stimuli )
    sprites[ "stimulus" ] =
    {
        "node" :
            $( "<div>" ).attr( {
                "id"   : "stimulus"
            } ).css( {
                "z-index"   : 10
            } ),
        "scalable" :
            {
                "width"     : 1.35,
                "height"    :  .6,
                "left"      :  .125,
                "top"       :  .2
            }
    };
    
    // Probe; arrow pointing up or down
    sprites[ "probe" ] =
    {
        "node" :        
            $( "<div>" ).attr( {} ).css( {
                "z-index"          : 11
            } ),
        "scalable" :            
            {
                "width"        :  .1,
                "height"       :  .1,
                "left"         :  .375, // .4 or 1.15
                "top"          :  .45
            }    
    };
    
    return sprites;
};


// **************
// *** Task
	
// Constructor
// Required globals:
//   translator
//   logger
function Gvpt( 
    images,
    sprites
) {
    this.images      = images;
    this.sprites     = sprites;
    var self = this;
    this.callbacks = {
        "initTask"               : function( config, managerCallbacks ) { self.initTask( config, managerCallbacks ); },
        "cleanup"                : function()                         { self.cleanup(); },
        "showSlide"              : function()                         { self.showSlide(); },
        "translationCallbacks"   : function()                         { return self.translationCallbacks(); },
        "startBlock"             : function( blockConfig )            { self.startBlock( blockConfig ); },
        "initTrial"              : function( trialConfig )            { self.initTrial( trialConfig ); },
        "trialEvent"             : function( eventData )              { self.trialEvent( eventData ); },
        "stop"                   : function( reason )                 { self.stop( reason ); }
    };
    
    this.eventManager = new EventManager( window );
}

// Draw any sprites that still need drawing
Gvpt.prototype.initTask = function( config, managerCallbacks )
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
}


Gvpt.prototype.cleanup = function()
{
    this.sprites[ "fix"         ][ "node" ].hide();
    this.sprites[ "stimulus"    ][ "node" ].hide();
    this.sprites[ "probe"       ][ "node" ].hide();
    this.sprites[ "incorrect"   ][ "node" ].hide();
    this.sprites[ "instruction" ][ "node" ].hide();
}

// Show instruction slide
Gvpt.prototype.showSlide = function()
{
    this.sprites[ "instruction" ][ "node" ].show();
}


// Translation callbacks
Gvpt.prototype.translationCallbacks = function()
{
    return this.config[ "translationCallbacks" ];
}

// Initialize a block
Gvpt.prototype.startBlock = function( blockConfig )
{
    this.blockConfig = blockConfig; // Store current blockCOnfig
    //this.nextEvent   = false;             // Initially never incorrect feedback
}

// Initialize a trial
Gvpt.prototype.initTrial = function( trialConfig )
{
    this.trialConfig    = trialConfig;

    // Setup stimulus
    var stimulus = this.images[ this.trialConfig[ "image" ] ];
    this.sprites[ "stimulus" ][ "node" ].empty();
    this.sprites[ "stimulus" ][ "node" ].append( 
        stimulus.css( {
            "width"  : "100%",
            "height" : "100%"
        } )
    );
    
    // Setup probe; up or down
    var probe = this.images[ "probe_up" ];
    if( trialConfig[ "pdir" ] == "down" )
    {
        probe = this.images[ "probe_down" ];
    }
    this.sprites[ "probe" ][ "node" ].empty();
    this.sprites[ "probe" ][ "node" ].append( 
        probe.css( {
            "width"  : "100%",
            "height" : "100%"
        } )
    );
        
    // Probe; left or right
    var x = Gvpt.dimensions[ "probe_left" ];
    if( trialConfig[ "phor" ] == "right" )
    {
        x = Gvpt.dimensions[ "probe_right" ];
    }    
    this.sprites[ "probe" ][ "scalable" ][ "left" ] = x;
    this.canvas.rescaleSprite( "probe" );
    
    // Start with event "start"
    this.event = "start";
}

// Run next event in trial
// callbacks -> callbacks for store (trial output), startTrial, and nextTrial
Gvpt.prototype.trialEvent = function( eventData )
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
                "start",                           // name
				false
            );    
            break;        
        case "fix":
            // Show fix
            this.sprites[ "fix" ][ "node" ].show();
            // Goto stimulus event
            var duration = 500 + 500 * Math.random();
            this.event = "stimulus";
			//alert( duration );
            this.eventManager.startEvent(
                // responses - What are valid responses to this event
                {},
                duration,                         // timeout   - When does this event timeout 
                this.trialEventCallback(),        // callback  - Function to return to after event
                null,                             // params   - State to pass to callback
                "fix",
				false
            );    
            break;       
        // stimulus - Show stimulus
        case "stimulus":
            this.sprites[ "fix" ][ "node" ].hide();
            this.sprites[ "stimulus" ][ "node" ].show();

            // Goto probe event
            this.event = "probe";
            this.eventManager.startEvent(
                // responses - What are valid responses to this event
                {
                    "keydown" :
                    {
                        "type"    : "specific",
                        "buttons" : {}
                    }
                },
                750,                              // timeout   - When does this event timeout 
                this.trialEventCallback(),        // callback  - Function to return to after event
                null,                             // params   - State to pass to callback
                "stimulus",                       // name
				false
            );    
            break;        
        // probe - Show probe
        case "probe":
            // Hide stimulus?
            if( this.trialConfig[ "keep" ] != "yes" )
            {
                this.sprites[ "stimulus"  ][ "node" ].hide();
            }
            
            // Hide incorrect, show probe
            this.sprites[ "probe"     ][ "node" ].show();

            // Goto response event
            this.event   = "hide";
            this.rtStart = ( new Date() ).getTime();
            this.eventManager.startEvent(
                // responses - What are valid resopnses to this event
                {
                    "keydown" :
                    {
                        "type"    : "all",
                        "buttons" : this.config[ "buttons" ]
                    }
                },
                750,                              // timeout   - When does this event timeout 
                this.trialEventCallback(),        // callback  - Function to return to after event
                null,                             // params   - State to pass to callback
                "probe",                          // name
				false
            );    
            break;
        // hide - Hide probe
        case "hide":
            // Hide stimulus?
            if( this.trialConfig[ "keep" ] == "yes" )
            {
                this.sprites[ "stimulus"  ][ "node" ].hide();
            }
            
            // Hide probe
            this.sprites[ "probe" ][ "node" ].hide();            
            this.event = "response";
            // Go directly to response if probe did not timeout
            if( eventData !== undefined && eventData[ "reason" ] != "timeout" )
            {
                //alert( vardump( eventData ) )
                this.trialEvent( eventData );
                return;
            }
            
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
                "hide",                      // name
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
                var rt    = eventData[ "stop" ] - this.rtStart;
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
                    var targetButton = this.trialConfig[ "pdir" ];
 
                    // Check correct
                    if( label == targetButton )
                    {
                        // Correct
                        this.cleanup();
                        this.nextEvent = "next";
                        this.storeResponse( TaskManager.RESPONSE_CORRECT, rt );
                    }
                    else
                    {
                        // Incorrect; retry from probe event
                        this.sprites[ "incorrect" ][ "node" ].show();
                        this.storeResponse( TaskManager.RESPONSE_INCORRECT, rt );
                        this.nextEvent = "hide";
                    }
                    
                    // Next event; keyup
                    this.event = "keyup";               
                    this.trialEvent( eventData );
                    return;
                }
            }
            break;
        case "feedback":
            // If response was "left", then reintroduce block
            this.sprites[ "instruction" ][ "node" ].hide();
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
                // If we used to go to hide (on incorrect), now go to start
                if( this.nextEvent == "hide" )
                {
                    this.nextEvent = "start";
                }
                
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

Gvpt.prototype.invalidFeedback = function( message, name )
{
    this.cleanup();
    $( "#instructionText" ).html( 
        this.translate( 
              message + "<br><br>" 
            + this.config[ "keys" ] + "<br><br>" 
            + this.config[ "slideButtonTexts"][ "first" ] ) 
    );
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

Gvpt.prototype.waitForKeyUp = function( timeout, callback, name  )
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

Gvpt.prototype.trialEventCallback = function()
{
    var self = this;
    return  function(  eventData ) { 
        self.trialEvent( eventData );
    };
}    

// Only store response if none yet
Gvpt.prototype.storeResponse = function( response, rt )
{
    response = response === undefined? null: response;
    rt       = rt       === undefined? null: rt;
    
    this.managerCallbacks[ "storeResponse" ]( {
        "response" : response,
        "rt"       : rt
    } );
}
    
// Stop running events and cleanup
Gvpt.prototype.stop = function( reason )
{
    this.eventManager.stopEvent( reason );
    this.cleanup();
    $('body').css('cursor', 'auto');
    
    // Alert manager
    this.managerCallbacks[ "stop" ]( reason );
}


Gvpt.prototype.translate = function( term )
{
    return translator.substitute( 
        term,
        this.translationCallbacks()
    );
}
