offline = true;  // Running offline?
promped = false;  // Prompt participant for task?
testing = true;
promptTouch = true;
promptLang  = true;

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}

//alert( $.urlParam( "task" ) );

// Start with loading the resources
start = function()
{   
    if( promptLang )
    {
        // Prompt language
        //var language = prompt( "Specify language: en, it, lt, nl ", "nl" );
        var language = $.urlParam( "language" ) === null? "en" : $.urlParam( "language" );
        translationsFile = "my_translations_" + language + ".txt";
    } else {
        translationsFile = "my_translations_en.txt";
    }

	if( offline )
	{
		loadDummyReplies( launch );
	}	
	else
	{
		launch();
	}
}
	
launch = function()
{
    // Load helpers
    loadGeneric( 
		config[ "runId" ],
        report,                // report callback
        $( "#hiddenContent" ), // Hidden div for Dialog
		function( message ) { engine( { "action" : "fail", "message" : message } ) }, // fail function
        !offline               // ajaxEnabled = !offline
    );
        
    if( window.opener != undefined  )
    {
        window.opener.logger = logger;
    }        
    
    // Set ajax fail to engine
    //ajaxManager.fail = function( message ) { engine( { "action" : "fail", "message" : message } ) }
    
    // Preload settings
    dialog.loading( "" );
	loader.load( 
        {
            // Tracks GAAT statePersistent
            "settings" :
            {
                "namespace" : "session_state",
                "type"      : "get",
                "id"        : "settings"
            },
            "translations":
            {
                "namespace" : "translate",
                "type"      : "experiment",
                "id"        : config[ "experiment_id" ]
            }			
        },
        // Images
        [],
        // Callback on success
        function( data, imageResults ) { preloadSuccess( data, imageResults ) },
        // Progress callback 
        function( message )
        {
            dialog.messageContainer.text( message );
        },
        // Progress text
        templateMessages[ "loading" ]
    );    
};    
    
// Preloaded settings, setup actual loading
preloadSuccess = function( data, imageResults )
{
    settings = data[ "settings" ];
    task     = settings[ "task" ];
    
    // Prompt task, stimuli, version
    if( promped )
    {
        // task
        //var taskIndex = prompt( "Specify task: v=vpt, a=aat, s=stroop, b=biat", "b" );
        taskIndex = $.urlParam( "task" ) === null? "v" : $.urlParam( "task" );
        var taskMap   = { "v" : "vpt", "a" : "aat", "s" : "stroop", "b" : "biat" };
        var task      = taskMap[ taskIndex ];
        settings[ "task" ] = task;
        
        // stimuli
        //var stim    = prompt( "Specify stimuli: a=alcohol, c=cannabis, s=smoking, i=Italian alcohol, f=food", "a" );
        stim = $.urlParam( "stim" ) === null? "a" : $.urlParam( "stim" );
        var stimMap = { "a" : "alcohol", "c" : "cannabis", "s" : "smoking", "i" : "alcohol_italy", "f" : "food" };
        settings[ "stimuli_url" ] = "stimuli/" + stimMap[ stim ] + "/";
        
        // Special case for food stims
        //alert( vardump( settings[ task + "_parts" ][0][ "stimuli" ] ) );
        /*settings[ task + "_parts" ][0][ "stimuli" ] = [
          "sw_a_18",
          "sw_a_19"
        ];*/
        //sw_a_18
        
        //alert( vardump( settings ));
        
        // Condition
        //var version = prompt( "Placebo? y, n", "n" );
        var version = $.urlParam( "condition" ) === null? "y" : $.urlParam( "condition" );
        if( ( task == "vpt" || task == "aat" ) && version == "n" )
        {
            settings[ task + "_parts" ][ 0 ][ "placebo" ] = false;
        }
    }
    
    taskConfig = setupTask( 
        "config",
        settings,
        imageResults
    );
        
    // Load translations
    translator.addTranslations( data[ "translations" ] )		
        
    report( "my_script.taskConfig", vardump( taskConfig ) );    
    
    // Load resources
    dialog.loading( "" );
    var taskState = {};
    taskState[ task ] = {
        "namespace" : "session_state",
        "type"      : "get",
        "id"        : "task"
    };
    
    report( "my_script.images", vardump(  taskConfig[ "images" ] ) );

	loader.load( 
        // JSON to load
        taskState,
        // Images
        taskConfig[ "images" ],
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
    // Set focus message
    focusManager.setWarning( function( callback ) {
        engine( {
            "action"  : "blur",
            "callback": callback
        } );
    } );

    // Get stimuli
    images = imageResults;
    
    // Set states to initial states
    logger.setState( "task", data[ "task" ], false );
        
    // Hide dialog
    dialog.hide();

    // Hide scrollbar
    $( "html" ).css( "overflow-y", "hidden" );

    // Construct, draw and start Task
    task = new setupTask(
        "construct",
        settings,
        images
    );    
    
    taskManager = new TaskManager(
        logger.getStateCallback( "task" ),                 
        logger.setStateCallback( "task" ), 
        taskConfig,
        task,           // Task to manage
        "#mainContent", // ID of target div
		// onComplete callback
        function() {
			// Send logs synchronously on task complete 
            ajaxManager.sendOpenRequests( true );
 		}   
    );
	
	// Send logs synchronously on unload
    $( window ).bind( "unload", function()
    {
		ajaxManager.sendOpenRequests( true );
    } ); 	
    
        
    // Called when running AAT in JASMIN Survey, provide dummy itemData
    taskManager.construct( {} );
    
    // Draw AAT (returns DOM node)
    taskManager.draw();
    
    // Start AAT
    taskManager.start();        
}

        
setupTask = function( phase, settings, images )        
{
    switch( settings[ "task" ] )
    {
        case "aat":
            return setupAat( phase, settings, images );
            break;
        case "vpt":
            return setupVpt( phase, settings, images );
            break;            
        case "biat":
            return setupBiat( phase, settings, images );
            break;            
        case "stroop":
            return setupStroop( phase, settings, images );
            break;            
    }
}

setupAat = function( phase, settings, images )
{
    switch( phase )
    {
        case "config":
            // Images to download
            var imageUrls = {};
            
            // Task config
            var taskConfig = GaatFactory.configTask( 
                { "approach_tilt" : settings[ "aat_approach" ] }
            );
            imageUrls = $.extend( imageUrls, taskConfig[ "images" ] );
            
            // Setup blocks
            var blocks = [];
            var part, block, test, control;
                        
            // Construct blocks
            for( var i in settings[ "aat_parts" ] )
            {
                part = settings[ "aat_parts" ][ i ];
                
                // Stimuli
                test    = [];
                control = [];
                for( i in part[ "stimuli" ] )
                {
                    test.push(    part[ "stimuli" ][ i ] + "_test"    );
                    control.push( part[ "stimuli" ][ i ] + "_control" );
                }                

                // Assessment block: config
                block = GaatFactory.configBlocks(
                    part[ "type"    ],
                    part[ "placebo" ],
                    test,
                    control,
                    settings[ "stimuli_url" ],
                    settings[ "stimuli_extension" ],
                    part[ "reps"   ],
                    part[ "blocks" ],
                    taskConfig[ "task" ][ "approach_tilt" ]
                );

                blocks = blocks.concat( block[ "blocks" ] );
                imageUrls = $.extend( imageUrls, block[ "images" ] );
            }

            /// Setup taskConfig
            taskConfig[ "blocks" ] = blocks;
            taskConfig[ "images" ] = imageUrls;

            return taskConfig;
        case "construct":
            return new Gaat(
                images,
                Gaat.defaultSprites()
            );
            break;
    }
}

setupVpt = function( phase, settings, images )
{
    switch( phase )
    {
        case "config":
            var imageUrls = {};            
            
            // Task config
            var taskConfig = GvptFactory.configTask( 
                settings[ "graphics_url" ]
            );
            imageUrls = $.extend( imageUrls, taskConfig[ "images" ] );
                        
            // Construct blocks
            var blocks = [];
            var part, block, stimuli;
            for( var i in settings[ "vpt_parts" ] )
            {
                part = settings[ "vpt_parts" ][ i ];
                // Stimuli
                stimuli = [];
                for( i in part[ "stimuli" ] )
                {
                    stimuli.push( part[ "stimuli" ][ i ] );
                }                

                // Assessment block: config
                block = GvptFactory.configBlocks(
                    part[ "type"    ],
                    part[ "placebo" ],
                    stimuli,
                    part[ "keep" ],
                    settings[ "stimuli_url" ],
                    settings[ "stimuli_extension" ],
                    part[ "reps"   ],
                    part[ "blocks" ]
                );

                blocks = blocks.concat( block[ "blocks" ] );
                imageUrls = $.extend( imageUrls, block[ "images" ] );
            }                        
                        
            /// Setup taskConfig
            taskConfig[ "blocks" ] = blocks;
            taskConfig[ "images" ] = imageUrls;

            return taskConfig;
        case "construct":
            return new Gvpt(
                images,
                Gvpt.defaultSprites()
            );
            break;
    }
}

setupStroop = function( phase, settings, images )
{
    switch( phase )
    {
        case "config":
            // Task config
            var taskConfig = StroopFactory.configTask();
                        
            // Construct blocks
            var blocks = [];
            var part, block;
            for( var i in settings[ "stroop_parts" ] )
            {
                part = settings[ "stroop_parts" ][ i ];

                // Assessment block: config
                block = StroopFactory.configBlocks(
                    part[ "type"    ],
                    part[ "labels"  ],
                    part[ "stimuli" ],
                    part[ "reps"    ],
                    part[ "blocks"  ]
                );

                blocks = blocks.concat( block[ "blocks" ] );
            }                        
                        
            /// Setup taskConfig
            taskConfig[ "blocks" ] = blocks;

            return taskConfig;
            break;
        case "construct":
            return new Stroop(
                Stroop.defaultSprites()
            );
            break;
    }
}

setupBiat = function( phase, settings, images )
{
    switch( phase )
    {
        case "config":    
            // Prompt for attributes
            var attributeSuffix1 = "approach";
            var attributeSuffix2 = "avoid";            
            if( promped )
            {
                //var attributeSetting = prompt( "Specify attribute (p=pleasant/unpleasant, a=approach/avoid)" );
                attributeSetting = $.urlParam( "attribute" ) === null? "a" : $.urlParam( "attribute" );                
                switch( attributeSetting )
                {
                    case "p":
                        attributeSuffix1 = "pleasant";
                        attributeSuffix2 = "unpleasant";
                    case "a":
                        attributeSuffix1 = "approach";
                        attributeSuffix2 = "avoid";
                }
            }
            
            var stimCount = 1;
            var attribute1 = {   
                "category" : attributeSuffix1,
                "label"    : "#[word_" + attributeSuffix1 + "_category]",
                "stimuli"  : {
                    "a1_1" : "#[word_" + attributeSuffix1 + "_1]"  
                }
            };
            var attribute2 = {   
                "category" : attributeSuffix2,
                "label"    : "#[word_" + attributeSuffix2 + "_category]",
                "stimuli"  : {
                    "a2_1" : "#[word_" + attributeSuffix2 + "_1]"  
                }
            };
            
            // Construct setup
            taskConfig = GiatFactory.biatConfig( 
                settings[ "biat_config" ][ "target1"    ],
                settings[ "biat_config" ][ "target2"    ],
                attribute1,  // settings[ "biat_config" ][ "attribute1" ],
                attribute2,  // settings[ "biat_config" ][ "attribute2" ],
                settings[ "biat_config" ][ "practice1"  ],
                settings[ "biat_config" ][ "practice2"  ],
                settings[ "biat_config" ][ "stimReps"   ],
                settings[ "biat_config" ][ "warmup"     ],
                settings[ "biat_config" ][ "blockReps"  ],
                settings[ "biat_config" ][ "intro"      ],
                settings[ "graphics_url" ],
                settings[ "biat_config" ][ "version"    ]
            );
                
            return taskConfig;
            break;
        case "construct":
            var touch = false;
            if( promptTouch ) {
                //var touchIndex = prompt( "Touchscreen version (y=yes,n=no)", "y" );
                var touchIndex = $.urlParam( "touch" ) === null? "n" : $.urlParam( "touch" );
                var touchMap   = { "y" : true, "n" : false };
                var touch      = touchMap[ touchIndex ];
            };
            return new Giat(
                images,
                Giat.defaultSprites(),
                touch
            );    
            break;
    }
}

// Function called after survey events; return false if navigation should be stopped
engine = function( params )
{
    switch( params[ "action" ] )
    {
        // Blur, params contains callback to "restart" function
        case "blur":
            /*
            return dialog.alert( 
                translator.translate( "click_to_focus" ),
                params[ "callback" ]
            );
            */
            break;
        // Page just drawn
        case "drawn":
            if( navigation.currentPageId() == "giat_task1" )
            {
                
            }
            break;
        // Continued to next page
        case "next":
            break;
        case "fail":
            return dialog.alert( 
                  templateMessages[ "error" ] + " "
                + vardump( params )
            );            
            break;
    }
        
    return params;
}
