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
var demoName   = "demo_ResponseManager_vmouse.js";

// Called on page load
load = function() {
    getScripts( [
            pathExt + "jquery.mobile.js",
            pathSrc + "ResponseManager.js"
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
                "position" : "absolute",
                "left" : "0px",
                "top"  : "0px",
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


    // Create a ResponseManager
    responseManager = new jasmin.ResponseManager( window );    
    
    // Start touchRespnose
    specificDownStart();
};

specificDownStart = function() {
    report( demoName, "Starting an event that registers vmousedown only on the divs above and lasts 8000 ms" );
    
    // Buttons for next event: vmousedown on buttonLeft or buttonRight
    // Note that vmousedown is provided by a jquery-mobile as a unified way
    // to register mouse clicks and touch events (without any 300 ms 'click'
    // delay.
    var activeResponses = { 
        "vmousedown" : {
            "type" : "specific",
            // No type key (as with keyboard)
            "buttons" : {
                "#field_left"  : "left",
                "#field_right" : "right"
            }
        }
    };
    
    // Activate; start registering responses
    responseManager.activate(
        activeResponses,           // activeResponses  - These responses are registered
        specificDownDone  // callbackResponse - Function to call on response
    );    
};

specificDownDone = function( eventData )
{
    // Deactivate; stop registering responses
    responseManager.deactivate();

    // Report logs
    report( demoName, JSON.stringify( responseManager.getResponseLog() ) );
    
    specificUpStart();    
};

specificUpStart = function() {
    report( demoName, "Starting an event that registers vmouseup only on the divs above" );
    
    // Buttons for next event: vmousedown on buttonLeft or buttonRight
    // Note that vmousedown is provided by a jquery-mobile as a unified way
    // to register mouse clicks and touch events (without any 300 ms 'click'
    // delay.
    var activeResponses = { 
        "vmouseup" : {
            "type" : "specific",
            // No type key (as with keyboard)
            "buttons" : {
                "#field_left"  : "left",
                "#field_right" : "right"
            }
        },
        "vmousecancel" : {
            "type" : "specific",
            // No type key (as with keyboard)
            "buttons" : {
                "#field_left"  : "left",
                "#field_right" : "right"
            }
        }        
    };
    
    // Activate; start registering responses
    responseManager.activate(
        activeResponses, // activeResponses  - These responses are registered
        specificUpDone   // callbackResponse - Function to call on response
    );    
};

// Called when touchResponse done
specificUpDone = function( eventData )
{
    // Deactivate; stop registering responses
    responseManager.deactivate();

    // Report logs
    report( demoName, JSON.stringify( responseManager.getResponseLog() ) );
    
    specificDownStart();    
};
