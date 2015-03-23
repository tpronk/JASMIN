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
    
    this.nodes           = {};        // DOM Nodes to manage
    this.scalables       = {};        // CSS to scale 
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
 * @param {String}     key                key of sprite
 * @param {jQuery}     node              jQuery node
 * @param {Object}     scalable          Associative array structured: {key: value}, containing CSS properties to scale
 */
jasmin.ScalableCanvas.prototype.addSprite = function( key, node, scalable )
{
    //alert( JSON.stringify( node ) );    
    // If no position specified, set to absolute
    //alert( node.prop( "style" ).position );
    node.css( "position", "absolute" );
    
    // Add node to target
    this.target.append( node );
    
    // Setup vars
    this.nodes[     key ] = node;
    this.scalables[ key ] = scalable;
};

/**
 * Add a set of sprites to the canvas via addSprite
 * @param {Object}     sprites           Associative array structured { key: { "sprite": sprite, "scalable": scalable } },
 */
jasmin.ScalableCanvas.prototype.addSprites = function( sprites )
{
    // add sprites to canvas
    for( var i in sprites )
    {
        this.addSprite( 
            i,
            sprites[ i ][ "node"  ],
            sprites[ i ][ "scale" ]
        );
    }    
};


/**
 * Get a sprite by key
 * @param {String} key key of sprite (same as was used when adding this sprite via addSprite earlier)
 * @return {Ijbect} associated sprite;
 * @public
 */
jasmin.ScalableCanvas.prototype.getSprite = function( key )
{
    return( this.nodes[ key ] );
};

// Check rescale, and do if required (or force == true)
jasmin.ScalableCanvas.prototype.rescale = function( force )
{
    // Current dimensions of (relatively scaled) div
    if( this.target === document.body ) {
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
        this.scale          = targetHeight;
        this.offsetLeft = ( targetWidth - ( this.scale * this.aspectRatio ) ) / 2;
    } else {
        // Screen is wider than aspect ratio; use width
        this.scale = targetWidth / this.aspectRatio;
        //alert(( targetHeight - ( scale ) / 2 ) );
        this.offsetTop = ( targetHeight - ( this.scale ) ) / 2;
    }
    
    // For each node, update css
    for( var i in this.nodes )
    {
        this.rescaleSprite( i );
    }
};

// Rescale a sprite
jasmin.ScalableCanvas.prototype.rescaleSprite = function( i )
{
    // Construct css
    var css = {}, offset, scaledValue;
    for( var j in this.scalables[i] )
    {
        // If position property, adjust for offset
        switch( j )
        {
            case "left":
                offset = this.offsetLeft;
                break;
            case "top":
                offset = this.offsetTop;
                //alert( this.target.y );
                break;
            default:
                offset = 0;
                break;
        }
        scaledValue = this.scalables[i][j] * this.scale + offset;
        
        // Round values for left, top, width, and height
        if( j === "left" || j === "top" || j === "width" || j === "height" )
        {
            scaledValue = Math.floor( scaledValue );
        }
        
        css[j] = scaledValue;
    }    

    // Apply
    this.nodes[i].css( css );
};

/**
 * Extend function based on Prototype: merge two (associative) arrays, named
 * destination and source. For any keys existing both in destination and source
 * the values of source is used.
 * @param {Object} destination 
 * @param {Object} source
 * @private
 */
jasmin.ScalableCanvas.prototype.extend = function(destination, source) {
    for (var property in source) {
        if (source.hasOwnProperty(property)) {
            destination[property] = source[property];
        }
    }
    return destination;
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
    var sprites = {}, sprite, key, childSprites;
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
        sprite[ "scale" ] = spritesJSON[ key ][ "scale" ];
       
        // Add any children
        if( spritesJSON[ key ][ "children" ] !== undefined ) {
            childSprites = this.spritesFromJSON( 
                spritesJSON[ key ][ "children" ],
                sprite
            );
        }
        
        // If no parent; add to sprites. Else add to parent
        if( parent === undefined ) {
            sprites[ key ] = sprite;
        } else {
            parent[ "node" ].append( sprite[ "node" ] );
        }
    }
    
    return sprites;
};

/**
 * Remove all HTMLElements constructed from sprites
 * @public
 */
jasmin.ScalableCanvas.prototype.removeSprites = function() {
    for( var n in this.nodes ) {
        this.nodes[n].remove();
    }
};
