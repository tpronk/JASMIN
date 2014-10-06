/**
 * Ajax Constructor. AjaxManager manages client server communication
 * @constructor
 * @param {String}    url                 URL to communicate with; config[ "ajax_url" ]
 * @param {Function}  report              Report callback (see reporter); config[ "report" ]
 * @param {Function}  fail                Fail callback (called with errorMessage as argument); config[ "ajax_fail" ]
 * @param {int}       timeBetweenRetries  Ms waited until retrying a request; config[ "ajax_timeout" ]
 * @param {int}       maxRetries          Number of retries until failing; config[ "ajax_retries" ]
 * @param {bool}      ajaxEnabled         If false, the AjaxManager does not process requests
 */
function AjaxManager( 
   url,
   runId,
   report,
   fail,
   timeBetweenRetries,
   maxRetries,
   ajaxEnabled
) {
   this.url                = url;
   this.runId              = runId;
   this.report             = report;
   this.fail               = fail;
   this.timeBetweenRetries = timeBetweenRetries;
   this.maxRetries         = maxRetries;
   this.ajaxEnabled        = ajaxEnabled === false? false: true;
   this.flushCallback      = undefined;

   // Report
   this.report( "AjaxManager.construct", "" );    

   // Constants for request states
   this.STATE_OPEN   = 1;  // Request is being transmitted
   this.STATE_FAILED = 2;  // Request failed
   this.STATE_NOW    = 3;  // Request should be sent immediately

   // Current AJAX request we are working on
   this.requests = {};

   // RequestCounter - All requests made to the AjaxManager via send
   this.requestCounter = 0;

   // AjaxCounter - Sequence number for ajax calls
   this.ajaxCounter = 0;

   // If we permanently failed; don't attempt any ajax requests anymore
   this.failed = false;

   // Start running
   var self = this;

   setInterval(
      function() {
         self.retry();
      },
      this.timeBetweenRetries
   );
}

/**
 * Do an AJAX request
 * @param data         Data to send
 * @param synchronous  Synchronous call? (if true, pause script until we get a reply)
 */
AjaxManager.prototype.doAjax = function( data, synchronous )
{
   var ajaxId = this.ajaxCounter;

   // Send
   request = $.ajax({
      url:      this.url,
      "async":  !synchronous,
      data:     "data=" +  encodeURI( JSON.stringify( data ) ),
      type:     "POST",
      context:  this,
      success:  function( data, status ) {
         this.ajaxState( data, status, ajaxId )
         },
      error:    function( data, status ) {
         this.ajaxState( data, status, ajaxId )
         },
   });

   // Increment ajaxCounter
   this.ajaxCounter++;

   // Return ajaxCounter of current call
   return ajaxId;
}

/**
 * Send multiple requests 
 * @param requests     Requests to send. 
 * @param immediately  Send immediately? (default true)
 * @return             requestIds of the requests to be sent
 */
AjaxManager.prototype.send_multi = function( requests, immediately )
{
   // Add each request
   var requestIds = [];
   for( var i in requests )
   {
      // Add the request
      var requestId = this.addRequest( {
         "async"           : true,
         "state"           : this.STATE_NOW,
         "attemptCounter"  : 0,
         "request"         : requests[i]
      } );
      requestIds.push( requestId );
   }
    
   // Should we send immediately? 
   immediately = immediately === undefined? true: immediately;
    
   // Report 
   this.report( 
      "AjaxManager.send_multi",
      "Immediately: " + immediately + ", requests:\n" + vardump( requests )
      );

   if( immediately )
   {
      this.sendOpenRequests();
   }
    
   return requestIds;
}

/**
 * Send a single request
 * @param request      Request to send. 
 * @param immediately  Send immediately? (default true)
 * @return             requestId of the request to be sent
 */
AjaxManager.prototype.send = function( request, immediately )
{
   var requestId = this.addRequest( {
      "async"           : true,
      "state"           : this.STATE_NOW,
      "attemptCounter"  : 0,
      "request"         : request
   } );

   // Attempt send if immediately
   immediately = immediately === undefined? true: immediately;
    
   // Report
   this.report(
      "AjaxManager.send",
      "requestId " + requestId + ", immediately: " + immediately + ", content:\n" + vardump( request )
      );

   if( immediately )
   {
      this.sendOpenRequests();
   }
    
   return requestId;
}

/*
 * Add a request to the requests array
 * @param request      Request to add.
 * @return             Index at which request has been added, or undefined if no AJAX enabled
 */
AjaxManager.prototype.addRequest = function( request )
{
   // Don't do anything is not enabled
   if( !this.ajaxEnabled )
   {
      return undefined;
   }

   var counter = this.requestCounter;
   this.requests[ counter ] = request;
   this.requestCounter++;
   return counter;
}

/**
 * Send all open requests (that should be sent)
 */
AjaxManager.prototype.sendOpenRequests = function()
{            
   // Stop if we failed
   if( this.failed )
   {
      return;
   }

   // Request content
   var data = new Object();

   // Get requestIds to send
   var requestIds = this.requestsToSend( this.timeBetweenRetries );
   
   // If anything to send, then send it
   if( requestIds.length > 0 )
   {
      // Construct request data, and update request states
      var requestId;          // Current requestId
      for( var i in requestIds )
      {
         requestId = requestIds[i];

         // Add to data
         data[ requestId ] = {};
		 data[ requestId ][ "runId"          ] = this.runId;
         data[ requestId ][ "requestId"      ] = requestId;
         data[ requestId ][ "attemptCounter" ] = this.requests[ requestId ][ "attemptCounter" ];
         data[ requestId ][ "request"        ] = this.requests[ requestId ][ "request" ];

         // Update state
         this.requests[ requestId ][ "state"          ] = this.STATE_OPEN;
         this.requests[ requestId ][ "attemptCounter" ]++;
         this.requests[ requestId ][ "attemptTime"    ] = new Date().getTime();
      }

      // Set time of most recent attempt
      this.lastAttemptTime = new Date().getTime();

      // Send
      var ajaxId = this.doAjax(
         data,  // Data to send
         false
         );

      // Report we've started a request
      this.report(
         "AjaxManager.sendOpenRequests",
         "ajaxId " + ajaxId + ". Data:\n" + vardump( data )
         );
   }
}

/**
 * Process all open requests (do nothing, add to sendlist, or timeout)
 * @return requestIds to retry
 */
AjaxManager.prototype.requestsToSend = function( timeBetweenRetries )
{
   var time      = new Date().getTime();        // Get time
   var sendList  = new Array();       // Requests to retry

   // Check which requests to add to  sendList
   for( var i in this.requests )
   {
      //alert( i )

      // Check for now and open
      switch( this.requests[i][ "state" ] )
      {
         case this.STATE_NOW:
            sendList.push( i );
            this.report(
               "AjaxManager.requestsToSend",
               "requestId " + i + ". State now"
               );
            break;
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

      //alert(  i )

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
 * Update state (called upon an AJAX response)
 * @param rawData JSON data returned by AJAX response
 * @param status  The state of the response (error or success)
 * @param ajaxId  ajaxId that this response is to
 */
AjaxManager.prototype.ajaxState = function( rawData, status, ajaxId )
{
   var data;

   // Did request succeed or fail?
   switch( status )
   {
      case "success":
         // Succeed; remove requests, parse data, and call successs

         // Report that AJAX call was succesful
         this.report(
            "AjaxManager.ajaxState",
            "ajaxId " + ajaxId + ". AJAX transmission was succesful, received:\n" + rawData
            );

         // Try to parse JSON
         try {
            data = JSON.parse( rawData );
         } catch( e ) {
            // Report that a JSON error occurred
            this.report(
               "AjaxManager.ajaxState",
               "ajaxId " + ajaxId + ". JSON error occurred while decoding a reply"
               );
            return;
         }

         // Process each reply all requests from the list and call successs
         for( var i in data )
         {
            requestId = data[i][ "requestId" ];
            // Check if requests still exists, if so, handle it
            if( this.requests[ requestId ] !== undefined )
            {
               data[i][ "request" ] = this.requests[ requestId ];

               // Report that request was completed
               this.report(
                  "AjaxManager.ajaxState",
                  "requestId " + requestId + " completed, data:\n" + vardump( data[i] )
                  );

               // Call success
               this.requests[ requestId ][ "request" ][ "success" ]( data[i] );
            }
         }
            
         // Now remove all requests
         for( i in data )
         {                
            requestId = data[i][ "requestId" ];
            delete this.requests[ requestId ];
         }
		 
		 // If flushing; check if all requests are sent, then call flushCallback
		 if( this.flushCallback !== undefined && $.isEmptyObject( this.requests ) )
	     {
			 this.flushCallback();
			 this.flushCallback = undefined;
		 }

         break;
      case "error":
         // Report that AJAX call failed
         this.report(
            "AjaxManager.ajaxState",
            "ajaxId " + ajaxId + " had an error, data:\n" + vardump( rawData )
            );
         //alert( vardump( rawData ) );
         break;
   }
}

/**
 * Send open requests if it's time to retry
 */
AjaxManager.prototype.retry = function()
{
   if( ( new Date().getTime() ) - this.lastAttemptTime > this.timeBetweenRetries )
   {
      this.sendOpenRequests();
   }
}

/**
 * Once all open requests have been sent, call this callback
 */
AjaxManager.prototype.flush = function( flushCallback )
{
	this.flushCallback = flushCallback;
	
	 if( $.isEmptyObject( this.requests ) )
	 {
         if( this.flushCallback !== undefined )
         {
            this.flushCallback();
         }
		 this.flushCallback = undefined;
	 }
}
