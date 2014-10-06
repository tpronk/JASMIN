/**
 * Get an image
 */
getIcon = function( icon )
{
	return $( "<img>" ).attr( {src: config[ "img_location" ] + "/icons/" + icon} );
}


/**
 * Run browser tests
 */
testBrowser = function()
{
    // *** Check browser type; block opera
    /*
    if( $.browser.opera )
    {
        $( "#BrowserFeedback").html( translations[ "use_other_browser" ] );
        return;
    }
    */
   
	// *** Test cookies
    $.cookie( 'test_cookies', "true" );
    
	// If cookie function return "true", we've got cookies
	if( $.cookie( 'test_cookies' ) != "true" )
	{
		$( "#BrowserFeedback").html( translations[ "enable_cookies" ] );
        return;
	}

	// console.debug( flashVersion.major + "_" + flashVersion.minor + "_" + flashVersion.release );

	// *** Test AJAX
    ajaxManager = new AjaxManager( 
        config[ "ajax_url" ],
        0, // run_id
        function() {},  // Report
        function( message ) { ajaxFail( message ) },
        config[ "ajax_timeout" ],
        config[ "ajax_retries" ]
    );
        

    // Set "pleae wait..." timeout
    pleaseWaitTimeout = setTimeout(
        pleaseWait,
        1000
    );
           
        
	// submit some data
	ajaxManager.send( {
        "namespace"      : "log_events",
        "type"           : "long",
        "experiment_id"  : config[ "experiment_id" ],
        "events"         : [ {
            "time"        : new Date().getTime(),
            "source"      : "BrowserTester",
            "type"        : "Test",
            "name"        : "",
            "value"       : ""
        } ],
        "success"        : function( data ) { ajaxSuccess( data ); },
        "error"          : function( data ) { ajaxFail( data ); }
	} );
}

// AJAX test Success, enable next button
ajaxSuccess = function( data )
{
    if( pleaseWaitTimeout !== undefined  )
    {
        clearTimeout( pleaseWaitTimeout );
    }
    $( "#BrowserTesterForm" ).submit(); 
}

ajaxFail= function( errorMessage )
{
    if( pleaseWaitTimeout === undefined  )
    {
        clearTimeout( pleaseWaitTimeout );
    }
	$( "#BrowserFeedback" ).html( translations[ "ajax_error" ] );
    // alert( errorMessage );
}

pleaseWait = function()
{
    $( "#BrowserFeedback").html( translations[ "please_wait" ] );
}

$( document ).ready( function() {
	testBrowser();
} ) ;


