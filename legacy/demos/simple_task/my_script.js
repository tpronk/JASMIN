testing = true;  // Testing? (no focus warnings etc.)
offline = true;  // Running offline?

// Start with loading the resources
start = function()
{   
    // If offline, my_ajax.js is used for task configuration
    // and my_translations.txt is used for instruction texts
    // If online, these are requested from the server (LOTUS/MIRTE)
	if( offline )
	{
        // Translations used for testing
        translationsFile = "my_translations.txt";
    	loadDummyReplies( launch ); 
        
	}	
	else
	{
		launch();
	}
}
	
launch = function()
{  
    // Report callback (overridden by a dummy function), should build demo
    report = function () {};

    // Load helpers see static/js/loadGeneric.js)
    loadGeneric( 
		config[ "runId" ],
        report,                // report callback
        $( "#hiddenContent" ), // Hidden div for Dialog
         // fail function
		function( message ) { 
           dialog.alert( 
                templateMessages[ "error" ] + " "
              + vardump( message )
            );            
        },
        !offline               // ajaxEnabled = !offline
    );
    
    // Show we are loading
    dialog.loading( "" );
    
    // Load settings and translations
	loader.load( 
        {
            "settings" :
            {
                "namespace" : "session_state",
                "type"      : "get",
                "id"        : "settings"
            },
            "translations":
            {
                "namespace" : "translate",
            }			
        },
        // Images
        { 
            "burger" : "stimuli/burger.jpg", 
            "salad"  : "stimuli/salad.jpg" 
        },
        // Callback on success
        function( data, imageResults ) { loadSuccess( data, imageResults ) },
        // Progress callback 
        function( message )
        {
            dialog.messageContainer.text( message );
        },
        // Progress text
        templateMessages[ "loading" ]
    );    
};    

// Loading done, start
loadSuccess = function( data, imageResults )
{
    // Add translations to translator
    translator.addTranslations( data[ "translations" ] );    

    // Hide dialog
    dialog.hide();

    // Hide scrollbar
    $( "html" ).css( "overflow-y", "hidden" );

    // Start Task
    task = new SimpleTask(
        data[ "settings" ],
        imageResults,
        config[ "target" ], 
        function() { alert( "onCompleted" ); }, 
        testing
    );
}