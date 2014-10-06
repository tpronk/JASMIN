function GaatFactory() {};

// Setup default config
GaatFactory.defaultConfig = function()
{
    return {
        "images"               : [],        
        "buttons"              : {
            85 : "up",           // U key
            78 : "down"          // N key
        },
        "zoomInterval"         : 100,    // No, of ms between zoom updates
        "zoomTime"             : 750,   // No, of ms from 50% to max or min zoom
        "zoomMin"              : .2,
        "zoomMax"              : 1,
        "translationCallbacks" : {},
        "keys"                 : "#[gaat_keys]", 
        "slideButtons"         : {
            85 : "previous",     // U key
            78 : "next"          // N key
        },
        "slideButtonTexts"     : {
            "first" : "#[gaat_slide_keys_first]",
            "later" : "#[gaat_slide_keys_later]"
        }
    };
}

// Pick version: Left (tilt) approach or Right (tilt) approach
GaatFactory.pickVersion = function()
{
    var version = {};
    version[ "approach_tilt" ] = Math.random() < .5? "left": "right";
    return version;    
}

// Setup task config
GaatFactory.configTask = function( version )
{
    // Result contains a config for the Gaat
    var result = GaatFactory.defaultConfig();

    // Pick version
    if( version === undefined )
    {
        version = GaatFactory.pickVersion();
    }
    
    result[ "task" ] = version;
    var approachTilt = result[ "task" ][ "approach_tilt" ];
    result[ "translationCallbacks" ][ "gaat_keys" ] = function()
    {
        return "#[gaat_keys_approach_" + approachTilt + "]";
    }
    
    return result;
}



// Create a balanced design (in which each stimulus is presented once in each of the 8 possible combinations)
GaatFactory.configBlocks = function( 
    blockType,
    placebo,
    test,
    control,
    prefix,
    postfix,
    reps, 
    blocks, 
    approachTilt
)  {
    var result = {};
    var i, j;

    // Setup approach and avoid
    var approach = {}, avoid = {}, stimulus;
    for( i in control )
    {
        stimulus = control[i];
        approach[ stimulus ] = "control";
        if( placebo )
        {
            avoid[ stimulus ] = "control";
        }
    }                
    for( i in test )
    {
        stimulus = test[i];
        avoid[ stimulus ] = "test";            

        if( placebo )
        {
            approach[ stimulus ] = "test";
        }
    }
    
    // ************
    // *** All the properties of an Approach Avoidance trial
    
    // Construct stim levels for approach and avoid
    var approachLevels = {
        "yes" : [],
        "no"  : []
    };
    var categories = {};
    for( i in approach )
    {
        approachLevels[ "yes" ].push( i );
        categories[ i ] = approach[ i ];
    }

    for( i in avoid )
    {
        approachLevels[ "no" ].push( i );
        categories[ i ] = avoid[ i ];
    }


    // Construct trialTypes
    var trialTypes = [], tempTypes;
        
    for( i in approachLevels )
    {
        tempTypes = [];
        
        // Stimulus Repetition        
        for(  j = 0; j < reps; j++ )
        {
            tempTypes.push( { 
                "reps" : j
            } );
        }
        
        // Approach or avoid
        tempTypes = Statistics.combine( tempTypes, "appr", [ i ] );    
        
        // Stimuli 
        tempTypes  = Statistics.combine( tempTypes, "stim", approachLevels[ i ] );
        
        trialTypes = trialTypes.concat( tempTypes );
    }
    
    // Construct additional info: "image" (image file), "tilt" (left/right tilted), and "cat" (stimulus category)
    var tilt;
    for( i in trialTypes )
    {
        if(    ( trialTypes[i][ "appr" ] == "yes" && approachTilt == "left"  ) 
            || ( trialTypes[i][ "appr" ] == "no"  && approachTilt == "right" ) 
        ) {
            tilt = "left";
        } else {
            tilt = "right";
        }
        trialTypes[i][ "tilt"  ] = tilt;
        trialTypes[i][ "image" ] = trialTypes[i][ "stim" ] + "_" + tilt;
        
        trialTypes[i][ "cat" ]   = categories[ trialTypes[i][ "stim" ] ];
    }
    
    // Report trialTypes
    report(
        "GaatFactory.trials",
        csvTable( trialTypes, "\t", "\n" )
    );
        
    
    // Shuffle until we found a sequence with less than 4 repetitions
    var accepted = false, candidate;
    while( !accepted )
    {
        candidate = Statistics.shuffle( trialTypes );
        accepted  = !Statistics.repetitions(
            candidate,
            5,
            "cat"
        );
        
        // Report trialTypes
        report(
            "GaatFactory.trials_shuffled",
            csvTable( trialTypes, "\t", "\n" )
        );        
    }
    trialTypes = candidate;
    
    // Report trialTypes
    report(
        "GaatFactory.trials_accepted",
        csvTable( trialTypes, "\t", "\n" )
    );
        
    // Construct blocks
    var blockConfig = [], from, to;
    for( i = 0; i < blocks.length; i++ )
    {
        from = Math.ceil( ( ( i     ) / blocks.length ) * trialTypes.length );
        to   = Math.ceil( ( ( i + 1 ) / blocks.length ) * trialTypes.length );
        blockConfig.push( {
            "block"  : { 
                "type"    : blockType,
                "placebo" : placebo                
            },
            "intro"  : blocks[i],
            "trials" : trialTypes.slice( from, to )
        } );
    }
    
    result[ "blocks" ] = blockConfig;
    
    // Construct stimulus filenames
    var imageFiles = {}
    var stimuli    = approachLevels[ "yes" ].concat( approachLevels[ "no" ] );
    for( var i in stimuli )
    {
        imageFiles[ stimuli[i] + "_left" ]  = prefix + stimuli[i] + "_aat_left" + postfix;
        imageFiles[ stimuli[i] + "_right" ] = prefix + stimuli[i] + "_aat_right"  + postfix;
    }
    
    // Report trialTypes
    report(
        "GaatFactory.imageFiles",
        vardump( imageFiles )
    );    

    //imageFiles[ "probe_up"   ] = filePrefix + "arrow_up.png";
    //imageFiles[ "probe_down" ] = filePrefix + "arrow_down.png";
    
    result[ "images" ] = imageFiles;
    
    return result;
}
