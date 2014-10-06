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
 * EventManager creates a SyncTimer to time events and ResponseManager to
 * register responses in order to present events that can end on both a 
 * timeout and a response. Requires jQuery for keyboard and mouse handling (keydown,
 * keyup, mousedown, mouseup). Requires jQuery mobile for touch handing 
 * (vmousedown, vmouseup, touchstart, touchend)
 * @requires jQuery
 * @requires jQuery mobile
 * @requires ResponseManager
 * @requires SyncTimer
 * @constructor
 * @param {Window} window Window to manage responses of
 */
function EventManager( window )
{
    this.responseManager = new ResponseManager( window );
    this.syncTimer       = new SyncTimer();
    
    this.callbackDone = undefined;
};

/**
 * Start synchronizing with clock; wrapper for SyncTimer.sync
 * @param {Function} callbackSynced Called when synced
 */
EventManager.prototype.sync = function( callbackSynced )
{
    this.syncTimer.sync( function() {
        callbackSynced();
    } );
};


/**
 * Start an event that can end on a timeout or a response
 * @param {int}      timeout          Number of ms until callbackDone is called, use multiples of 16 for best results (since most screens have a 60hz refresh rate). If -1 then never tmieout
 * @param {Function} callbackDraw     Callback called when timeout starts (immediately if we handling a synchronous callback, at next refresh if not)
 * @param {Function} callbackDone     Callback called on timeout
 * @param {Object}   activeResponses  An associative array defining responses that stop the event (if any). See <a href="../source/jasmin_demos/demo_choose.html">these demos </a> for examples.
 * @param {String}   name             Name of this timeout for logging. Default = noname
 */
EventManager.prototype.startEvent = function( timeout, callbackDraw, callbackDone, activeResponses, name ) {
    // Clear logging vars
    this.clearLoggingVars();

    // Copy arguments
    this.timeout         = timeout;
    this.callbackDraw    = callbackDraw;
    this.callbackDone    = callbackDone;
    this.activeResponses = activeResponses;
    this.name            = name === undefined? "noname" : name;
    
    var self = this;
    this.responseManager.activate( 
        activeResponses,  
        function() {
            self.endEvent( "response" );
        },
        this.name
    );

    this.syncTimer.setTimeout( 
        timeout, 
        function() {
            self.callbackDraw();
        },
        function() {
            self.endEvent( "timeout" );
        },
        this.name 
    );
};

/**
 * endEvent called on timeout or response
 * @param (string) endReason Why the event ended: timeout, response, or cancel
 * @private
 */
EventManager.prototype.endEvent = function( endReason ) {
    // Don't register responses anumore
    this.responseManager.deactivate();
    
    // Cancel timeout if event not ended by timeout
    if( endReason !== "timeout" ) {
        this.syncTimer.cancelTimeout();
    }
    
    // Calculate rt on response
    if( endReason === "response" ) {
        this.rt = this.responseManager.time - this.syncTimer.timeShown;
    }
    
    this.endReason = endReason;

    // Store logging vars
    this.updateEventLog();
    
    // If endReason for endEvent is not "cancel", call callbackDone
    if( endReason !== "cancel" ) {
        this.callbackDone();
    }
};
    
/**
 * cancelEvent cancels event, responseManager is deactived and syncTimer timeout
 * is canceled; callbackDone is not called
 * @public
 */
EventManager.prototype.cancelEvent = function() {
    this.endEvent( "cancel" );
};



/**
 * Store all logging vars in responseLog
 * @private
 */
EventManager.prototype.updateEventLog = function() {
    this.eventLog = {
        "name"      : this.name,
        "rt"        : this.rt,
        "endReason" : this.endReason
    };
};

/**
 * Get previous responseLog
 * @private
 */
EventManager.prototype.getEventLog = function() {
    return( this.eventLog );
};

// Clear logging vars
EventManager.prototype.clearLoggingVars = function() {
    /**
     * Name of this event
     * @instance
     */
    this.name = undefined;
    /**
     * Time between SyncTimer.timeShown and responseManager.time (if any response was given this event)
     * @instance
     */
    this.rt = undefined;
    /**
     * Reason that this event stopped. "response" = because of a (critical) response, "timeout" because of timeout, "cancel" event was canceled via cancelEvent
     * @instance
     */
    this.endReason = undefined;    
};