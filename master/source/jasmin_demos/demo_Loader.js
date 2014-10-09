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
            jasminPath + "jasmin_core/RequestManager.js",
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
    report( demoName, "<span class='red'>Loading includes and data...</span>" );    
    
    io = new jasmin.RequestManager( fail, report, report );
    loader = new jasmin.Loader( io );

    // Specify all data you want to load here; special case for img, all else is passed to jQuery.ajax as dataType
    // Note that includes is an associative array
    var requests = {
        "css1"       : [ "css",    "demo_RequestManager_css.css"   ],
        "j1"         : [ "script", "demo_RequestManager_script.js" ],
        "my_json"    : [ "json",   "demo_RequestManager_json.json" ],
        "my_picture" : [ "img",    "demo_RequestManager_img.jpg" ]
    };

    loader.load( requests, allLoaded, progressCallback );
};

progressCallback = function( progress ) {
    report( demoName, "Progress: " + progress );
};

// All loaded, show my_json and my_picture
allLoaded = function( replies ) {
    report( demoName, "All loaded, my_json = " + JSON.stringify( replies[ "my_json" ] ) );
    $( "#graphics_here" ).append( replies[ "my_picture" ].css( {
        "width"  : "200px",
        "height" : "200px"
    } ) );
};