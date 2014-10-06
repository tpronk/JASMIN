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
 * Manages AJAX requests and responses. Sends requests in a package documented
 * separately (2do: update docs). By default the ajaxManager is set up to 
 * periodically send any outstanding requests (timeBetweenRetries). It can
 * be configured to (a) periodically send unsent requests or not; (b) immediately 
 * send a request or to wait until the next try (for bulk sending); (c) flush
 * all open request and call a callback once all have been sent (to send remaining
 * logs at the end of a participation
 * @constructor
 * @param {String}    url                 URL to send requests to
 * @param {Object}    id                  Object sent along to identify run/session/participant
 * @param {Function}  fail                Fail callback called with string errorMessage as argument. Defaults to alert
 * @param {Function}  report              Report callback
 * @param {int}       timeBetweenRetries  Ms waited until retrying a request, default = 4000
 * @param {int}       maxRetries          Number of retries until failing, default = 8
 * @param {int}       periodicalSending   Send requests periodically (true) or only when flushing (false), default = true
 */
function AjaxManager( 
   url,
   id,
   fail,   
   report,
   timeBetweenRetries,
   maxRetries,
   periodicalSending
) {
    this.url                = url;
    this.id                 = id;
    this.fail               = fail === undefined? function( errorMessage ) { alert( errorMessage ); } : fail;
    this.report             = report === undefined? function() {}: report;   
    this.timeBetweenRetries = timeBetweenRetries === undefined? 4000 : timeBetweenRetries;
    this.maxRetries         = timeBetweenRetries === undefined? 8 : maxRetries;
    this.periodicalSending  = periodicalSending  === undefined? true : periodicalSending;

    // Called after flushing all remaining requests
    this.flushCallback      = undefined;

    // Report
    this.report( "AjaxManager.construct", "" );    

    // Constants for request states
    this.STATE_OPEN   = 1;  // Request is being transmitted
    this.STATE_FAILED = 2;  // Request failed
    this.STATE_FIRST  = 3;  // Request that haven't been sent yet

    // Data on current AJAX request we are working on
    this.requests = {};

    // RequestCounter - Assigns unique requestId for each request
    this.requestCounter = 0;

    // AjaxCounter - Sequence number for ajax calls
    this.ajaxCounter = 0;

    // If we permanently failed; don't attempt any ajax requests anymore
    this.failed = false;

    this.lastAttemptTime = new Date().getTime();

    // Start running, if we sending periodically
    if( this.periodicalSending )
    {
        this.retry();
    }
};


/**
 * Send multiple requests 
 * @param requests     Requests to send, an array of associative arrays with keys "data", and "callback" (see AjaxManager.sendOne)
 * @param immediately  Send immediately (true && periodicalSending = true) or wait until next retry (false), default = true
 * @return             requestIds of the requests to be sent
 * @public
 */
AjaxManager.prototype.sendMulti = function( requests, immediately )
{
    immediately = immediately === undefined? true : immediately;
     
    // Add each request
    var requestIds = [];
    for( var i in requests )
    {
        // Add the request
        var requestId = this.addRequest( 
            requests[i][ "data" ], 
            requests[i][ "callback" ]
        );
        requestIds.push( requestId );
   }
    
   if( immediately && this.periodicalSending )
   {
      this.sendOpenRequests();
   }
    
   return requestIds;
};

/**
 * Send a single request
 * @param data         Data to send
 * @param callback     Callback called on response (with data replied by target url as argument)
 * @param immediately  Send immediately (true && periodicalSending = true) or wait until next retry (false), default = true
 * @return             requestId of the request to be sent
 * @public
 */
AjaxManager.prototype.sendOne = function( data, callback, immediately )
{
    immediately = immediately === undefined? true : immediately;
   
    var requestId = this.addRequest( 
        data, 
        callback
    );    
    
   if( immediately && this.periodicalSending )
   {
      this.sendOpenRequests();
   }
    
   return requestId;
}

/*
 * Add a request to the requests array
 * @param request      Request to add.
 * @return             Index at which request has been added, or undefined if no AJAX enabled
 * @private
 */
AjaxManager.prototype.addRequest = function( data, callback )
{
    var counter = this.requestCounter;
    this.requests[ counter ] = {
         "state"           : this.STATE_FIRST,
         "attemptCounter"  : 0,
         "data"            : data,
         "callback"        : callback,
         "handled"         : false
    };
   this.requestCounter++;
   return counter;
};

/**
 * Send all open requests (that should be sent)
 * @private
 */
AjaxManager.prototype.sendOpenRequests = function()
{            
   // Stop if we failed
   if( this.failed )
   {
      return;
   }

   // Setup ajaxPackage to send
   var ajaxPackage = {
       "id"       : this.id,
       "requests" : []
   };

   // Get requestIds to send
   var requestIds = this.requestsToSend( this.timeBetweenRetries );
   
   // If anything to send, then send it
   if( requestIds.length > 0 ) {
            // Setup each request
            var requestId;          
            for( var i in requestIds ) {
            // Get ID
            requestId = requestIds[i];

            // Setup package
            ajaxPackage[ "requests" ].push( {
                "requestId" : requestId,
                "data"      : this.requests[ requestId ][ "data" ]
            } );

            // Update state
            this.requests[ requestId ][ "state"          ] = this.STATE_OPEN;
            this.requests[ requestId ][ "attemptCounter" ]++;
            this.requests[ requestId ][ "attemptTime"    ] = new Date().getTime();
        }

        // Set time of most recent attempt
        this.lastAttemptTime = new Date().getTime();

        // Send
        var ajaxId = this.doAjax( ajaxPackage );
    }
}

/**
 * Process all open requests (do nothing, add to sendlgist, or timeout)
 * @return requestIds to retry
 * @private
 */
AjaxManager.prototype.requestsToSend = function( timeBetweenRetries )
{
    var time      = new Date().getTime();        // Get time
    var sendList  = new Array();       // Requests to retry

    // Check which requests to add to  sendList
    for( var i in this.requests ) {
      //alert( i )

      // Check for now and open
      switch( this.requests[i][ "state" ] ) {
        // Now? immediately add to sendList
        case this.STATE_FIRST:
            sendList.push( i );
            this.report(
               "AjaxManager.requestsToSend",
               "requestId " + i + ". STATE_FIRST"
               );
            break;
        // Open? Fail if timed out
        case this.STATE_OPEN:
          // If timed out, then failed, add to list
          if( time - this.requests[i][ "attemptTime" ] > timeBetweenRetries )
          {
             this.report(
                "AjaxManager.requestsToSend",
                "requestId " + i + " open and timed out"
                );

             // Timed out -> state to failed
             this.requests[i][ "state" ] = this.STATE_FAILED;
          }
          break;
      }

      // Handle failed request -> retry if attempts not exceeded
      if( this.requests[i][ "state" ] == this.STATE_FAILED )
      {
         // Check if max attempts exceeded
         if( this.requests[i][ "attemptCounter" ] >= this.maxRetries )
         {
            this.report(
               "AjaxManager.requestsToSend",
               "requestId " + i + " failed; Exceeded " + this.maxRetries + " attempts"
               );

            // We officially failed
            if( !this.failed )
            {
               this.failed = true;
               this.fail( "AjaxManager: Max attempts exceeded" );
            }
         }
         else
         {
            this.report(
               "AjaxManager.requestsToSend",
               "requestId " + i + " added to sendList"
               );

            sendList.push( i );
         }
      }
   }

   return sendList;
}


/**
 * Do an (asynchronous) AJAX request
 * @param data         Data to send
 * @private
 */
AjaxManager.prototype.doAjax = function( ajaxPackage )
{
    // Count ajaxId
    var ajaxId = this.ajaxCounter;
   
    // Report ajax
    this.report(
       "AjaxManager.doAjax",
       "ajaxId " + ". ajaxPackage:" + JSON.stringify( ajaxPackage )
    );    
   
    // Send
    var self = this;    
    var request = $.ajax({
        type: "POST",
        //crossDomain: true,
        dataType: "json",
        url: this.url,
        data: "ajaxPackage=" +  encodeURI( JSON.stringify( ajaxPackage ) )
    } );
    request.done(  function( response, status ) {
        self.ajaxState( response, status, ajaxId );
    } );
    request.fail( function( response, status ){
        self.ajaxState( response, status, ajaxId );
    } );
    
    
   // Increment ajaxCounter
   this.ajaxCounter++;

   // Return ajaxCounter of current call
   return ajaxId;
};


/**
 * Update state (called upon an AJAX response)
 * @param {Object} replies  Answers to each request; associative array in which each key is a requestId and the correspoing value is the corresponing answer
 * @param {String} status  The state of the response (error or success)
 * @param {int}    ajaxId  ajaxId that this response is related to
 * @private
 */
AjaxManager.prototype.ajaxState = function( replies, status, ajaxId )
{
   // Report replies
    this.report(
        "AjaxManager.ajaxState",
        "ajaxId " + ajaxId + ", status " + status + ", received:" + JSON.stringify( replies )
    );   
   
    switch( status ) {
        case "success":
            // Succeed; remove requests, parse replies, and call successs
            this.processReplies( replies );
            break;
        case "error":
            // Don't do anything; let the request time out and retry
            break;
   }
}

/**
 * Process each reply and call associated callback
 * @private
 */
AjaxManager.prototype.processReplies = function( replies ) {
    // Process for each reply the corresponding request
    var requestId, i, reply;
    for( i in replies ) {
        requestId = replies[i][ "requestId" ];
        reply     = replies[i][ "data"      ];
        
        // Report that request was replied to
        this.report(
            "AjaxManager.ajaxState",
            "reply on requestId " + requestId + 
            ", handle request? " + ( this.requests[ requestId ] !== undefined && !this.requests[ requestId ][ "handled" ] ) +
            ", reply: " + JSON.stringify( reply ) 
        );
        
        // Check if request still exists, if so, handle it
        if( this.requests[ requestId ] !== undefined && !this.requests[ requestId ][ "handled" ] )
        {
            // Request is now handled
            this.requests[ requestId ][ "handled" ] = true;
            
            // Call callback (if defined)
            if( this.requests[ requestId ][ "callback" ] !== undefined )
            {
                this.requests[ requestId ][ "callback" ]( reply );
            }
        }
}

    // Now remove all requests
    for( i in replies )
    {
       requestId = replies[i][ "requestId" ]
       delete this.requests[ requestId ];
    }
    
    // If flushing; check if all requests are sent, then call flushCallback
    if( this.flushCallback !== undefined && $.isEmptyObject( this.requests ) )
    {
        this.flushCallback();
        this.flushCallback = undefined;
    }    
};

/**
 * Send open requests if it's time to retry
 * @private
 */
AjaxManager.prototype.retry = function( force )
{
    if( force || ( new Date().getTime() ) - this.lastAttemptTime > this.timeBetweenRetries )
    {
       this.sendOpenRequests();
    }
   
    // Check retry every 250 ms if periodicalSending is true or flushing is true
    if( this.periodicalSending || this.flushCallback !== undefined ) {

        var self = this;
        setTimeout(
           function() {
              self.retry();
           },
           this.timeBetweenRetries
        );
    }
};

/**
 * Make sure that all open requests are being sent and then call this callback
 * (open requests are retried even regardless of periodicalSending)
 * @param {Function} flushCallback After flushing this callback is called
 */
AjaxManager.prototype.flush = function( flushCallback ) {
	this.flushCallback = flushCallback;
	
    if( $.isEmptyObject( this.requests ) )
    {
        if( this.flushCallback !== undefined )
        {
           this.flushCallback();
        }
        this.flushCallback = undefined;
    }
    
    this.retry( true );
};
