// Vardump output data as JSON
vardump = function( dumpMe )
{
    return JSON.stringify( dumpMe, null, 2 );
}

// FInd index of element in Array (MDN fix)
// if (!Array.prototype.indexOf) {
    // Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        // "use strict";

        // if (this === void 0 || this === null) throw new TypeError();

        // var t = Object(this);
        // var len = t.length >>> 0;
        // if (len === 0) return -1;

        // var n = 0;
        // if (arguments.length > 0) {
            // n = Number(arguments[1]);
            // if (n !== n) // shortcut for verifying if it's NaN
            // n = 0;
            // else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) n = (n > 0 || -1) * Math.floor(Math.abs(n));
        // }

        // if (n >= len) return -1;

        // var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);

        // for (; k < len; k++) {
            // if (k in t && t[k] === searchElement) return k;
        // }
        // return -1;
    // };
// }

// Display 2-dimensional array as table with variable names on top
csvTable = function( convertMe, separatorColumn, separatorRow )
{
    if( separatorColumn === undefined )
    {
        separatorColumn = "\t";
    }
    
    if( separatorRow === undefined )
    {
        separatorRow = "\n";
    }    
    
    // No indexed array; return nothing
    var i, j, row;
    var result = [];
    if( convertMe.length == 0 )
    {
        return "<empty>";
    }
    
    // Header
    var header = [];
    for( i in convertMe[0] )
    {
        header.push( i );
    }
    result.push( header.join( separatorColumn ) );
    
    // Values
    var value;
    for( i in convertMe )
    {
        row = [];
        for( j in header )
        {
            value = convertMe[i][header[j]];
            if( ( typeof value ) == "object" )
            {
                value = JSON.stringify( value );
            }
            row.push( value );
        }
        result.push( row.join( separatorColumn ) );
    }
    
    return result.join( separatorRow );
}
