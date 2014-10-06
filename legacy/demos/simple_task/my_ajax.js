dummyReplies = {
    // Settings for task
    "settings"    : {
        "burger_right" : true
    }
};

// Launcher callback
var launcherCallback;
loadDummyReplies = function( launcherCallbackParam )
{
    launcherCallback = launcherCallbackParam;
	
    // Current UNIX time
    dummyReplies[ "now" ] = new Date();

    // Read translations from file
    readFile( translationsFile );
}
 
doneLoading = function( data )
{
    dummyReplies[ "translations" ] = convertFileToTranslations( data );
    launcherCallback();    
}
// Read a textfile, then call done
readFile = function( filename )
{
    $.ajax( {
        "url"      : filename,
        "data"     : "",
        "success"  : doneLoading,
        "dataType" : "text",
        "contentType" : "application/x-www-form-urlencoded;charset=ISO-8859-15"
    } );
}

// Reads translations from a tab and newline separate string, returns a translation array for use in Translator
convertFileToTranslations = function( data )
{
    // Lines to array
    data = data.split( "\n" );

    // Get relevant columns
    var header = rowToArray( data[0] );
    var indexTerm  = searchStringInArray( "term", header );
    var indexTrans = searchStringInArray( "value",     header );
    
    if( indexTerm  === -1 ) { alert( "Error: No terms found; no column in translations has the name 'term'" ) }
    if( indexTrans === -1 ) { alert( "Error: No translations found; no column in translations has the name 'value'" ) }    
    
    var translation, output = {};
    for( var i = 1; i < data.length; i++ )
    {
        translation = rowToArray( data[i] );
        if( translation.length != 1 )
        {
            output[ translation[ indexTerm ] ] = translation[ indexTrans ];
        }
    }    
    return output;
}

rowToArray = function( source )
{
    // Remove additional control char before endline
    if( source.charCodeAt( source.length - 1 ) == 13 )
    {
        source = source.substr( 0, source.length - 1 );
    }    
    
    return source.split( "\t" );    
}

searchStringInArray = function( needle, haystack ) 
{
    for( var j = 0; j< haystack.length; j++ ) 
    {
        if( haystack[j] === needle ) return j;
    }
    return -1;
}
