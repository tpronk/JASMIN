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
// *** demo_ResponseManager_keyboard
//
// Demonstrates how the ResponseManager registers keyboard responses
// Assignments:
//   - Let the ResponseManagerit respond to any keyup (but only A is valid)
//   - Let the ResponseManagerit respond to any keydown (but none is valid)

// Name of this demo
var demoName   = "demo_ResponseManager_keyboard.js";

// Called on page load
load = function() {
    getScripts( 
        [
            jasminPath + "jasmin_core/ResponseManager.js"
        ],
        allKeysResponseStart
    );
};

// Called when ResponseManager JS file loaded
allKeysResponseStart = function() {
    // Create a ResponseManager. Attach window to allow the ResponseManager to detect
    // everything that happens in the window
    responseManager = new jasmin.ResponseManager( window );
    
    report( demoName, "Starting an event that registers all keydown responses, E and I key are valid" );
   
     // Map keyboard keydown codes to response labels 
     // For keyboard key codes, see: http://www.asciitable.com/
    var activeResponses = {
        // On keydown events
        "keydown" : {
            // Any keydown is accepted (whether defined in buttons or not)
            "type"    : "all", 
            // Valid buttons: ASCII key codes mapped to labels
            "buttons" : {
                69 : "left",  // E key = left
                73 : "right"  // I key = right
            }
        }
    };
    
    // Activate; start registering responses
    responseManager.activate(
        activeResponses,      // activeResponses  - These buttons are in use
        allKeysResponseDone   // callbackResponse - Function to call on response
    );    
};

// Called when noResponse done
allKeysResponseDone = function()
{
    // Deactivate; stop registering responses
    responseManager.deactivate();
    
    // Report logs
    report( demoName, JSON.stringify( responseManager.getResponseLog() ) );
    
    // Start a specific response registration
    specificResponseStart();
};

// Called after noResponse done
specificResponseStart = function()
{ 
    report( demoName, "Starting an event that registers only E and I keydown responses (specific response)" );
   
     // Map keyboard keydown codes to response labels 
     // For keyboard key codes, see: http://www.asciitable.com/
    var activeResponses = {
        // On keydown events
        "keydown" : {
            // Only keys defined in buttons are accepted
            "type"    : "specific", 
            // Valid buttons: ASCII key codes mapped to labels
            "buttons" : {
                69 : "left",  // E key = left
                73 : "right"  // I key = right
            }
        }
    };
    
    responseManager.activate(
        activeResponses,       // activeResponses  - These responses are registered
        specificResponseDone   // callbackResponse - Function to call on response
    );    
};

// Called when specificResponseDone done
specificResponseDone = function()
{
    // Ignore responses
    responseManager.deactivate();    

    // Report logs
    report( demoName, JSON.stringify( responseManager.getResponseLog() ) );
    
    // Another specific response
    allKeysResponseStart();
};

