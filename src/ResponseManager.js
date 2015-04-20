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
 * A list of possible pointer responses, both for touch and mouse 
 * @private
 */
jasmin.POINTER_EVENTS = {
    /** vmouse; triggered both by touch and mouse, requires jquery mobile */
    "vmouse" : {
        "down"   : "vmousedown",
        "up"     : "vmouseup",
        "cancel" : "vmousecancel"
    },
    /** mouse; triggered only by mouse */
    "mouse" : {
        "down" : "mousedown",
        "up"   : "mouseup"
    },
    /** mouse; triggered only by touch, requires jquery mobile */
    "touch" : {
        "down"   : "touchstart",
        "up"     : "touchend",
        "cancel" : "touchcancel"        
    }
};

/**
 * ResponseManager manages keyboard, touch, and mouse responses.
 * See <a href="../source/jasmin_demos/demo_choose.html">these demos </a> for
 * usage examples. Requires jQuery for keyboard and mouse handling (keydown,
 * keyup, mousedown, mouseup). Requires jQuery mobile for touch handing 
 * (vmousedown, vmouseup, touchstart, touchend)
 * @requires jasmin_ext/jquery.js
 * @requires jasmin_ext/jquery.mobile.js
 * @constructor
 * @param {Window} window Window to manage responses of
 */
jasmin.ResponseManager = function( window )
{
    // Start inactive
    this.active = false;
    
    // Save window ref
    this.window = window;
    
    // Attach keyboard event handlers
    var self = this;
    this.window.$( this.window.document ).keydown( function( event ) {
        self.response( "keydown", event );
    } );
    this.window.$( this.window.document ).keyup( function( event ) {
        self.response( "keyup", event );
    } );
    
    // Make a list of the jasmin.POINTER_EVENTS
    this.pointerDeviceEventsList = [];
    for( var i in jasmin.POINTER_EVENTS )
    {
        for( var j in jasmin.POINTER_EVENTS[i] )
        {
            this.pointerDeviceEventsList.push( jasmin.POINTER_EVENTS[i][j] );
        }
    }
}

/**
 * Activate; ResponseManager calls callbackResponse if a response was given
 * that is allowed by activeResponses
 * @public
 * @param {Object}    activeResponses   An associative array defining responses that stop the event (if any). See <a href="../source/jasmin_demos/demo_choose.html">these demos </a> for examples.
 * @param {Function}  callbackResponse  Callback called upon a response
 * @param {String}    name               Name of this activation for logging. Default = noname
 */
jasmin.ResponseManager.prototype.activate = function(
    activeResponses,    
    callbackResponse,
    name
) {
    // Store settings
    this.activeResponses  = activeResponses;
    this.callbackResponse = callbackResponse;
    this.name             = name === undefined? "noname" : name;
    this.active           = true;
    
    // Clear logging vars
    this.clearLoggingVars();
    
    // Activate mouse handlers
    var self = this;
    var mouseType;
    
    // Check each possible pointer event
    for( var j in this.pointerDeviceEventsList )
    {
        mouseType = this.pointerDeviceEventsList[ j ];
        
        // Is this response type in activeResponses?
        if( this.activeResponses[ mouseType ] !== undefined )
        {
            // It is, check if type is "all" then attach to window
            if( this.activeResponses[ mouseType ][ "type" ] === "all" )
            {
                // Mode is "all", trigger on any response on window
                var myMouseType = mouseType;
                this.window.$( this.window.document ).bind( 
                    mouseType,
                    "all",
                    function( event ) {
                        //alert( "all");
                        self.response( myMouseType, event, "all", undefined );
                    } 
                );
            };
            
            // Also attach to element in buttons 
            if( this.activeResponses[ mouseType ][ "buttons" ] !== undefined )
            {
                var attach;
                for( var id in this.activeResponses[ mouseType ][ "buttons" ] )
                {
                    // callback for this.response, binding mouseType, label, and id
                    attach = function( mouseType, label, id )
                    {
                        var myLabel     = label;
                        var myMouseType = mouseType;
                        var myId        = id;
                        
                        $( id ).bind( 
                            myMouseType,
                            myLabel,
                            function( event ) {
                                report( "ResponseManager.triggered", myMouseType );
                                self.response( myMouseType, event, myId, myLabel );
                            } 
                        );                
                    };
                    report( "ResponseManager.bind", mouseType + " to " + id );
                    attach( 
                        mouseType,
                        this.activeResponses[ mouseType ][ "buttons" ][ id ],
                        id
                    );
                }
            }
        }
    }
};

/**
 * Every keyboard and registered touch event triggers a callback to response,
 * in which is determined if we should call callbackResponse
 * @private
 * @param {String}    mode  Type of response (keydown, vmouseup etc.) 
 * @param {Object}    event  Data about the event that triggered the response
 * @param {String}    pointerId    ID of pointer event (if any) 
 * @param {String}    pointerLabel    Label of pointer event (if any) 
 */
jasmin.ResponseManager.prototype.response = function( mode, event, pointerId, pointerLabel ) {
    //report( "ResponseManager.response", JSON.stringify( [ mode, id ] ) );
    
    // Only register responses if active
    if( this.active ) {
        // Parse response, does it end the timedEvent?
        var critical = this.parseResponse( mode, event, pointerId, pointerLabel  );
        if( critical ) {
            // Stop event bubbling - TP disable for Android Browser 4.3 
            event.stopPropagation(); 
            event.preventDefault();   
    
            // Store logging vars
            this.updateResponseLog();
    
            // Do callback
            this.callbackResponse();
        }
    }
};


// Check if this response is critical, and parse it on the way
jasmin.ResponseManager.prototype.parseResponse = function( mode, event, id, label ) {
    // Log time of response
    var time = window.performance.now();
    
    // Assume not critical
    var critical = false;
            
    // Is this mode defined?
    if( this.activeResponses[ mode ] !== undefined ) {    
        // On a keyboard response, check key
        if( 
               mode === "keydown" 
            || mode === "keyup"
        ) {       
            // The id is keycode based on event.which
            id = event.which;
                
            // Is the response a valid buton? 
            if(
                   this.activeResponses[ mode ][ "buttons" ]                !== undefined 
                && this.activeResponses[ mode ][ "buttons" ][ event.which ] !== undefined 
            ) {
                // Yes; assign label
                label = this.activeResponses[ mode ][ "buttons" ][ id ];
            }

            // Yes, are all buttons critical?
            if( this.activeResponses[ mode ][ "type" ] === "all" )
            {
                // All buttons critical, so this one too
                critical = true;

            // Not all buttons critical, is this response defined in buttons?
            } else if( label !== undefined ) {
                // Response is defined, so response is critical
                critical = true;               
            }
        }
        
        // Clear x and y coordinates
        this.x = undefined;
        this.y = undefined;
        
        // On a mouse response, log coordinates and assume critical
        if( this.pointerDeviceEventsList.indexOf( mode ) !== -1 )  {
            this.x = event.pageX;
            this.y = event.pageY;
            
            // No need to setup label and id, but let's check if they are the same
            critical = true;
        }
    }
    
    // Save logging vars to this
    this.critical = critical;
    this.mode     = mode;
    this.id       = id;
    this.label    = label;
    this.time     = time;
 
    return critical;
};


/**
 * Deactivate; don't call responseCallback on any response anymore
 * @public
 */
jasmin.ResponseManager.prototype.deactivate = function() {
    // Stop event
    this.active = false;    
    
    // Update responseLog
    this.updateResponseLog();
    
    // Remove mouse handlers
	if( this.activeResponses !== undefined )
	{
		var mouseType;
		for( var j in this.pointerDeviceEventsList ) {
			mouseType = this.pointerDeviceEventsList[ j ];
			if( this.activeResponses[ mouseType ] !== undefined ) {
				// If all responses unbind document
				if( this.activeResponses[ mouseType ][ "type" ] === "all" ) {
					this.window.$( this.window.document ).unbind( 
						mouseType
					);
				}	
                
                for( var i in this.activeResponses[ mouseType ][ "buttons" ] ) {
                    report( "ResponseManager.unbind", mouseType );
                    //$( i ).unbind( mouseType );
				}
			}
		}    
	}
};


/**
 * Store all logging vars in responseLog
 * @private
 */
jasmin.ResponseManager.prototype.updateResponseLog = function() {
    this.responseLog = {
        "na"     : this.name,
        "cr"     : this.critical,
        "mo"     : this.mode,
        "id"     : this.id,
        "la"     : this.label,
        "ti"     : this.time,
        "x"      : this.x,
        "y"      : this.y
    };
};

/**
 * Get past responseLog; a responseLog is ready when callbackResponse being called
 * See logging vars for an overview of values stored in responseLog
 * @returns (Object) Associative array with responseLog variables
 * @public
 */
jasmin.ResponseManager.prototype.getResponseLog = function() {
    return( this.responseLog );
};

// Clear logging vars
jasmin.ResponseManager.prototype.clearLoggingVars = function() {
    /**
     * Logging var: was response critical (true/false)
     * @instance
     */
    this.critical = undefined;
    /**
     * Logging var: what type of response (keydown, touchend, etc.)
     * @instance
     */
    this.mode = undefined;
    /**
     * Logging var: what was the id (keycode for keyboard, css selector for pointer)
     * @instance
     */
    this.id = undefined;
    /**
     * Logging var: what was the corresponding label in buttons (if any)
     * @instance
     */
    this.label = undefined;
    /**
     * Logging var: at what time was the response made?
     * @instance
     */
    this.time = undefined;
};