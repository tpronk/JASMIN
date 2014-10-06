// itemData - Standard item data
// question - Question asked to participant
// restrict - Restriction on answer
function ItemTypeVertical( itemData, specs )
{
    // Setup properties
    this.itemData        = itemData;
    this.specs           = specs;
    if( this.itemData.answer === null )
    {
        if( this.specs[ "multiple answer" ] !== undefined && this.specs[ "multiple answer" ] )
        {
            this.itemData.answer = {};    
        } else {
            this.specs[ "multiple answer" ] = false;
        }
    }
}

// Generate html for item
ItemTypeVertical.prototype.draw = function()
{
    // Report
    this.itemData.report( 
        "ItemTypeVertical.draw",
        "item id: " + this.itemData.id
    );
      
    // Main container
    var i, j;
	var item;
	item = $( "<div>" ).attr( "class", "Item" );
    
    // question; align top
    var left = $( "<div>" ).attr( "class", "Left" );
    left.css( "vertical-align", "top" );
    left.html( this.itemData.translator.substitute( this.specs[ "question" ] ) );
    
    // answer options
    var right = $( "<div>" ).attr( "class", "Right" ); 

    // one row per option
    var optionLeft, optionRight, input, type;
    for( i in this.specs[ "options" ] )
    {
        input = $( "<input>" );
        
        // Left div; input (checkbox or option
        if( this.specs[ "multiple answer" ] )
        {
            // Checkbox
            input = input.attr( "type", "checkbox" );
            input.attr( { "id" : this.itemData.domId + "_" + i } );
            if( this.itemData.answer[ i ] )
            {
                input.attr( "checked", true );
            }
        } else {
            input = input.attr( "type", "radio" );
            input = input.attr( "name",  this.itemData.domId );
            input = input.attr( "id",    this.itemData.domId + "_" + i  );
            if( this.itemData.answer == i )
            {
                input.attr( "checked", true );
            }
        }
        
        input.bind( 
            "change", 
            { "self": this, "option": i }, 
            function( event ) { event.data[ "self" ].update( event.data[ "option" ] ) }
        );                  
            
        optionLeft = $( "<div>" ).attr( "class", "Option" );            
        optionLeft.append( input );
        
        // Right div; option label
        optionRight = $( "<div>" ).attr( "class", "Option" ).html( 
            this.itemData.translator.substitute( this.specs[ "options" ][ i ] )
         );
        
        right.append( optionLeft );
        right.append( optionRight );
        right.append( $( "<div>" ).attr( "class", "Clear" ) );
    }

    // Add to item
    item.append( left  );
    item.append( right );
    item.append( $( "<div>" ).attr( "class", "Clear" ) );            
    
    this.highlightDiv = $( "<div>" );
    this.highlightDiv.append( item );    
    
    return this.highlightDiv;
}


// Check if answer is right
ItemTypeVertical.prototype.update = function( option )
{
    if( this.specs[ "multiple answer" ] )
    {
        var checked =  $( "#" + this.itemData.domId + "_" + option ).prop( "checked" ) !== undefined;

        var optionId = option;
        if( this.specs[ "option_ids" ] !== undefined )
        {
            optionId = this.specs[ "option_ids" ][ option ];
        }

        // Setup params
        var params = {
            "option"  : optionId,
            "checked" : checked
        };

        // Log
        this.itemData.logger.log(
            this.itemData.source,
            "click",
            this.itemData.id,
            params
        );

        // Update answer and call callback
        this.itemData.answer[ option ] = checked;
    } else {
        // Setup params
        var params = {
            "answer" : option
        };

        // Log
        this.itemData.logger.log(
            this.itemData.source,
            "click",
            this.itemData.id,
            params
        );

        // Update answer and call callback
        this.itemData.answer = option;        
    }
    
    this.itemData.callback( this.itemData.id, this.itemData.answer );
    
    // Check higlight
    this.highlight();        
}

// Highlight unanswered parts depending on mouseover and highlight 
ItemTypeVertical.prototype.highlight = function( enter, row )
{
    if( this.itemData.highlightOn )
    {
        if( !this.isAnswered() )
        {
            this.highlightDiv.attr( "class", "UnansweredHighlight" );
        }
        else
        {
            this.highlightDiv.removeClass( "UnansweredHighlight" );
        }
    }    
}

// Check if item is answered
ItemTypeVertical.prototype.isAnswered = function()
{
    if( this.specs[ "multiple answer" ] )
    {
        return true;
    }
    return this.itemData.answer !== null;
}

