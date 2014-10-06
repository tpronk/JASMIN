// itemData - Standard item data
// question - Question asked to participant
// restrict - Restriction on answer
function ItemTypeOpen( itemData, specs )
{
    this.itemData  = itemData;
    this.specs     = specs;
}    

// Generate html for item
ItemTypeOpen.prototype.draw = function()
{
    // Report
    this.itemData.report( 
        "ItemTypeParagraph.draw",
        "item id " + this.itemData.id
    );
        
    // html for question
    var left = $( "<div>" ).attr( "class", "Left" );
	left.append( translator.substitute( this.specs[ "question" ] ) );

    // html for text input
    var right = $( "<div>" ).attr( "class", "Right" );    
	var input = $( "<input type='text' />");
	input = input.attr( "id", this.itemData.domId );
    
    if( this.specs[ "width" ] !== undefined )
    {
        input.css( "width", this.specs[ "width" ] );
    }
	input = input.bind( 
        "keyup", 
        {self: this}, 
        function( event ) {event.data.self.check()}
    );    
    right.append( input );

    // Main container
    this.highlightDiv = $( "<div>" );
	var item = $( "<div>" );
	item.append( left  );
	item.append( right );
    item.append( $( "<div>" ).attr( "class", "Clear" ) );
    item.attr( "class", "Item" );
    this.highlightDiv.append( item );
    
    // Add answer (if any)
    if( !( this.itemData.answer == null || this.itemData.answer == "" ) )
    {
        input.val( this.itemData.answer );
    }
    
    // Return HTML
	return this.highlightDiv;    
}

// Check if answer is right
ItemTypeOpen.prototype.check = function()
{
    // Report answer
    this.itemData.report( 
        "ItemTypeOpen.check",
        "item id " + this.itemData.id + ", answer " + this.itemData.answer
    );
        
    // Update answer and call callback
    this.itemData.answer = $( "#" + this.itemData.domId ).val();
    this.itemData.callback( this.itemData.id, this.itemData.answer );        

    // Log
    this.itemData.logger.log(
        this.itemData.source,
        "check",
        this.itemData.id,
        this.itemData.answer
    );
        

    // Check highlight
    this.highlight();
}


ItemTypeOpen.prototype.isAnswered = function()
{
    return !( this.itemData.answer == null || this.itemData.answer == "" );
}

ItemTypeOpen.prototype.highlight = function()
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