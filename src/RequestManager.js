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
 * Features for making AJAX requests, loading CSS and loading images
 * is set up to actively send any outstanding requests. It can
 * be configured to (a) actively send outstanding requests or not; (b) immediately 
 * send a request or to wait until the next try (for bulk sending); (c) flush
 * all open request and call a callback once all have been sent (to send remaining
 * logs at the end of a participation
 * @constructor
 * @param {Function}  fail                callback called if RequestManager fails
 * @param {int}       timeout             Default number of ms waited until retrying a request (can be overriden by individual request), default = 4000
 * @param {int}       retries             Default number of retries until failing (can be overriden by individual request), default = 8
 * @param {int}       active              Will always sending and retry requests (true) or only when flushing (false), default = true
 * @param {int}       checkInterval       Number of ms between checking if we should resend anything; default = 300
 */
jasmin.RequestManager = function ( 
   fail,
   timeout,
   retries,
   active,
   checkInterval
) {
   this.fail          = fail === undefined? function () {}: fail; 
   this.timeout       = timeout === undefined? 16000: timeout;
   this.retries       = retries === undefined? 16: retries;
   this.active        = active  === undefined? true: active;
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
   this.errorLogs = []; // Log of all errors

   this.failed = false;    // If we permanently failed; don't attempt any ajax requests anymore

   // If we're active; start checking whether there is anything to do
   if(this.active) {
      this.check();
   }
};

jasmin.RequestManager.prototype.error = function (errorMessage) {
   this.errorLogs.push(errorMessage);
}

/**
 * Constant for AJAX type requests
 * @constant
 */
jasmin.RequestManager.TYPE_AJAX = "ajax";

/**
 * Constant for img type requests
 * @constant
 */
jasmin.RequestManager.TYPE_IMG = "img";

/**
 * Constant for audio type requests
 * @constant
 */
jasmin.RequestManager.TYPE_AUDIO = "audio";

/**
 * Make a single request
 * @param {const}    type         jasmin.RequestManager.TYPE_AJAX (request is passed on to jQuery.ajax or jasmin.RequestManager.TYPE_IMG (request is url of img)
 * @param {Object}   request      The request (what do say to which url)
 * @param {function} callback     Callback called on reply (with data replied by target url as argument)
 * @param {int}      timeout      Overrides default value set in constructor
 * @param {int}      retries      Overrides default value set in constructor
 * @return stateId of the request to be sent
 * @public
 */
jasmin.RequestManager.prototype.request = function (type, request, callback, timeout, retries) {
   // Setup state
   var counter = this.stateCounter;
   this.states[counter] = {
      // Copy arguments
      "type"            : type,
      "request"         : request,
      "callback"        : callback,
      "timeout"         : timeout,
      "retries"         : retries,

      // Stuff to initialize
      "state"           : this.STATE_FIRST,
      "retryCounter"    : 0,
      "handled"         : false
   };
   this.stateCounter++;

   // Report
   DEBUG && console.log("RequestManager.request, stateId " + counter);
   DEBUG && console.log(request);

   // If active; send immediately
   if (this.active) {
      this.sendOpenRequests();
   };

   return counter;    
};


/**
 * Send all open states (that should be sent)
 * @private
 */
jasmin.RequestManager.prototype.sendOpenRequests = function () {            
   // Only continue if we are active or flushing and didn't fail 
   if (!((this.active || this.flushing) && !this.failed)) {
     return;
   }
   // Get stateIds to send
   var stateIds = this.statesToSend();
   // If anything to send, then send it
   if (stateIds.length > 0) {
      // Send each request on the list
      var stateId;          
      for (var i in stateIds) {
         stateId = stateIds[i];
         transactionId = this.transactionCounter;
         switch (this.states[stateId]["type"]) {
            case jasmin.RequestManager.TYPE_AJAX:
               this.ajaxRequest(stateId, transactionId);
               break;
            case jasmin.RequestManager.TYPE_IMG:
               this.imgRequest(stateId, transactionId);
               break;
            case jasmin.RequestManager.TYPE_AUDIO:
               this.audioRequest(stateId, transactionId);
               break;
         }

         this.transactionCounter++;

         // Update state
         this.states[stateId]["state"] = this.STATE_OPEN;
         this.states[stateId]["retryCounter" ]++;
         this.states[stateId]["attemptTime"] = new Date().getTime();
      }
   }
};


/**
 * Process all open states (do nothing, add to sendlist, or fail)
 * @return stateIds to retry
 * @private
 */
jasmin.RequestManager.prototype.statesToSend = function () {
   var time      = new Date().getTime();        // Get time
   var sendList  = new Array();       // Requests to retry

   // Check which states to add to sendList
   var timeout, retries;
   for (var i in this.states) {
      // Check for now and open
      switch (this.states[i]["state"]) {
         // Now? immediately add to sendList
         case this.STATE_FIRST:
            sendList.push(i);
            DEBUG && console.log("RequestManager.statesToSend, stateId " + i + ", STATE_FIRST");
            break;
         // Open? Fail if timed out
         case this.STATE_OPEN:
            // get default or overriden value of timeout
            timeout = this.states[i]["timeout"] === undefined? this.timeout : this.states[i]["timeout"];
            // If timed out, then failed, add to list
            if (time - this.states[i]["attemptTime"] > timeout) {
               DEBUG && console.log("RequestManager.statesToSend, stateId " + i + " open and timed out");
               // Add to errorLog
               this.error(
                  "ajax timed out, stateId " + i + 
                  ", request " + JSON.stringify(this.states[i]["request"])
               );


               // Timed out -> state to failed
               this.states[i]["state"] = this.STATE_FAILED;
            }
            break;
      }

      // Handle failed request -> retry if attempts not exceeded
      if (this.states[i]["state"] === this.STATE_FAILED) {
         // get default or overriden value of retries
         retries = this.states[i]["retries"] === undefined? this.retries : this.states[i]["retries"];
      
         // Check if max attempts exceeded
         if (this.states[i]["retryCounter"] >= this.retries) {
            DEBUG && console.log("RequestManager.statesToSend, stateId " + i + " failed; Exceeded " + this.retries + " attempts");

            // We officially failed
            if (!this.failed) {
               this.failed = true;
               this.error("Max attempts exceeded");
               this.fail(this.errorLogs);
            }
         } else {
            DEBUG && console.log("RequestManager.statesToSend, stateId " + i + " added to sendList");
            sendList.push(i);
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
jasmin.RequestManager.prototype.ajaxRequest = function (stateId, transactionId) {
   // arguments to pass to jQuery.ajax
   var ajaxArgs = this.states[stateId]["request"];
   ajaxArgs["cache"] = false;
   
   // Report ajax
   DEBUG && console.log("RequestManager.ajaxRequest, stateId = " + stateId + ", transactionId = " + transactionId);
   DEBUG && console.log(ajaxArgs);

   // Send
   var self = this;    
   var ajax = $.ajax(ajaxArgs);
   ajax.done(
      function (response, status) {
         // Report replies
         DEBUG && console.log("RequestManager ajax.done, stateId " + stateId + ", transactionId " + transactionId + ", status " + status);
         DEBUG && console.log(ajaxArgs);
         DEBUG && console.log(response);
         self.success( stateId, response );
      } 
   );
   ajax.fail( 
      function (response, status) {
         DEBUG && console.log("RequestManager ajax.fail, stateId " + stateId + ", transactionId " + transactionId + ", status " + status);
         DEBUG && console.log(ajaxArgs);
         DEBUG && console.log(response);
         // Error; only report it, let the request time out and retry
         self.error("ajax.fail, stateId " + stateId + ", transactionId " + transactionId + ", status " + status + ", ajaxArgs: " + JSON.stringify(ajaxArgs) + ", response:" + JSON.stringify(response));
      }
   );
};

// Downloading an img
jasmin.RequestManager.prototype.imgRequest = function (stateId, transactionId) {
   var url = this.states[stateId]["request"];

   // Report ajax
   DEBUG && console.log("RequestManager.imgRequest, stateId = " + stateId + ", transactionId = " + transactionId + ", url = " + url);

   var self = this;
   this.states[stateId]["reply"] = $("<img>").attr(
      "src", url + "?_=" + new Date().getTime()
   ).load(function () {
      if (self.states[stateId]["reply"] === undefined) {
         self.error("img reply undefined, stateId " + stateId + ", transactionId " + transactionId + ", url " + url);
      }
      DEBUG && console.log("RequestManager img load, stateId " + stateId + ", transactionId " + transactionId); 
      self.success(stateId, self.states[stateId]["reply"]);
   }).error(function () {
       self.error("img error, stateId " + stateId + ", transactionId " + transactionId + ", url " + url);
   });
};

// Downloading an audio
jasmin.RequestManager.prototype.audioRequest = function (stateId, transactionId) {
   var url = this.states[stateId]["request"];

   // Report ajax
   DEBUG && console.log("RequestManager.audioRequest, stateId = " + stateId + ", transactionId = " + transactionId + ", url = " + url);

   var self = this;
   var audio = document.createElement("audio");
   this.states[stateId]["reply"] = audio;
   self.states[stateId]["onerror"] = function () {
      self.error("audio error, stateId " + stateId + ", transactionId " + transactionId + ", url " + url);
   };
   self.states[stateId]["oncanplaythrough"] = function () {
      audio.removeEventListener("error", self.states[stateId]["onerror"]);
      audio.removeEventListener("canplaythrough", self.states[stateId]["oncanplaythrough"]);
      self.success(stateId, self.states[stateId]["reply"]);
   };
   audio.addEventListener("error", self.states[stateId]["onerror"]);
   audio.addEventListener("canplaythrough", self.states[stateId]["oncanplaythrough"]);
   audio.preload = "auto";
   audio.src = url;
};

/**
 * On success, handle request; call callback with argument reply and remove state
 * @param stateId
 * @param reply
 * @private
 */
jasmin.RequestManager.prototype.success = function (stateId, reply) {
   // Check if state still exists and is not handled, if so, handle it
   if (this.states[stateId] !== undefined && !this.states[stateId]["handled"]) {
      // Request is now handled
      this.states[stateId]["handled"] = true;

      // Call callback (if defined)
      if (this.states[stateId]["callback"] !== undefined) {
         try {
            this.states[stateId]["callback"](reply);
         } catch(e) {}
      }

      // Remove state
      delete this.states[stateId];
   }

   // If flushing; check if all requests are sent, then call flushCallback
   if (this.flushing && $.isEmptyObject(this.states)) {
      this.flushing = false;
      if (this.flushCallback !== undefined) {
          this.flushCallback();
      }
   }    
};

/**
 * Check if we should send open requests 
 * @private
 */
jasmin.RequestManager.prototype.check = function () {
   // Keep sending open requests if we are active or flushing and haven't failed yet
   // NB - the same expression is also evaluated at start of sendOpenRequests
   if ((this.active || this.flushing) && !this.failed) {
      this.sendOpenRequests();
      var self = this;
      setTimeout(
         function () {
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
jasmin.RequestManager.prototype.flush = function (flushCallback) {
   this.flushing      = true;
	this.flushCallback = flushCallback;
   if ($.isEmptyObject(this.states)) {
      if (this.flushCallback !== undefined) {
         this.flushCallback();
      }
   }

   this.check();
};