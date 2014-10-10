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
jasmin.TaskManager = function( task, config, target, onCompleted, report, state, setState )
{
    // Copy properties
    this.task        = task;
    this.config      = config;
    this.target      = target;    
    this.onCompleted = onCompleted;        
    this.report      = report === undefined? function() {} : report;
    this.state       = state;    
    this.setState    = setState === undefined? function() {} : setState;
    
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
jasmin.TaskManager.prototype.init = function() {
    
    /**
     * @property {HTMLElement} Div element containing ScalableCanvas, default filling the window
     */    
    this.container = $( "<div>" ).css( {
        "position"         : "absolute",
        "top"              : "0%",
        "left"             : "0%",
        "bottom"           : "0%",
        "right"            : "0%",
        "overflow"         : "hidden"
        //"background-color" : "#000000"
    } );
    
    /**
     * @property {ScalableCanvas} Containing task graphics. Default width:height ratio = 1:1.6
     */    
    this.canvas      = new jasmin.ScalableCanvas( 
        this.container,   // container div
        1.6,              // aspectRatio
        1000              // rescaleInterval
    );

    // Let task setup canvas (create & add sprites)
    this.task.setupCanvas( this.canvas ); 
};
