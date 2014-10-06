// itemData - Standard item data
// question - Question asked to participant
// restrict - Restriction on answer
function ItemTypeLikert( itemData, specs )
{
    // Setup properties
    this.itemData        = itemData;
    if( this.itemData.answer === null )
    {
        this.itemData.answer = {};
    }
    this.specs           = specs;
}    

// Generate html for item
ItemTypeLikert.prototype.draw = function()
{
    // Report
    this.itemData.report( 
        "ItemTypeLikert.draw",
        "item id: " + this.itemData.id
    );
      
    // Main container
    var i, j;
	var item;
	item = $( "<div>" ).attr( "class", "Item" );
    var label;
    var labelWidth = this.specs[ "label width" ];// / this.specs[ "options" ];    
   
    // Add end labels if any
    var labelsEnds = this.specs[ "labels ends" ];
    if( labelsEnds !== undefined )
    {
        // Label panels
        var labelsLeft  = $( "<div>" ).attr( "class", "Left" );
        labelsLeft.css( 
            "width", 
            this.widthOf( "left" )
        );        
        var labelsRight = $( "<div>" ).attr( "class", "Right" );
        labelsRight.css( 
            "width", 
            this.widthOf( "right" )
        );        
        
        // Left
        var textLeft = labelsEnds[ "left"];
        if( textLeft !== undefined )
        {
            var labelLeft = $( "<div>" ).attr( "class", "LabelLeft" );
            labelLeft.html( translator.substitute( textLeft ) );
            labelsRight.append( labelLeft  );
        }
        
        // Right
        var textRight = labelsEnds[ "right"];
        if( textRight !== undefined )
        {
            var labelRight = $( "<div>" ).attr( "class", "LabelRight" );
            labelRight.html( translator.substitute( textRight ) );
            labelsRight.append( labelRight );
        }      

        // Add to item
        item.append( labelsLeft  );
        item.append( labelsRight );
        item.append( $( "<div>" ).attr( "class", "Clear" ) );        
    }
    
    // Add option labels if any
    var labelsOptions = this.specs[ "labels options" ];
    var labelsTranslations = [];  // Translations for each answer option (for title)
    if( labelsOptions !== undefined )
    {    
        // Label panels
        labelsLeft  = $( "<div>" ).attr( "class", "Left" );
        labelsLeft.css( 
            "width", 
            this.widthOf( "left" )
        );           
        labelsRight = $( "<div>" ).attr( "class", "Right" );
        labelsRight.css( 
            "width", 
            this.widthOf( "right" )
        );            
        
        // Labels for every option
        for( i in labelsOptions )
        {
            label = $( "<div>" ).css( "width", labelWidth + "px" );
            label = label.attr( "class", "LabelEvery" );
            // Set text size
            if( this.specs[ "labels options font-size" ] !== undefined )
            {
                label.css( "font-size", "14px" );
            }
            labelsTranslations[i] = translator.substitute( labelsOptions[i] );
            label.html( labelsTranslations[i] );
            labelsRight.append( label )
        }   

           // Add to item
        item.append( labelsLeft  );
        item.append( labelsRight );
        item.append( $( "<div>" ).attr( "class", "Clear" ) );    
    }        
        
    // html for questions and answer options
    for( i in this.specs[ "questions" ] )
    {
        // question
        var left = $( "<div>" ).attr( "class", "Left" );
        left.css( 
            "width", 
            this.widthOf( "left" )
        );
        left = left.html( translator.substitute( this.specs[ "questions" ][i] ) );
        
        // answer options
        var right = $( "<div>" ).attr( "class", "Right" ); 
        right.css( 
            "width", 
            this.widthOf( "right" )
        );            
        var option, radio;
        var groupName = this.itemData.domId + "_" + i;
        var radioWidth;
        for( j = 0; j < this.specs[ "options" ]; j++ )
        {
            // Option div
            option = $( "<div>" ).css( "width", labelWidth + "px" );
            option = option.attr( "class", "LabelEvery" );
            
            if( this.specs[ "enabled options" ] === undefined || this.specs[ "enabled options" ][j] )
            {
                // Option radio
                var optionId = groupName + "_" + j;
                radio  = $( "<input>" ).attr( "type", "radio" );
                radio  = radio.attr( "name",  groupName );
                radio  = radio.attr( "id",    optionId  );
                if( labelsTranslations.length > 0 )
                {
                    radio  = radio.attr( "title", translator.substitute( labelsTranslations[j] ) );
                }
                radioWidth = radio.width();

                radio.bind( 
                    "change", 
                    { self: this, question: i, answer: j }, 
                    function( event ) { event.data.self.update( event.data.question, event.data.answer ) }
                );                
                option.append( radio );
            } else {
                option.css( "height", "1px" );
            }
            
            right.append( option );
            
            if( this.itemData.answer[i] == j )
            {
                radio.attr( "checked", true );
            }
        }
        
        // row
        var row =  $( "<div>" ).attr( {
            "class" : "Row",
            "id"    : this.itemData.domId + "_row_" + i
        } );
        row = row.append( left  );
        row = row.append( right );
        row.append( $( "<div>" ).attr( "class", "Clear" ) );
        
        // mouseOver effect
        //alert( critical );
        row.mouseenter( 
            { 
                "self" : this,
                "row"  : i
            },
            function( event ) { 
                event.data[ "self" ].highlight( true, event.data[ "row" ] );
                //alert( vardump( event.data[ "row" ] ) );
            } 
        );
        row.mouseleave( 
            { 
                "self" : this,
                "row"  : i
            },
            function( event ) { 
                //alert( vardump( event.data[ "row" ] ) );
                event.data[ "self" ].highlight( false, event.data[ "row" ] );
            } 
        );            

        item = item.append( row );
    }
    
    // If labeling type == ends, move labes to left and right edge of radio
    if( textLeft !== undefined )
    {    
        labelLeft.css(  "padding-left",  labelWidth / 2 - radioWidth / 2 );
    }
    if( textRight !== undefined  )
    {
        labelRight.css( "padding-right", labelWidth / 2 - radioWidth / 2 );
    }

	return item;    
}

// Check if answer is right
ItemTypeLikert.prototype.update = function( question, answer )
{
    // Setup questionId
    var questionId = question;
    if( this.specs[ "question_ids" ] != undefined )
    {
        questionId = this.specs[ "question_ids" ][ question ];
    }
    
    // Setup params
    var params = {
        "question" : questionId,
        "answer"   : answer
    };
    
    // Log
    this.itemData.logger.log(
        this.itemData.source,
        "click",
        this.itemData.id,
        params
    );

    // Report
    this.itemData.report( 
        "ItemTypeLikert.check",
        "item id: " + this.itemData.id + ", " + JSON.stringify( params )
    );
    
    // Update answer and call callback
    this.itemData.answer[ question ] = answer;
    this.itemData.callback( this.itemData.id, this.itemData.answer );
    
    // Check higlight
    this.highlight();
}

// Highlight unanswered parts depending on mouseover and highlight 
ItemTypeLikert.prototype.highlight = function( enter, row )
{
    // On mouseleave, only update the row that was left
    if( enter !== undefined && !enter )
    {
        i = row;
        
        // Remove all highlight classes
        $( "#" + this.itemData.domId + "_row_" + i ).removeClass( "MouseOverHighlight")
        $( "#" + this.itemData.domId + "_row_" + i ).removeClass( "UnansweredHighlight")  
        
        // If highlight on and no answer, show UnansweredHighlight
        if( this.itemData.highlightOn && this.itemData.answer[i] === undefined )
        {
            $( "#" + this.itemData.domId + "_row_" + i ).attr( "class", "UnansweredHighlight" );
        }        
        
        return;
    }
    
    // On no mouseevent or mouseenter, update all
    for( i in this.specs[ "questions" ] )
    {
        // Remove all highlight classes
        $( "#" + this.itemData.domId + "_row_" + i ).removeClass( "MouseOverHighlight")
        $( "#" + this.itemData.domId + "_row_" + i ).removeClass( "UnansweredHighlight")        
        
        // If mouseover, show mouseverclass
        if( enter !== undefined && row == i )
        {
            $( "#" + this.itemData.domId + "_row_" + i ).attr( "class", "MouseOverHighlight" );
        }        
        else
        {
            // Else, if highlight on and no answer, show UnansweredHighlight
            if( this.itemData.highlightOn && this.itemData.answer[i] === undefined )
            {
                $( "#" + this.itemData.domId + "_row_" + i ).attr( "class", "UnansweredHighlight" );
            }
        }
    }    
}

// Check if item is answered
ItemTypeLikert.prototype.isAnswered = function()
{
    for( var i in this.specs[ "questions" ] )
    {
        if( this.itemData.answer[i] === undefined )
        {
            return false;
        }
    }
    return true;
}

// Get the right with for left part of item, given survey width, options and label width
ItemTypeLikert.prototype.widthOf = function( side )
{
    var rightWidth = this.specs[ "options" ] * this.specs[ "label width" ];
    rightWidth += 6; // Hack against CSS styling
    if( side == "right" )
    {
        return rightWidth;
    }
    // Return left width (total - right)
    return ( this.itemData.width - rightWidth ) + "px";
}