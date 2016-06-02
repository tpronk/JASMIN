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
// 
// 
// ****************
// *** demo_Translator
//
// Demonstrates how the Translator translates terms, incorporates custom callbacks,
// and supports honorifics (such as t-form and v-form)

// Name of this demo
var demoName   = "demo_ScreenManager.js";

// Called on page load
load = function() {
    getScripts( [
            pathExt + "screenfull-2.0.0.js",
            pathExt + "jquery.mobile-1.4.5.js",
            pathSrc + "polyfills.js",
            pathSrc + "TableLogger.js",
            pathSrc + "ScreenManager.js"
        ],
        start
    );
};

// Run the actual demo's
start = function() {
    $("#graphics_here").height("30px");
    // Requirements; show message if any of these is not satisfied. If they are, start task
    var requirements = [
        // fullscreen
        {
            "req"    : "fullscreen",
            "values" : [ true ],
            "warn"   : function() { 
                $("#graphics_here").html(   
                    "Click here to go fullscreen"
                );                
            }
        },
        // landscape
        {
            "req"    : "orientation",
            "values" : [ "landscape" ],
            "warn"   : function() { 
                $("#graphics_here").html(   
                    "Please turn your screen to landscape"
                );
            }
        },     
        // focus
        {
            "req"    : "focus",
            "values" : [ true ],
            "warn"   : function() {
                $("#graphics_here").html(   
                    "Click here to focus the window"
                );                
            }
        }
    ];
    
    screenManager = new jasmin.ScreenManager();
    
    // Print ScreenManager logs
    console.log( screenManager.logger.getLogs( true ) );
    
    // Testing iOS bugfix: Testing: Resize html and body to fit window on resize 
    // or orientation change
    $( "html" ).css( "overflow", "hidden" );
    $( document.body ).css( {"margin":"0px"} );
    fitToWindow = function() {
        var cssProperties = {
            "width"  : window.innerWidth,
            "height" : window.innerHeight
        };
       $( "html" ).css( cssProperties );
       $( document.body ).css( cssProperties );
       console.log( cssProperties );
    };
    screenManager.addCallback( "resize", fitToWindow );
    screenManager.addCallback( "orientationchange", fitToWindow );
    // END Testing iOS bugfix
    
    screenManager.require(
        requirements,
        function() {
            $("#graphics_here").html( "Requirements met for the first time" );
            report( demoName, "Requirements met for the first time" );
        },
        function() {
            $("#graphics_here").append( "<a>" ).text( "Requirements met another time. Click to disable ScreenManager" ).on(
                "vmousedown",
                function() {
                    screenManager.require( [], function() {} );
                }
            );
            report( demoName, "Requirements met another time" );
        }
    );
};