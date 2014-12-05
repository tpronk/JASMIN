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

/**
 * TaskEngine implements functions that are required for being managed by TaskManager.
 * TaskEngine and Taskmanager pressupose a standard task structure in which a series of blocks are 
 * administered, each of which (a) is introduced by a series of slides, and 
 * (b) contains a series of 0trials. The TaskConfig JSON string contains 
 * a configuration of TaskEngine, distinguishing between task, block, and
 * trial level configuration variables. 
 * blocks
 * @param {TaskSpritesJSON} sprites      Sprites for task graphics to be drawn with ScalableCanvas. See ScalableCanvas.addSprites and TaskSpritesJSON schema for details of the JSON representation
 * @param {Object}          binaries     Binaries such as images download in advance * 
 * @constructor
 */
jasmin.TaskEngine = function( spritesJSON, binaries ) {
    // Copy properties    
    this.spritesJSON  = spritesJSON;
    this.binaries     = binaries;
    
    /**
     * @property {Object} task-level config variables ("config_task" in TaskConfig)
     */
    this.configTask = undefined;
    /**
     * @property {Object} block-level config variables ("config_block" for current block in TaskConfig)
     */
    this.configBlock = undefined;
    /**
     * @property {Object} trial-level config variables (current element of "blocks" for current block in TaskConfig)
     */
    this.configTrial = undefined;
};

/**
 * Setup task; this function is called by TaskManager before the canvas started.
 * Add your sprites and perform any general task preparation here
 * @param {Object}         configTask task-level config variables
 * @param {ScalableCanvas} canvas     canvas to draw sprites on
 */
jasmin.TaskEngine.prototype.taskSetup = function( configTask, canvas ) {
    // Store properties
    this.configTask = configTask;
    this.canvas = canvas;
    
    // Convert SpritesJSON to Sprites and add to canvas
    this.sprites = canvas.spritesFromJSON( this.spritesJSON ); 
    this.canvas.addSprites( this.sprites );
    this.cleanup();
    
    // Add letters to button sprites and fix
    $( "#button_left_text"  ).html( "D" );
    $( "#button_right_text" ).html( "K" );
    
    // Setup fix and incorrect pics
    this.sprites[ "fix" ][ "node" ].append( 
        this.binaries[ "fix" ].css( {
            "width"  : "100%",
            "height" : "100%"
        } ) 
    );
    this.sprites[ "incorrect" ][ "node" ].append( 
        this.binaries[ "incorrect" ].css( {
            "width"  : "100%",
            "height" : "100%"
        } ) 
    );
};

/**
 * Get sprites of this task
 * @returns sprites
 */
jasmin.TaskEngine.prototype.getSprites = function() {
    return this.sprites;
};


/**
 * Setup current block; this function is called by TaskManager before the 
 * block introduction slides are shown. Prepare your block here and show any
 * sprites that you'd like to display alongside the intro slides.
 * @param {Object} configBlock block-level config variables
 */
jasmin.TaskEngine.prototype.blockSetup = function( configBlock ) {
    // Store properties
    this.configBlock = configBlock;
    
    // Show touch responses
    this.sprites[ "button_left"        ][ "node" ].show();
    this.sprites[ "button_right"       ][ "node" ].show();
};

/**
 * Setup current trial; this function is called by TaskManager before the 
 * trial is started. Here you can, for instance, setup your stimuli
 * @param {Object} configTrial trial-level config variables
 */
jasmin.TaskEngine.prototype.trialSetup = function( configTrial ) {
    // Store properties
    this.configTrial = configTrial;
    
    // Setup stimulus
    var stimulus = this.binaries[ this.configTrial[ "stim" ] ];
    this.sprites[ "stim" ][ "node" ].empty();
    this.sprites[ "stim" ][ "node" ].append( 
        stimulus.css( {
            "width"  : "100%",
            "height" : "100%"
        } )
    );
};

/**
 * Run one trial event; one timed part of a trial, such as "show fix" or
 * "wait for reponse"
 * @param {event}    Name of current event; first event in a trial should be named "start"
 * @param {eventLog} EventLog of previous event (if any) as obtained via EventManager.getEventLog()
 */
jasmin.TaskEngine.prototype.trialEvent = function( event, eventLog ) {
    var self = this;
    switch( event ) {
        // Start: show fix
        case "start" :
            // Setup event
            var duration = 500 + 500 * Math.random();
            return {
                "type" : jasmin.TASK_TRIAL_NORESPONSE, // Don't register any responses
                "draw" : function() {
                    self.sprites[ "fix" ][ "node" ].show();
                },
                "dur"  : duration,
                "next" : "stimulus"                    // Next event is stimulus
            };
            break;
        // stimulus: show stimulus and wait for reponse
        case "stimulus" :
            return {
                "type" : jasmin.TASK_TRIAL_RESPONSE,   // Do register a responses
                "draw" : function() {
                    self.sprites[ "fix"  ][ "node" ].hide();
                    self.sprites[ "stim" ][ "node" ].show();                    
                },
                "dur"  : this.configTask[ "response_window" ],
                "next" : "response"                    // Next event is stimulus
            };            
            break;
        // response: process response and show feedback
        case "response" :
            //alert( JSON.stringify( eventLog ) );
            var draw = function() {
                self.sprites[ "stim" ][ "node" ].hide();
            };
            // Too slow; show "too slow" slide and repeat trial
            if( eventLog[ "endReason" ] === "timeout" ) {
                return {
                    "type" : jasmin.TASK_TRIAL_TOO_SLOW,
                    "draw" : draw,
                    "next" : "start"                 
                };                   
            }
                
            // Invalid; show "invalid" slide and repeat
            if( eventLog[ "responseLabel" ] === undefined ) {
                return {
                    "type" : jasmin.TASK_TRIAL_INVALID,
                    "draw" : draw,                    
                    "next" : "start"                    
                };                   
            }             

            // Incorrect; show "red x", wait for key up, go to response
            if( eventLog[ "responseLabel" ] === "left" ) {
                return {
                    "type" : jasmin.TASK_TRIAL_RELEASE,
                    "draw" : draw,                    
                    "next" : "start"                    
                };                   
            }             
            
            // Correct; show "red x", wait for key up, go to next
            if( eventLog[ "responseLabel" ] === "right" ) {
                return {
                    "type" : jasmin.TASK_TRIAL_RELEASE,
                    "draw" : draw,                    
                    "next" : "next"     
                };                   
            }
            break;
        // Go to next trial
        case "next":
            return {
                "type" : jasmin.TASK_TRIAL_NEXT,
                "next" : "start"
            };
            break;
    }
};

/**
 * Hides all relevant sprites
  */
jasmin.TaskEngine.prototype.cleanup = function() {
    this.sprites[ "stim"         ][ "node" ].hide();
    this.sprites[ "instruction"  ][ "node" ].hide();    
    this.sprites[ "button_left"  ][ "node" ].hide();
    this.sprites[ "button_right" ][ "node" ].hide();
    this.sprites[ "fix"          ][ "node" ].hide();
    this.sprites[ "incorrect"    ][ "node" ].hide();    
};