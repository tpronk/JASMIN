// Copyright 2014, Thomas Pronk
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License. 

/**
 * TaskEngine implements methods required for management by TaskManager
  * @constructor
 */
TaskEngine = function() {};

/**
 * Called before the first block is set up.
 * Setup task generic aspects over here (such as "left key means yes")
 * @param {Object} configTask task-level variables
 */
TaskEngine.prototype.taskSetup = function(configTask) {
    DEBUG && console.log("TaskEngine.prototype.taskSetup, received this configTask:");
    DEBUG && console.log(configTask);
};

/**
 * Called before block is introduced.
 * Setup block generic aspects over here (such as "no feedback for this block")
 * @param {Object} configBlock block-level variables
 */
TaskEngine.prototype.blockSetup = function(configBlock) {
    DEBUG && console.log("TaskEngine.prototype.blockSetup, received this configBlock:");
    DEBUG && console.log(configBlock);
    $("#button_left").css({"background-color":configBlock["button_color"]});
    $("#button_right").css({"background-color":configBlock["button_color"]});
};

/**
 * Called before trial is started.
 * Setup trial generic aspects over here (such as current target stimulus)
 * @param {Object} configTrial trial-level variables
 */
TaskEngine.prototype.trialSetup = function(configTrial) {
    DEBUG && console.log("TaskEngine.prototype.trialSetup, received this configTrial:");
    DEBUG && console.log(configTrial);
    this.question = configTrial["question"];
    this.answer   = configTrial["answer"];
};

/**
 * Called before trial is started.
 * Setup trial generic aspects over here (such as current target stimulus)
 * @param {String} eventName Name of current event. The first event should have eventName "start"
 * @param {Object} eventLog  Log of previous event as provided by EventManager
 * @returns {Object} eventConfig that tells TaskManager what to do during this trialEvent
 */
TaskEngine.prototype.trialEvent = function(eventName, eventLog) {
    DEBUG && console.log("TaskEngine.prototype.trialEvent, eventName: " + eventName + ", eventLog:");
    DEBUG && console.log(eventLog);
    
    // Config for next event
    var eventConfig;
    // Decide what to do this event
    var self = this;
    switch (eventName) {
        // First event
        case "start":
            eventConfig = {
                "type" : jasmin.TaskManager.EVENT_RESPONSE, 
                "dur" : 2000,
                "draw" : function() {
                    $("#text_container").html(self.question);
                    $("#text_container").show();
                },
                "next" : "feedback"
            };
            break;
        // Feedback event
        case "feedback":
            // Show feedback based on tooslow, invalid, incorrect or correct

            // If too slow
            if(eventLog["endReason"] === jasmin.EventManager.ENDREASON_TIMEOUT) {
                eventConfig = {
                    "type" : jasmin.TaskManager.EVENT_TOOSLOW
                };
            // If invalid
            } else if(eventLog["responseLabel"] === "invalid_key") {
                eventConfig = {
                    "type" : jasmin.TaskManager.EVENT_INVALID
                };
            // If incorrect
            } else if(eventLog["responseLabel"] !== this.answer) {
                eventConfig = {
                    "type" : jasmin.TaskManager.EVENT_INCORRECT
                };
            } else {
            // If correct            
                eventConfig = {
                    "type" : jasmin.TaskManager.EVENT_CORRECT
                };
            }
            eventConfig["next"] = "done";
            eventConfig["draw"] = function() {};
            break;            
        // Feedback event
        case "done":
            eventConfig = {
                // Type of event, see TaskManager.EVENT constants
                "type" : jasmin.TaskManager.EVENT_NEXT
            };
            break;               
    }
        
    DEBUG && console.log("TaskEngine.prototype.trialEvent, eventConfig:");
    DEBUG && console.log(eventConfig);
    return eventConfig;
};

/**
 * Called once a task is done
 * Remove any graphics or do other cleaning up activities over here
 */
TaskEngine.prototype.taskDone = function() {
    DEBUG && console.log("TaskEngine.prototype.taskDone");
    $("#button_left").hide();
    $("#button_right").hide();
    $("#text_container").hide();
};

/**
 * Called to hide previous/next buttons for slideshow
 */
TaskEngine.prototype.slideshowButtonsHide = function() {
    DEBUG && console.log("TaskEngine.prototype.slideshowButtonsHide");
    $("#button_left").hide();
    $("#button_right").hide();
};

/**
 * Called to show previous/next buttons for slideshow
 */
TaskEngine.prototype.slideshowButtonsShow = function() {
    DEBUG && console.log("TaskEngine.prototype.slideshowButtonsShow");
    $("#button_left").show();
    $("#button_right").show();    
};

/**
 * Called to hide slideshow
 */
TaskEngine.prototype.slideshowHide = function() {
    DEBUG && console.log("TaskEngine.prototype.slideshowHide");
    $("#text_container").hide();
};

/**
 * Called to hide trial sprites and show slidehow
 */
TaskEngine.prototype.slideshowShow = function() {
    DEBUG && console.log("TaskEngine.prototype.slideshowShow");
    $("#text_container").show();
};