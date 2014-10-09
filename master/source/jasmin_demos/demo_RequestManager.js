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
// *** demo_RequestManager
//
// Demonstrates how RequestManager sends a request and receives a response and
// how the RequestManager handles various strange cases

// Path to jasmin
var demoName   = "demo_RequestManager.js";

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
        
// Called on load, setup RequestManager and do a request
start = function()
{
    // Construct RequestManager but set it to inactive
    io = new jasmin.RequestManager( fail, report, report );
    demoJSON();
}

demoJSON = function() {
    report( demoName, "Sending a JSON request to demo_demo_RequestManager_json.json" );

    io.request(
        jasmin.REQUEST_MANAGER_TYPE_AJAX,
        {
            "url"      : "demo_RequestManager_json.json",
            "dataType" : "json"
        },
        demoJS
    );
};

demoJS = function( reply )
{
    report( demoName, "received: " + JSON.stringify( reply ) );
    report( demoName, "Downloading JS from demo_RequestManager_script.js" );
    
    io.request(
        jasmin.REQUEST_MANAGER_TYPE_AJAX,
        {
            "url"      : "demo_RequestManager_script.js",
            "dataType" : "script"
        },
        demoImg
    );    
}
    
demoImg = function( reply )
{
    report( demoName, "received: " + JSON.stringify( reply ) );
    report( demoName, "Downloading image from demo_RequestManager_img.jpg" );
    
    io.request(
        jasmin.REQUEST_MANAGER_TYPE_IMG,
        "demo_RequestManager_img.jpg",
        demoCSS
    );    
}
    
demoCSS = function( reply )
{
    $( "#graphics_here" ).append( reply.css( {
        "width"  : "200px",
        "height" : "200px"
    } ) );
    
    report( demoName, "Downloading CSS from demo_RequestManager_css.css" );    
    io.request(
        jasmin.REQUEST_MANAGER_TYPE_AJAX,
        {
            "url"      : "demo_RequestManager_css.css",
            "dataType" : "text"
        },
        demoDone
    );
};

demoDone = function( reply ) {
    $('<link rel="stylesheet" type="text/css" href="demo_RequestManager_css.css" />' ).appendTo( "head" );
    report( demoName, "<span class='red'>CSS loaded; this text should be red</span>" );
};
