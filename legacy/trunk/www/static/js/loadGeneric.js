/*
 * Load these helper objects in a set of globals
 *  - popup       
 *   - ajaxManager
 *   - logger
 *   - loader
 *   @param report        Function used by helpers to report on their functioning
 *   @param dialogDiv     Div containing dialog
 *   @param ajaxEnabled   Is the ajaxManager enabled?
  */
loadGeneric = function(
	runId,
    report,
    dialogDiv,
	fail,
    ajaxEnabled
) {
    // AjaxManager; manages AJAX calls
    // - Communicate with ajax_handler.php
    // - Retry any calls that timeout
    // - Fail once we've retried too often
	ajaxManager = new AjaxManager( 
        config[ "ajax_url" ],
		runId,
        report,
		fail,
        //function( message ) { ajaxFail( message ) },
        config[ "ajax_timeout" ],
        config[ "ajax_retries" ],
        ajaxEnabled
    );    
    
    // Loader; uses AjaxManager to preload resources
    // 1. load a set of resources (text/pictures) from the server
    // 2. Optionally show progress
    // 3. Call a function once all resources are loaded
    loader  = new Loader( 
         ajaxManager, 
         report,
		 fail
		 //function( message ) { ajaxFail( message ) }
    );

    // Logger; uses AjaxManager to periodically log events and states
    // 1. log events, which are sent every x ms to the server
    // 2. maintain states, which are synced every x ms with the server
	logger  = new Logger(
        ajaxManager, 
        report, 
        config[ "log_timeout" ],
        ajaxEnabled
    );
     
    // Popup; maintains popup state 
    // 1. Communicate with PopupManager
    // 2. Flush the logs if the window is closed
    popup = new Popup(
        ajaxManager, 
        logger
    );

    // Translator; translate terms
    // 1. Load in sets of terms
    // 2. Translate with callbacks for user-defined terms
    translator = new Translator( 
        report 
    );
        
    // Dialog; show a small dialog window in one of three flavors:
    // 1. Loading, text with a loading animation
    // 2. Alert,   text with OK button
    // 3. Message, text without anything
    dialog = new Dialog( 
        dialogDiv,
        logger
    );
        
    // FocusManager; checks if window has focus. Callbacks for:
    // 1. Alerting the user that the window blurred
    // 2. Callback for blur  (to stop any running tasks)
    // 3. Callback for focus (to restart any tasks)
    focusManager = new FocusManager( 
        window,
        logger
    );  
};