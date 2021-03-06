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
// *** demo_EventManager
//
// Demonstrates how the EventManager times events and registers responses

// Name of this demo
var demoName   = "demo_EventManager.js";

// Called on page load
load = function() {
    getScripts( 
        [
            pathExt + "jquery.mobile-1.4.5.js",
            pathSrc + "polyfills.js",
            pathSrc + "ResponseManager.js",
            pathSrc + "SyncTimer.js",
            pathSrc + "EventManager.js"
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
            "position" : "absolute",                
            "width" : "100px",
            "height" : "100px",
            "left" : "0px",
            "top" : "0px",
            "background-color" : "red"
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
            "background-color" : "blue"
        } )
    );
    $( "#graphics_here" ).height( "100px" );

    // Create a EventManager and attach buttons
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
            "label" : "all_up",
            "modalities" : [
                { "type" : "mouseup",  "id" : "all" },
                { "type" : "touchend", "id" : "all" }
            ]
        }
    ];    
    eventManager = new jasmin.EventManager();    
    
    // Start touchRespnose after syncing
    currentType  = "all";           //JGW? Where are these initialized?
    currentEvent = 1;
    currentColor = "yellow";
    eventManager.start( 
        buttonDefinitions,
        function() {
            multiResponseStart( 4000 );
        } 
    );
};

multiResponseStart = function( timeout ) {
    DEBUG && console.log(demoName + ".multiResponseStart, starting an event that registers down responses (via keyboard arrows and pointer on divs above). Event times out in " + timeout + " ms.");

    eventManager.startEvent(
        timeout,              // timeout      - No. of ms to time out
        colorBoxes,           // callbackDraw - draw these graphics on refresh
        // callbackDone - called when event ends (due to response or timeout)
        function() {
            multiResponseDone( timeout );    
        },
        ["left_down", "right_down"], // buttonsActive
        true, // resetRt
        "event" + currentEvent // eventName
    );
};   

// Draws boxes green
colorBoxes = function() {
    $( "#button_left"  ).css( "background-color", currentColor );
    $( "#button_right" ).css( "background-color", currentColor );
};

// Called when multiResponse done
multiResponseDone = function( timeout ) {
    DEBUG && console.log(demoName + ".multiResponseDone, eventManager logs:");
    DEBUG && console.log(eventManager.getEventLog());
    DEBUG && console.log(demoName + ".multiResponseDone, syncTimer logs:");
    DEBUG && console.log(eventManager.syncTimer.getPrevTimeoutLog());
    DEBUG && console.log(demoName + ".multiResponseDone, responseManager logs:");
    DEBUG && console.log(eventManager.responseManager.getResponseLog());
    
    // type var has been passed along from start to done, switch it from "all" to "specific" or vice versa, and start over
    currentType  = currentType  === "all"? "specific" : "all";
    currentColor = currentColor === "yellow"? "green" : "yellow";
    currentEvent++;
    
    // Set timeout to -1 or 4000
    timeout = timeout === -1? 4000: -1;
    multiResponseStart( timeout );
};


