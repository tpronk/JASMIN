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
// Demonstrates how the ResponseManager can be used for dragging and dropping

// Name of this demo
var demoName   = "demo_ResponseManager.js";

// Called on page load
load = function() {
    getScripts( [
            pathExt + "jquery.mobile-1.4.5.js",
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
   
    // all buttons managed by this ResponseManager instance
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
            "label" : "left_up",
            "modalities" : [
                { "type" : "mouseup",  "id" : "#button_left" },
                { "type" : "touchend", "id" : "#button_left" },
                { "type" : "keyup",    "id" : "37" }
           ]
        },
        {
            "label" : "misc_up",
            "modalities" : [
                { "type" : "mouseup",  "id" : "all" },
                { "type" : "touchend", "id" : "all" }
           ]
        },        
        {
            "label" : "left_over",
            "modalities" : [
                { "type" : "mouseover",  "id" : "#button_left" }
           ]
        },        
        {
            "label" : "left_out",
            "modalities" : [
                { "type" : "mouseout",  "id" : "#button_left" }
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
    
    dragging = false;
    window.requestAnimationFrame(dragAnimation);
    start();
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
};

// Register a 'down' response
start = function() {
    console.log( "Starting an event that registers down response (via left/right key or the colored rectangles)" );
    responseManager.activate(
        [ "left_down", "left_up", "misc_up" ], // buttonsActive
        changeDragState,                       // callbackResponse
        mouseOverHandler
    );    
};

$(document).mousemove(function(e) {
   mouseX = e.pageX;
   mouseY = e.pageY;
});
$(document).bind("touchmove",function(e) {
   var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
   mouseX = touch.pageX;
   mouseY = touch.pageY;
   console.log(touch);
});


dragAnimation = function () {
   if (dragging) {
      $("#button_left").css({
         "left" : mouseX - dragX,
         "top"  : mouseY - dragY
      });
   }
   window.requestAnimationFrame(
       function() { dragAnimation(); }
   );
};

// 'down' response made
changeDragState = function( eventData ) {
   var responseLog = responseManager.getResponseLog();
   console.log(responseLog);
   // On down, determine grabbing point and start dragAnimation
   if (responseLog["label"] === "left_down") {
      dragX = responseLog["x"] - $("#button_left").offset()["left"];
      dragY = responseLog["y"] - $("#button_left").offset()["top"];
      mouseX = responseLog["x"];
      mouseY = responseLog["y"];
      dragging = true;
      console.log(responseLog);
   // On up, stop dragging  
   } else {
      dragging = false;
   }
};

// Register an 'up' response
upStart = function() {
    console.log( "Starting an event that registers up response" );
    responseManager.activate(
        [ "left_up", "right_up", "all_up" ], // buttonsActive
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
