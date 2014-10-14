//Copyright 2014, Thomas Pronk
//
//Licensed under the Apache License, Version 2.0 (the "License");
//you may not use this file except in compliance with the License.
//You may obtain a copy of the License at
//
//http://www.apache.org/licenses/LICENSE-2.0
//
//Unless required by applicable law or agreed to in writing, software
//distributed under the License is distributed on an "AS IS" BASIS,
//WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//See the License for the specific language governing permissions and
//limitations under the License. 

/** 
 * Init JASMIN namespace
 * @private
 */
if( jasmin === undefined ) { var jasmin = function() {}; }

// Task Response types 
jasmin.TASK_RESPONSE_NONE      = 0; // No response yet
jasmin.TASK_RESPONSE_CORRECT   = 1; // Correct response
jasmin.TASK_RESPONSE_INCORRECT = 2; // Incorrect response
jasmin.TASK_RESPONSE_TIMEOUT   = 3; // Too late response
jasmin.TASK_RESPONSE_INVALID   = 4; // Invalid key response

// Task Trial Event types
jasmin.TASK_TRIAL_RESPONSE     = 1; // Set a timeout with a reponse
jasmin.TASK_TRIAL_NORESPONSE   = 2; // Set a timeout without a response
jasmin.TASK_TRIAL_INCORRECT    = 3; // Show invalid feedback
jasmin.TASK_TRIAL_INVALID      = 4; // Show invalid feedback
jasmin.TASK_TRIAL_TOO_SLOW     = 5; // Show invalid feedback
jasmin.TASK_TRIAL_RELEASE      = 6; // Wait for key up
jasmin.TASK_TRIAL_NEXT         = 7; // Next trial

/**
 * TaskManager manages a Task
 * @param {TaskEngine}  task         The TaskEngine instance managed by this TaskManager instance, see TaskEngine API for the function a TestEngine needs to implement
 * @param {TaskConfig}  config       An associative array containing task configuration, see schema for a desription of TaskConfig structure
 * @param {HTMLElement} target       HTMLElement that will contain the ScalableCanvas that shows Task graphics* 
 * @param {Function}    onCompleted  Called when TaskEngine has completed
 * @param {Function}    report       (optional) Called for reporting TaskManager state
 * @param {Object}      state        (optional) Current task state. If undefined, task state is intialized to beginning of task
 * @param {Function}    setState     (optional) Called to store task state. Called with one argument, being task state to store.
  * @constructor
 */
jasmin.TaskManager = function( translator, eventManager, task, config, target, onCompleted, report, state, setState )
{
    // Copy properties
    this.translator   = translator;
    this.eventManager = eventManager;
    this.task         = task;
    this.config       = config;
    this.target       = target;    
    this.onCompleted  = onCompleted;        
    this.report       = report === undefined? function() {} : report;
    this.state        = state;    
    this.setState     = setState === undefined? function() {} : setState;
    
    /**
     * @property {Object} this.state Persistent state of the task (which can periodically be saved via calls to setState) 
     */
    if( !( this.state instanceof Object ) )
    {
        this.state = {
            /**
             * @property {int} Current block
             */
            "block"  : 0,
            /**
             * @property {int} Current trial
             */            
            "trial"  : 0,
            /**
             * @property {bool} Current task done?
             */            
            "done"   : false,
            /**
             * @property {Object} Task logs (should it be indexed or associative?)
             */                  
            "logs"   : {}
        };
    }
}

/**
 * Initializes the task by drawing a ScalableCanvas, setting up the sprites, and starting the task
 * @public
 */
jasmin.TaskManager.prototype.start = function() {
    /**
     * @property {ScalableCanvas} Containing task graphics. Default width:height ratio = 1:1.6
     */    
    this.canvas      = new jasmin.ScalableCanvas( 
        this.target,      // container div
        1.6,              // aspectRatio
        1000              // rescaleInterval
    );

    // Setup task
    this.configTask = this.config[ "task" ][ "task_vars" ];
    this.task.taskSetup( this.configTask, this.canvas ); 

    /**
     * @property {Slideshow} For block introduction slides
     */  
    this.slideshow = new jasmin.Slideshow(
        // target; html of this HTMLElement will be set to slide
        $( this.config[ "slideshow" ][ "text_id" ] ),
        //this.task.getSprites()[ this.config[ "slideshow" ][ "text" ] ][ "node" ],
        this.eventManager,
        // activeResponses; touch and keyboard progress the slides
        this.config[ "slideshow" ][ "buttons" ],
        // buttonTexts
        this.config[ "slideshow" ][ "button_texts" ],
        // buttonDelay; one second
        this.config[ "slideshow" ][ "button_delay" ]
    );    

    // Canvas starts scaling
    this.canvas.start();
    
    this.blockSetup();
};

/**
 * Set up the current block, then show introduction slides
 * @public
 */
jasmin.TaskManager.prototype.blockSetup = function() {
    // No blocks left? finish task
    if( this.state[ "block" ] >= this.config.blocks.length )
    {
        this.done();
        return;
    }
    // Config of current block
    this.specsBlock = this.config[ "blocks" ][ this.state[ "block" ] ];
    this.task.blockSetup( this.specsBlock[ "block_vars" ] );
    this.blockIntroduce();
};

/**
 * Show introduction slides of current block, then start next trial of block.
 * Adds two callbacks to translator: block_counter -> index of current block
 * starting at 1, block_total -> total number of blocks
 * @public
 */
jasmin.TaskManager.prototype.blockIntroduce = function() {
    // Add translation callbacks for block counters
    this.translator.setCallback( "block_counter", function() { return self.block + 1; } );
    this.translator.setCallback( "block_total",   function() { return self[ "config" ][ "blocks" ].length; } );
 
    // Show intro slides
    var self = this;      
    $( this.config[ "slideshow" ][ "container_id" ] ).show();
    this.slideshow.show( 
        this.specsBlock[ "intro_slides" ],
        function() {
            $( self.config[ "slideshow" ][ "container_id" ] ).hide();
            self.trialStart(); 
        }
    );

};

/**
 * Go to next block
 * Adds two callbacks to translator: block_counter -> index of current block
 * starting at 1, block_total -> total number of blocks
 * @public
 */
jasmin.TaskManager.prototype.blockNext = function() {
    this.state[ "trial"] = 0;
    this.state[ "block" ]++;
    this.blockSetup();
};

/**
 * If no trials left, go to next block. Otherwise, setup trial and go to 
 * start event. Calls task.trialSetup
 * @public
 */
jasmin.TaskManager.prototype.trialStart = function()
{
    // No more trials to go? Next block, else setup next trial
    var trialsInBlock = this.specsBlock[ "trials" ].length;

    if( this.state[ "trial" ] >= trialsInBlock ) {
        // *** Next block        
        this.blockNext();
    } else {
        // *** Setup trial
        this.trial       = this.state[ "trial" ];
        this.configTrial = this.specsBlock[ "trials" ][ this.trial ];
        this.task.trialSetup( this.configTrial );
        // *** Go to event "start"
        this.eventNow = "start";
        this.trialEventStart();
    }
};

/**
 * Run a single trial event. Calls task.trialEvent
 * @public
 */
jasmin.TaskManager.prototype.trialEventStart = function()
{
    // Get eventLog, if any
    var eventLog = this.eventManager.getEventLog();
    
    // Run a trial event
    var eventConfig = this.task.trialEvent( this.eventNow, eventLog );
    this.eventNext = eventConfig[ "next" ];
    
    // Determine what to do
    var self = this;
    switch( eventConfig[ "type" ] ) {
        // Set a timeout without a response            
        case( jasmin.TASK_TRIAL_NORESPONSE ):  
            this.eventManager.startEvent( 
                eventConfig[ "dur"  ],
                eventConfig[ "draw" ],
                function() {
                    self.trialEventDone();
                },
                {},
                this.event
            );
            break;
        // Set a timeout with a reponse
        case( jasmin.TASK_TRIAL_RESPONSE ):
            this.eventManager.startEvent( 
                eventConfig[ "dur"  ],
                eventConfig[ "draw" ],
                function() {
                    self.trialEventDone();
                },
                this.config[ "task_buttons" ][ "down" ],
                this.event
            );            
            break;               
        // Wait for key up            
        case( jasmin.TASK_TRIAL_RELEASE ):
            //alert( JSON.stringify( this.config ));
            this.eventManager.startEvent( 
                self.config[ "task" ][ "settings" ][ "release_timeout" ],
                eventConfig[ "draw" ],
                function() {
                    self.checkReleased();
                },
                this.config[ "task_buttons" ][ "up" ],
                "released_wait"
            );
            break;        
        // Show invalid feedback
        case( jasmin.TASK_TRIAL_INVALID ):
            this.showFeedbackSlide( 
                this.config[ "task" ][ "settings" ][ "invalid_button" ],
                eventConfig[ "draw" ]
            );
            break;                
        // Show "too slow" feedback
        case( jasmin.TASK_TRIAL_TOO_SLOW ):
            this.showFeedbackSlide( 
                this.config[ "task" ][ "settings" ][ "too_slow" ],
                eventConfig[ "draw" ]
            );
            break;
        // Next trial
        case( jasmin.TASK_TRIAL_NEXT ):
            this.state[ "trial" ]++;
            this.trialStart();
            break;
        // Repeat current trial
        case( jasmin.TASK_TRIAL_REPEAT ):
            this.trialStart();
            break;
    }
};

/**
 * Called once an event ends
 * @public
 */
jasmin.TaskManager.prototype.trialEventDone = function() {
    this.eventNow = this.eventNext;
    this.trialEventStart();
}

/**
 * Check if key has been released, if not show message
 * @public
 */
jasmin.TaskManager.prototype.checkReleased = function( eventLog ) {
    var eventLog = this.eventManager.getEventLog();
    var self = this;
    
    // Key released?
    if( eventLog[ "endReason" ] === "timeout" ) {
        // Not released; show message
        this.eventManager.startEvent( 
            -1,
            function() {
                $( self.config[ "slideshow" ][ "text_id" ] ).html( 
                    self.config[ "task" ][ "settings" ][ "release_buttons" ]
                );
                $( self.config[ "slideshow" ][ "container_id" ] ).show();
            },
            function() {
                $( self.config[ "slideshow" ][ "container_id" ] ).hide();
                self.trialEventDone();
            },
            this.config[ "task_buttons" ][ "up" ],
            "keyup_show"
        );        
    } else {
        // Released; next event
        self.trialEventDone();
    }
};


/**
 * Show a feedback text on invalid or timeout
 * @public
 */
jasmin.TaskManager.prototype.showFeedbackSlide = function( message, draw ) {
    // Not released; show message
    var self = this;
    this.eventManager.startEvent( 
        -1,
        function() {
            draw();
            $( self.config[ "slideshow" ][ "text_id" ] ).html( 
                message + "<br /><br />" + self.config[ "slideshow" ][ "button_texts" ][ "first" ]
            );
            $( self.config[ "slideshow" ][ "container_id" ] ).show();
        },
        function() {
            $( self.config[ "slideshow" ][ "container_id" ] ).hide();
            self.trialEventDone();
        },
        this.config[ "task_buttons" ][ "down" ],
        "feedback"
    );        
}
   
/**
 * Stops a task; call this function when, for instance, the window loses focus
 * @public
 */
jasmin.TaskManager.prototype.stop = function() {
    this.task.stop();
};

/**
 * Restarts a task (by restarting the current block); call this function after an interruption.
 * @public
 */
jasmin.TaskManager.prototype.restart = function() {
    this.blockSetup();
};

/**
 * Called when task is done
 * @public
 */
jasmin.TaskManager.prototype.done = function() {
};

