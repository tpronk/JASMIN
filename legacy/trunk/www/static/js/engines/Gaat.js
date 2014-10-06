Gaat.dimensions = {
    "stimulus_left"   :  .8,
    "stimulus_top"    :  .5
};

Gaat.defaultSprites = function()
{
    var sprites = TaskManager.defaultSprites();
    
    sprites[ "stimulus" ] =
    {    
        "node" :
            $( "<div>" ).attr( {
                "id"   : "stimulus"
            } ).css( {
                "z-index"   : 2
            } ),
        "scalable" :
            {
                "width"     :  .5,
                "height"    :  .5,
                "left"      :  .55,
                "top"       :  .25
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
function Gaat( 
    images,
    sprites
) {
    this.images      = images;
    this.sprites     = sprites;
    var self = this;
    this.callbacks = {
        "initTask"               : function( config, managerCallbacks ) {self.initTask( config, managerCallbacks )},
        "cleanup"                : function()                         {self.cleanup()},
        "showSlide"              : function()                         {self.showSlide()},
        "translationCallbacks"   : function()                         {return self.translationCallbacks()},
        "startBlock"             : function( blockConfig )            {self.startBlock( blockConfig )},
        "initTrial"              : function( trialConfig )            {self.initTrial( trialConfig )},
        "trialEvent"             : function( eventData )              {self.trialEvent( eventData )},
        "stop"                   : function( reason )                 {self.stop( reason )}
    };
    
    this.eventManager = new EventManager( window );
    this.animation    = new AnimationManager();
}

// Draw any sprites that still need drawing
Gaat.prototype.initTask = function( config, managerCallbacks )
{
    this.config           = config;
    this.managerCallbacks = managerCallbacks;    
    this.zoomPerMs        = ( this.config[ "zoomMax" ] - this.config[ "zoomMin" ] ) / this.config[ "zoomTime" ];
    
    // Configure container
    this.container = $( "<div>" ).css( {
        "position"         : "absolute",
        "top"              : "2%",
        "left"             : "2%",
        "bottom"           : "2%",
        "right"            : "2%",
        "background-color" : "#000000",
        "overflow"         : "hidden"
    } );
    
    // Construct canvas
    this.canvas      = new ScalableCanvas( 
        this.container,   // container div
        1.6,              // aspectRatio
        1000              // rescaleInterval
    );
    
    // Add sprites
    this.canvas.addSprites( this.sprites );
    
    // Start animation
    this.zoomAnimation();
}


Gaat.prototype.cleanup = function()
{
    this.sprites[ "fix"         ][ "node" ].hide();
    this.sprites[ "stimulus"    ][ "node" ].hide();
    this.sprites[ "incorrect"   ][ "node" ].hide();
    this.sprites[ "instruction" ][ "node" ].hide();
}

// Show instruction slide
Gaat.prototype.showSlide = function()
{
    this.sprites[ "instruction" ][ "node" ].show();
}


// Translation callbacks
Gaat.prototype.translationCallbacks = function()
{
    return this.config[ "translationCallbacks" ];
}

// Initialize a block
Gaat.prototype.startBlock = function( blockConfig )
{
    
    this.blockConfig = blockConfig; // Store current blockCOnfig
    //this.nextEvent   = false;             // Initially never incorrect feedback
}

// Initialize a block
Gaat.prototype.initTrial = function( trialConfig )
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
    
    // Init sustained
    this.sustained = true;
    
    // Reset trial
    this.resetTrial();
}    

Gaat.prototype.resetTrial = function()
{
    // Setup initial zoom level
    this.zoom = ( this.config[ "zoomMax" ] + this.config[ "zoomMin" ] ) / 2;
    this.scaleStimulus();    
    
    // Start with event "start"
    this.event = "start";
}

// Scale stimulus while keeping centered
Gaat.prototype.scaleStimulus = function()
{
    var ratio = 1.5;
    var zoom = Math.pow( this.zoom, ratio );
    //var zoom = this.zoom;
    var left = Gaat.dimensions[ "stimulus_left" ] - zoom / 2;    
    var top  = Gaat.dimensions[ "stimulus_top"  ] - zoom / 2;    
    this.sprites[ "stimulus" ][ "scalable" ][ "left"   ] = left;
    this.sprites[ "stimulus" ][ "scalable" ][ "top"    ] = top;
    this.sprites[ "stimulus" ][ "scalable" ][ "width"  ] = zoom;
    this.sprites[ "stimulus" ][ "scalable" ][ "height" ] = zoom;
    this.canvas.rescaleSprite( "stimulus" );
}

Gaat.prototype.zoomAnimation = function()
{
    var self = this;
    if( this.zooming )
    {
        var timeDepressed  = ( new Date() ).getTime() - self.startTime;
        var zoomMultiplier = self.direction == "down"?1:-1;
        self.zoom          = self.startZoom + zoomMultiplier * self.zoomPerMs * timeDepressed;
        self.scaleStimulus();
    }
    self.animation.add( function() { self.zoomAnimation() } );
}

// Run next event in trial
// callbacks -> callbacks for store (trial output), startTrial, and nextTrial
Gaat.prototype.trialEvent = function( eventData )
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
                false                             // logEvent
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
                "fix",
                false                             // logEvent
            );    
            break;       
        // stimulus - Show stimulus
        case "stimulus":
            this.sprites[ "fix" ][ "node" ].hide();
            this.sprites[ "stimulus" ][ "node" ].show();

            // Goto probe event
            this.event = "keydown";
            this.eventManager.startEvent(
                // responses - What are valid responses to this event
                {
                    "keydown" :
                    {
                        "type"    : "all",
                        "buttons" : this.config[ "buttons" ]
                    }
                },
                6000,                             // timeout   - When does this event timeout 
                this.trialEventCallback(),        // callback  - Function to return to after event
                null,                             // params   - State to pass to callback
                "stimulus",                       // name
                false                             // logEvent
            );    
            break;        
        // response - process a response
        case "keydown":
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
                    this.startTime  = ( new Date() ).getTime();
                    this.startZoom  = this.zoom;
                    this.direction  = label;
                    this.zooming    = true;
                    
                    // Store response
                    var responseType;
                    var responseApproach = this.direction == "down"? "yes": "no";
                    if( responseApproach == this.trialConfig[ "appr" ] )
                    {
                        responseType = TaskManager.RESPONSE_CORRECT;
                    } else {
                        responseType = TaskManager.RESPONSE_INCORRECT;
                    }
                    this.storeResponse( responseType, rt );
                    
                    // Next event; zoom
                    this.event = "zoom";
                    eventData[ "reason" ] = "timeout"
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
        case "zoom":
            // Update zoom 
            //var timeDepressed  = ( new Date() ).getTime() - this.startTime;
            //var zoomMultiplier = this.direction == "down"?1:-1;
            //this.zoom          = this.startZoom + zoomMultiplier * this.zoomPerMs * timeDepressed;
            /*
            report( "Gaat", "XXX" );
            report( "Gaat", ( new Date() ).getTime() );
            report( "Gaat", this.startTime );
            report( "Gaat", this.startZoom );
            report( "Gaat", zoomMultiplier );
            report( "Gaat", this.zoomPerMs );
            report( "Gaat", timeDepressed  );
            report( "Gaat", this.zoom      );
            */
            // If zoom exceeds min, resolve trial with approach no
            if( this.zoom <= this.config[ "zoomMin" ] )
            {
                this.zooming = false;
                this.approach = "no";
                this.event = "response";
                this.trialEvent( eventData );
                return;
            }

            // If zoom exceeds max, resolve trial with approach yes
            if( this.zoom >= this.config[ "zoomMax" ] )
            {
                this.zooming = false;
                this.approach = "yes";
                this.event = "response";
                this.trialEvent( eventData );
                return;
            }

            /*
            this.animation.add( function() {
                self.scaleStimulus();
                self.animation.add( function() {
                    self.scaleStimulus();
                } );
            } );
            */
            //alert( vardump( eventData ) );

            // If response, then key is released; goto stimulus event
            if( eventData[ "reason" ] == "response" )
            {
                this.zooming = false;
                this.sustained = false;
                this.event = "stimulus";
                this.trialEvent( eventData );
                return;
            }
            
            // If timeout, then key is still depressed; repeat zoom event
            if( eventData[ "reason" ] == "timeout" )
            {
                this.event = "zoom";
                this.eventManager.startEvent(
                    // responses - What are valid responses to this event
                    {
                        "keyup" :
                        {
                            "type"    : "specific",
                            "buttons" : this.config[ "buttons" ]
                        }
                    },
                    this.config[ "zoomInterval" ],     // timeout   - When does this event timeout 
                    this.trialEventCallback(),        // callback  - Function to return to after event
                    null,                             // params   - State to pass to callback
                    "zoom",                           // name
                    false                             // logEvent
                );                  
            }
            break;
        // limit; max/min zoom reached, process response
        case "response":
            // Hide Stimulus
            this.cleanup();

            // Correct response?
            if( this.approach == this.trialConfig[ "appr" ] )
            {
                // Correct
                this.nextEvent = "next";
            }
            else
            {
                // Incorrect; reset zoom and retry from stimulus
                this.sprites[ "incorrect" ][ "node" ].show();
                this.nextEvent = "retry";
            }

            // Check if key already released
            for( var i = 0; i < eventData[ "responses" ].length; i++ )
            {
                if( eventData[ "responses" ][i][ "type" ] == "keyup" )
                {
                    // keys released; done
                    this.event = "done";
                    this.trialEvent();
                    return;                    
                }
            }
            
            // Wait for keyup
            this.event = "keyup";
            this.trialEvent();
            break;
        case "keyup":
            this.event = "release_keys";
            this.waitForKeyUp( 1500, this.trialEventCallback(), "keyup" );
            break;
        case "release_keys":
            // Show "release keys" or continue. Hide incorrect
            this.sprites[ "incorrect" ][ "node" ].hide();
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
                this.trialEvent();
                return;
            }
            break;
        case "done":
			this.sprites[ "incorrect" ][ "node" ].hide()
			
            // Log sustained
            logger.log(
                "Task",
                "trial_done",
                "",
                {
                    "sust" : this.sustained
                }
            );            
            // Go to next event
            this.event = this.nextEvent;
            // Hide buttons and instructions
            this.sprites[ "instruction" ][ "node" ].hide();            
            this.trialEvent();
            break;
        case "retry":
            this.resetTrial();
            this.trialEvent();
            //this.managerCallbacks[ "startTrial" ]();
            //this.event = "start";
            //this.trialEvent();
            break;
        case "next":
            // Clear response
            //this.sustained = undefined;
            this.managerCallbacks[ "nextTrial" ]();
            break;
    }
}

Gaat.prototype.invalidFeedback = function( message, name )
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
        false                             // logEvent
    );        
}

Gaat.prototype.waitForKeyUp = function( timeout, callback, name  )
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
        false                     // logEvent - Don't log by default
    );     
}

Gaat.prototype.trialEventCallback = function()
{
    var self = this;
    return  function(  eventData ) { 
        self.trialEvent( eventData );
    };
}    

// Only store response if none yet
Gaat.prototype.storeResponse = function( response, rt )
{
    response = response === undefined? null: response;
    rt       = rt       === undefined? null: rt;    
    
    this.managerCallbacks[ "storeResponse" ]( {
        "response" : response,
        "rt"       : rt
    } );
}
    
// Stop running events and cleanup
Gaat.prototype.stop = function( reason )
{
    this.eventManager.stopEvent( reason );
    this.cleanup();
    $('body').css('cursor', 'auto');
    
    // Alert manager
    this.managerCallbacks[ "stop" ]( reason );
}


Gaat.prototype.translate = function( term )
{
    return translator.substitute( 
        term,
        this.translationCallbacks()
    );
}
