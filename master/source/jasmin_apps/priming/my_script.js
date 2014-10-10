$( document ).ready( function() { 
    // Fail and report callbacks
    fail    = function(         message ) { console.log( "FAILED: "    + message ); };
    report  = function( source, message ) { console.log( source + ": " + message ); };

    // Setup a loader
    io = new jasmin.RequestManager( fail ); //, report, report );
    loader = new jasmin.Loader( io );

    // Start
    taskEngine  = new jasmin.TaskEngine( "A" );
    taskManager = new jasmin.TaskManager( taskEngine );
    taskManager.init();
} );