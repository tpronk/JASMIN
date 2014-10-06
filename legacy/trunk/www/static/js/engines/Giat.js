Giat.prototype.dimensions = {
    "button_left"   : 0,
    "button_center" : .6,  // 1.6/2 - .4/2
    "button_right"  : 1.2
};

Giat.prototype.mouseEvents = {
    "mouse" : {
        "down" : "mousedown",
        "up"   : "mouseup"
    },
    "touch" : {
        "down" : "touchstart",
        "up"   : "touchend"
    }    
};

Giat.defaultSprites = function()
{
    return {
        "background" : 
        {
            "node" :
                $( "<div>" ).css( {
                    "z-index"          : 1,
                    "background-color" : "#000000",
                    "opacity"          : 1
                } ),
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
                    "z-index"          : 3,
                    "text-align"       : "left",
                    "display"          : "table",
                    "userSelect"       : "none"
                } ).append( $( "<p>" ).attr( {
                    "id"        : "instructionText"
                } ).css( {
                    "vertical-align"   : "middle",
                    "display"          : "table-cell",
                    "color"            : "#FFFFFF"
                } ).text( "" ) ),
            "scalable" :            
                {
                    "width"        :  .7,
                    "height"       :  .9,
                    "left"         :  .45,
                    "top"          :  .05,
                    "font-size"    :  .04
                }    
        },

        // Button0
        "button0" : 
        {
            "node" :        
                $( "<div>" ).attr( {} ).css( {
                    "z-index"          : 4,
                    "text-align"       : "center",
                    "userSelect"       : "none"
                    //"display"          : "table"
                } ),
            "scalable" :            
                {
                    "width"        :  .40,
                    "height"       :  .15,
                    "left"         : 0.0,
                    "top"          : 0.0,
                    "font-size"    :  .04
                }    
        },

        // Button1
        "button1" : 
        {
            "node" :        
                $( "<div>" ).attr( {} ).css( {
                    "z-index"          : 5,
                    "text-align"       : "center",
                    "userSelect"       : "none"
                    //"display"          : "table"
                } ),
            "scalable" :            
                {
                    "width"        :  .40,
                    "height"       :  .15,
                    "left"         : 1.2,
                    "top"          : 0.0,
                    "font-size"    :  .04
                }    
        },

        // Incorrect feedback (red cross)
        "incorrect" : 
        {
            "node" :
                $( "<div>" ).attr( {
                    "id"   : "incorrect"
                } ).css( {
                    "z-index"   : 2
                } ),
            "scalable" :
                {
                    "width"        :  .2,
                    "height"       :  .2,
                    "left"         :  .7,
                    "top"          : 0.6
                }        
        },
       
        // Left touch field
        "touch0" : 
        {
            "node" :        
                $( "<div>" ).attr( { 
                    "id" : "touch0"
                } ).css( {
                    "z-index"          : 7,
                    "text-align"       : "center",
                    "display"          : "table",
                    "userSelect"       : "none",
                    "color"            : "white",
                    "background-color" : "grey"
                    //"display"          : "table"
                } ).append( 
					$( "<p>" ).attr( {
						"id"        : "touch0_text"
					} ).css( {
						"vertical-align"   : "middle",
						"text-align"       : "center",
						"display"          : "table-cell"
					} ).text( "init" ) 
				),
            "scalable" :            
                {
                    "width"        :  .40,
                    "height"       :  .2,
                    "left"         : 0.0,
                    "top"          : 0.8,
                    "font-size"    :  .12
                }    
        },
        // Left touch field
        "touch1" : 
        {
            "node" :        
                $( "<div>" ).attr( {
                    "id" : "touch1"
                } ).css( {
                    "z-index"          : 8,
                    "text-align"       : "center",
                    "display"          : "table",
                    "userSelect"       : "none",
                    "color"            : "white",
                    "background-color" : "grey"
                    //"display"          : "table"
                } ).append( 
					$( "<p>" ).attr( {
						"id"        : "touch1_text"
					} ).css( {
						"vertical-align"   : "middle",
						"text-align"       : "center",
						"display"          : "table-cell"
					} ).text( "init" ) 
				),
            "scalable" :            
                {
                    "width"        :  .40,
                    "height"       :  .2,
                    "left"         : 1.2,
                    "top"          : 0.8,
                    "font-size"    :  .12
                }    
        }          
    };
};


Giat.prototype.createStimulusSprite = function( stimuliType )
{
	if( stimuliType == "text" )
	{    
		this.sprites[ "stimulus" ] =
		{
			"node" :
				$( "<div>" ).attr( {
					"id"   : "stimulus"
				} ).css( {
					"z-index"    : 2,
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
					"width"     : ".9",
					"height"    : ".9",
					"left"      : ".35",
					"top"       : ".05",
					"font-size" : ".1"
				}
		};		
	}
	else
	{
		this.sprites[ "stimulus" ] =
		{
			"node" :
				$( "<div>" ).attr( {
					"id"   : "stimulus"
				} ).css( {
					"z-index"   : 2
				} ),
			"scalable" :
				{
					"width"     : ".9",
					"height"    : ".9",
					"left"      : ".35",
					"top"       : ".05",
					"font-size" : ".7"
				}
		};
    }
}

// **************
// *** Task
	
// Constructor
// Required globals:
//   translator
//   logger
function Giat( 
    images,
    sprites,
    touch
) {
    this.images      = images;
    this.sprites     = sprites;
    var self = this;
    this.callbacks = {
        "initTask"               : function( config, managerCallbacks ) {self.initTask( config, managerCallbacks )},
        "startBlock"             : function( blockConfig )            {self.startBlock( blockConfig )},
        "initTrial"              : function( trialConfig )            {self.initTrial( trialConfig )},
        "trialEvent"             : function( eventData )              {self.trialEvent( eventData )},        
        "showSlide"              : function()                         {self.showSlide()},
        "translationCallbacks"   : function()                         {return self.translationCallbacks()},
        "cleanup"                : function()                         {self.cleanup()},
        "stop"                   : function( reason )                 {self.stop( reason )}
    };
    
    this.eventManager = new EventManager( window );
    
    // If touchscreen, enable touchscreen
    this.touch = touch === undefined? false: touch;
}

// Draw any sprites that still need drawing
Giat.prototype.initTask = function( config, managerCallbacks )
{
    this.config         = config;
    this.managerCallbacks = managerCallbacks;    
    
    // Draw stimulus sprite
    //this.createStimulusSprite( config[ "task" ][ "stimuliType" ] );
    this.createStimulusSprite( "text" );
        
    // Configure container
    this.container = $( "<div>" ).css( {
        "position"         : "absolute",
        "top"              : "0%",
        "left"             : "0%",
        "bottom"           : "0%",
        "right"            : "0%",
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
    
    // Hide touch fields (show at startBlock)
    this.sprites[ "touch0" ][ "node" ].hide();
    this.sprites[ "touch1" ][ "node" ].hide();    
}

// Clean up sprites
Giat.prototype.cleanup = function()
{
    this.sprites[ "stimulus"    ][ "node" ].hide();
    this.sprites[ "incorrect"   ][ "node" ].hide();
    this.sprites[ "instruction" ][ "node" ].hide();
}

// Show instruction slide
Giat.prototype.showSlide = function()
{
    this.sprites[ "instruction" ][ "node" ].show();
}

// Translation callbacks
Giat.prototype.translationCallbacks = function()
{
    // Setup word_overview callback
    var self = this;
    this.config[ "translationCallbacks" ][ "word_overview" ] = function()
    {
        return self.wordOverview();
    }    
    this.config[ "translationCallbacks" ][ "giat_keys" ] = function()
    {
        return self.blockConfig[ "keys" ];
    }       
    
    return this.config[ "translationCallbacks" ];
}

// Show all the words for each category
Giat.prototype.wordOverview = function()
{
    var overview = this.blockConfig[ "overview" ];
    //alert( vardump( this.config[ "categories" ] ) );
    var result = [];
    
    var i, j, current, stimuli, tempResult;
    for( i in overview )
    {
        current = overview[i];
        tempResult = "<b>" + this.config[ "categories" ][ current[ "category" ] ] + "</b>: ";
        //alert( this.config[ "categories" ][ current[ "category" ] ] );
        stimuli = [];
        for( j in current[ "stimuli" ] )
        {
            stimuli.push( this.config[ "stimuli" ][ current[ "stimuli" ][ j ] ][ "content" ] );
        }
        tempResult += stimuli.join( ", " );
        
        // Setup color
        if( current[ "color" ] !== undefined )
        {
            tempResult = "<span style=\"color: " + current[ "color" ] + "\">" + tempResult + "</span>";
        }
        result.push( tempResult );
    }
    
    return result.join( "<br><br>" );
}
  

// Initialize a block
Giat.prototype.startBlock = function( blockConfig )
{
    // Setup incorrect 
    var incorrect = this.images[ "incorrect" ];
    this.sprites[ "incorrect" ][ "node" ].empty();
    this.sprites[ "incorrect" ][ "node" ].append( 
        incorrect.css( {
            "width"  : "100%",
            "height" : "100%"
        } )
    );    
    
    // Setup touch fields
    if( this.touch )
    {
        //alert( vardump( this.config[ "keyLabels" ][ 0 ] ) );
        $( "#touch0_text" ).text( this.config[ "keyLabels" ][ 0 ] );
        $( "#touch1_text" ).text( this.config[ "keyLabels" ][ 1 ] );
        this.sprites[ "touch0" ][ "node" ].show();
        this.sprites[ "touch1" ][ "node" ].show();
    } else {
        this.sprites[ "touch0" ][ "node" ].hide();
        this.sprites[ "touch1" ][ "node" ].hide();
    }
    
    this.blockConfig = blockConfig; // Store current blockCOnfig
    
    // Setup buttons (and labels and categoryMap)
    var i, j;
    var responseConfig, buttonSprite, button, position, labels;
    var labelObject, labelCategory, labelColor;
    var categoryMap = {};    
    for( i in blockConfig[ "responses" ] )
    {
        responseConfig = blockConfig[ "responses" ][i];
        //alert( "button" + i );
        buttonSprite = this.sprites[ "button" + i ];
        button       = responseConfig[ "button" ];
        position     = responseConfig[ "position" ];
        labels       = responseConfig[ "labels" ];
        
        // Setup position
        if( position == "hide" )
        {
            buttonSprite[ "node" ].hide();
        }
        else
        {
            buttonSprite[ "node" ].show();
            buttonSprite[ "scalable" ][ "left" ] = this.dimensions[ "button_" + position ];
            this.canvas.rescaleSprite( "button" + i );
        }
        
        // Setup labels and categoryMap (mapping of categories to colors and buttons)
        buttonSprite[ "node" ].empty();
        for( j in labels )
        {
            labelCategory = labels[j][ "category" ];
            labelColor    = labels[j][ "color" ];

            // Setup categoryMap
            categoryMap[ labelCategory ] = {
                "color"  : labelColor,
                "button" : button
            };

            // Setup label
            labelObject = $( "<p>" ).attr( {} ).css( {
                "text-align"       : "center", // needed?
                "color"            : labelColor
            } ).html( this.translate(
                this.config[ "categories" ][ labelCategory ]
            ) );
            buttonSprite[ "node" ].append( labelObject );
        }
    }
    
    // Store categoryMap 
    this.categoryMap = categoryMap;
}

  
// **************
// *** Trials

// Setup and start a trial
Giat.prototype.initTrial = function( trialConfig )
{
    this.trialConfig = trialConfig;
    this.event       = "start";
   
    // Current stimulus
    var stimulus = {
        "content"  : this.config[ "stimuli" ][ this.trialConfig[ "stim" ] ][ "content" ],
        "category" : this.trialConfig[ "cat" ]
    };
    
    if( this.config[ "stimuliType" ] == "text" )
    {    
        //var category
        // Text
        $( "#stimulusText" ).html( this.translate(
            stimulus[ "content" ]
        ) );
        $( "#stimulusText" ).css( {
            "color" : this.categoryMap[ stimulus[ "category" ] ][ "color" ]
        } );        
    }
    else
    {
        alert( "Giat says: Non-text stimuli not implemented yet. Sorry!" );
        /*
        // Image
        this.sprites[ "stimulus" ][ "node" ].empty();
        this.sprites[ "stimulus" ][ "node" ].append( 
            stimulus[ "content" ].css( {
                "width"  : "100%",
                "height" : "100%"
            } )
        );
        */
    }
}
    
// Run next event in trial
Giat.prototype.trialEvent = function( eventData )
{
    // Determine which event to run
    switch( this.event )
    {
        // start - Show nothing
        case "start":
            // Goto prime event
            this.event = "stimulus";
            this.eventManager.startEvent(
                // responses - What are valid responses to this event
                {},
                250,                              // timeout   - When does this event timeout 
                this.trialEventCallback(),        // callback  - Function to return to after event
                null,                             // params   - State to pass to callback
                "start",                          // name
				false
            );    
            break;    
        // stimulus - Show stimulus
        case "stimulus":
            // Show stimulus
            this.sprites[ "stimulus" ][ "node" ].show();

            // Start response event
            this.event = "response";
            
            this.eventManager.startEvent(
                this.setupResponses( "down", "all_buttons" ),
                this.config[ "responseWindow"] , // timeout   - When does this event timeout 
                this.trialEventCallback(),       // callback  - Function to return to after event
                null,                            // params   - State to pass to callback
                "start",
				false
            );    
            break;
        case "response":
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
                var rt = eventData[ "response" ][ "rt" ];
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
                    var targetCategory = this.trialConfig[ "cat" ];
                    var targetButton   = this.categoryMap[ targetCategory ][ "button" ];
                    //alert( targetButton );
                    //targetButton = this.trialConfig

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
                        // Incorrect; retry from stimulus event
                        this.sprites[ "incorrect" ][ "node" ].show();
                        this.storeResponse( TaskManager.RESPONSE_INCORRECT, rt );
                        this.nextEvent = "stimulus";
                    }
                    
                    // Next event; keyup
                    this.event = "keyup";
                    this.trialEvent( eventData );
                    return;
                }
            }
            break;
        case "feedback":
            this.sprites[ "instruction" ][ "node" ].hide();
            this.event = "keyup";
            this.trialEvent( eventData );
            return;
            break;
        case "keyup":
            // If touch responses, don't wait for keyup
            /*
            if( this.touch )
            {
                this.event = "done";
                this.trialEvent( eventData );
                return;            
            }
            */
            // Else, wait for keyup
            this.event = "release_keys";
            this.waitForKeyUp( 1500, this.trialEventCallback(), "keyup" );
            return;
            break;
        case "release_keys":
            // Show "release keys" or continue. Hide incorrect and instruction
//            this.sprites[ "incorrect" ][ "node" ].hide();
//            this.sprites[ "instruction" ][ "node" ].hide();
            
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
                this.sprites[ "instruction" ][ "node" ].hide();                
                this.event = "done";
                this.trialEvent( eventData );
                return;
            }
            break;
        case "done":
            this.event = this.nextEvent;
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

Giat.prototype.setupResponses = function( type, which )
{
    // Setup responses
    var responses = {};
    
    // Keyboard
    responses[ "key" + type ] = {
        "type"    : which,
        "buttons" : this.config[ "buttons" ]
    };
    
    // Touch
    responses[ "vmouse" + type ] = {
        "buttons" : this.config[ "touchButtons" ]
    };
    
    return responses;
}

Giat.prototype.invalidFeedback = function( message, name )
{
    this.cleanup();
    $( "#instructionText" ).html( this.translate( 
        message + "<br><br>" + this.config[ "keys" ] + "<br><br>" + this.config[ "slideButtonTexts"][ "first" ]
    ) );
    this.sprites[ "instruction" ][ "node" ].show();

    this.event = "feedback";
    this.eventManager.startEvent(
        this.setupResponses( "down", "specific" ),
        -1,                         // timeout   - When does this event timeout 
        this.trialEventCallback(),  // callback  - Function to return to after event
        null,                       // params   - State to pass to callback
        name,
		false
    );        
}

Giat.prototype.waitForKeyUp = function( timeout, callback, name )
{
    this.eventManager.startEvent(
        this.setupResponses( "up", "all" ),    
        timeout,                  // timeout   - When does this event timeout 
        callback,                 // callback  - Function to return to after event
        null,                     // params   - State to pass to callback
        name,
		false
    );     
}

Giat.prototype.trialEventCallback = function()
{
    var self = this;
    return  function(  eventData ) { 
        self.trialEvent( eventData );
    };
}    

// Only store response if none yet
Giat.prototype.storeResponse = function( response, rt )
{
    response = response === undefined? null: response;
    rt       = rt       === undefined? null: rt;

    this.managerCallbacks[ "storeResponse" ]( {
        "response" : response,
        "rt"       : rt
    } );
}

// Stop    
Giat.prototype.stop = function( reason )
{
    this.eventManager.stopEvent( reason );
    this.cleanup();
    $('body').css('cursor', 'auto');
    
    // Alert manager
    this.managerCallbacks[ "stop" ]( reason );
}    


Giat.prototype.translate = function( term )
{
    return translator.substitute( 
        term,
        this.translationCallbacks()
    );
}

