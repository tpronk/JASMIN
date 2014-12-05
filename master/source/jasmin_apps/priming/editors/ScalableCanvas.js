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
    // Set positioning to absolute
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

    var targetWidth  = window.innerWidth;
    var targetHeight = window.innerHeight;

    //var targetWidth  = $( window ).width();
    //var targetHeight = $( window ).height();
    
    /*
    var targetWidth  = this.target.width();
    var targetHeight = this.target.height();
    */
    //alert( vardump( [ targetWidth, targetHeight ] ) );

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


// Convert indexed array to associative
convertFileToTranslations = function( data )
{
    // Lines to array
    data = data.split( "\n" );
    
    // Get relevant columns
    var header = rowToArray( data[0] );
    var indexTerm  = searchStringInArray( "term", header );
    var indexTrans = searchStringInArray( "value",     header );
    if( indexTerm  == - 1 ) { alert( "Error: No terms found; no column in translations has the name 'term'" ) }
    if( indexTrans == - 1 ) { alert( "Error: No translations found; no column in translations has the name 'value'" ) }    
    
    var translation, output = {};
    for( var i = 1; i < data.length; i++ )
    {
        translation = rowToArray( data[i] );
        if( translation.length != 1 )
        {
            output[ translation[ indexTerm ] ] = translation[ indexTrans ];
        }
    }
    return output;
}


/**
 * Convert spritesJSON to sprites; one sprite in spritesJSON format is an 
 * associative array with the following keys:
 * "key", key of the sprite (as used in canvas), "param", a String instead of 
 * passed as argument to jQuery to constuct an HTMLElement, "attr" for attributes
 * of the sprite, "css" for non-scaled CSS and "scale" for scaled CSS
 * @param {Array} spritesJSON JSON to convert
 * @return Sprites;
 * @public
 */
jasmin.ScalableCanvas.prototype.spritesFromJSON = function( spritesJSON ) {
    var sprites = {}, sprite, key;
    for( var i = 0; i < spritesJSON.length; i++ ) {
        // Create sprite
        sprite = {};
        sprite[ "node" ] = $( 
            spritesJSON[ i ][ "type" ]
        ).attr(
            this.recodeArray( spritesJSON[ i ][ "attr" ],  "p", "v" )
        ).css( 
            this.recodeArray( spritesJSON[ i ][ "css" ],  "p", "v" )
        );
        sprite[ "scale" ] = this.recodeArray( spritesJSON[ i ][ "scale" ],  "p", "v" );
        
        //alert( JSON.stringify( sprite[ "node" ] ) );
        
        // Add to canvas at key
        key = spritesJSON[ i ][ "key" ];
        sprites[ key ] = sprite;
    }
    
    return sprites;
};

// Convert indexed array of porperty/value to associative array
// private
jasmin.ScalableCanvas.prototype.recodeArray = function( array, forKey, forValue) {
    var result = {};
    
    for( var i = 0; i < array.length; i++ )
    {
        result[ array[ i ][ forKey ] ] = array[ i ][ forValue ];
    }
    
    return result;
};