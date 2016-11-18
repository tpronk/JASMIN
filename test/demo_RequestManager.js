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

var demoName   = "demo_RequestManager.js";

// Called on page load
load = function() {
    getScripts( [
            pathSrc + "RequestManager.js",
            pathExt + "jquery.binarytransport-1.0.js"
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
    // Construct RequestManager 
    io = new jasmin.RequestManager(fail);
    demoJSON();
}

demoJSON = function() {
    report( demoName, "Sending a JSON request to demo_demo_RequestManager_json.json" );

    io.request(
        jasmin.RequestManager.TYPE_AJAX,
        {
            "url"      : "files/demo_RequestManager_json.json",
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
        jasmin.RequestManager.TYPE_AJAX,
        {
            "url"      : "files/demo_RequestManager_script.js",
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
        jasmin.RequestManager.TYPE_IMG,
        "files/demo_RequestManager_img.jpg",
        demoCSS
    );    
}
    
demoCSS = function( reply )
{
    report( demoName, "received image" );
    $( "#graphics_here" ).append( reply.css( {
        "width"  : "200px",
        "height" : "200px"
    } ) );
    
    report( demoName, "Downloading CSS from demo_RequestManager_css.css" );    
    io.request(
        jasmin.RequestManager.TYPE_AJAX,
        {
            "url"      : "files/demo_RequestManager_css.css",
            "dataType" : "text"
        },
        demoWOFF
    );
};

demoWOFF = function( reply ) {
    report( demoName, "received CSS" );
    $('<link rel="stylesheet" type="text/css" href="files/demo_RequestManager_css.css" />' ).appendTo( "head" );
    $("#text_here").append("<span class='red'>CSS loaded; this text should be red</span><br />");
    
    report( demoName, "Downloading font from SourceSansPro-Regular.woff" );    
    io.request(
        jasmin.RequestManager.TYPE_AJAX,
        {
            "url"      : "files/SourceSansPro-Regular.woff",
            "dataType" : "binary",
            "processData" : false
        },
        demoDone
    );   
};

demoDone = function( reply ) {
    report( demoName, "received font" );
    style = 
          '<style type="text/css">@font-face {'
        + 'src : url("'    + "files/SourceSansPro-Regular.woff" + '");'
        + 'font-family : ' + "SourceSansPro" + ';'
        + 'font-weight : ' + "normal" + ';'
        + 'font-style  : ' + "normal" + ';'
        + '}';
    $( "head" ).prepend( style );    
    $("#text_here").append("<span style='font-family:SourceSansPro'>Font loaded; this text should be in SourceSansPro</span><br />");
};


