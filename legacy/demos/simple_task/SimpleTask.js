// A simple demo task to demonstrate JASMIN generic and task2 packages

// Response types 
TaskManager.RESPONSE_NONE      = 0; // No response yet
TaskManager.RESPONSE_CORRECT   = 1; // Correct response
TaskManager.RESPONSE_INCORRECT = 2; // Incorrect response
TaskManager.RESPONSE_TIMEOUT   = 3; // Too late response
TaskManager.RESPONSE_INVALID   = 4; // Invalid key response


function SimpleTask( taskSettings, images, target, onCompleted, testing )
{
    // Copy arguments
    this.taskSettings = taskSettings;
    this.images       = images;
    this.target       = target;
    this.onCompleted  = onCompleted;    
    this.testing      = testing === undefined? false: true;
    
    // *** Init vars
    this.persistent = { "trial" : 0 };  // Persistent state; stuff to remember if the page reloads
    this.translationCallbacks = {};     // Callbacks for translations of terms provided by this task
    
    // *** Helper objects
    // Times events and registers responses
    this.eventManager  = new EventManager( window );
    // Shows slides
    this.slideShow     = new SlideShow( this.eventManager );

    // Buttons
    this.buttonsTask = {
        69 : "left", // E = left
        73 : "right" // I = right
    };

    this.buttonsSlideShow = {
        69 : "previous", // E = previous slide
        73 : "next"      // I = next slide
    };    

    // Log taskSettings: I want to simplify this format
    logger.log(
        "SimpleTask ",    // source
        "taskSettings",   // type
        "",               // name
        this.taskSettings // value
    );        

    // Setup task logic (trialSequence, counterbalancing)
    this.setupTaskLogic();

    // Setup stopping/restarting task, and taking over browser
    this.setupFocusManagerCallbacks();
    
    // Draw canvas and sprites
    this.setupGraphics();
    
    // Clean up (hide all graphics)
    this.cleanup();
    
    // Introduction slideshow
    this.introStart();
    //this.trialStart();
}

// Wrapper for translating terms using translationCallbacks
SimpleTask.prototype.translate = function( term )
{
    return translator.substitute( 
        term,
        this.translationCallbacks
    );
}

SimpleTask.prototype.cleanup = function()
{
    this.sprites[ "fix"         ][ "node" ].hide();
    this.sprites[ "stimulus"    ][ "node" ].hide();
    this.sprites[ "incorrect"   ][ "node" ].hide();
    this.sprites[ "instruction" ][ "node" ].hide();
}

// Attach callbacks to focusManager to stop/restart task.
// If we're not testing
// 1. show a warning on defocus
// 2. show/hide mouse on defocus/focus
// 3. go fullscren on focus
SimpleTask.prototype.setupFocusManagerCallbacks = function()
{
    if( this.testing )
    {
        this.blurred    = false;
        this.fullScreen = false;
    } else {
        var self = this;
        
        // Show a warning dialog if window loses focus
        focusManager.setWarning( function( callback ) 
        {
            dialog.alert( 
                this.translate( "click_to_focus" ),
                callback
            );                    
        } );            
        
        // Stop the task if window loses focus; show mouse
        focusManager.setBlur(  function() {
            $( "body" ).css( "cursor", "auto" );
            self.stop();
        } );
        
        // Restart trial if task gains focus again; fullscreen; hide mouse
        focusManager.setFocus( function() { 
            $( "body" ).css( "cursor", "none" );
            if( screenfull && !screenfull.isFullScreen && self.fullScreen )
            {
                screenfull.request();
            }
            self.startBlock() ;
        } );
    }        
}

// Setup canvas and sprites
SimpleTask.prototype.setupGraphics = function()
{
    // Container div
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
        1.6,              // aspectRatio (x/y). A value of 1.6 gives this range of coordinates: x[0:1.6] and y[0:1]
        1000              // rescaleInterval (rescaling sprites if window size changes)
    );
    
    // Add sprites
    this.sprites = this.getSprites();
    this.canvas.addSprites( this.sprites );

    // Add canvas to target
    $( this.target ).append( this.container );
    
    // Start rescaling
    this.canvas.start();
}

// Setup trial sequence (using taskSettings for counterbalancing)
SimpleTask.prototype.setupTaskLogic = function()    
{
    // Burger left or right (and salad right/left)
    this.persistent[ "left"  ] = this.taskSettings[ "burger_left" ]? "burger" : "salad";
    this.persistent[ "right" ] = this.taskSettings[ "burger_left" ]? "salad"  : "burger";
    
    // Setup translationCallbacks so that right word is put left/right in instructions
    // (see my_translations.txt)
    var self = this;
    this.translationCallbacks[ "category_left"  ] = function() { 
        return self.translate( "#[" + self.persistent[ "left"  ]  + "]" ); 
    };
    this.translationCallbacks[ "category_right" ] = function() { 
        return self.translate( "#[" + self.persistent[ "right" ]  + "]" ); 
    };
    
    // Setup a trialSequence of burgers and salads
    var trialSequence = [ "burger", "burger", "salad", "salad" ];
    this.persistent[ "ts" ] = Statistics.shuffle( trialSequence );
};
 
// Show some intro slides
SimpleTask.prototype.introStart = function()    
{ 
    var self = this;
    
    this.sprites[ "instruction" ][ "node" ].show();
    // Start slideShow
    this.slideShow.showSlides( 
        $( "#instructionText" ),          // Put slide in this HTML element
        // Slides (terms in my_translations.txt)
        [ 
            "#[simple_task_slide_1]", 
            "#[simple_task_slide_2]" 
        ],  
        function() { self.trialStart() },  // Callback when slideshow is done
        this.translationCallbacks,         // Terms translated by task
        this.buttonsSlideShow,
        [], // MouseType; obsolete
        [], // Touchbutton for touch responses
        // Texts for keys to progress slideShow
        { 
            "first" : "#[simple_task_slide_keys_first]",
            "later" : "#[simple_task_slide_keys_later]" 
        }
    );
}
    
// Start a trial
SimpleTask.prototype.trialStart = function()    
{ 
    this.cleanup();
    
    // Done with trials?
    if( this.persistent[ "trial" ] >= this.persistent[ "ts" ].length )
    {
        this.onCompleted();
        return;
    }
    
    // Setup stimulus: burger or salad?
    this.stimulus = this.persistent[ "ts" ][ this.persistent[ "trial" ] ];
    
    // Put right image in stimulus
    var image = this.images[ this.stimulus ];
    this.sprites[ "stimulus" ][ "node" ].empty();
    this.sprites[ "stimulus" ][ "node" ].append( 
        image.css( {
            "width"  : "100%",
            "height" : "100%"
        } )
    );
    
    // Set event to first of trial
    this.event = "start";
    
    // Run through trialEvents
    this.trialEvent();
}

// Callback to trialEvent in the scope of this
SimpleTask.prototype.trialEventCallback = function()
{
    var self = this;
    // eventData argument contains info about previous event
    return function( eventData ) { 
        self.trialEvent( eventData );
    };
}   

// Each trial consists of a series of events. The function below sets up
// the task according to which event we're in.
// eventData contains info about previous event (like: was there a response and which?)
SimpleTask.prototype.trialEvent = function( eventData )
{
    // Determine which event to run
    switch( this.event )
    {
        // Start: show fix for 500 ms
        case "start":
            // Show fix
            this.sprites[ "fix" ][ "node" ].show();
            
            // Next event is stimulus
            this.event = "fix";

            this.eventManager.startEvent(
                {},                               // responses - What responses are registered?
                500,                              // timeout   - When does this event timeout 
                this.trialEventCallback(),        // callback  - Function to return to after event
                null,                             // params    - Stuff to pass to callback
                "fix",                            // name      - Name of this event
				false
            );    
            break;    
        // Fix: show stimulus for 3000 ms and register all key presses
        case "fix":
            // Hide fix & show stimulus
            this.sprites[ "fix" ][ "node" ].hide();
            this.sprites[ "stimulus" ][ "node" ].show();

            // Next event is response
            this.event = "response";

            this.eventManager.startEvent(
                // responses - What are valid responses to this event
                { "keydown" : {
                    "type"    : "all",
                    "buttons" : this.buttonsTask
                } },
                3000,                             // timeout   - When does this event timeout 
                this.trialEventCallback(),        // callback  - Function to return to after event
                null,                             // params   - State to pass to callback
                "stimulus",
				false
            );    
            //alert( ( new Date() ).getTime() - testTime );
            break;
        // Response: process response and show feedback (or next trial)
        case "response":

            // In first instance, hide incorrect
            this.sprites[ "stimulus" ][ "node" ].hide();
            
            // Check for a response (and store it)
            
            // No response? reason = timeout
            if( eventData[ "reason" ] === "timeout" )
            {
                // Timeout: Show "too slow" and retry trial. We go to finalEvent
                // after feedback. This case finalEvent is "retry" which does not
                // increase trial cunter (but "next" event would)
                this.finalEvent = "retry";
                // storeResponse constructs a nice table with all response data
                this.storeResponse( TaskManager.RESPONSE_TIMEOUT );
                this.invalidFeedback( "#[task_too_slow]", "too_slow" );
                return;
            }
            // Any other reason -> there was a response
            else
            {
                // Get responseLabel and rt. Was it a valid key?
                var rt    = eventData[ "stop" ] - this.rtStart;
                
                // Label: index of response button or null if invalid
                var responseLabel = eventData[ "response" ][ "label" ];  
                if( responseLabel === null )
                {
                    // Invalid, show "invalid key" and retry
                    this.finalEvent = "retry";
                    this.storeResponse( TaskManager.RESPONSE_INVALID, rt );
                    this.invalidFeedback( "#[task_invalid_key]", "invalid" );
                    return;
                }
                else
                {
                    // Response is burger or salad?
                    var response = this.persistent[ responseLabel];
                    
                    // Response is correct?
                    if( response === this.stimulus )
                    {
                        // Correct
                        this.cleanup();
                        this.finalEvent = "next";
                        this.storeResponse( TaskManager.RESPONSE_CORRECT, rt );
                    }
                    else
                    {
                        // Incorrect; retry from start
                        this.sprites[ "incorrect" ][ "node" ].show();
                        this.storeResponse( TaskManager.RESPONSE_INCORRECT, rt );
                        this.finalEvent = "retry";
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
            this.sprites[ "incorrect" ][ "node" ].hide();
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
            this.event = this.finalEvent;
            // Hide buttons and instructions
            this.sprites[ "instruction" ][ "node" ].hide();            
            this.trialEvent();
            break;
        case "retry":
            this.trialStart();
            return;
            break;
        case "next":
            this.persistent[ "trial" ]++;
            this.trialStart();
            return;
            break;
    }
}

SimpleTask.prototype.invalidFeedback = function( message, name )
{
    this.cleanup();
    $( "#instructionText" ).html( 
        this.translate( 
              message
            + "<br><br>#[simple_task_task_keys]" 
            + "<br><br>#[simple_task_slide_keys_first]"
        )
    );

    //alert( this.translationCallbacks["category_left"]() );
    
    this.sprites[ "instruction" ][ "node" ].show();

    this.event = "feedback";
    this.eventManager.startEvent(
        // responses - What are valid resopnses to this event
        {
            "keydown" :
            {
                "type"    : "specific",
                "buttons" : this.buttonsSlideShow
            }
        },
        -1,                         // timeout   - When does this event timeout 
        this.trialEventCallback(),  // callback  - Function to return to after event
        null,                       // params   - State to pass to callback
        name,
		false
    );        
}

SimpleTask.prototype.waitForKeyUp = function( timeout, callback, name  )
{
    this.eventManager.startEvent(
        // responses - What are valid resopnses to this event
        {
            "keyup" :
            {
                "type"    : "all",
                "buttons" : this.buttonsTask
            }
        },
        timeout,                  // timeout   - When does this event timeout 
        callback,                 // callback  - Function to return to after event
        null,                     // params   - State to pass to callback
        name,
		false
    );     
}

    
// Store response on a trial
SimpleTask.prototype.storeResponse = function( responseData )
{
    /*
    // Only store if no response was given yet
    if( this.currentResult[ "response" ] == TaskManager.RESPONSE_NONE )
    {
        this.currentResult = responseData;
        this.persistent[ "results" ][ this.persisent[ "trial" ] ] = this.currentResult;
        this.state[ "result" ][ this.block ][ "output" ][ this.trial ] = this.initialResult;
    }    
    */
}    
    
    
    // Sprites
SimpleTask.prototype.getSprites = function()
{
    // Each sprite is an element of the sprites array, for each sprite we
    // construct the HTML node ("node") and assign scalable CSS properties ("scalable"). 
    return {
        "background" : 
        {
            // "node" contains the object and CSS properties that not need scaling
            "node" :
                $( "<div>" ).css( {
                    "z-index"          : 1,
                    "background-color" : "#000000",
                    "opacity"          : 1
                } ),
            // "scalable" contains the object and CSS properties that not need scaling
            "scalable" :
                {
                    "width"  : "1.6",
                    "height" : "1",
                    "left"   : "0",
                    "top"    : "0"
                }
        },

        // Label left
        "instruction" : 
        {
            "node" :        
                $( "<div>" ).attr( {} ).css( {
                    "z-index"          : 2,
                    "text-align"       : "left",
                    "display"          : "table"
                } ).append( $( "<p>" ).attr( {
                    // Note the id; we can use this to refer to this <p> element in the task
                    "id"        : "instructionText"
                } ).css( {
                    "vertical-align"   : "middle",
                    "display"          : "table-cell",
                    "color"            : "#FFFFFF"
                } ).text( "" ) ),
            "scalable" :            
                {
                    "width"        : 1,
                    "height"       :  .5,
                    "left"         :  .3,
                    "top"          :  .25,
                    "font-size"    :  .04
                }    
        },

        // Incorrect feedback (red cross)
        "incorrect" : 
        {
            "node" :        
                $( "<div>" ).attr( {} ).css( {
                    "z-index"          : 3,
                    "text-align"       : "center",
                    "color"            : "red",
                    "display"          : "table",
                    "font-weight"      : "bold"
                } ).append( 
                        $( "<p>" ).attr( {
                        } ).css( {
                            "vertical-align"   : "middle",
                            "text-align"       : "center",
                            "display"          : "table-cell"
                        } ).text( "X" ) 
                ),
            "scalable" :            
                {
                    "width"        :  .40,
                    "height"       :  .2,
                    "left"         :  .6,
                    "top"          : 0.4,
                    "font-size"    :  .16
                }    
        },
        // Fixation cross
        "fix" : 
        {
            "node" :        
                $( "<div>" ).attr( {} ).css( {
                    "z-index"          : 4,
                    "text-align"       : "center",
                    "color"            : "white",
                    "display"          : "table",
                    "font-weight"      : "bold"
                } ).append( 
                        $( "<p>" ).attr( {
                        } ).css( {
                            "vertical-align"   : "middle",
                            "text-align"       : "center",
                            "display"          : "table-cell"
                        } ).text( "+" ) 
                ),
            "scalable" :            
                {
                    "width"        :  .40,
                    "height"       :  .2,
                    "left"         :  .6,
                    "top"          : 0.4,
                    "font-size"    :  .16
                }    
        },
        "stimulus" :
        {    
            "node" :
                $( "<div>" ).attr( {
                    "id"   : "stimulus"
                } ).css( {
                    "z-index"   : 5
                } ),
            "scalable" :
                {
                    "width"     :  .5,
                    "height"    :  .5,
                    "left"      :  .55,
                    "top"       :  .25
                }
        }
    };
};
    