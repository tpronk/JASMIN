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
 * ScalableCanvas scales a set of sprites on a vistual canvas to uniformly fit to a container DIV
 * @constructor
 * @param {jQueryDiv}  target            container DIV
 * @param {float}      aspectRatio       Width to height ratio
 * @param {int}        rescaleInterval   Interval (in ms) between checking if canvas should be rescaled and rescaling
 */
jasmin.ScalableCanvas = function( target, aspectRatio, rescaleInterval )
{
    // Globals
    this.target          = target;
    this.aspectRatio     = aspectRatio;
    this.rescaleInterval = rescaleInterval === undefined? 1000: rescaleInterval;
    
    this.sprites         = {};
    this.lastWidth       = false;     // Width of last scale measurement
};

/**
 * Start scaling contents
 */
jasmin.ScalableCanvas.prototype.start = function()
{
    var self = this;
    self.rescale( true );
    this.timer = setInterval( function() { self.rescale(); }, self.rescaleInterval );
};

/**
 * Stop scaling contents
 */
jasmin.ScalableCanvas.prototype.stop = function()
{
    clearInterval( this.timer );
};

/**
 * Add a sprite to the canvas
 * @param {String}     key               key of sprite
 * @param {jQuery}     node              jQuery node
 * @param {Object}     scale             Associative array structured: {key: value}, containing CSS properties to scale
 * @param {Object}     children          child sprites
 */
jasmin.ScalableCanvas.prototype.addSprite = function( key, node, scale, children )
{
    // Add node to target
    this.target.append( node );
    
    // Add to sprites
    this.sprites[ key ] = {
        "node"     : node,
        "scale"    : scale,
        "children" : children
    };
};

/**
 * Add a set of sprites to the canvas via addSprite
 * @param {Object}   sprites   Associative array structured { key: { "sprite": sprite, "scale": scalable } }
 * @param {bool}     hidden    Default: true, if true sprites are hidden by default
 */
jasmin.ScalableCanvas.prototype.addSprites = function( sprites, hidden )
{
   hidden = hidden === undefined? true: hidden;
    // add sprites to canvas
    for( var i in sprites )
    {
        this.addSprite( 
            i,
            sprites[ i ][ "node"  ],
            sprites[ i ][ "scale" ],
            sprites[ i ][ "children" ]
        );
    }    
};

// Check rescale, and do if required (or force == true)
jasmin.ScalableCanvas.prototype.rescale = function( force )
{
    // Current dimensions of (relatively scaled) div
    if( this.target === $( document.body ) ) {
        var targetWidth  = window.innerWidth;
        var targetHeight = window.innerHeight;
    } else {
        var targetWidth  = this.target.width();
        var targetHeight = this.target.height();
    }
        
    // No force and no change in scale? No need to rescale    
    if( force === undefined && this.lastWidth === targetWidth && this.lastHeight === targetHeight )
    {
        return;
    } else {
        this.lastWidth  = targetWidth;
        this.lastHeight = targetHeight;
    }
    
    // To maintain aspect ratio, scale to width or height
    this.offsetLeft = 0;
    this.offsetTop  = 0;

    if( targetWidth / targetHeight > this.aspectRatio )
    {
        // Screen is wider than aspect ratio; use height (divided by aspect)
        this.scale       = targetHeight;
        this.offsetLeft  = ( targetWidth - ( this.scale * this.aspectRatio ) ) / 2;
        this.canvasHeight = targetHeight;
        this.canvasWidth  = targetHeight * this.aspectRatio;
    } else {
        // Screen is wider than aspect ratio; use width
        this.scale = targetWidth / this.aspectRatio;
        this.offsetTop = ( targetHeight - ( this.scale ) ) / 2;
        this.canvasHeight = targetWidth / this.aspectRatio;
        this.canvasWidth  = targetWidth;
    }
    
    // For each node, update css
    for( var i in this.sprites ) {
        this.rescaleSprite( this.sprites[ i ] );
    }
};

// Rescale a sprite
jasmin.ScalableCanvas.prototype.rescaleSprite = function( sprite ) {
    // Construct css
    var css = {}, offset, scaledValue;

    for( var j in sprite[ "scale" ] )
    {
        // If position property, adjust for offset
        switch( j )
        {
            case "left":
                offset = this.offsetLeft;
                break;
            case "top":
                offset = this.offsetTop;
                break;
            default:
                offset = 0;
                break;
        }
        // But not if position is relative
        if( sprite[ "node" ].css( "position" ) === "relative" ) {
            offset = 0;
        }
        scaledValue = sprite[ "scale" ][j] * this.scale + offset;
        
        // Round values for left, top, width, and height
        if( j === "left" || j === "top" || j === "width" || j === "height" )
        {
            scaledValue = Math.floor( scaledValue );
        }
        
        css[j] = scaledValue;
    }    
    
    // Apply
    sprite[ "node" ].css( css );

    // Scale children, if any
    if( sprite[ "children" ] !== undefined ) {
        for( var child_i in sprite[ "children" ] ) {
            this.rescaleSprite( sprite[ "children" ][ child_i ] );
        }
    }
};


/**
 * Convert spritesJSON to sprites; one sprite in spritesJSON format is an 
 * associative array with the following keys:
 * "key", key of the sprite (as used in canvas), "param", a String instead of 
 * passed as argument to jQuery to constuct an HTMLElement, "attr" for attributes
 * of the sprite, "css" for non-scaled CSS and "scale" for scaled CSS,
 * "children", set of HTMLElements to be appended to this one
 * @param {Array}  spritesJSON JSON to convert
 * @param {Sprite} include     used internally to append cildren and prevent them from being be included in sprites
 * @return Sprites;
 * @public
 */
jasmin.ScalableCanvas.prototype.spritesFromJSON = function( spritesJSON, parent ) {
    var sprites = {}, sprite, key, cssClass, cssClass_i;
    for( var key in spritesJSON ) {
        // Create sprite
        sprite = {};
        sprite[ "node" ] = $( 
            spritesJSON[ key ][ "type" ]
        ).attr(
            spritesJSON[ key ][ "attr" ]
        ).css( 
            spritesJSON[ key ][ "css" ]
        );
        
        if( spritesJSON[ key ][ "class" ] !== undefined ) {
            for( cssClass_i in spritesJSON[ key ][ "class" ] ) {
                sprite[ "node" ].addClass( spritesJSON[ key ][ "class" ][ cssClass_i ] );
            }
        }
    
        sprite[ "scale" ] = spritesJSON[ key ][ "scale" ];
       
        // Add any children
        if( spritesJSON[ key ][ "children" ] !== undefined ) {
            sprite[ "children" ] = this.spritesFromJSON( 
                spritesJSON[ key ][ "children" ],
                sprite
            );
        }
        
        sprites[ key ] = sprite;
        // If no parent; add to sprites. Else add to parent
        if( parent !== undefined ) {
            parent[ "node" ].append( sprite[ "node" ] );
            //parent[ "children" ][ key ] = sprite;
        }
    }
    
    return sprites;
};

/**
 * Remove all HTMLElements constructed from sprites
 * @public
 */
jasmin.ScalableCanvas.prototype.removeSprites = function() {
    for( var i in this.sprites ) {
        this.sprites[ i ][ "node" ].remove();
    }
};

/**
 * Map document x and y coordinates to canvas x and y coordinates
 * @param {Number} x    x coordinate
 * @param {Number} y    y coordinate
 * @return {Object} x and y coordinates converted to canvas coordinates
 * @public
 */
jasmin.ScalableCanvas.prototype.mapToCanvas = function (x, y) {
   //console.log([y,this.offsetTop,this.lastHeight]);
   return {
      "x" : ((x - this.offsetLeft) / this.canvasWidth) * this.aspectRatio,
      "y" : (y - this.offsetTop) / this.canvasHeight
   };
};

