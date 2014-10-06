// itemData - Standard item data
// question - Question asked to participant
// restrict - Restriction on answer
function Dropdown( itemData, specs, highlight )
{
    this.itemData  = itemData;
    this.specs     = specs;
    this.highlight = highlight;
}    

// Generate html for item
Dropdown.prototype.draw = function()
{
    this.tracker = new ItemTracker();    
    var self = this;
    
    // Report
    //alert( "X" );    
    this.itemData.report( 
        "Dropdown.draw",
        JSON.stringify( this.itemData )
    );
    //alert( "Y" );
    // Select
    this.select = $( "<select>" ).attr( "id", this.itemData.domId );

    this.tracker.track(
        this.select,
        { 
            "mousedown" : false,
            "change"    : true
        },
        function( params ) { self.update( params ) },
        this.itemData,
        function() {  return { "type" : "select", "value" : self.select.val() }; }
    );
        
    // Empty option with "make a choice"
    option = $( "<option>" ).text( translator.substitute( 
        this.specs[ "empty" ]
    ) ).attr( "value", "-1" );
    this.select.append( option );
    
    // Track empty
    /*
    this.tracker.track(
        option,
        { 
            "mouseover" : false,
            "mouseup"   : false
        },
        function() {},
        this.itemData,
        function() { return { "type" : "option", "value" : null } }
    ); 
    */
    // Options from specs
    for( var i in this.specs[ "options" ] )
    {
        var option = $( "<option>" ).html( translator.substitute( 
            this.specs[ "options" ][i]
        ) ).attr( "value", i );
        this.select.append( option );
        
        if( this.itemData[ "answer" ] == i )
        {
            //alert( i );
            option.prop( "selected", "selected" );
        }
        
        /*
        this.tracker.track(
            option,
            { 
                "mouseover" : false,
                "mouseup"   : false
            },
            function( params ) { self.update( params ) },
            this.itemData,
            function() {  return { "type" : "option", "value" : i }; }
        );        
        */
    }
    
    return this.select;
}

Dropdown.prototype.update = function( params )
{
    // Report
    this.itemData.report( 
        "ItemTypeDropdown.update",
        "item id: " + this.itemData.id + ", value: " + params[ "value" ]
    );
    
    // Update answer and call callback
    this.itemData.answer = params[ "value" ];
    this.itemData.callback( this.itemData.id, this.itemData.answer );
    
    // Set isAnswered
    this.highlight();
}    

Dropdown.prototype.isAnswered = function()
{
    return this.itemData.answer != -1;
}

/*
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
*/