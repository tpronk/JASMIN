/* 
 * Logger Constructor
 * @param   ajaxManager     AjaxManager
 * @param   report          Report callback (see reporter)
 * $param   periodicSending Interval with which to log; config[ "log_timeout" ]
 */
function Logger( ajaxManager, report, periodicSending, ajaxEnabled )
{
    this.ajaxManager     = ajaxManager;
    this.report          = report;
    this.periodicSending = periodicSending;
    this.ajaxEnabled     = ajaxEnabled;
        
    this.sequenceNumber  = 0;       // seq. nr. of eventLogs
    this.states          = {};      // States to log in session
    this.startTime       = ( new Date() ).getTime();
    this.clearLogs();
    

    this.sessionStateLoggers = {};
    
    // Setup periodic sending
    if( this.periodicSending != 0 )
    {
        var self = this;
        setInterval(
            function() {
                self.send();
            },
            this.periodicSending
        );        
    }

	// Report we've started a asynchronous ajax call
	this.report(
        "Logger.construct",
		"startTime: " + this.startTime + ", periodicSending: " + this.periodicSending
	);    
}

/* 
 * Clear (and init) logs to send
 */
Logger.prototype.clearLogs = function()
{
    this.logs = [];
}

/* 
 * Log an event
 * @param   source  Source (e.g. "ItemLikert")
 * @param   type    Type   (e.g. "click")
 * @param   name    Name   (e.g. "espad_expect")
 * @param   value   Value  (e.g. "1 3")
 */
Logger.prototype.log = function( source, type, name, value )
{
    var currentLog = jQuery.extend( true, {}, [
        source,
        type,
        name,
        value,
        (new Date()).getTime(),
        this.sequenceNumber
    ] );
    this.logs.push( currentLog );
    this.report( 
        "Logger.log",
        JSON.stringify( currentLog )
    );
        
    this.sequenceNumber++;
}

/* 
 * Send logs, if any
 */
Logger.prototype.send = function()
{
    // Requests to send this round
    var requests = [];

    // Check event logs
    if( this.logs.length > 0 )
    {
        this.report(
            "Logger.send",
            "Sending " + this.logs.length + " events"
        );
        requests.push(
            {
                "namespace" : "log_events",
                "type"      : "short",
                "events"    : this.logs,
                "success"   : function() {}
            }        
        );
            
        // Only clear logs if ajaxEnabled
        if( this.ajaxEnabled )
        {
            this.clearLogs();            
        }
    }
    
    // Check states to update
    for( var i in this.states )
    {
        // Add requests for all dirty states, and clean 'em
        if( this.states[i][ "dirty" ] )
        {
            requests.push(
                {
                    "namespace" : "session_state",
                    "type"      : "set",
                    "id"        : i,
                    "value"     : this.states[i][ "state" ],
                    "success"   : function() {}
                }
            );
            this.states[i][ "dirty" ] = false;
        }
    }
    
    // Send if anything
    if( requests.length > 0 )
    {
        this.ajaxManager.send_multi( requests, true );
    }
}

/* 
 * Update the state of a slot
 * @param   dirty   The slot changed value and should be sent to the server
 * @param   slot    The slot whose state we are updating
 * @param   state   The new state of the slot
 */
Logger.prototype.setState = function( slot, state, dirty  )
{
    this.states[ slot ] = {
        "dirty" : dirty,
        "state" : state
    };
}

/* 
 * Create a callback to updateState with a preset slot
 * @param   slot    The preset slot
 * @return          The callback with arguments for dirty and state
 */
Logger.prototype.setStateCallback = function( slot )
{
    var self = this;
    return function( state, dirty ) 
    {
        self.setState( slot, state, dirty );
    };
}

/* 
 * Get the state of a slot
 * @param   slot    The slot whose state we want
 * @return          The state of this slot
 */
Logger.prototype.getState = function( slot )
{
    if( this.states[ slot ] === undefined )
    {
        report( "Error", "Logger.getState. Undefined slot: " + slot );
    }
    return this.states[ slot ][ "state" ];
}

/* 
 * Create a callback to getState with a preset slot
 * @param   slot    The preset slot
 * @return          The callback function (no arguments)
 */
Logger.prototype.getStateCallback = function( slot )
{
    var self = this;
    return function() 
    {
        return self.getState( slot );
    };
}
