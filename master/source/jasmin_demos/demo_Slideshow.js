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
    // Load EventManager JS file
    getScripts( [
            jasminPath + "jasmin_ext/jquery.mobile.js",
            jasminPath + "jasmin_core/SyncTimer.js",
            jasminPath + "jasmin_core/ResponseManager.js",
            jasminPath + "jasmin_core/EventManager.js",
            jasminPath + "jasmin_core/Slideshow.js"
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
    $( "#graphics_here" ).append( 
        $( "<p>" ).attr( {
            "id" : "slide_container"
        } ).html( "Slides here..." )
    );    

    // Create an EventManager and sync
    eventManager = new jasmin.EventManager( window );
    
    // Create Slideshow
    slideshow = new jasmin.Slideshow(
        // target; html of this HTMLElement will be set to slide
        $( "#slide_container"),  
        eventManager,
        // activeResponses; touch and keyboard progress the slides
        {
            "vmouseup" : {
                "type"    : "specific",
                "buttons" : {
                    "#field_left"  : "previous",
                    "#field_right" : "next"
                },
            },
            // keyboard
            "keyup" : {
                "type"    : "specific",
                "buttons" : {
                    69 : "previous",  
                    73 : "next"  
                }
            }
        },
        // buttonTexts
        {
            "first"  : "Press I or the blue box to continue",
            "middle" : "Press I or the blue box to continue; press E or the red box to go back",
            "last"   : "Press I or the blue box to end this slideshow; press E or the red box to go back"
        },
        // buttonDelay; one second
        1000
    );

    eventManager.sync( slideshowStart );
};

slideshowStart = function() {
    // Show slides
    report( demoName, "Starting slideshow..." );
    slideshow.show(
        [ "Slide 1", "Slide 2", "Slide 3", "Slide 4" ],
        slideshowDone
    );
};

slideshowDone = function() {
    report( demoName, "Slideshow done!" );
    $( "#slide_container").hide();
};
