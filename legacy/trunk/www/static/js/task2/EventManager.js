EventManager.prototype.pointerDeviceEvents = {
    "vmouse" : {
        "down" : "vmousedown",
        "up"   : "vmouseup"
    },
    "mouse" : {
        "down" : "mousedown",
        "up"   : "mouseup"
    },
    "touch" : {
        "down" : "touchstart",
        "up"   : "touchend"
    }
};

/**
 * EventManager times trial events and registers responses/response times
 * @constructor
 * @param {Window}    window              Window to managa responses of
 */
function EventManager( window )
{
    this.window = window;
    this.timer  = null;
    this.active = false;
    this.timingEvents    = [];
    this.timingRequested = [];
    this.timingRealized  = [];
    
    // Event data
    this.eventData = {};
    this.eventData[ "responses" ] = [];
    
    // Attach keyboard event handlers
    var self = this;
    this.window.$( this.window.document ).keydown( function( event ) {
        self.response( "keydown", event );
    } );
    this.window.$( this.window.document ).keyup( function( event ) {
        self.response( "keyup", event );
    } );
    
    // Make a list of the pointerDeviceEvents
    this.pointerDeviceEventsList = [];
    for( var i in this.pointerDeviceEvents )
    {
        for( var j in this.pointerDeviceEvents[i] )
        {
            this.pointerDeviceEventsList.push( this.pointerDeviceEvents[i][j] )
        }
    }
}

/**
 * Present an event with timing and response options
 * @param {Object}    activeResponses  An array defining responses that stop the event (and call callback). The array should have the form { responseType : { "buttons" : { keycode: label }, "type" : type }. For each responseType (keydown, keyup), you can specify (1) which buttons are valid responses (associate keycodes to labels), and (2) "type" , which determines if only valid responses end this event (value "specific"), or any response of this type (value "all")
 * @param {int}       timeout          Number of ms to wait until stopping the event (and calling callback). Special values: -1 == never timeout, 0 == immediately timeout
 * @param {Function}  callback         When this event stops, callback is called with two arguments: eventData and params. eventData is an associative array with the following keys: "start", "stop", time in ms on which event started and stopped; "reason", string being "response" on response, or "timeout" on timeout; "responses", responseData for all responses given during this event (responseType, keycode, and rt); "response", if a response ended this trial, response contains responseData this response, with an additional "label" value that you assigned to this button via activeResponses
 * @param {Object}    params           Values passed as second argument to callback
 */
EventManager.prototype.startEvent = function(
    activeResponses,    
    timeout,            
    callback,           
    params,
    name,
    logEvent
) {
    // Store settings
    this.activeResponses = activeResponses;
    this.callback        = callback
    this.params          = params
    this.active          = true;
    this.name            = name;
    this.logEvent        = logEvent === undefined? true: logEvent;
    
    // Ceil timeout to integer
    timeout = Math.ceil( timeout );
    
    if( this.name === undefined )
    {
        this.name = "";
    }
    
    // Activate mouse handlers
    var self = this;
    var mouseType;
    for( var j in this.pointerDeviceEventsList )
    {
        mouseType = this.pointerDeviceEventsList[ j ];
        if( this.activeResponses[ mouseType ] !== undefined )
        {
            // If all responses, attach to document, else attach to sprites
            if( this.activeResponses[ mouseType ][ "type" ] == "all" )
            {
                this.window.$( this.window.document ).bind( 
                    mouseType,
                    "all",
                    function( event ) {
                        self.response( mouseType, event, "all" );
                    } 
                );

            // Other cases, attach to a jQuery node via bind
            } else {
                var attach;
                //alert( mouseType );
                for( var i in this.activeResponses[ mouseType ][ "buttons" ] )
                {
                    attach = function( mouseType, label )
                    {
                        var myLabel     = label;
                        var myMouseType = mouseType;
                        
                        $( i ).bind( 
                            myMouseType,
                            myLabel,
                            function( event ) {
                                self.response( myMouseType, event, myLabel );
                            } 
                        );                
                    };
                    
                    attach( 
                        mouseType,
                        this.activeResponses[ mouseType ][ "buttons" ][ i ]
                    );
                }
            }
        }
    }
    
    // eventData 1
    this.eventData = {};
    this.eventData[ "timeout" ] = timeout;
    this.eventData[ "start"   ] = ( new Date() ).getTime();
    
    // Log event start (without responses)
    if( this.logEvent )
    {
        logger.log(
            "EventManager",
            "event_start",
            this.name,
            this.eventData
        );
    }

    // 
    this.eventData[ "responses" ] = [];

    // Set a timer
    this.setTimer( timeout );
}

// Start the timer. timeout: Number of ms to wait until timing out. Special values: -1 == never timeout, 0 == immediately timeout
 EventManager.prototype.setTimer = function( timeout )
{
    clearTimeout( this.timer );
    
    if( timeout == 0 )
    {
        // Timout 0; immediately timeout        
        this.stopEvent( "timeout" );
        this.doCallback();
    } 
    else if( timeout > 0 ) 
    {
        // Timout > 0; set a timeout
        var self = this;
        this.timer = setTimeout( 
            function() { self.timedOut() },
            timeout
        );
    }
}

/**
 * Stop timer, log timeStop and reason in eventData
 * @param {String}       reason     Log this reason in eventData
 */
EventManager.prototype.stopEvent = function( reason )
{
    // Stop event
    this.active = false;    
    clearTimeout( this.timer );    
    
    // Log stuff in eventData
    this.eventData[ "stop" ] = ( new Date() ).getTime();
    this.eventData[ "reason"   ] = reason;

    // Check timing accuracy if event timed out
    if( this.eventData[ "timeout" ] !== -1 && this.eventData[ "reason" ] === "timeout" )
    {
        this.timingEvents.push(    this.name );
        this.timingRequested.push( this.eventData[ "timeout" ] );
        this.timingRealized.push(  this.eventData[ "stop" ] - this.eventData[ "start" ] );
    }

    // eventData to log upon event_stop
    var toLog = { 
        "stop"      : this.eventData[ "stop" ],
        "reason"    : this.eventData[ "reason" ],
        "responses" : this.eventData[ "responses" ]
    }
    if( this.eventData[ "response" ] !== undefined )
    {
        toLog[ "response" ] = this.eventData[ "response" ];
    }

    if( this.logEvent )
    {
        // Log event stop
        logger.log(
            "EventManager",
            "event_stop",
            this.name,
            toLog
        );
    }
    
    // Remove mouse handlers
	if( this.activeResponses !== undefined )
	{
		var mouseType;
		for( var j in this.pointerDeviceEventsList )
		{
			mouseType = this.pointerDeviceEventsList[ j ];
			if( this.activeResponses[ mouseType ] !== undefined )
			{
				// If all responses unbind document
				if( this.activeResponses[ mouseType ][ "type" ] == "all" )
				{
					this.window.$( this.window.document ).unbind( 
						mouseType
					);
				} else {
					for( var i in this.activeResponses[ mouseType ][ "buttons" ] )
					{
						$( i ).unbind( mouseType );
					}
				}
			}
		}    
	}
}

// Call callback with eventData and params
EventManager.prototype.doCallback = function()
{
    this.callback(
        this.eventData,
        this.params
    );
}

// TimedOut; stop timer and call callback
EventManager.prototype.timedOut = function()
{
    //alert( this.eventData );
    this.stopEvent( "timeout" );
    this.doCallback();
}

// Parse a response, stop event if appropriate
EventManager.prototype.response = function( responseType, event, label )
{
    report( "EventManager.response", JSON.stringify( [ responseType, label ] ) );
    
    // Only register responses if active
    if( this.active )
    {
        // Parse response, does it end the timedEvent?
        var criticalResponse = this.parseResponse( responseType, event, label );
        if( criticalResponse )
        {
            // Stop event bubbling
            event.stopPropagation(); 
            event.preventDefault();   
    
            // Yes, stop event
            this.stopEvent( "response" );
            this.doCallback();
        }
    }
}

// Log a response, returns true if response is critical (stops the event), false otherwise
EventManager.prototype.parseResponse = function( responseType, event, label )
{
    // Is this response critical?
    var criticalResponse = false;
    // Log response
    var response = {
        "type" : responseType,
        "key"  : event.which,
        "rt"   : ( new Date() ).getTime() - this.eventData[ "start" ]
    };

    // Is this responseType defined?
    if( this.activeResponses[ responseType ] !== undefined )
    {    
        // Add buttton label (if any)
        response[ "label" ] = null;

        // On a keyboard response, check key
        if( 
               responseType == "keydown" 
            || responseType == "keyup"
        ) {            
            // Is the response a valid buton?
            if(
                   this.activeResponses[ responseType ][ "buttons" ]                !== undefined 
                && this.activeResponses[ responseType ][ "buttons" ][ event.which ] !== undefined 
            ) {
                response[ "label" ] = this.activeResponses[ responseType ][ "buttons" ][ event.which ];
            }

            // Yes, do all buttons end a response?
            if( this.activeResponses[ responseType ][ "type" ] === "all" ||  this.activeResponses[ responseType ][ "type" ] === "all_buttons" )
            {
                // All button ends; response is critical
                criticalResponse = true;

            // Is this response defined in responses?                
            } else if( response[ "label" ] !== null )
            {
                // Response is defined, so response is critical
                criticalResponse = true;               
            }
        }
        
        // On a mouse response, assume critical
        if( this.pointerDeviceEventsList.indexOf( responseType ) != -1 )
        {
            response[ "label" ] = label;
            criticalResponse = true;
        }
        
        // Store response in responses, and also in response if critical
        this.eventData[ "responses" ].push( response );        
        if( criticalResponse )
        {
            this.eventData[ "response" ] = response;
        }
        
        return criticalResponse;
    }
}

EventManager.prototype.clearTimingReport = function()
{
    this.timingEvents    = [];
    this.timingRequested = [];
    this.timingRealized  = [];
}

EventManager.prototype.getTimingReport = function()
{
    return {
        "events"    : this.timingEvents,
        "requested" : this.timingRequested,
        "realized"  : this.timingRealized
    };
}