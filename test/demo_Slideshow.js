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
// *** demo_ResponseManager_pointer
//
// Demonstrates how the ResponseManager can register pointer responses via
// vmousedown
// Assignments:
//   - Let the ResponseManager register vmouseup   responses
//   - Let the ResponseManager register touchstart responses (need touchscreen for this)

// Name of this demo
var demoName   = "demo_ResponseManager_pointer.js";

// Called on page load
load = function() {
    getScripts( [
            pathExt + "jquery.mobile-1.4.5.js",
            pathSrc + "SyncTimer.js",
            pathSrc + "ResponseManager.js",
            pathSrc + "EventManager.js",
            pathSrc + "TableLogger.js",
            pathSrc + "Slideshow.js"
        ],
        setupDemo
    );
};

// Initialise pointer fields and create eventManager
setupDemo = function() {
    $( "#graphics_here" ).append( 
        $( "<p>" ).attr( {
            "id" : "text_container"
        } ).css( {
            "position" : "absolute",
            "width" : "220px",            
            "left" : "0px",
            "top" : "0px",
            "z-index" : 2,
            "text-align" : "center"
        } ).html( "Text here..." )
    );
    $( "#graphics_here" ).append( 
        $( "<div>" ).attr( {
                "id" : "button_left"
            } ).css( {
            "position" : "absolute",                
            "width" : "100px",
            "height" : "100px",
            "left" : "0px",
            "top" : "50px",
            "text-align" : "center",
            "background-color" : "yellow"
        } ).html(
            "L"
        )
    );
    $( "#graphics_here" ).append( 
        $( "<div>" ).attr( {
            "id" : "button_right"
        } ).css( {
            "width"  : "100px",
            "height" : "100px",
            "position" : "absolute",
            "left"   : "120px",
            "top"    : "50px",
            "text-align" : "center",
            "z-index" : 2,
            "background-color" : "yellow"
        } ).html(
            "R"
        )
    );
    $( "#graphics_here" ).height( "140px" );    
    
    // Create an EventManager and attach buttons
    var buttonDefinitions = [
        {
            "label" : "left_down",
            "modalities" : [
                { "type" : "mousedown",  "id" : "#button_left" },
                { "type" : "touchstart", "id" : "#button_left" },
                { "type" : "keydown",    "id" : "37" }
           ]
        },
        {
            "label" : "right_down",
            "modalities" : [
                { "type" : "mousedown",  "id" : "#button_right" },
                { "type" : "touchstart", "id" : "#button_right" },
                { "type" : "keydown",    "id" : "39" }
           ]
        },
        {
            "label" : "left_up",
            "modalities" : [
                { "type" : "mouseup",  "id" : "#button_left" },
                { "type" : "touchend", "id" : "#button_left" },
                { "type" : "keyup",    "id" : "37" }
           ]
        },
        {
            "label" : "right_up",
            "modalities" : [
                { "type" : "mouseup",  "id" : "#button_right" },
                { "type" : "touchend", "id" : "#button_right" },
                { "type" : "keyup",    "id" : "39" }
           ]
        },
        {
            "label" : "misc_up",
            "modalities" : [
                { "type" : "mouseup",  "id" : "all" },
                { "type" : "touchend", "id" : "all" },
                { "type" : "keyup",    "id" : "all" }                
            ]
        }
    ];    
    eventManager = new jasmin.EventManager();
    
    // Create Slideshow
    slideshow = new jasmin.Slideshow(
        // target; html of this HTMLElement will be set to slide
        $( "#text_container"),  
        eventManager,
        {
            "previous" : [ "left_down" ],
            "next"     : [ "right_down" ],
            "up"       : [ "left_up", "right_up", "misc_up" ],
        },
        // buttonDelay; one second
        1000,
        // buttonHide
        function() {
            $("#button_left").hide();
            $("#button_right").hide();
        },
        // buttonShow
        function() {
            $("#button_left").show();
            $("#button_right").show();
        }
    );

    eventManager.start( 
        buttonDefinitions,
        slideshowStart
    );
};

slideshowStart = function() {
    // Show slides
    report( demoName, "Starting slideshow..." );
    slideshow.show(
        [ "Slide 0", "Slide 1", "Slide 2", "Slide 3" ],
        slideshowDone,
        "demo"
    );
};

slideshowDone = function() {
    report( demoName, "Slideshow done!" );
    $( "#slide_container").hide();
};
