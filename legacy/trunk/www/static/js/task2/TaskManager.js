/**
 * TaskManager manages TaskEngines
 * @constructor
 */
function TaskManager( getState, setState, config, task, target, onCompleted, blurred, fullScreen )
{
    // Copy properties
    this.getState    = getState;
    this.setState    = setState;
    this.config      = config;
    this.task        = task;
    this.target      = target;
    this.onCompleted = onCompleted;    
    this.blurred     = blurred    !== undefined? blurred    : true;
    this.fullScreen  = fullScreen !== undefined? fullScreen : true;
    
    if( testing )
    {
        this.blurred    = false;
        this.fullScreen = false;
    }
    
    /* @property {Object} this.state Persistent state of the task (remembered across page loads). */
    // Get persistent state. If none, init to start values    
    this.state  = this.getState();
    if( !( this.state instanceof Object ) )
    {
        this.state = {
            "block"  : 0,
            "trial"  : 0,
            "done"   : false,
            "result" : {}
        };
    }
    
    // Log config
    logger.log(
        "TaskManager",
        "config",
        "",
        this.config
    );        
}

// Response types 
TaskManager.RESPONSE_NONE      = 0; // No response yet
TaskManager.RESPONSE_CORRECT   = 1; // Correct response
TaskManager.RESPONSE_INCORRECT = 2; // Incorrect response
TaskManager.RESPONSE_TIMEOUT   = 3; // Too late response
TaskManager.RESPONSE_INVALID   = 4; // Invalid key response


// Called by survey to pass itemData (not used)
TaskManager.prototype.construct = function( itemData )
{
    this.itemData = itemData;
}

// Called by survey to draw task
TaskManager.prototype.draw = function()
{
    var self = this;
    this.task.callbacks[ "initTask" ]( 
        this.config,  
        // Callbacks to store, startTrial, and nextTrial
        {
            "storeResponse" : function( responseData ) {self.storeResponse( responseData )},
            "startTrial"    : function()               {self.startTrial()},
            "nextTrial"     : function()               {self.nextTrial()},
            "stop"          : function( reason )       {self.stop( reason )}
        }
    );
        
    // Log init
    logger.log(
        "TaskManager",
        "task_init",
         "",
         this.config[ "task" ]
    );   
    
    // ****************
    // *** EventManager and SlideShow
    this.container     = this.task.container;
    this.eventManager  = this.task.eventManager;
    this.slideShow     = new SlideShow( this.eventManager );

    // GIAT is not managed by Survey; it adds itself to DIV upon start
    return null;
}

// Called by survey to start task
TaskManager.prototype.start = function()
{
    // Add to target and start rescaling
    $( this.target ).append( this.container );    
    this.task.canvas.start();
    
    // Hide scrollbar
    $( "html" ).css( "overflow-y", "hidden" );
    
    // Set stop and startBlock on blur and focus
    var self = this;
    
    if( !testing )
    {
        focusManager.setBlur(  function() {
            self.task.callbacks[ "stop" ]( "blurred" );
            $( "body" ).css( "cursor", "auto" );
        } );
        
        focusManager.setFocus( function() { 
            if( screenfull && !screenfull.isFullScreen && self.fullScreen )
            {
                screenfull.request();
            }
            $( "body" ).css( "cursor", "none" );
            self.startBlock() ;
        } );
        focusManager.setWarning( function( callback ) 
        {
            dialog.alert( 
                translator.translate( "click_to_focus" ),
                callback
            );                    
        } );    
    }
    // Start blurred or not
    if( this.blurred )
    {
        focusManager.blurred();
    } else {
        this.startBlock();
    }
}


// If any blocks left, introduce and start it, else finish task
TaskManager.prototype.startBlock = function()
{
    // Hide cursor
    if( this.task.touch !== undefined && !this.task.touch )
    {
        $('body').css('cursor', 'none');
    }
    
    // No blocks left? finish task
    if( this.state[ "block" ] >= this.config.blocks.length )
    {
//        if( !this.state[ "done" ] )
//        {
            this.done();
//        }
        return;
    }

    // Config of current block
    this.block       = this.state[ "block" ];
    this.blockConfig = this.config[ "blocks" ][ this.block ];
    
    // If no result for block with this name, then create result 
       
    if( this.state[ "result" ][ this.block ] === undefined )
    {
         this.state[ "result" ][ this.block ] = {};
         this.state[ "result" ][ this.block ][ "output" ] = [];
         this.state[ "result" ][ this.block ][ "block"  ] = this.blockConfig[ "block" ];
    }


    // Call initBlock in task
    this.task.callbacks[ "startBlock" ]( this.blockConfig );
    
    // Setup block specific features
    logger.log(
        "TaskManager",
        "block_start",
        this.block,
        this.blockConfig[ "block" ]
    );  
    
    // Introduce block
    this.introduceBlock();
}

// Show intro slides, then start trial
TaskManager.prototype.introduceBlock = function()
{
    this.task.callbacks[ "cleanup" ]();
    this.task.callbacks[ "showSlide" ]();
    
    // Get intro
    var intro = this.blockConfig[ "intro" ];
    var self  = this;
    
    var translationCallbacks = this.task.callbacks[ "translationCallbacks" ]();

    // Add block counters
    translationCallbacks[ "block_counter" ] = function() {return self.block + 1;};
    translationCallbacks[ "block_total"   ] = function() {return self.config.blocks.length;};
    
    // Show intro slides
    this.slideShow.showSlides( 
        $( "#instructionText" ),    
        intro,   
        function() {self.startTrial(); },
        translationCallbacks,
        this.config[ "slideButtons"],
        this.config[ "mouseType" ],
        this.config[ "slideTouchButtons"],
        this.config[ "slideButtonTexts" ]
    );
}

// Go to next block
TaskManager.prototype.nextBlock = function()
{
    
    // Setup block specific features
    logger.log(
        "TaskManager",
        "block_next",
        this.block,
        ""
    );  
    
    this.task.callbacks[ "cleanup" ]();
    this.state[ "block" ]++;
    this.state[ "trial" ] = 0;
    this.startBlock();
}

// Setup and start a trial; goto next block if no trials left
TaskManager.prototype.startTrial = function()
{
    this.task.callbacks[ "cleanup" ]();
    
    // No more trials to go? Next block, else setup next trial
    var trialsInBlock = this.blockConfig[ "trials" ].length;

    if( this.state[ "trial" ] >= trialsInBlock )
    {
        // *** Next block        
        this.nextBlock();
    }
    else
    {
        // *** Setup trial and init
        this.trial       = this.state[ "trial" ];
        this.trialConfig = this.blockConfig[ "trials" ][ this.trial ];
        this.initTrial();
    }
}

// Initialize trial
TaskManager.prototype.initTrial = function()
{
    // Create result and check if trial has been started before
    if( this.state[ "result" ][ this.block ][ "output" ][ this.trial ] === undefined )
    {
        // Never started before, create initial result with config and output
        this.initialResult = {};
        this.initialResult[ "trial"  ] = this.trialConfig;
        this.initialResult[ "output" ] = {"response" : TaskManager.RESPONSE_NONE};
        this.state[ "result" ][ this.block ][ "output" ][ this.trial ] = this.initialResult; 
    }
    
    // Initialize trial in task
    this.task.callbacks[ "initTrial" ](
        // Current trialConfig
        this.trialConfig
    );
        
    // Log event start
    logger.log(
        "TaskManager",
        "trial_init",
        JSON.stringify( [ this.block, this.trial ] ),
        this.trialConfig
    );           
        
    // Clear timingReport
    this.eventManager.clearTimingReport();

    // start event
    this.task.callbacks[ "trialEvent" ]();
}

// Next trial
TaskManager.prototype.nextTrial = function()
{
    // Get timingReport
    var timingReport = this.eventManager.getTimingReport();
    
    // Log trial_next
    logger.log(
        "TaskManager",
        "trial_next",
        JSON.stringify( [ 
            this.block, 
            this.trial,
            [ timingReport[ "events" ]    ],
            [ timingReport[ "requested" ] ],
            [ timingReport[ "realized"  ] ]
        ] ),
        ""
    );
   
    // DEBUG: Generate timingReport
    var timingToAlert = [];
    for( var i = 0; i < timingReport[ "events" ].length; i++ )
    {
        timingToAlert.push( {
            "event"     : timingReport[ "events"    ][ i ],
            "requested" : timingReport[ "requested" ][ i ],
            "realized"  : timingReport[ "realized"  ][ i ]
        } );
    }
    //alert( csvTable( timingToAlert, ", " ) );
	//csvTable();
    
    this.state[ "trial" ]++;

	// Update task state
	this.setState( this.state, true );
	
    this.startTrial();
}

// Task has been stopped
TaskManager.prototype.stop = function( reason )
{
    // Log stop
    logger.log(
        "TaskManager",
        "stop",
        JSON.stringify( [ this.block, this.trial ] ),
        reason
    );       
}

// Store response on a trial
TaskManager.prototype.storeResponse = function( responseData )
{
    // Only store if no response was given yet
    if( this.initialResult[ "output" ][ "response" ] == TaskManager.RESPONSE_NONE )
    {
        this.initialResult[ "output" ] = responseData;
        this.state[ "result" ][ this.block ][ "output" ][ this.trial ] = this.initialResult;
    }
    
    // Log trial result
    logger.log(
        "TaskManager",
        "trial_response",
        JSON.stringify( [ this.block, this.trial ] ),
        responseData
    );           
}

// For Survey
TaskManager.prototype.isAnswered = function()
{
    return this.state[ "done" ];
}

// Task done; call onCompleted
TaskManager.prototype.done = function()
{
    // Clean up
    this.task.canvas.stop();
    $('body').css('cursor', 'auto');
    $( "html" ).css( "overflow-y", "scroll" );
    this.state[ "done" ] = true;
    
    // Store output
    logger.log(
        "TaskManager",
        "output",
         "",
        this.state[ "result" ]
    );       
        
    // Report output
    report(
        "TaskManager",
        JSON.stringify( this.state[ "result" ] )
    );
    
    // Log task_done
    logger.log(
        "TaskManager",
        "task_done",
         "",
        ""
    );  
        
    // Clear focus warning
    focusManager.setWarning( undefined );
        
    // Call onCompleted
    if( this.onCompleted !== undefined )
    {
        this.onCompleted();
    }
}


// Default sprites for background, instruction, fix and incorrect
TaskManager.defaultSprites = function()
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
                    "z-index"          : 2,
                    "text-align"       : "left",
                    "display"          : "table"
                } ).append( $( "<p>" ).attr( {
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
        }          
    };
}
