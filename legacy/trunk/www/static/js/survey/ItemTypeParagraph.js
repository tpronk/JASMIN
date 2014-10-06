// itemData - Standard item data
// question - Question asked to participant
// restrict - Restriction on answer
function ItemTypeParagraph( itemData, specs )
{
    this.itemData  = itemData;
    this.specs     = specs;
}    

// Generate html for item
ItemTypeParagraph.prototype.draw = function()
{
    // Report
    this.itemData.report( 
        "ItemTypeOpen.draw",
        "item id " + this.itemData.id
    );
        
    // html for item
    var paragraph = $( "<div>" ).attr( "class", "Paragraph" );
    
    // Use answer if it overrides text in specs
    var text;
    if( this.itemData.answer === null  )
    {
        text = translator.substitute( this.specs[ "text" ] );
    }
    else
    {
        text = translator.substitute( this.itemData.answer );
    }
	paragraph.append( text );

	return paragraph;
}

// Item interface
ItemTypeParagraph.prototype.highlight = function()
{
}

ItemTypeParagraph.prototype.isAnswered = function()
{
    return true;
}

// Update state
ItemTypeParagraph.prototype.update = function( value )
{
    // Set answer to value
    this.itemData.answer = value;
    // Callback
    this.itemData.callback( this.itemData.id, this.itemData.answer );    
}