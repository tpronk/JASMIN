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
// *** demo_Loader
//
// Demonstrates how the loader loads JSON and images

// Path to jasmin
var demoName   = "demo_Loader.js";

// Called on page load
load = function() {
    // Load ScalableCanvas JS file
    getScripts( [
            jasminPath + "jasmin_core/AjaxManager.js",
            jasminPath + "jasmin_core/Loader.js"
        ],
        start
    );
};

// Called if AJAX fails
fail = function( message )
{
    report( demoName, "Failed: " + message );
};
        
// Called on load, setup AjaxManager, Loader, and start loading
start = function()
{
    // Construct AjaxManager but disable periodicalSending
    ajax = new AjaxManager(
        "demo_Loader.json",                // Target URL
        "demo",                            // id; identifies current session
        fail,                              // fail callback
        report,                            // report callback
        4000,                              // timeBetweenRetries
        4,                                 // maxRetries
        false                              // peridocalSending
    );

    loader = new Loader(
        ajax,
        fail
    );

    var requests = {
        "request0" : "data of request 0",
        "request1" : "data of request 1"
    };
    
    var images = {
        "burger" : "demo_Loader_burger.jpg",
        "salad"  : "demo_Loader_salad.jpg"
    };

    loader.load(
        requests,          
        images,            
        allLoaded,          
        progressCallback
    );
}

progressCallback = function( progress ) {
    report( demoName, "Progress: " + progress );
};

allLoaded = function( jsonResults, imageResults ) {
    report( demoName, "All Loaded. json: " + JSON.stringify( jsonResults ) );
    $( "#graphics_here" ).append( imageResults[ "burger" ].css( {
        "width"  : "200px",
        "height" : "200px"
    } ) );
    $( "#graphics_here" ).append( imageResults[ "salad" ].css( {
        "width"  : "200px",
        "height" : "200px"
    } ) );    
};