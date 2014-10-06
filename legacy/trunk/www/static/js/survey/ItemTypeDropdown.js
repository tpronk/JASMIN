// itemData - Standard item data
// question - Question asked to participant
// restrict - Restriction on answer
function ItemTypeDropdown( itemData, specs )
{
    this.itemData  = itemData;
    this.specs     = specs;
}    

// Generate html for item
ItemTypeDropdown.prototype.draw = function()
{
    this.tracker = new ItemTracker();
    var self = this;
    
    // Report
    this.itemData.report( 
        "ItemTypeDropdown.draw",
        "item id " + this.itemData.id
    );
        
    // html for question
    var left = $( "<div>" ).attr( "class", "Left" );
	left = left.text( translator.substitute( 
        this.specs[ "question" ] 
    ) );

    // html for dropdown
    var right = $( "<div>" ).attr( "class", "Right" );   
    this.dropDown = new Dropdown( 
        this.itemData,
        this.specs,
        function() { self.highlight(); }
    );
    
    right.append( this.dropDown.draw() );

    // Main container
    this.highlightDiv = $( "<div>" );
	var item = $( "<div>" );
	item.append( left  );
	item.append( right );
    item.append( $( "<div>" ).attr( "class", "Clear" ) );
    item.attr( "class", "Item" );
    this.highlightDiv.append( item );
    
	return this.highlightDiv;    
}

ItemTypeDropdown.prototype.isAnswered = function()
{
    return this.itemData.answer != -1 && this.itemData.answer != null;
}

ItemTypeDropdown.prototype.highlight = function()
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