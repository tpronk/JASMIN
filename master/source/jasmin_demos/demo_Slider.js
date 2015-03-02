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
// *** demo_ScalableCanvas
//
// Demonstrates how ScalableCanvas scales stimuli

// Name of this demo
var demoName   = "demo_Slider.js";

// Called on page load
load = function() {
    report( demoName, "Demonstrating a slider implemented on a ScalableCanvas" );
    getScripts( [
            jasminPath + "jasmin_core/ScalableCanvas.js",
            jasminPath + "jasmin_ext/jquery.mobile.js",
            jasminPath + "jasmin_core/responseManager.js"
        ],
        startCanvas
    );
}

startCanvas = function()
{
    // Setup two sprites (background & text_box) to add to the canvas. 
    // Note that each sprite has two properties:
    //  * "node" contains the object and CSS properties that not need scaling
    //  * "scale" contains the object and CSS properties that do need scaling
    sprites = {
        // A black background; rectangle size of canvas
        "background" :
        {
            // "node" contains the object and CSS properties that not need scaling
            "node" :
                $( "<div>" ).css( {
                    "z-index"          : 1,
                    "background-color" : "#000000",
                    "opacity"          : 1
                } ),
            // "scale" contains the object and CSS properties that do need scaling
            "scale" :
                {
                    "width"  : "1.6",
                    "height" : "1",
                    "left"   : "0",
                    "top"    : "0"
                }
        },        
        // Grey div within which a centered red text
        "slider_bar" : 
        {
            // Container DIV; text will be center aligned inside of this DIV
            "node" :        
                $( "<div>" ).attr( {} ).css( {
                    "z-index"          : 2,
                    "text-align"       : "center",
                    "color"            : "red",
                    "display"          : "table",
                    "font-weight"      : "bold",
                    "background-color" : "#666666"
                } ),
            // scale; all properties you want to scale
            "scale" :            
                {
                    "width"        :  .8,
                    "height"       :  .05,
                    "left"         :  .4,
                    "top"          :  .4
                }    
        },
        // Grey div within which a centered red text
        "slider_handle" : 
        {
            // Container DIV; text will be center aligned inside of this DIV
            "node" :        
                $( "<div>" ).attr( {} ).css( {
                    "z-index"          : 3,
                    "text-align"       : "center",
                    "color"            : "red",
                    "display"          : "table",
                    "font-weight"      : "bold",
                    "background-color" : "#FFFFFF"
                } ),
            // scale; all properties you want to scale
            "scale" :            
                {
                    "width"        :  .05,
                    "height"       :  .15,
                    "left"         :  .6,
                    "top"          :  .35
                }    
        }        
    };
    
    // Construct canvas
    canvas      = new jasmin.ScalableCanvas( 
        $( "#graphics_here" ),  // container div; note though that canvas scales to the window
        1.6                     // aspectRatio (x/y). A value of 1.6 gives this range of coordinates: x[0:1.6] and y[0:1]
        // rescaleInterval (number of ms between checking rescaling), 1000 by default
    );
    
    // Add sprites to canvas
    canvas.addSprites( sprites );
   
    // Start rescaling
    canvas.start();    
    
    // Create responseManager
    responseManager = new jasmin.ResponseManager( window );    

    // Wait for vmousedown
    waitForVmousedown();
};

waitForVmousedown = function() {
    var activeResponses = { 
        "vmousedown" : {
            "type" : "all",
            "buttons" : {}
        }
    };
    
    // Activate; start registering responses
    responseManager.activate(
        activeResponses,          // activeResponses  - These responses are registered
        onVmousedown             // callbackResponse - Function to call on response
    );  
};

onVmousedown = function() {
    // Get vmouse and canvas coordinates on page, convert vmouse to canvas coordinates
    var canvasLeft   = $( "#graphics_here" ).offset()[ "left" ] + canvas.offsetLeft;
    var canvasTop    = $( "#graphics_here" ).offset()[ "top"  ] + canvas.offsetTop;
    var canvasRight  = $( "#graphics_here" ).offset()[ "left" ] + $( "#graphics_here" ).width()  - canvas.offsetLeft;
    var canvasBottom = $( "#graphics_here" ).offset()[ "top" ]  + $( "#graphics_here" ).height() - canvas.offsetTop;
    var mouseX     = responseManager.getResponseLog()[ "x" ];
    var mouseY     = responseManager.getResponseLog()[ "y" ];
    var relX = ( ( mouseX - canvasLeft ) / ( canvasRight  - canvasLeft ) ) * canvas.aspectRatio;
    var relY = ( ( mouseY - canvasTop  ) / ( canvasBottom - canvasTop  ) );
    
    report(
        demoName,
        "vmouse coordinates: x = " + relX + ", y = " + relY
    );
    
    // If the vmouse was clicked inside of the slider_bar, move slider_handle
    if(    sprites.slider_bar.scale[ "left"   ] < relX 
        && sprites.slider_bar.scale[ "width"  ] > relX - sprites.slider_bar.scale[ "left"   ]
        && sprites.slider_bar.scale[ "top"    ] < relY
        && sprites.slider_bar.scale[ "height" ] > relY - sprites.slider_bar.scale[ "top"    ]
    ) {
        report(
            demoName,
            "clicked on slider_bar"
        );        
    
        // Move slider_handle
        canvas.scalables.slider_handle.left = relX - .025;
        canvas.rescaleSprite( "slider_handle" );
    }
};