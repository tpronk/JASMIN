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
var demoName   = "demo_ScalableCanvas.js";

// Called on page load
load = function() {
    getScripts( [
            jasminPath + "jasmin_core/ScalableCanvas.js"
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
    var sprites = {
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
        "text_box" : 
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
                } ).append( 
                        // The actual text; change contents via id "my_text"
                        $( "<p>" ).attr( {
                            "id" : "my_text"
                        } ).css( {
                            "vertical-align"   : "middle",
                            "text-align"       : "center",
                            "display"          : "table-cell"
                        } ).text( "Submit" )
                ),
            // scale; all properties you want to scale
            "scale" :            
                {
                    "width"        :  .8,
                    "height"       :  .4,
                    "left"         :  .4,
                    "top"          :  .4,
                    "font-size"    :  .08
                }    
        },
        // A text input field, let's see if this works
        "text_input" : 
        {
            // Container DIV; text will be center aligned inside of this DIV
            "node" :        
                $( "<input>" ).attr( { "value" : "Type text here" } ).css( {
                    "z-index"   : 3,
                    "padding"   : "0px",
                    "border"    : "0px",
                } ),
            // scale; all properties you want to scale
            "scale" :            
                {
                    "width"        :  .8,
                    "height"       :  .15,
                    "left"         :  .4,
                    "top"          :  .1,
                    "font-size"    :  .08
                }    
        }
        
    };
    
    
    sprites.text_box.node.text("something else");
    // Construct canvas
    var canvas      = new jasmin.ScalableCanvas( 
        $( "#graphics_here" ),  // container div; note though that canvas scales to the window
        1.6                     // aspectRatio (x/y). A value of 1.6 gives this range of coordinates: x[0:1.6] and y[0:1]
        // rescaleInterval (number of ms between checking rescaling), 1000 by default
    );
    
    // Add sprites to canvas
    canvas.addSprites( sprites );
   
    // Start rescaling
    canvas.start();    
};