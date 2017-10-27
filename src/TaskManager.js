//
//
////Copyright 2014, Thomas Pronk
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
/**
 * TaskManager manages simple tasks.
 * @param {TaskEngine}   task         The TaskEngine instance managed by this TaskManager instance, see TaskEngine API for the function a TestEngine needs to implement
 * @param {TaskConfig}   config       An associative array containing task configuration, see schema for a desription of TaskConfig structure
 * @param {Function}     onCompleted  Called when TaskEngine has completed
 * @param {Translator}   translator   (optional) A Translator instance used to translate texts.
 * @param {Translator}   eventManager (optional) An EventManager used for timing and response registering
 * @param {Object}       state        (optional) Current task state. If undefined, task state is intialized to beginning of task
 * @param {Function}     setState     (optional) Called to store task state. Called with one argument, being task state to store.
 * @constructor
 */
jasmin.TaskManager = function( task, config, onCompleted, translator, eventManager, state, setState )
{
    // Copy properties
    this.task         = task;
    this.config       = config;
    this.onCompleted  = onCompleted;        
    this.translator   = translator;
    this.eventManager = eventManager;
    
    this.eventManager = eventManager !== undefined? eventManager: new jasmin.EventManager();
    this.translator = translator !== undefined? translator: new jasmin.Translator();
    
    /**
     * @property {Object} this.logger An instance of jasmin.TableLogger for logging, constructed with the value of this.config[ "logging" ] as columns argument
     */
    this.logger = new jasmin.TableLogger( this.config[ "logging" ] );

    /**
     * @property {Object} this.state Persistent state of the task (which can periodically be saved via calls to setState) 
     */
    this.state        = state;        
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
             * @property {Object} Task results
             */                  
            "results"   : [],
            /**
             * @property {int} Number of times a block has been attempted
             */                  
            "block_attempt" : 0,
            /**
             * @property {int} Number of correct responses this block
             */                  
            "block_correct" : 0,
            /**
             * @property {int} Number of trials in a block
             */                  
            "block_trial_count" : 0,
            /**
             * @property {int} Number of trials in task
             */                  
            "task_trial_count" : 0,
            /**
             * @property {int} Current trial in task
             */                  
            "task_trial" : 0
        };
    }
    this.setState     = setState === undefined? function() {} : setState;
};

// Task Response types
jasmin.TaskManager.RESPONSE_NONE      = 0; // No response yet
jasmin.TaskManager.RESPONSE_CORRECT   = 1; // Correct response
jasmin.TaskManager.RESPONSE_INCORRECT = 2; // Incorrect response
jasmin.TaskManager.RESPONSE_TIMEOUT   = 3; // Too late response
jasmin.TaskManager.RESPONSE_INVALID   = 4; // Invalid key response
jasmin.TaskManager.RESPONSE_VALID     = 5; // Valid response

// Task Trial Event types
jasmin.TaskManager.EVENT_RESPONSE     = "response"; // Set a timeout with a reponse
jasmin.TaskManager.EVENT_NORESPONSE   = "noresponse"; // Set a timeout without a response
jasmin.TaskManager.EVENT_CORRECT      = "correct"; // Show incorrect feedback
jasmin.TaskManager.EVENT_INCORRECT    = "incorrect"; // Show incorrect feedback
jasmin.TaskManager.EVENT_INVALID      = "invalid"; // Show invalid feedback
jasmin.TaskManager.EVENT_TOOSLOW      = "tooslow"; // Show tooslow feedback
jasmin.TaskManager.EVENT_NEXT         = "next"; // Immediately go to next event
jasmin.TaskManager.EVENT_RELEASE      = "release"; // Wait for key up
jasmin.TaskManager.EVENT_TRIAL_NEXT   = "trial_next"; // Next trial
jasmin.TaskManager.EVENT_TRIAL_REPEAT = "trial_repeat"; // Repeat trial


/**
 * Initializes the task by calling Task.taskSetup (which receives taskConfig["task_vars"]
 * and creating a slideshow (configured via taskConfig["slideshow"]
 * @public
 */
jasmin.TaskManager.prototype.start = function() {
   // Setup task
   this.configTask = this.config[ "task_vars" ];
   this.task.taskSetup( this.configTask, this.canvas ); 

   // Calculate total number of trials
   for (var i in this.config["blocks"]) {
      this.state["task_trial_count"] += this.config["blocks"][i]["trials"].length;
   }
   console.log(this.state);
   
   /**
    * @property {Slideshow} For block introduction slides
    */  
   var self = this;
   this.slideshow = new jasmin.Slideshow(
      $( this.config[ "slideshow" ][ "slide_id" ] ),
      this.eventManager,
      this.config[ "slideshow" ][ "buttons" ],
      this.config[ "slideshow" ][ "button_delay" ],
      function() {
          self.task.slideshowButtonsHide();
      }, 
      function() {
          self.task.slideshowButtonsShow();
      },
      this.translator
   );

   var self = this;
   this.eventManager.start(
      this.config["button_definitions"],
      function() {
          self.blockSetup();
      }
   );
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
    this.specsBlock  = this.config[ "blocks" ][ this.state[ "block" ] ];
    this.configBlock = this.specsBlock[ "block_vars" ];
    
    // Trial repetitions 
    if( this.specsBlock[ "trial_rep" ] !== undefined ) {
        var sourceTrials = this.specsBlock[ "trials" ];
        this.specsBlock[ "trials" ] = [];
        var rep_i, trial_i;
        for( trial_i = 0; trial_i < sourceTrials.length; trial_i++ ) {
            for( rep_i = 0; rep_i < this.specsBlock[ "trial_rep" ]; rep_i++ ) {
                this.specsBlock[ "trials" ].push(
                    sourceTrials[ trial_i ]
                );
            }
        }
    }
    
    // Trial randomization
    if( this.specsBlock[ "randomize" ] ) {
        this.specsBlock[ "trials" ] = jasmin.Statistics.fisherYates( this.specsBlock[ "trials" ] );
    }
    
    // No. of trials in block
    this.state["block_trial_count"] = this.specsBlock[ "trials" ].length;
    
    this.task.blockSetup( this.configBlock );
    this.blockIntroduce();
};

/**
 * Show introduction slides of current block, then start next trial of block.
 * Adds two callbacks to translator: block_counter -> index of current block
 * starting at 1, block_total -> total number of blocks
 * @public
 */
jasmin.TaskManager.prototype.blockIntroduce = function() {
    var self = this;
    
    // Add translation callbacks for block counters
    this.translator.setCallback( "block_counter", function() { return self.state[ "block" ] + 1; } );
    this.translator.setCallback( "block_total",   function() { return self[ "config" ][ "blocks" ].length; } );
 
   // Show intro slides
    this.task.slideshowShow();
    this.slideshow.show( 
        this.specsBlock[ "intro_slides" ],
        function() {
            self.task.slideshowHide();
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
   if (this.configBlock["min_correct"] === undefined || this.state["trial"] === 0 ||
         (
            this.state["block_correct"] / this.state["trial"] >= this.configBlock["min_correct"] &&
            (this.configBlock["max_attempts"] === undefined || this.state["block_attempt"] < this.configBlock["max_attempts"])
         )
   ) {
      this.state[ "block_attempt" ] = 0;
      this.state[ "block" ]++;
   } else {
      this.state[ "block_attempt" ]++;
   }
   this.state[ "block_correct" ] = 0;   
   this.state[ "trial"] = 0;
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
        this.state[ "attempt" ] = 0;
        this.trial       = this.state[ "trial" ];
        this.configTrial = this.specsBlock[ "trials" ][ this.trial ];
        this.task.trialSetup( this.configTrial, this.state );
        
        // *** Go to event "start"
        this.eventNow = "start";
        this.trialEventStart();
    }
};

/**
 * Run a single trial event. Calls task.trialEvent
 * @public
 */
jasmin.TaskManager.prototype.trialEventStart = function( feedbackLog )
{
    // Get eventLog, if any
    var eventLog = this.eventManager.getEventLog();

    // Run a trial event
    var eventConfig = this.task.trialEvent( this.eventNow, eventLog, feedbackLog, this.state, this.eventManager.responseManager.getResponseLog() );
    this.eventNext = eventConfig[ "next" ];
    
    // Log trial?
    if( eventConfig[ "log" ] !== undefined ) {
        // Collect all parameters to log, then send to logger and store in state
        var logRow = this.collectLogs( eventConfig[ "log" ] );
        this.logger.log( logRow );
        this.state[ "results" ].push( logRow );
    }
    
    // Log a correct response?
    if (eventConfig["response"] === jasmin.TaskManager.RESPONSE_CORRECT && this.state["attempt"] === 0) {
       this.state["block_correct"]++;
    }
    
    // If retry, increase attempt
    if( eventConfig[ "retry" ] ) {
        this.state[ "attempt" ]++;
    }
    
    // Setup buttontext
    var buttons = this.configBlock[ "button_instruction" ] === undefined? "": " " + this.configBlock[ "button_instruction" ];

    // Determine what to do
    var self = this;
    switch( eventConfig[ "type" ] ) {
        // Set a timeout without a response            
        case( jasmin.TaskManager.EVENT_NORESPONSE ):  
            this.eventManager.startEvent( 
                eventConfig[ "dur"  ],
                eventConfig[ "draw" ],
                function() {
                    self.trialEventDone();
                },
                [],
                eventConfig["resetRT"],
                eventConfig["name"],
                eventConfig["callbackEvent"]
            );
            break;
        // Set a timeout with a response
        case( jasmin.TaskManager.EVENT_RESPONSE ):
            // "down" buttons by default
            var buttons = eventConfig[ "buttons" ] !== undefined? eventConfig[ "buttons" ]: "down";
            this.eventManager.startEvent( 
                eventConfig[ "dur"  ],
                eventConfig[ "draw" ],
                function() {
                    self.trialEventDone();
                },
                this.config[ "task_buttons" ][ buttons ],
                eventConfig["resetRT"],
                eventConfig["name"],
                eventConfig["callbackEvent"]
            );            
            break;               
        // Wait for key up            
        case( jasmin.TaskManager.EVENT_RELEASE ):
            //alert( JSON.stringify( this.config ));
            this.checkReleasedSilent( 
                function() {
                    self.trialEventDone();
                },
                eventConfig[ "draw" ]
            );
            break;        
        // Show "too slow" feedback
        case( jasmin.TaskManager.EVENT_TOOSLOW ):
            self.showFeedbackSlide( 
                this.translator.translate( self.config[ "feedback" ][ "tooslow" ] ),
                eventConfig[ "draw" ],
                false
            );     
            break;            
        // Show invalid feedback
        case( jasmin.TaskManager.EVENT_INVALID ):
            self.showFeedbackSlide( 
                this.translator.translate( self.config[ "feedback" ][ "invalid" ] ),
                eventConfig[ "draw" ],
                true,
                eventConfig["released"]
            );            
            break;                
        // Show "incorrect" feedback
        case( jasmin.TaskManager.EVENT_INCORRECT ):
            self.showFeedbackSlide( 
                this.translator.translate( self.config[ "feedback" ][ "incorrect" ] ),
                eventConfig[ "draw" ],
                true,
                eventConfig["released"]
            );            
            break;            
        // Show "correct" feedback
        case( jasmin.TaskManager.EVENT_CORRECT ):
            self.showFeedbackSlide( 
                this.translator.translate( self.config[ "feedback" ][ "correct" ] ),
                eventConfig[ "draw" ],
                true,
                eventConfig["released"]
            );
            break;      
        // Immediately go to next event
        case( jasmin.TaskManager.EVENT_NEXT ):
            self.trialEventDone();
            break;              
        // Next trial
        case( jasmin.TaskManager.EVENT_TRIAL_NEXT ):
            this.state[ "trial" ]++;
            this.state[ "task_trial" ]++;
            this.trialStart();
            break;
        // Repeat current trial
        case( jasmin.TaskManager.EVENT_TRIAL_REPEAT ):
            this.trialStart();
            break;
        // Default: give a warning
        default:
            console.log( "TaskManager.trialEventStart, unrecognized eventType in eventConfig:");
            console.log( eventConfig );
    }
};

/**
 * Called once an event ends
 * @public
 */
jasmin.TaskManager.prototype.trialEventDone = function( feedbackLog ) {
    this.eventNow = this.eventNext;
    this.trialEventStart( feedbackLog );
};


/**
 * Check if key has been released, but no message yet
 * @public
 */
jasmin.TaskManager.prototype.checkReleasedSilent = function( afterRelease, draw ) {
    this.afterRelease = afterRelease;
    var self = this;
    this.eventManager.startEvent( 
        self.config[ "task_buttons" ][ "release_timeout" ],
        draw,
        function(eventLog) {
            self.checkReleasedMessage(eventLog, afterRelease)
        },
        this.config[ "task_buttons" ][ "up" ],
        "released_silent"
    );    
};

/**
 * Check if key has been released, if not show message
 * @public
 */
jasmin.TaskManager.prototype.checkReleasedMessage = function( eventLog, afterRelease ) {
    var eventLog = this.eventManager.getEventLog();
    var self = this;
    
    // Key released?
    if( eventLog[ "endReason" ] === jasmin.EventManager.ENDREASON_TIMEOUT ) {
        // Not released; show message
        this.eventManager.startEvent( 
            -1,
            function() {
                $( self.config[ "slideshow" ][ "slide_id" ] ).html( 
                    self.translator.translate( self.config[ "feedback" ][ "release" ] )
                );
                self.task.slideshowShow();
            },
            function() {
                afterRelease();
            },
            this.config[ "task_buttons" ][ "up" ],
            "released_message"
        );        
    } else {
        // Released; next event
        afterRelease();
    }
};


/**
 * Show a feedback text, wait or key up
 * @public1
 */
jasmin.TaskManager.prototype.showFeedbackSlide = function( message, draw, waitForUp, released ) {
    // Provided draw and display of feedback slide
    var self = this;    
    var drawCallback = function() {
        draw();
        $( self.config[ "slideshow" ][ "slide_id" ] ).html( 
            self.translator.translate( message )
        );
        self.task.slideshowShow();
    };
    
    waitForUp = waitForUp !== undefined? waitForUp: true;
    
    // Go to shown if we don't need to wait for up first
    if( !waitForUp ) {
        this.shownFeedbackSlide(drawCallback);
    // Go to shown after next up        
    } else {
        this.eventManager.startEvent( 
            1000,
            drawCallback,
            function(eventLog) {
                self.checkReleasedMessage(
                    eventLog,
                    function() {
                        self.shownFeedbackSlide(drawCallback);
                        released();
                        //self.task.slideshowHide();
                    }
                );            
            },
            this.config[ "task_buttons" ][ "up" ],
            "feedback"
        );      
    }
};

/**
 * Show a feedback text on invalid or timeout
 * @param {Function} drawCallback draw callback called before showing slideshow
 * @public
 */
jasmin.TaskManager.prototype.shownFeedbackSlide = function(drawCallback) {
    var self = this;
    this.eventManager.startEvent( 
        -1,
        drawCallback,
        function(eventLog) {
            // Store event log of feedback slide, passed to trialEvent
            var feedbackLog = self.eventManager.getEventLog();
            self.checkReleasedSilent(
                function() {
                    self.trialEventDone( feedbackLog );
                },
                function() {
                    self.task.slideshowHide();
                }
            );            
        },
        this.config[ "task_buttons" ][ "down" ],
        "feedback"
    );     
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
    this.eventManager.stop();
    this.task.taskDone();
    this.onCompleted();
};

/**
 * Collect variables to log from configTask, configBlock, configTrial and evenLog
 * @public
 */
jasmin.TaskManager.prototype.collectLogs = function( eventLog ) {
    // Result are all the key-value pairs to log for this row
    var result = {};
        
    // haystacks contains all places to search for log keys
    var haystacks = [];
    haystacks.push( this.configTask  );
    haystacks.push( this.configBlock );
    haystacks.push( this.configTrial );
    haystacks.push( this.state );
    haystacks.push( eventLog );
    
    // Fill result with each key found in log
    var haystack, key, i, j, found;
    for( i in this.config[ "logging" ] ) {
        key = this.config[ "logging" ][i];
        found = false;
        j = 0;
        while( !found && j < haystacks.length ) {
            haystack = haystacks[j];
            if( haystack[ key ] !== undefined ) {
                found = true;
                result[ key ] = haystack[ key ];
            }
            j++;
        }
        if( !found ) {
            result[ key ] = "NA";
        }
    }
    return( result );
};

/*
 * Convert picture URLs to Loader requests
 * @public
 */
jasmin.TaskManager.pictureUrlsToRequests = function( pictures, baseUrl ) {
    var requests = {};
    baseUrl = baseUrl === undefined? "": baseUrl;
    for( var p in pictures ) {
        requests[ p ] = [ "img", baseUrl + pictures[p] ];
    }
    return requests;
};