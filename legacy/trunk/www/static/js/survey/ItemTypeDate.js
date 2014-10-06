// itemData - Standard item data
// question - Question asked to participant
// restrict - Restriction on answer
function ItemTypeDate( itemData, specs )
{
    this.itemData  = itemData;
    this.specs     = specs;
    
    // Default order is day month year
    if( this.specs[ "order" ] === undefined )
    {
        this.specs[ "d m y"]
    }
    
    // Initialize state (if none)
    if( this.itemData.answer === null )
    {
        this.itemData.answer = {
            "year"  : -1,
            "month" : -1,
            "day"   : -1
        }
    }

    // Years
    this.years = [];
    for( var i = 2012; i >= 1913; i-- )
    {
         this.years.push( i );
    }
    
    // If already a complete date, update date term
    if( this.isAnswered() )
    {
        this.updateDate();        
    }
}    

// Generate html for item
ItemTypeDate.prototype.draw = function()
{
    this.tracker = new ItemTracker();
    var self = this;
    var i, j, specs, options = [];

    // Report
    this.itemData.report( 
        "ItemTypeDate.draw",
        "item id " + this.itemData.id
    );
        
    // html for question
    var left = $( "<div>" ).attr( "class", "Left" );
	left = left.text( translator.substitute( 
        this.specs[ "question" ] 
    ) );

    // *** Create drowdowns for each date term
    // 
    // Store years to calculate date later
    specs = {
        "options"  : this.years,
        "empty"    : "#[year]"
    };
    this.year = new Dropdown( 
        new ItemData(
            this.itemData.id + "_year", 
            this.itemData.source, 
            this.itemData.answer[ "year" ],
            this.itemData.width,
            function( myId, myValue ) {self.update( "year", myId, myValue );},
            this.itemData.logger,
            this.itemData.translator,            
            this.itemData.report
        ),
        specs,
        function() {self.highlight();}
    );
        
    // Month
    options = [
        "#[january]",
        "#[february]",
        "#[march]",
        "#[april]",
        "#[may]",
        "#[june]",
        "#[july]",
        "#[august]",
        "#[september]",
        "#[october]",
        "#[november]",
        "#[december]"
    ];
    specs = {
        "options"  : options,
        "empty"    : "#[month]"
    };
    this.month = new Dropdown( 
        new ItemData(
            this.itemData.id + "_month", 
            this.itemData.source, 
            this.itemData.answer[ "month" ],
            this.itemData.width,
            function( myId, myValue ) {self.update( "month", myId, myValue );},
            this.itemData.logger,
            this.itemData.translator,            
            this.itemData.report
        ),
        specs,
        function() {self.highlight();}
    );        

    // Day, create one dropdown for each possible set of no. of days
    this.dayContainer = $( "<div>" ).css( "display", "inline" );
    this.dayDropdowns = {};
    var dayCounts = [ 28, 29,  30, 31 ];
    for( j in dayCounts )
    {
        // Create options
        days = dayCounts[j];
        options = [];
        for( i = 1; i <= days; i++ )
        {
            options.push( i );
        }
        
        // Create dropdown
        specs = {
            "options"  : options,
            "empty"    : "#[day]"
        };        
       
        this.dayDropdowns[ days ] = new Dropdown( 
            new ItemData(
                this.itemData.id + "_day", 
                this.itemData.source, 
                this.itemData.answer[ "day" ],
                this.itemData.width,
                function( myId, myValue ) {self.update( "day", myId, myValue );},
                this.itemData.logger,
                this.itemData.translator,
                this.itemData.report
            ),
            specs,
            function() {self.highlight();}
        );          
    }
    this.day = this.dayDropdowns[ 31 ];
    
    // Add drowndowns in order as specified in specs
    var right = $( "<div>" ).attr( "class", "Right" );   
    var orderString = translator.substitute( this.specs[ "order" ] );
    var order = orderString.split( " " );
    
    var dropdown;

    for( i in order )
    {
        // Add drowpdwn for current date term
        dropdown = null;
        switch( order[i] )
        {
            case "d":
                this.dayContainer.append( this.day.draw() );
                dropdown =  this.dayContainer;
                break;
            case "m":
                dropdown =  this.month.draw();
                break;
            case "y":
                dropdown =  this.year.draw();
                break;
        }
        
        // Drowpdown created?
        if( dropdown === null )
        {
            // No drowdown; unrecognized term
            this.itemData.report(
                "ItemTypeDate.draw error",
                "Unrecognized date term in this.specs[ 'order' ]: " + order[i] + " of " + orderString
            );
        }
        else
        {
            // Yes drowdown; add it
            right.append( dropdown );
            
            // Add right-margin if still terms to go
            if( i < order.length - 1 )
            {
                // Day hack - for day, style container instead of select
                if( order[i] == "d" )
                {
                    this.dayContainer.css( "margin-right", "10px" );
                }
                else
                {
                    dropdown.css( "margin-right", "10px" );
                }
            }
        }
    }
        
    // Main container
	var item = $( "<div>" );
	item.append( left  );
	item.append( right );
    item.append( $( "<div>" ).attr( "class", "Clear" ) );
    item.attr( "class", "Item" );
    this.highlightDiv = $( "<div>" );    
    this.highlightDiv.append( item );
    
	return this.highlightDiv;    
}

// Update:
//   Check if days match with month & year
//   Log date if complete
ItemTypeDate.prototype.update = function( term, id, value )
{
    // Update itemData
    //this.itemData.answer[ term ] = value;
    
    // Get itemData
    var year  =  this.year.itemData.answer;
    var month =  this.month.itemData.answer;
    var day   =  this.day.itemData.answer;

    // Calculate days in month
    // If month & year are set, calculate no. of days in month 
    var daysInMonth;
    if( year != -1 && month != -1 )
    {
        //  month & year are set; calculate days
        daysInMonth = this.getDaysInMonth( 
            parseInt( month ),
            this.years[ year ]
        );
    }
    else
    {
        // month & year are set; days to 31 by default
        daysInMonth = 31;
    }
    
    // Unset current value of day if it exceeds the number of days allowed
    if( day >= daysInMonth )
    {
        day = -1;
    }
    
    // Save day
    //this.day.itemData.answer = day;
    
    // Redraw days dropdown if it changed
    var newDay = this.dayDropdowns[ daysInMonth ];
    if( this.day != newDay )
    {
        newDay.itemData.answer = day;
        this.dayContainer.empty();
        this.dayContainer.append( newDay.draw() );
        this.day = newDay;
    }
    
    // Store answer
    this.itemData.answer[ "year" ]  = year;
    this.itemData.answer[ "month" ] = month;
    this.itemData.answer[ "day" ]   = day;
    
    // If item answered, log so
    if( this.isAnswered() )
    {
        // Construct readable date
        var date = this.updateDate();

        // Log
        this.itemData.logger.log(
            this.itemData.source,
            "answered",
            this.itemData.id,
            date.format( "Y-m-d" )
        );    
            
        // Report
        this.itemData.report(
            "ItemTypeDate.update",
            "answered, id: " + this.itemData.id + ", date: " + date.getTime()
        );    
    }
    
    //  Callback
    this.itemData.callback( this.itemData.id, this.itemData.answer );    
}

// Update date term in answer
ItemTypeDate.prototype.updateDate = function()
{
    var year  =  this.itemData.answer[ "year" ];
    var month =  this.itemData.answer[ "month" ];
    var day   =  this.itemData.answer[ "day" ];    
    
    //alert( this.years[ year ] + " " + month + " " + day );
    
    var date = ( new Date( 
        this.years[ year ],
        month,
        parseInt( day ) + 1
    ) );
    
    //alert( date );

    this.itemData.answer[ "date" ] = date;
    return date;
}


ItemTypeDate.prototype.getDaysInMonth = function (iMonth, iYear)
{
    return 32 - new Date(iYear, iMonth, 32).getDate();
}

ItemTypeDate.prototype.isAnswered = function()
{
    return (
           this.itemData.answer[ "year" ]  != -1
        && this.itemData.answer[ "month" ] != -1
        && this.itemData.answer[ "day" ]   != -1 
    );
}

ItemTypeDate.prototype.highlight = function()
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
