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
if (jasmin === undefined) { var jasmin = function() {}; }

/**
 * EventManager creates a SyncTimer to time events and ResponseManager to
 * register responses in order to present events that can end on both a 
 * timeout and a response. Requires jQuery for keyboard and mouse handling (keydown,
 * keyup, mousedown, mouseup). Requires jQuery mobile for touch handing 
 * (vmousedown, vmouseup, touchstart, touchend)
 * @requires jQuery
 * @requires jQuery mobile
 * @requires ResponseManager
 * @requires SyncTimer
 * @param {Object} buttonsAll buttons used 
 * @constructor
 */
jasmin.EventManager = function() {
    this.responseManager = new jasmin.ResponseManager();
    this.syncTimer       = new jasmin.SyncTimer();
    this.callbackDone    = undefined;
};

// Reasons an event ended; values for EventManager.endReason
jasmin.EventManager.ENDREASON_TIMEOUT  = "timeout";  // Event ended because it timed out
jasmin.EventManager.ENDREASON_RESPONSE = "response"; // Event ended because a response was given
jasmin.EventManager.ENDREASON_CANCEL   = "cancel";   // Event ended because it was canceled (task stopped?)

/**
 * Start synchronizing with clock and attach buttons
 * @param {Function} buttonDefinitions Buttons to attach. See ResponseManager.attach()
 * @param {Function} callbackSynced    Called when synced. See SyncTimer.sync()
 */
jasmin.EventManager.prototype.start = function(buttonDefinitions,callbackSynced) {
    this.responseManager.attach(buttonDefinitions);
    this.syncTimer.sync(function() {
        callbackSynced();
    });
};

/**
 * Stop synchronizing with clock and detach buttons
 * @param {Function} callbackSynced Called when synced
 */
jasmin.EventManager.prototype.stop = function() {
    this.responseManager.detach();
    this.syncTimer.unsync();
};

/**
 * Start an event that can end on a timeout or a response
 * @param {int}      timeout          Number of ms until callbackDone is called, use multiples of 16 for best results (since most screens have a 60hz refresh rate). If -1 then never timeout, so the event lasts forever.
 * @param {Function} callbackDraw     Callback called when timeout starts (immediately if we handling a synchronous callback, at next refresh if not)
 * @param {Function} callbackDone     Callback called on timeout
 * @param {Array}    buttonsActive    Array with buttons active this event
 * @param {bool}     resetRt          If true, sets start time of RT measurement on timeShown of this event, else use earlier start time. Default = true.
 * @param {String}   name             Name of this timeout for logging. Default = noname
 */
jasmin.EventManager.prototype.startEvent = function(timeout, callbackDraw, callbackDone, buttonsActive, resetRt, name) {
    // Clear logging vars
    this.clearLoggingVars();

    // Copy arguments
    this.timeout         = timeout;
    this.callbackDraw    = callbackDraw;
    this.callbackDone    = callbackDone;
    this.buttonsActive   = buttonsActive;
    this.resetRt         = resetRt !== undefined? resetRt: true;
    this.name            = name !== undefined? name: "noname";

    var self = this;
    this.responseManager.activate(
        buttonsActive,  
        function() {
            self.endEvent(jasmin.EventManager.ENDREASON_RESPONSE);
        },
        this.name
   );

    this.syncTimer.setTimeout(
        timeout, 
        function() {
            self.callbackDraw();
        },
        function() {
            self.endEvent(jasmin.EventManager.ENDREASON_TIMEOUT);
        },
        this.name 
   );
};

/**
 * endEvent called on timeout or response
 * @param {string} endReason Why the event ended: timeout, response, or cancel
 * @private
 */
jasmin.EventManager.prototype.endEvent = function(endReason) {
    // Don't register responses anumore
    this.responseManager.deactivate();
    
    // Cancel timeout if event not ended by timeout
    if (endReason !== jasmin.EventManager.ENDREASON_TIMEOUT) {
        this.syncTimer.cancelTimeout();
    }
    
    // Set rt start time
    if (this.resetRt) {
        if (this.syncTimer.shown === false) {
            // Special case; nothing shown yet -> rtStartTime is now (rt=0)
            this.timeRtStart = window.performance.now();
        } else {
            // Otherwise, calculate relative to timeShown
            this.timeRtStart = this.syncTimer.timeShown;
        }
    }
    
    // Get response data on response
    if (endReason === jasmin.EventManager.ENDREASON_RESPONSE) {
        var responseLog = this.responseManager.getResponseLog();
        this.rt = responseLog[ "time" ] - this.syncTimer.timeShown;
        this.responseLabel = responseLog[ "label" ];
        this.responseId = responseLog[ "id" ];
        this.responseModality = responseLog[ "modality" ];
    }
    
    this.endReason = endReason;

    // Store logging vars
    this.updateEventLog();
    
    // If endReason for endEvent is not "cancel", call callbackDone
    if (endReason !== jasmin.EventManager.ENDREASON_CANCEL) {
        this.callbackDone();
    }
};
    
/**
 * cancelEvent cancels event, responseManager is deactived and syncTimer timeout
 * is canceled; callbackDone is not called
 * @public
 */
jasmin.EventManager.prototype.cancelEvent = function() {
    this.endEvent(jasmin.EventManager.ENDREASON_CANCEL);
};

/**
 * Store all logging vars in responseLog
 * @private
 */
jasmin.EventManager.prototype.updateEventLog = function() {
    this.eventLog = {
        "name" : this.name,
        "rt" : this.rt,
        "endReason" : this.endReason,
        "responseLabel" : this.responseLabel,
        "modality" : this.responseModality,
        "id"            : this.responseId
    };
};

/**
 * Get past eventLog; the eventLog is ready when callbackDone is being called.
 * See logging vars for an overview of values stored in eventLog
 * in eventLog
 * @returns (Object) Associative array with eventLog variables
 * @public
 */
jasmin.EventManager.prototype.getEventLog = function() {
    return(this.eventLog);
};

// Clear logging vars
jasmin.EventManager.prototype.clearLoggingVars = function() {
    /**
     * Logging var: Name of this event
     * @instance
     */
    this.name = undefined;
    /**
     * Logging var: Time between syncTimer.timeShown and responseManager.time (if any response was given this event)
     * @instance
     */
    this.rt = undefined;
    /**
     * Logging var: Reason that this event stopped. "response" = because of a (critical) response, "timeout" because of timeout, "cancel" event was canceled via cancelEvent
     * @instance
     */
    this.endReason = undefined;    
    
    /**
     * Logging var: If this event was ended by a response, the label of this response
     * @instance
     */
    this.responseLabel = undefined;    
    
    /**
     * Logging var: If this event was ended by a response, the ID of this response
     * @instance
     */
    this.responseId = undefined;        
    
    /**
     * Logging var: If this event was ended by a response, the modality of this response (keydown, touchstart, etc.)
     * @instance
     */
    this.responseModality = undefined;            
};
