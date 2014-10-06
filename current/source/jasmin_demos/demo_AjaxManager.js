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
// *** demo_AjaxManager
//
// Demonstrates how AjaxManager sends a request and receives a response and
// how the AjaxManager handles various strange cases

// Path to jasmin
var demoName   = "demo_AjaxManager.js";

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
    // Construct AjaxManager
    ajax = new AjaxManager(
        "demo_AjaxManager_sendOne.json",   // Target URL
        "demo",                            // id; identifies current session
        ajaxFail,                          // fail callback
        report                             // report callback
    );

    demoOne();
}

demoOne = function() {
    report( demoName, "Sending one request to demo_AjaxManager_sendOne.json" );

    ajax.sendOne( 
        "data from client",  // data
        demoMulti,           // callback
        true                 // immediately
    );
};

// Called on load, setup AjaxManager and do a request
demoMulti = function( reply )
{
    report( demoName, "Sending two requests to demo_AjaxManager_sendMulti.json" );
    
    ajax.url = "demo_AjaxManager_sendMulti.json";
    replies = 0;   // Count sucesses
    ajax.sendMulti( [ {
            "data"     : "request data 1",
            "callback" : multiSuccess
        }, {
            "data"     : "request data 2",
            "callback" : multiSuccess
        } ],
        true
    );    
};

// Count sucesses; if we arrive at two go on to next request
multiSuccess = function( reply )
{
    replies++;
    if( replies == 2 )
    {
        demoInvalid();
    }
}


// Called on load, setup AjaxManager and do a request
demoInvalid = function( reply )
{
    report( demoName, "Sending two requests to demo_AjaxManager_repliesInvalid.json" );
    report( demoName, "requestId 3 gets two identical replies, request 4 gets no replies, and a reply with requestId 5 is returned (which has no exisiting request)" );
    
    ajax.url = "demo_AjaxManager_repliesInvalid.json";
    replies = 0;   // Count sucesses
    ajax.sendMulti( [ {
            "data"     : "request data 1",
            "callback" : multiSuccess
        }, {
            "data"     : "request data 2",
            "callback" : multiSuccess
        } ],
        true
    );    
};


