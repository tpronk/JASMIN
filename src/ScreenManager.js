//Copyright 2015, Thomas Pronk
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
 * ScreenManager tracks screen changes (such as resize) and can check whether
 * a list of screen requirements are satisfied (fullscreen, focus, landscape)
 * @requires jQuery
 * @requires screenfull
 * @param {int} watchTimeout No. of ms until considering a screen event ended. Default: 1000
 */
jasmin.ScreenManager = function( watchTimeout ) {
    this.watchTimeout = watchTimeout === undefined? 1000: watchTimeout;
    
    // callbacks
    this.callbacks = {};
    
    // Setup logger
    this.logger = new jasmin.TableLogger(
        [ "name", "phase", "time", "value" ],
        function( message ) { console.log( message ); },
        "NA"
    );

    // Hack a report in the logger
    var self = this;
    this.logger.oldLog = this.logger.log;
    this.logger.log = function( logMe ) {
        DEBUG && console.log( {
            "screenState" : self.screenState
        });
        self.logger.oldLog( logMe );
    };

    // Requirements to satisfy
    this.requirements    = [];
    // Called first time requirements are satisfied
    this.satisfiedFirst  = undefined;
    // Called each time requirements are satisfied
    this.satisfiedEach   = undefined;

    
    // Current screen state
    this.screenState = {
        "orientation" : $( window ).width() >= $( window ).height()? "landscape": "portrait",
        "focus"       : true,
        "fullscreen"  : this.isFullscreen()
    };
        
    
    // Attach event listeners
    var self = this;
    var watchThese = {
        "orientationchange" : {
            "source" : window,
            "event"  : "orientationchange",
            "on"     : function( event ) {
                var orientation = $( window ).width() >= $( window ).height()? "landscape": "portrait";
                self.screenState[ "orientation" ] = orientation;
                self.checkRequirements();
                return {
                    "window.orientation" : event.orientation
                };
            }
        },
        "focusout" : {
            "source" : window,
            "event"  : "focusout",
            "on"     : function( event ) {
                self.screenState[ "focus" ] = false;
                self.checkRequirements();
                return {};
            }
        },
        "focusin" : {
            "source" : window,
            "event"  : "focusin",
            "on"     : function( event ) {
                self.screenState[ "focus" ] = true;
                self.checkRequirements();
                return {};
            }
        },
        "resize" : {
            "source" : window,
            "event"  : "resize",
            "on"     : function( event ) {
                var orientation = $( window ).width() >= $( window ).height()? "landscape": "portrait";
                self.screenState[ "orientation" ] = orientation;
                self.checkRequirements();  
                return {
                    "window.width"     : $( window ).width(),
                    "window.height"    : $( window ).height(),
                    //"devicePixelRatio" : window.devicePixelRatio,
                    "avail.width"      : screen.availWidth,
                    "avail.height"     : screen.availHeight
                };                              
            }
        },
        "beforeunload" : {
            "source" : window,
            "event"  : "beforeunload",
            "on"     : function() {
                return {};
            }
        },
        "unload" : {
            "source" : window,
            "event"  : "unload",
            "on"     : function() {
                return {};
            }
        }        
    };

    // Only add fullscreenchange event is screenfull is available
    if( screenfull && screenfull.raw !== undefined ) {
        watchThese[ "fullscreenchange" ] = {
            "source" : document,
            "event"  : screenfull.raw.fullscreenchange,
            "on"     : function() {
                var orientation = $( window ).width() >= $( window ).height()? "landscape": "portrait";
                self.screenState[ "orientation" ] = orientation;
                self.checkRequirements();                
                return {
                    "window.width"  : $( window ).width(),
                    "window.height" : $( window ).height(),
                    "avail.width"   : screen.availWidth,
                    "avail.height"  : screen.availHeight,
                    "screenfull.isFullscreen" : screenfull.isFullscreen
                };
            }
        };
    }

    var watchThis, self = this, closure;
    for( var e in watchThese ) {
        watchThis = watchThese[e];
        var closure = function( param1, param2 ) {
            return function( event ) {
                return self.changed( param1, param2, event );
            };
        };
        $( watchThis[ "source" ] ).on( 
            watchThis[ "event" ], 
            closure( e, watchThis[ "on" ] ) 
        );
    }
    
    // Events we are currently watching (for an 'end')
    this.watching = {};
    
    // Log screen data
    this.logger.log( {
        "name"   : "init",
        "phase"  : "start",
        "time"   : window.performance.now(),
        "value"  : {
            "screen.width"   : screen.width,
            "screen.height"  : screen.height,
            "avail.width"    : screen.availWidth,
            "avail.height"   : screen.availHeight,
            "window.width"   : $( window ).width(),
            "window.height"  : $( window ).height()
        }
    } );
    
    // watchTimeout; how much time between successive events before we log "end"?
    var self = this;
    setTimeout( 
        self.updateWatch(),
        this.watchTimeout
    );
        
    //$( "#output" ).append( "start " + JSON.stringify( log ) + "\n" );
}    

jasmin.ScreenManager.prototype.changed = function( name, logThis, event ) {
    this.watch( 
        name,
        logThis( event )
    );

    var result;
    if( this.callbacks[ name ] !== undefined ) {
        result = this.callbacks[ name ]( event );
    }

    return result;
};

jasmin.ScreenManager.prototype.watch = function( name, value ) {
    var now = window.performance.now();
    // Not watching yet? log start
    if( this.watch[ name ] === undefined ) {
        // Log screen data
        this.logger.log( {
            "name"   : name,
            "phase"  : "start",
            "time"   : now,
            "value"  : value
        } );    
    }
    this.watch[ name ] = now;
};

// Check if any watched events passed watchTimeout. If so, log end and remove from watch
jasmin.ScreenManager.prototype.updateWatch = function() {
    var now = window.performance.now();
    for( var w in this.watch ) {
        // watchTimeout?
        if( this.watch[w] + this.watchTimeout < now ) {
            this.logger.log( {
                "name"   : w,
                "phase"  : "end",
                "time"   : this.watch[w],
                "value"  : {}
            } );                
            delete this.watch[w];            
        };
        // Check requirements again
        this.checkRequirements();
    }
    
    var self = this;
    setTimeout( 
        function() {
            self.updateWatch();
        },
        this.watchTimeout
    );    
};

// Enable/disable fullscreen
jasmin.ScreenManager.prototype.fullscreen = function( fullscreenEnabled, fullscreenAsk, fullscreenDone ) {
    this.fullscreenEnabled = fullscreenEnabled;
    this.fullscreenAsk     = fullscreenAsk;
    this.fullscreenDone    = fullscreenDone;
    if( this.fullscreenEnabled && !this.isFullscreen() ) {
        if( this.fullscreenAsk !== undefined ) {
            this.fullscreenAsk();
        }
        this.attachFullscreenCallback();
    }
    if( !this.fullscreenEnabled ) {
        screenfull.exit();
    }
};

// Convenience function; returns false if
// - !screenfull
// - !screenfull.enabled
// - !screenfull.isFullscreen
jasmin.ScreenManager.prototype.isFullscreen = function() {
    return !screenfull || !screenfull.enabled || screenfull.isFullscreen;
};

// Start tracking whether we ware focused and fullscreen
jasmin.ScreenManager.prototype.attachFullscreenCallback = function() {
    var callback = function( self ) {
        return function() {
            if (this.fullScreenTarget === undefined) {
                screenfull.request();
            } else {
                screenfull.request(this.fullScreenTarget);
            }
            self.screenState[ "fullscreen" ] = true;
            $( document ).off(
                "vmousedown",
                self.fullscreenCallback
            );              
            self.checkRequirements();
        };
    };
    var self = this;    
    self.fullscreenCallback = callback( this );
    if( !this.isFullscreen() && !this.attached ) {
        $( document ).on(
            "vmousedown",
            function() {
                self.fullscreenCallback();
            }
        );
        this.attached = true;
    };
};

jasmin.ScreenManager.prototype.detachFullscreenCallback = function () {
    $( document ).off(
        "vmousedown",
        self.fullscreenCallback
    );        
};

// Call callback on this event
jasmin.ScreenManager.prototype.addCallback = function( name, callback ) {
    this.callbacks[ name ] = callback;
};

// Check if requirements are satisfied, call appropriate callback
jasmin.ScreenManager.prototype.checkRequirements = function() {
    var requirement, i, fullscreenOn = false, failedRequirement = false;
    // Check for each requirement if it's satisfied, if not, show corresponding message
    for( i in this.requirements ) {
        if( !failedRequirement ) {
            requirement = this.requirements[i];
            if( requirement[ "values" ].indexOf( this.screenState[ requirement[ "req" ] ] ) === -1 ) {
                DEBUG && console.log({
                    "what"   : "requirement not satisfied",
                    "req"    : requirement[ "req" ],
                    "values" : requirement[ "values" ],
                    "state"  : this.screenState[ requirement[ "req" ] ] 
                });
                this.satisfied = false;
                requirement[ "warn" ]();
                // Special case: fullscreen requirement
                if( requirement[ "req" ] === "fullscreen" ) {
                    fullscreenOn = true;
                    this.attachFullscreenCallback();
                }
                // We're done
                failedRequirement = true;;
            }
        }
    }
    
    // Detach fullscreen, if not enabled
    if( !fullscreenOn ) {
        this.detachFullscreenCallback();
    }
    
    
    // Still not failed? All requirements passed! Call appropriate callback
    if( !failedRequirement ) {
        var callback = function() {};
        if( this.satisfiedNever ) {
            // Never satisfied before; call satisfiedFirst
            DEBUG && console.log( "callback to this.satisfiedFirst" );
            callback = this.satisfiedFirst;
            this.satisfiedNever = false;
        } else if( !this.satisfied ) {
            // Not satisfied before; call satisfiedEach
            DEBUG && console.log( "callback to this.satisfiedEach" );
            callback = this.satisfiedEach;
        }
        this.satisfied = true;
        if( callback instanceof Function ) {
            callback();
        }
    }
};

/**
 * Checks a list of requirements and calls callback when requirements are
 * satisfied.
 * @public
 * @param {Object} requirements Requirements that need to be met, see demo_jasmin.ScreenManager
 * @param {Function} Called first time all requirements are satisfied
 * @param {Function} Called each time all requirements are satisfied (after the first time)
 * @returns {Function} fail callback
 */
jasmin.ScreenManager.prototype.require = function( requirements, satisfiedFirst, satisfiedEach, fullScreenTarget ) {
    // Copy properties
    this.requirements     = requirements;
    this.satisfiedFirst   = satisfiedFirst;
    this.satisfiedEach    = satisfiedEach;
    this.fullScreenTarget = fullScreenTarget;
    
    // Check which callbacks have been called
    this.satisfiedNever = true;  // True once satisfiedFirst has been called
    this.satisfied      = false; // False whenever not satisfied
    
    this.checkRequirements();
};
    
