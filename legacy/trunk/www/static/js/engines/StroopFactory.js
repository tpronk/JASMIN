function StroopFactory() {};

// Setup default config
StroopFactory.defaultConfig = function()
{
    return {
        "buttons"              : {
            68 : "blue",         // D key
            86 : "green",        // 78 key
            78 : "yellow",       // N key
            75 : "red"           // K key
        },
        "buttonNames"          : {
            "blue"   : "D",
            "green"  : "V",
            "yellow" : "N",
            "red"    : "K"
        },
        "responseWindow"       : 4000,
        "translationCallbacks" : {},
        "keys"                 : "#[stroop_keys]", 
        "slideButtons"         : {
            86 : "previous",     // V key
            78 : "next"          // N key
        },
        "slideButtonTexts"     : {
            "first" : "#[stroop_slide_keys_first]",
            "later" : "#[stroop_slide_keys_later]"
        }
    };
}

// Task Config
StroopFactory.configTask = function( version )
{
    // Result contains a config for the Gaat
    return StroopFactory.defaultConfig();
}

// Create a balanced design (in which each stimulus is presented once in each of the 8 possible combinations)
StroopFactory.configBlocks = function(
    blockType,
    labels,
    stimuli,
    reps, 
    blocks
)  {
    var result = {};
    // ************
    // *** All the properties of a visual probe trial
    
    // Setup color 
    var colors = [
        "blue",
        "green",
        "yellow",
        "red"            
    ];
	
	// Setup base trialTypes
	var trialTypes = [];;
	var stim, color, i;
	for( stim in stimuli )
	{
		for( color in colors )
		{
			for( i = 0; i < stimuli[stim][color]; i++ )
			{
				trialTypes.push( {
					"color" : colors[color],
					"stim"  : stim
				} );
			}
		}
	}
		        
    // Report trialTypes
    report(
        "StroopFactory.trials",
        csvTable( trialTypes, "\t", "\n" )
    );
    
    // Shuffle until we found a sequence with less than 4 repetitions of same stimulus
    var accepted = false, candidate;
    while( !accepted )
    {
        candidate = Statistics.shuffle( trialTypes );
        accepted  = !Statistics.repetitions(
            candidate,
            3,
            "color"
        );
        
        // Report trialTypes
        report(
            "StroopFactory.trials_shuffled",
            csvTable( trialTypes, "\t", "\n" )
        );        
    }
    trialTypes = candidate;    
    
    // Report trialTypes
    report(
        "StroopFactory.trials_accepted",
        csvTable( trialTypes, "\t", "\n" )
    );
        
    // Construct blocks
    var blockConfig = [], from, to;
    for( i = 0; i < blocks.length; i++ )
    {
        from = Math.ceil( ( ( i     ) / blocks.length ) * trialTypes.length );
        to   = Math.ceil( ( ( i + 1 ) / blocks.length ) * trialTypes.length );
        blockConfig.push( {
            "block"  : { "type" : blockType, "labels" : labels },
            "intro"  : blocks[i],
            "trials" : trialTypes.slice( from, to )
        } );
    }
    
    result[ "blocks" ] = blockConfig;
    
    return result;

}
