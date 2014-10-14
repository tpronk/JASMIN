$( document ).ready( function() { 
    // Fail and report callbacks
    fail    = function(         message ) { console.log( "FAILED: "    + message ); };
    report  = function( source, message ) { console.log( source + ": " + message ); };

    // Setup a loader
    io     = new jasmin.RequestManager( fail, report, report );
    loader = new jasmin.Loader( io );
    
    // Load stuff
    var requests = { 
        "sprites"     : [ "json", "TaskSprites.json" ],
        "config"      : [ "json", "TaskConfig.json" ],
        "burger"      : [ "img", "pictures/burger.jpg" ],
        "salad"       : [ "img", "pictures/salad.jpg" ],
        "fix"         : [ "img", "pictures/fix.png" ],
        "incorrect"   : [ "img", "pictures/incorrect.png" ]
    };
    loader.load( requests, setup );
} );

setup = function( replies ) {
    // Setup more JASMIN modules
    translator   = new jasmin.Translator();
    eventManager = new jasmin.EventManager( window );
         
    // Setup task
    taskEngine  = new jasmin.TaskEngine( 
        replies[ "sprites" ],
        {
            "burger"     : replies[ "burger"     ],
            "salad"      : replies[ "salad"      ],
            "fix"        : replies[ "fix"        ],
            "incorrect"  : replies[ "incorrect"  ]
        }
    );
 
    taskManager = new jasmin.TaskManager( 
        translator,
        eventManager,
        taskEngine,          
        replies[ "config" ] ,
        $( document.body )   // Add task to document body
    );

    // Sync and start
    eventManager.sync( function() { 
        taskManager.start();
    } );
};