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

// requestAnimationFrame polyfill by Erik M�ller
// fixes from Paul Irish and Tino Zijdel
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function( callback ) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
// end of requestAnimationFrame polyfill by Erik M�ller

/**
 * State jasmin.SYNC_TIMER_NOT_SYNCED if not synchronized yet [call sync()]
 */
jasmin.SYNC_TIMER_NOT_SYNCED = 0;
/**
 * State jasmin.SYNC_TIMER_WAITING if no timeout is running, 
 */
jasmin.SYNC_TIMER_WAITING    = 1;
/**
 * State jasmin.SYNC_TIMER_REQUESTED if a timeout has been requested (but we haven't drawn yet
 */
jasmin.SYNC_TIMER_REQUESTED  = 2;
/**
 * State jasmin.SYNC_TIMER_DRAWN when stimuli have been drawn
 */
jasmin.SYNC_TIMER_DRAWN      = 3;
/**
 * State jasmin.SYNC_TIMER_DRAWN when stimuli have been shown (actual timeout starts here)
 */
jasmin.SYNC_TIMER_SHOWN      = 4;

/**
 * This timer synchronizes to requesAnimationFrame so that all callbacks are
 * performed right after a refresh took place. When setting a timeout it 
 * atempts to predict which refresh will take place nearest to the timeout.
 * @param {function} report Reporting function for reporting timing info
 * @constructor
 */
jasmin.SyncTimer = function() {
    // Save report
    this.report = report === undefined? function() {}: report;
    
    // state: Not synced at start
    this.state = jasmin.SYNC_TIMER_NOT_SYNCED;
    
    // Set to true if we are handling a synchronized callback (a function being
    // executed via requiresAnimationFrame
    this.synchronousCallback = false;
};

// Clears logging vars; not used anymore
jasmin.SyncTimer.prototype.clearLoggingVars = function() {
    /**
     * Logging var: when a timeout was requested 
     * @instance
     */
    this.timeRequested = undefined; 
    /**
     * Logging var: when graphics were drawn
     * @instance
     */
    this.timeDrawn     = undefined; 
    /**
     * Logging var: when graphics were shown; here the timeout actually starts
     * @instance
     */
    this.timeShown     = undefined;
    /**
     * Logging var: when event was stopped
     * @instance
     */
    this.timeStopped   = undefined; 
    /**
     * Logging var: whether timeout was canceled (true/false)
     * @instance
     */
    this.canceled      = undefined; 
};

/**
 * Start synchronizing with clock; ready when two refreshes have taken place
 * @@param {Function} callbackSynced Called when synced
 */
jasmin.SyncTimer.prototype.sync = function( callbackSynced ) {
    this.callbackDone = callbackSynced;
    
    var self = this;
    window.requestAnimationFrame( function() {
        self.refreshFirst();
    } );
};

/**
 * Called first refresh (when framePrev is not yet defined)
 * @private
 */
jasmin.SyncTimer.prototype.refreshFirst = function() {
    // First refresh; store current time
    this.frameNow = window.performance.now();
    
    // Next refresh we are ready, then go to conventional refresh with timeToErase === now
    // immediately call callback
    var self = this;
    window.requestAnimationFrame( function() {
        self.name        = "sync";
        self.state       = jasmin.SYNC_TIMER_SHOWN;
        self.timeToErase = window.performance.now();
        self.refresh();
    } );
};

/**
 * Called every refresh; calculate frame duration and check for timeouts
 * @private
 */
jasmin.SyncTimer.prototype.refresh = function()  {
    // Store previous refresh time
    this.framePrev = this.frameNow; 
    // Get current
    this.frameNow  = window.performance.now();
    // Duration of last frame
    this.frameDur = this.frameNow - this.framePrev;

    // Check whether we should do anything
    switch( this.state )
    {
        // A draw was requested; draw
        case jasmin.SYNC_TIMER_REQUESTED:
            this.callbackDraw();
            this.timeDrawnNew = window.performance.now();
            this.state = jasmin.SYNC_TIMER_DRAWN;
            break;
        // Stimuli were drawn; show
        case jasmin.SYNC_TIMER_DRAWN:
            // timeShown of new event
            this.timeShownNew = window.performance.now();
            // calculate difference between current and new show times -> realized
            this.realized    = this.timeShownNew - this.timeShown;
            
            // Create a log of all the times etc.
            this.updateTimeoutLog ();
        
            // Update timeRequested, timeShown, timeDrawn, and timeout
            this.timeRequested = this.timeRequestedNew;
            this.timeDrawn     = this.timeDrawnNew;
            this.timeShown     = this.timeShownNew;
            this.timeout       = this.timeoutNew;
            this.name          = this.nameNew;
            if( this.timeout !== -1 )
            {
                this.timeToErase  = this.timeShown + this.timeout;
            }
            this.state = jasmin.SYNC_TIMER_SHOWN;
            // Note no break, after show we immediately go check for timeouts
            // So if your timeout = 1, the callback may be called immediately
            // instead of next refresh.
        // Stimuli are being shown; check for timeout
        case jasmin.SYNC_TIMER_SHOWN:
            // If timeout is set and it's now later than Stop minus half a refresh less, call callback
            if( this.timeout !== -1 && this.frameNow > this.timeToErase - 1.5 * this.frameDur ) {
                this.timeStopped = window.performance.now();
//                this.realized    = this.timeStopped - this.timeShown;
                this.canceled = false;            // Event was not canceled
                this.state = jasmin.SYNC_TIMER_WAITING;   // We are not active anymore
                this.synchronousCallback = true;  // This callback is synchronized
                this.callbackDone();
                this.synchronousCallback = false; // But after this not anymore
            };
            break;
    }
    
    // Next refresh
    var self = this;
    window.requestAnimationFrame( function() {
        self.refresh();
    } );
};


/**
 * Set a timeout; callback is called on next requestFrame that is as near
 * as possible to the timeout. 
 * @public
 * @param {int}      timeout      Number of ms until callbackDone is called, use multiples of 16 for best results (since most screens have a 60hz refresh rate). If -1 then never tmieout
 * @param {Function} callbackDraw Callback called when timeout starts (immediately if we handling a synchronous callback, at next refresh if not)
 * @param {Function} callbackDone Callback called on timeout
 * @param {String}   name         Name of this timeout for logging. Default = noname
 */
jasmin.SyncTimer.prototype.setTimeout = function( timeout, callbackDraw, callbackDone, name ) {
    // Show alert if trying to setTimeout while not synced
    if( this.state === jasmin.SYNC_TIMER_NOT_SYNCED )
    {
        alert( "SyncTimer.setTimeout called but state == NOT_SYNCED; call sync first" );
    }

    // When was timeout requested
    this.timeRequestedNew = window.performance.now();    
    
    // Save timeout and callbacks
    this.timeoutNew      = timeout;
    this.callbackDraw    = callbackDraw;
    this.callbackDone    = callbackDone;
    this.nameNew         = name === undefined? "noname": name;
    
    // If we are already synchronized, immediately draw, else wait for refresh
    if( this.synchronousCallback )
    {
        // Synchronized; drawn is same moment as requested
        this.timeDrawnNew = this.timeRequestedNew;
        this.callbackDraw();
        this.state = jasmin.SYNC_TIMER_DRAWN;
    } else {
        this.state = jasmin.SYNC_TIMER_REQUESTED;
    }
};


/**
 * Cancel a timeout; callbackDone is not called anymore
 * @public
 */
jasmin.SyncTimer.prototype.cancelTimeout = function() {
    this.timeStopped = window.performance.now();
    this.realized = this.timeStopped - this.timeShown;
    this.canceled = true;
    this.state = jasmin.SYNC_TIMER_WAITING;
};

/**
 * Convenience function: rounding number to x precision
 * @private
 */
jasmin.SyncTimer.prototype.round = function( number, precision ) {
    return Math.round( number * precision ) / precision;
};

/*
 * Updates timeout log
 * @private
 */
jasmin.SyncTimer.prototype.updateTimeoutLog = function() {
    this.timeoutLog = {
        "na" : this.name,
        "tr" : this.round( this.timeRequested, 1000 ),
        "td" : this.round( this.timeDrawn, 1000 ),
        "ts" : this.round( this.timeShown, 1000 ),
        "tt" : this.round( this.timeStopped, 1000 ),
        "ca" : this.canceled,
        "ti" : this.round( this.timeout, 1000 ),
        "re" : this.round( this.realized, 1000 )
    };
};
    
/**
 * Returns an associative array with all the variables logged of previous event
 * @public
 */
/**
 * Get PREVIOUS timeoutLog; a timeoutLog is ready after callbackDraw of the NEXT
 * timeout is being called. See logging vars for an overview of values stored in 
 * timeoutLog
 * @returns (Object) Associative array with timeoutLog variables
 * @public
 */
jasmin.SyncTimer.prototype.getPrevTimeoutLog = function() {
    return this.timeoutLog; 
};