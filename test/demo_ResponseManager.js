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
var demoName   = "demo_ResponseManager.js";

// Called on page load
load = function() {
    getScripts( [
            pathExt + "jquery.mobile-1.4.5.js",
            pathExt + "gyronorm-3.0.2.js",
            pathSrc + "polyfills.js",
            pathSrc + "ResponseManager.js"
        ],
        setupDemo
    );
};

// Initialise pointer fields and create eventManager
setupDemo = function() {
    $( "#graphics_here" ).append( 
        $( "<div>" ).attr( {
                "id" : "button_left"
            } ).css( {
                "width"  : "100px",
                "height" : "100px",
                "position" : "absolute",
                "left" : "0px",
                "top"  : "0px",
                "background-color" : "green"
        } )
    );
    $( "#graphics_here" ).append( 
        $( "<div>" ).attr( {
            "id" : "button_right"
        } ).css( {
            "width"  : "100px",
            "height" : "100px",
            "position" : "absolute",
            "left"   : "120px",
            "top"    : "0px",
            "z-index" : 2,
            "background-color" : "green"
        } )
    );
    $( "#graphics_here" ).height( "100px" );
   
    // all buttons managed by this ResponseManager instance
    var buttonDefinitions = [
        {
            "label" : "left_down",
            "modalities" : [
                { "type" : "mousedown",   "id" : "#button_left" },
                { "type" : "touchstart",  "id" : "#button_left" },
                { "type" : "keydown",     "id" : "37" },
                { "type" : "speech",      "id" : "left" },                
                { "type" : "gamepadaxis", "id" : 0, "min" : -1, "max" : -0.98 },
                { "type" : "gyroscope",   "id" : "dm", "id2" : "gx", "min" : -9.81, "max" : -3.13 }
            ]
        },
        {
            "label" : "right_down",
            "modalities" : [
                { "type" : "mousedown",  "id" : "#button_right" },
                { "type" : "touchstart", "id" : "#button_right" },
                { "type" : "keydown",    "id" : "39" },
                { "type" : "speech",     "id" : "right" },        
                { "type" : "gamepadaxis", "id" : 0, "min" : 0.98, "max" : 1 },
                { "type" : "gyroscope",   "id" : "dm", "id2" : "gx", "min" : 3.13, "max" : 9.81 }
           ]
        },
        {
            "label" : "left_up",
            "modalities" : [
                { "type" : "mouseup",  "id" : "#button_left" },
                { "type" : "touchend", "id" : "#button_left" },
                { "type" : "keyup",    "id" : "37" },
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
            "label" : "all_up",
            "modalities" : [
                { "type" : "mouseup",     "id" : "all" },
                { "type" : "touchend",    "id" : "all" },
                { "type" : "speech",      "id" : "up" },
                { "type" : "gamepadaxis", "id" : 0, "min" : -0.05, "max" : 0.05 },
                { "type" : "gyroscope",   "id" : "dm", "id2" : "gx", "min" : -0.5, "max" : 0.5 }
            ]
        },
        {
            "label" : "left_over",
            "modalities" : [
                { "type" : "mouseover",  "id" : "#button_left" },
           ]
        },        
        {
            "label" : "right_over",
            "modalities" : [
                { "type" : "mouseover",  "id" : "#button_right" },
           ]
        },
        {
            "label" : "left_out",
            "modalities" : [
                { "type" : "mouseout",  "id" : "#button_left" },
           ]
        },        
        {
            "label" : "right_out",
            "modalities" : [
                { "type" : "mouseout",  "id" : "#button_right" },
           ]
        }
    ];

    // Create a ResponseManager (with an override on the escape key)
    responseManager = new jasmin.ResponseManager({
       "type" : "keydown",
       "id" : 27,
       "callback" : function() { alert("Pressed ESC key"); }
    });
    // Attach event handlers
    console.log("Attaching ResponseManager");
    responseManager.attach(buttonDefinitions);
    
    downStart();
};

// Callback for mouseover over buttons
mouseOverHandler = function(event, modality, id, label, time, x, y) {
   if (label === "left_over") {
      $("#button_left").css({"background-color":"blue"});
   }
   if (label === "right_over") {
      $("#button_right").css({"background-color":"blue"});
   }
   if (label === "left_out") {
      $("#button_left").css({"background-color":"green"});
   }
   if (label === "right_out") {
      $("#button_right").css({"background-color":"green"});
   }
   /*
   if (event === "axischange") {
      console.log ("gamepadaxis " + id, ", value ", + x);
   }
   */
};

// Register a 'down' response
downStart = function() {
    console.log( "Starting an event that registers down response (via left/right key; clicking or touching the colored rectangles; pushing a gamepad joystick to the left/right; rotating your handheld device counter-clockwise/clockwise; or saying 'left'/'right')" );
    responseManager.activate(
        [ "left_down", "right_down", "axis_push", "left_speech" ], // buttonsActive
        downDone,                      // callbackResponse
        mouseOverHandler
    );    
};

// 'down' response made
downDone = function( eventData ) {
    // Deactivate; stop registering responses
    responseManager.deactivate();
    // Report response data
    console.log("Down response registered, responseLog:");
    var responseLog = responseManager.getResponseLog();
    console.log(responseLog);

    // Make pressed button black
    if (responseLog["label"] === "left_down") {
        $("#button_left").css({"background-color":"black"});
    }
    if (responseLog["label"] === "right_down") {
        $("#button_right").css({"background-color":"black"});
    }

    upStart();    
};

// Register an 'up' response
upStart = function() {
    console.log( "Starting an event that registers up response (via left/right key; clicking or touching the colored rectangles; or centering a gamepad joystick; rotating your handheld device to landscape; or saying 'up')" );
    responseManager.activate(
        [ "left_up", "right_up", "all_up", "axis_center" ], // buttonsActive
        upDone                     // callbackResponse
    );        
};

// 'down' response made
upDone = function( eventData ) {
    // Deactivate; stop registering responses
    responseManager.deactivate();
    // Report response data
    console.log("Up response registered, responseLog:");
    var responseLog = responseManager.getResponseLog();
    console.log(responseLog);
    
    // Make buttons green again
    $("#button_left").css({"background-color":"green"});
    $("#button_right").css({"background-color":"green"});
    
    downStart();
    // Detach event handlers
    // console.log("Detaching ResponseManager");    
    // responseManager.detach();
};
