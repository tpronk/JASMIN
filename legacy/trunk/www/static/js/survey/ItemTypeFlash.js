// itemData - Standard item data
// question - Question asked to participant
// restrict - Restriction on answer
function ItemTypeFlash( itemData, specs )
{
    this.itemData     = itemData;
    this.specs        = specs;
}    

// Generate html for item
ItemTypeFlash.prototype.draw = function()
{
    var item = $( "<embed>" ).attr( {
        "width"   : "100%",
        "height"  : "100%",
        "src"     : config[ "swf_location" ] + "KenJeZopie.swf"
    } );
    
	return item;
}

// Item interface
ItemTypeFlash.prototype.highlight = function()
{
}

ItemTypeFlash.prototype.isAnswered = function()
{
    return true;
}