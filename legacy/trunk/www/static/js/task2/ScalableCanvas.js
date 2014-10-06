/**
 * ScalableCanvas scales a set of sprites on a vistual canvas to uniformly fit to a container DIV
 * @constructor
 * @param {jQueryDiv}  target            container DIV
 * @param {float}      aspectRatio       Width to height ratio
 * @param {int}        rescaleInterval   Interval (in ms) between checking if canvas should be rescaled and rescaling
 */
function ScalableCanvas( target, aspectRatio, rescaleInterval )
{
    // Globals
    this.target          = target;
    this.aspectRatio     = aspectRatio;
    this.rescaleInterval = rescaleInterval;
    this.nodes           = {};        // DOM Nodes to manage
    this.scalables       = {};        // CSS to scale 
    this.lastWidth       = false;     // Width of last scale measurement
}

/**
 * Start scaling contents
 */
ScalableCanvas.prototype.start = function()
{
    var self = this;
    self.rescale( true );
    this.timer = setInterval( function() { self.rescale() }, self.rescaleInterval );
}

/**
 * Stop scaling contents
 */
ScalableCanvas.prototype.stop = function()
{
    clearInterval( this.timer );
}

/**
 * Add a sprite to the canvas
 * @param {String}     id                index of sprite
 * @param {jQuery}     node              jQuery node
 * @param {Object}     scalable          Associative array structured: {key: value}, containing CSS properties to scale
 */
ScalableCanvas.prototype.addSprite = function( id, node, scalable )
{
    // Set positioning to absolute
    node.css( "position", "absolute" );
    
    // Add node to target
    this.target.append( node );
    
    // Setup vars
    this.nodes[     id ] = node;
    this.scalables[ id ] = scalable;
}

/**
 * Add a set of sprites to the canvas via addSprite
 * @param {Object}     sprites           Associative array structured { id: { "sprite": sprite, "scalable": scalable } },
 */
ScalableCanvas.prototype.addSprites = function( sprites )
{
    // add sprites to canvas
    for( var i in sprites )
    {
        this.addSprite( 
            i,
            sprites[ i ][ "node"     ],
            sprites[ i ][ "scalable" ]
        );
    }    
}


/**
 * Get a sprite by id
 * @param {String}     id                index of sprite
 * @return associated sprite;
 */
ScalableCanvas.prototype.getSprite = function( id )
{
    return( this.nodes[ id ] );
}

// Check rescale, and do if required (or force == true)
ScalableCanvas.prototype.rescale = function( force )
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
    if( force === undefined && this.lastWidth == targetWidth && this.lastHeight == targetHeight )
    {
        return;
    } else {
        this.lastWidth  = targetWidth;
        this.lastHeight = targetHeight;
    }
    
    // To maintain aspect ratio, scale to width or height
    this.scale;
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
}

// Rescale a sprite
ScalableCanvas.prototype.rescaleSprite = function( i )
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
                offset = this.offsetTop
                //alert( this.target.y );
                break;
            default:
                offset = 0;
                break;
        }
        scaledValue = this.scalables[i][j] * this.scale + offset;
        
        // Round values for left, top, width, and height
        if( j == "left" || j == "top" || j == "width" || j == "height" )
        {
            scaledValue = Math.floor( scaledValue );
        }
        
        css[j] = scaledValue;
    }    

    // Apply
    //alert( vardump( this.scalables[i] ) );
    this.nodes[i].css( css );
}