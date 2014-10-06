// Copyright 2014, Thomas Pronk
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License. 

// ****************
// *** demo_AjaxManager_flush
//
// Demonstrates how to setup the AjaxManager not to send any requests until 
// explicitly told to do so via a flush

// Path to jasmin
var demoName   = "demo_AjaxManager_flush.js";

// Called on page load
load = function() {
    // Load ScalableCanvas JS file
    getScripts( [
            jasminPath + "jasmin_core/AjaxManager.js"
        ],
        ajaxStart
    );
};

// Called if AJAX fails
ajaxFail = function( message )
{
    report( demoName, "AJAX fail: " + message );
};
        
// Called on load, setup AjaxManager and do a request
ajaxStart = function()
{
    // Construct AjaxManager but disable periodicalSending
    ajax = new AjaxManager(
        "demo_AjaxManager_flush.json",     // Target URL
        "demo",                            // id; identifies current session
        ajaxFail,                          // fail callback
        report,                            // report callback
        4000,                              // timeBetweenRetries
        4,                                 // maxRetries
        false                              // peridocalSending
    );

    // Send a request
    report( demoName, "Adding one request to the queue" );
    ajax.sendOne( 
        "data from client",  // data
        function() {}        // callback
    );

    setTimeout( 
        sendMore,
        2000
    );
}

sendMore = function() {
    // Send another request
    report( demoName, "Adding another request to the queue" );
    ajax.sendOne( 
        "more data from client",  // data
        function() {}             // callback
    );

    setTimeout( 
        flush,
        2000
    );
};

flush = function( reply ) {
    report( demoName, "Flushing AjaxManager" );
    ajax.flush( allDone );
};

allDone = function() {
   report( demoName, "All open requests have now been sent" );
}
