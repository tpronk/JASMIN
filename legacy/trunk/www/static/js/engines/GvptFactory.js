function GvptFactory() {};

// Setup default config
GvptFactory.defaultConfig = function( filePrefix )
{
    return {
        // Arrow up and down image
        "images"               : {
            "probe_up"   : filePrefix + "vpt_arrow_up.png",
            "probe_down" : filePrefix + "vpt_arrow_down.png"
        },
        "buttons"              : {
            85 : "up",           // U key
            78 : "down"          // N key
        },
        "responseWindow"       : 6000,
        "translationCallbacks" : {},
        "keys"                 : "#[gvpt_keys]", 
        "slideButtons"         : {
            85 : "previous",     // I key
            78 : "next"          // N key
        },
        "slideButtonTexts"     : {
            "first" : "#[gvpt_slide_keys_first]",
            "later" : "#[gvpt_slide_keys_later]"
        },
        "blocks" : []
    };
}

// Task Config
GvptFactory.configTask = function( filePrefix )
{
    // Result contains a config for the Gaat
    return GvptFactory.defaultConfig( filePrefix );
}

// Create a balanced design (in which each stimulus is presented once in each of the 8 possible combinations)
GvptFactory.configBlocks = function(
    blockType,
    placebo,
    stimuli,
    keepStimulus,
    filePrefix,
    filePostfix,
    reps, 
    blocks
)  {    
    var result = {};
    // ************
    // *** All the properties of a visual probe trial
    
    // Setup patt (probe at target)
    var trialTypes;
    if( placebo )
    {
        trialTypes = [
            { "patt": "yes" },
            { "patt": "no"  }
        ];
    } else {
        trialTypes = [
            { "patt": "no"  }
        ];        
    }
    
    // Stimulus Repetition        
    var repLevels = [];
    for( var j = 0; j < reps; j++ )
    {
        repLevels.push( j );
    }    

    // x stimulus repetitions 
    trialTypes = Statistics.combine( trialTypes, "reps", repLevels );

    // x phor; Probe horizontal position
    trialTypes = Statistics.combine( trialTypes, "phor", [ "left", "right" ] );

    // x stimuli
    trialTypes = Statistics.combine( trialTypes, "stim", stimuli );
    
    // x keepStimulus
    var keepStimulusLevels;
    if( keepStimulus == "both" )
    {
        keepStimulusLevels = [ "yes", "no" ];
    } else {
        keepStimulusLevels = [ keepStimulus ];        
    }    
    trialTypes = Statistics.combine( trialTypes, "keep", keepStimulusLevels );
    
    // Construct pdir; arrow up/down
    var pdirs =               Statistics.rep( "up",   trialTypes.length / 2 );
    pdirs     = pdirs.concat( Statistics.rep( "down", trialTypes.length / 2 ) );
    pdirs     = Statistics.shuffle( pdirs );
    
    // Add pdir -> probe direction; patt -> (probe at target: yes/no); stimulus per trial     
    var thor;
    for( var i in trialTypes )
    {
        if(    ( trialTypes[i][ "patt" ] == "yes" && trialTypes[i][ "phor" ] == "left"  ) 
            || ( trialTypes[i][ "patt" ] == "no"  && trialTypes[i][ "phor" ] == "right" ) 
        ) {
            thor = "left";
        } else {
            thor = "right";
        }
        trialTypes[i][ "thor"  ] = thor;
        trialTypes[i][ "image" ] = trialTypes[i][ "stim" ] + "_" + thor;
        trialTypes[i][ "pdir"  ] = pdirs[i];
    }
    
    // Report trialTypes
    report(
        "GvptFactory.trials",
        csvTable( trialTypes, "\t", "\n" )
    );
    
    // Shuffle until we found a sequence with less than 4 repetitions
    var accepted = false, candidate;
    while( !accepted )
    {
        candidate = Statistics.shuffle( trialTypes );
        accepted  = !Statistics.repetitions(
            candidate,
            6,
            "thor"
        );
        
        // Report trialTypes
        report(
            "GvptFactory.trials_shuffled",
            csvTable( trialTypes, "\t", "\n" )
        );        
    }
    trialTypes = candidate;    
    
    // Report trialTypes
    report(
        "GvptFactory.trials_accepted",
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
    for( var i in stimuli )
    {
        imageFiles[ stimuli[i] + "_left" ]  = filePrefix + stimuli[i] + "_vpt_left"  + filePostfix;
        imageFiles[ stimuli[i] + "_right" ] = filePrefix + stimuli[i] + "_vpt_right" + filePostfix;
    }
    
    result[ "images" ] = imageFiles;
    
    return result;
}
