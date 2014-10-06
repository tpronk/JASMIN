/* 
 * Reporter Constructor 
 * @param   target        ID of target div
 * @param   prefixes      Array of prefixes only reports types that contain prefix (leave undefined to report everything)
 */
function Reporter( target, prefixes )
{
	this.target       = target;
    this.prefixes     = prefixes;
    
	// Create report table
    this.tbl = $( "<table>" );
    this.tbl.attr( "id", "ReporterTable" );
	this.tbl.css( {
		"font-family"    : "monospace"
	} );		
	
    // Add to target
    this.target.append( this.tbl );
        
	// Write headers
	this.writeRow( [ "Time", "Type", "Description" ] );
}

/* 
 * Report something
 * @param   type        Type of message
 * @param   message     What to report
 */
Reporter.prototype.report = function( type, message )
{
    //alert( type);
    if( this.prefixes === undefined || this.findInArray( type, this.prefixes ) )
    {
        this.writeRow( [ this.niceDate(), type, message ] );
    }
}

/* 
 * Pad a number with zeroes so that it has at least x digits 
 * @param   number     Number to pad
 * @param   digits     Number of digits in result
 * @return             Padded number
 */
Reporter.prototype.padNumber = function( number, digits )
{
	number = number.toString();
	var padding = "";
	if( digits > number.length )
	{
		for( i = 0; i < ( digits - number.length ); i++ )
		{
			padding += "0";
		}
	}
	return padding + number.toString();
}

/* 
 * Get the current date in a nice format (MySQL + milliseconds)
 * @return             Nice date
 */
Reporter.prototype.niceDate = function()
{
	var date = new Date();
	return(
		  date.getFullYear()
		+ "-"
		+ this.padNumber( date.getMonth(), 2 )
		+ "-"
		+ this.padNumber( date.getDay(), 2 )
		+ " "
		+ this.padNumber( date.getHours(), 2 )
		+ ":"
		+ this.padNumber( date.getMinutes(), 2 )
		+ ":"
		+ this.padNumber( date.getSeconds(), 2 )
		+ " "
		+ this.padNumber( date.getMilliseconds(), 3 )
	);
}

/* 
 * Write a row to the debugger table
 * @param  cells       Cells to write
 */
Reporter.prototype.writeRow = function( cells )
{
    var tr = $( "<tr>" );
    var td;

    for( var i in cells )
    {
        td = $( "<td>" ).append( $( "<pre>" ).text( cells[i] ) );
        td.css( {
            "vertical-align" : "top",
            "padding-left"   : "16px"
        } );
        tr.append( td );
    }
    //this.tbl.prepend( tr );
    this.tbl.append( tr );

    //var scrollTo = this.target.height();
    //this.target.scrollTop( scrollTo );
}

/* 
 * Make a callback to this report function
 * @return callback
 */
Reporter.prototype.reportClosure = function()
{
	var self = this;
	return function( type, message )
	{
		self.report( type, message );
	};
}


/* 
 * Find if needle is in one of the haystack string
 * @return true if so
 */
Reporter.prototype.findInArray = function( needle, haystack )
{
    for( i in haystack )
    {
        if( needle.search( haystack[i] ) != -1 )
        {
            
            return true;
        }
    }
    return false;
}
