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
var demoName   = "demo_RequestManager_flush.js";

// Called on page load
load = function() {
    // Load ScalableCanvas JS file
    getScripts( [
            jasminPath + "jasmin_core/RequestManager.js"
        ],
        start
    );
};

// Called if AJAX fails
fail = function( message )
{
    report( demoName, "AJAX fail: " + message );
};
        
// Called on load, setup AjaxManager and do a request
start = function()
{
    // Construct inactive AjaxManager 
    io = new jasmin.RequestManager( fail, report, report, undefined, undefined, false );
    
    report( demoName, "Making 2 request; flushing in 2 seconds..." );
    io.request(
        jasmin.REQUEST_MANAGER_TYPE_AJAX,
        {
            "url"      : "files/demo_RequestManager_json.json",
            "dataType" : "json"
        },
        function( reply ) {
            report( demoName, "json loaded: " + JSON.stringify( reply ) );
        }
    );    

    io.request(
        jasmin.REQUEST_MANAGER_TYPE_AJAX,
        {
            "url"      : "files/demo_RequestManager_script.js",
            "dataType" : "script"
        },
        function( reply ) {
            report( demoName, "js loaded: " + JSON.stringify( reply ) );
        }
    );   
    
    setTimeout( 
        function() { 
            report( demoName, "Starting flush" );
            io.flush( flushed );
        },
        2000
    );
}

flushed = function() {
    report( demoName, "Flush done!" );
};
