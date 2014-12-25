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
 * Constant for AJAX type requests
 * @constant
 */
jasmin.REQUEST_MANAGER_TYPE_AJAX = 1;

/**
 * Constant for img type requests
 * @constant
 */
jasmin.REQUEST_MANAGER_TYPE_IMG = 2;

/**
 * Features for making AJAX requests, loading CSS and loading images
 * is set up to actively send any outstanding requests. It can
 * be configured to (a) actively send outstanding requests or not; (b) immediately 
 * send a request or to wait until the next try (for bulk sending); (c) flush
 * all open request and call a callback once all have been sent (to send remaining
 * logs at the end of a participation
 * @constructor
 * @param {Function}  fail                Fail callback called with string errorMessage as argument. Defaults to alert
 * @param {Function}  report              callback for detailed reporting on RequestManager state
 * @param {Function}  error               callback for reporting request errors
 * @param {int}       timeout             Default number of ms waited until retrying a request (can be overriden by individual request), default = 4000
 * @param {int}       retries             Default number of retries until failing (can be overriden by individual request), default = 8
 * @param {int}       active              Will always sending and retry requests (true) or only when flushing (false), default = true
 * @param {int}       checkInterval       Number of ms between checking if we should resend anything; default = 300
 */
jasmin.RequestManager = function( 
   fail,   
   error,
   report,
   timeout,
   retries,
   active,
   checkInterval
) {
    this.fail          = fail === undefined? function( errorMessage ) { alert( errorMessage ); } : fail;
    this.error         = error === undefined? function() {}: error; 
    this.report        = report === undefined? function() {}: report; 
    this.timeout       = timeout === undefined? 4000 : timeout;
    this.retries       = retries === undefined? 8 : retries;
    this.active        = active  === undefined? true : active;
    this.checkInterval = checkInterval === undefined? 300: checkInterval;

    // For flushing (sending all remaining requests)
    this.flushing        = false;
    this.flushCallback   = undefined;

    // Constants for request states
    this.STATE_OPEN   = 1;  // Request is being transmitted
    this.STATE_FAILED = 2;  // Request failed
    this.STATE_FIRST  = 3;  // Request that haven't been sent yet

    this.states = {};       // Data on current AJAX states we are working with
    this.stateCounter = 0;  // stateCounter - Assigns unique stateId for each request
    this.transactionCounter = 0; // Counts individual transactions
    
    
    this.failed = false;    // If we permanently failed; don't attempt any ajax requests anymore

    // If we're active; start checking whether there is anything to do
    if( this.active )
    {
        this.check();
    }
};

/**
 * Make a single AJAX request
 * @param {const}    type         jasmin.REQUEST_MANAGER_TYPE_AJAX (request is passed on to jQuery.ajax or jasmin.REQUEST_MANAGER_TYPE_IMG (request is url of img)
 * @param {Object}   request      The request (what do say to which url)
 * @param {function} callback     Callback called on reply (with data replied by target url as argument)
 * @param {int}      timeout      Overrides default value set in constructor
 * @param {int}      retries      Overrides default value set in constructor
 * @return stateId of the request to be sent
 * @public
 */
jasmin.RequestManager.prototype.request = function( type, request, callback, timeout, retries ) {
    // Setup state
    var counter = this.stateCounter;
    this.states[ counter ] = {
        // Copy arguments
        "type"            : type,
        "request"         : request,
        "callback"        : callback,
        "timeout"         : timeout,
        "retries"      : retries,

        // Stuff to initialize
        "state"           : this.STATE_FIRST,
        "retryCounter"  : 0,
        "handled"         : false
    };
    this.stateCounter++;
    
    // If active; send immediately
    if( this.active ) {
        this.sendOpenRequests();
    };
    
    return counter;    
};


/**
 * Send all open states (that should be sent)
 * @private
 */
jasmin.RequestManager.prototype.sendOpenRequests = function() {            
    // Only continue if we are active or flushing and didn't fail 
    if( !( ( this.active || this.flushing ) && !this.failed ) ) {
      return;
    }

    // Get stateIds to send
    var stateIds = this.statesToSend();

    // If anything to send, then send it
    if( stateIds.length > 0 ) {
        // Send each request on the list
        var stateId;          
        for( var i in stateIds ) {
            stateId = stateIds[i];
            transactionId = this.transactionCounter;
            switch( this.states[ stateId ][ "type" ] )
            {
                case jasmin.REQUEST_MANAGER_TYPE_AJAX:
                    this.ajaxRequest( stateId, transactionId );
                    break;
                case jasmin.REQUEST_MANAGER_TYPE_IMG:
                    this.imgRequest( stateId, transactionId );
                    break;
            }
            
            this.transactionCounter++;
        
            // Update state
            this.states[ stateId ][ "state"          ] = this.STATE_OPEN;
            this.states[ stateId ][ "retryCounter" ]++;
            this.states[ stateId ][ "attemptTime"    ] = new Date().getTime();
        }
    }
};


/**
 * Process all open states (do nothing, add to sendlist, or fail)
 * @return stateIds to retry
 * @private
 */
jasmin.RequestManager.prototype.statesToSend = function()
{
    var time      = new Date().getTime();        // Get time
    var sendList  = new Array();       // Requests to retry

    // Check which states to add to sendList
    var timeout, retries;
    for( var i in this.states ) {
      // Check for now and open
      switch( this.states[i][ "state" ] ) {
        // Now? immediately add to sendList
        case this.STATE_FIRST:
            sendList.push( i );
            this.report(
               "RequestManager.statesToSend: ",
               "stateId " + i + ". STATE_FIRST"
               );
            break;
        // Open? Fail if timed out
        case this.STATE_OPEN:
          // get default or overriden value of timeout
          timeout = this.states[i][ "timeout" ] === undefined? this.timeout : this.states[i][ "timeout" ];
          // If timed out, then failed, add to list
          if( time - this.states[i][ "attemptTime" ] > timeout )
          {
             this.report(
                "RequestManager.statesToSend",
                "stateId " + i + " open and timed out"
                );

             // Timed out -> state to failed
             this.states[i][ "state" ] = this.STATE_FAILED;
          }
          break;
      }

      // Handle failed request -> retry if attempts not exceeded
      if( this.states[i][ "state" ] === this.STATE_FAILED )
      {
         // get default or overriden value of retries
         retries = this.states[i][ "retries" ] === undefined? this.retries : this.states[i][ "retries" ];
      
         // Check if max attempts exceeded
         if( this.states[i][ "retryCounter" ] >= this.retries )
         {
            this.report(
               "RequestManager.statesToSend",
               "stateId " + i + " failed; Exceeded " + this.retries + " attempts"
               );

            // We officially failed
            if( !this.failed )
            {
               this.failed = true;
               this.fail( "RequestManager: Max attempts exceeded" );
            }
         }
         else
         {
            this.report(
               "RequestManager.statesToSend",
               "stateId " + i + " added to sendList"
               );

            sendList.push( i );
         }
      }
   }

   return sendList;
};


/**
 * Do an (asynchronous) AJAX request. Request is associative array passed on
 * to jQuery.ajax
 * @param stateId 
 * @param transactionId
 * @private
 */
jasmin.RequestManager.prototype.ajaxRequest = function( stateId, transactionId )
{
    // arguments to pass to jQuery.ajax
    var ajaxArgs = this.states[ stateId ][ "request" ];
  
    // Report ajax
    this.report(
       "RequestManager.ajaxRequest",
       "stateId = " + stateId + ", transactionId = " + transactionId + ", ajaxArgs = " + JSON.stringify( ajaxArgs )
    );    
   
    // Send
    var self = this;    
    var ajax = $.ajax( ajaxArgs );
    ajax.done(  function( response, status ) {
        // Report replies
        self.report(
            "RequestManager AJAX done",
            "stateId " + stateId + ", transactionId " + transactionId + ", status " + status + ", received:" + JSON.stringify( response )
        );           
        self.success( stateId, response );
    } );
    ajax.fail( function( response, status ){
        // Error; only report it, let the request time out and retry
        self.error( 
            "RequestManager AJAX fail", 
            "stateId " + stateId + ", transactionId " + transactionId + ", status " + status + ", received:" + JSON.stringify( response )
        );
    } );
};

// Downloading an img
jasmin.RequestManager.prototype.imgRequest = function( stateId, transactionId ) {
    var url = this.states[ stateId ][ "request" ];

    // Report ajax
    this.report(
       "RequestManager.imgRequest",
       "stateId = " + stateId + ", transactionId = " + transactionId + ", url = " + JSON.stringify( url )
    );    

    var self = this;
    this.states[ stateId ][ "reply" ] = $( "<img>" ).attr( 
        "src", url
    ).load( function() {
        // Report replies
        self.report(
            "RequestManager img load",
            "stateId " + stateId + ", transactionId " + transactionId 
        );        
        self.success( stateId, self.states[ stateId ][ "reply" ] );
    } ).error( function() {
        self.error( 
            "RequestManager img error", 
            "stateId " + stateId + ", transactionId " + transactionId
        );        
    } );
};

/**
 * On success, handle request; call callback with argument reply and remove state
 * @param stateId
 * @param reply
 * @private
 */
jasmin.RequestManager.prototype.success = function( stateId, reply ) {
    // Check if state still exists and is not handled, if so, handle it
    if( this.states[ stateId ] !== undefined && !this.states[ stateId ][ "handled" ] ) {
        // Request is now handled
        this.states[ stateId ][ "handled" ] = true;

        // Call callback (if defined)
        if( this.states[ stateId ][ "callback" ] !== undefined ) {
            try {
               this.states[ stateId ][ "callback" ]( reply );
            } catch( e ) {}
        }
        
        // Remove state
        delete this.states[ stateId ];
    }
    
    // If flushing; check if all requests are sent, then call flushCallback
    if( this.flushing && $.isEmptyObject( this.states ) ) {
        this.flushing = false;
        if( this.flushCallback !== undefined ) {
            this.flushCallback();
        }
    }    
};

/**
 * Check if we should send open requests 
 * @private
 */
jasmin.RequestManager.prototype.check = function()
{
    // Keep sending open requests if we are active or flushing and haven't failed yet
    // NB - this expression is also tested at start of sendOpenRequests
    if( ( this.active || this.flushing ) && !this.failed  ) {
        this.sendOpenRequests();
        var self = this;
        setTimeout(
           function() {
              self.check();
           },
           this.checkInterval
        );
    }
};

/**
 * Make sure that all open requests are being sent and then call this callback
 * (open requests are retried even regardless of active)
 * @param {Function} flushCallback After flushing this callback is called
 */
jasmin.RequestManager.prototype.flush = function( flushCallback ) {
    this.flushing      = true;
	this.flushCallback = flushCallback;
	
    if( $.isEmptyObject( this.states ) )
    {
        if( this.flushCallback !== undefined )
        {
           this.flushCallback();
        }
    }
    
    this.check();
};