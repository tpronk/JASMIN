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
    // Load EventManager JS file
    getScripts( 
        [
            jasminPath + "jasmin_ext/jquery.mobile.js",
            jasminPath + "jasmin_core/ResponseManager.js",
            jasminPath + "jasmin_core/SyncTimer.js",
            jasminPath + "jasmin_core/EventManager.js"
        ],
        setupDemo
    );
};

// Initialise pointer fields and create eventManager
setupDemo = function() {
    $( "#graphics_here" ).append( 
        $( "<div>" ).attr( {
                "id" : "field_left"
            } ).css( {
                "width"  : "100px",
                "height" : "100px",
                "position" : "relative",
                "left" : "0px",
                "background-color" : "red"
        } )
    );
    $( "#graphics_here" ).append( 
        $( "<div>" ).attr( {
            "id" : "field_right"
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

    report( demoName, "After each event we report the logging vars of SyncTimer, ResponseManager and EventManager. Note how the logs of SyncTimer lags one event behind." )

    // Create an EventManager. Attach window to allow the EventManager to respond 
    // to everything that happens in the window
    eventManager = new jasmin.EventManager( window );
    
    // Start touchRespnose after syncing
    currentType  = "all";
    currentEvent = 1;
    currentColor = "yellow";
    eventManager.sync( function() {
        multiResponseStart() 
    } );
};

multiResponseStart = function() {
    report( demoName, "Starting an event that registers both key E and I and pointer responses (on divs above). Type = " + currentType );
    
    var activeResponses = {
        // vmouse
        "vmousedown" : {
            "type" : currentType,
            "buttons" : {
                "#field_left"  : "left",
                "#field_right" : "right"
            },
        },
        // keyboard
        "keydown" : {
            "type"    : currentType,
            "buttons" : {
                69 : "left",  
                73 : "right"  
            }
        }        
    };        
    
    eventManager.startEvent(
        4000,                 // timeout      - No. of ms to time out
        colorBoxes,           // callbackDraw - draw these graphics on refresh
        function() {
            multiResponseDone();    // callbackDone - called when event ends (due to response or timeout)
        },
        activeResponses,
        "event" + currentEvent
    );
};   

// Draws boxes green
colorBoxes = function() {
    $( "#field_left"  ).css( "background-color", currentColor );
    $( "#field_right" ).css( "background-color", currentColor );
};

// Called when multiResponse done
multiResponseDone = function() {
    report( demoName, "syncTimer       logs " + JSON.stringify( eventManager.syncTimer.getPrevTimeoutLog() ) );
    report( demoName, "responseManager logs " + JSON.stringify( eventManager.responseManager.getResponseLog() ) );
    report( demoName, "eventManager    logs " + JSON.stringify( eventManager.getEventLog() ) );
    
    // type var has been passed along from start to done, switch it from "all" to "specific" or vice versa, and start over
    currentType  = currentType  === "all"? "specific" : "all";
    currentColor = currentColor === "yellow"? "green" : "yellow";
    currentEvent++;
    multiResponseStart();
};


