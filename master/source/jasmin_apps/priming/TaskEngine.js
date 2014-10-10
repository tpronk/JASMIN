//Copyright 2014, Thomas Pronk
//
//Licensed under the Apache License, Version 2.0 (the "License");
//you may not use this file except in compliance with the License.
//You may obtain a copy of the License at
//
//http://www.apache.org/licenses/LICENSE-2.0
//
//Unless required by applicable law or agreed to in writing, software
//distributed under the License is distributed on an "AS IS" BASIS,
//WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//See the License for the specific language governing permissions and
//limitations under the License. 

/** 
 * Init JASMIN namespace
 * @private
 */
if( jasmin === undefined ) { var jasmin = function() {}; }

/**
 * Task implements functions required for TaskManager
 * @param {TaskSpritesJSON} sprites      Sprites for task graphics to be drawn with ScalableCanvas. See ScalableCanvas.addSprites and TaskSpritesJSON schema for details of the JSON representation
 * @param {Object}          binaries     Binaries such as images download in advance * 
 * @constructor
 */
jasmin.TaskEngine = function( spritesJSON, binaries ) {
    // Copy properties    
    this.spritesJSON  = spritesJSON;
    this.binaries     = binaries;
};

/**
 * Draw sprites on the ScalableCanvas that is provided
 * @param {ScalableCanvas} canbas Canvas to draw sprites on
 */
jasmin.TaskEngine.prototype.setupCanvas = function( canvas ) {
    // Save canvas 
    this.canvas  = canvas;                   
    // Convert SpritesJSON to Sprites and add to canvas
    this.sprites = canvas.spritesFromJSON( spritesJSON ); 
    this.canvas.addSprites( this.sprites );
};
