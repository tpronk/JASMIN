function GiatFactory() {};


// **********
// *** General functions

// Create stimuli for Giat config
GiatFactory.createStimuli = function( categories )
{
    var stimuli = {};
    var category, i, j;
    for( i in categories )
    {
        category = categories[i];
        for( j in category[ "stimuli" ] )
        {
            stimuli[ j ] = {
                "category" : category[ "category" ],
                "content"  : category[ "stimuli" ][ j ]
            }
        }
    }
    return stimuli;
}

// Create categories for Giat config
GiatFactory.createCategories = function( categoriesInput )
{
    var categories = {};
    for( var i in categoriesInput )
    {
        categories[ categoriesInput[i][ "category" ] ] = categoriesInput[i][ "label" ];
    }
    return categories;
}    

// Create trials for Giat block config
GiatFactory.createTrials = function( categories )
{
    var trials = [];
    var i, j, k;
    for( i in categories )
    {
        for( j in categories[i][ "stimuli" ] )
        {
            for( k = 0; k < categories[i][ "reps" ]; k++ )
            {
                trials.push( j );
            }
        }
    }
    
    return Statistics.shuffle( trials );
} 

// Create trials for Giat block config
GiatFactory.createOverview = function( categories )
{
    var result = [];
    var i, j, row;
    for( i in categories )
    {
        row = { 
            "category": categories[i][ "category" ],
            "stimuli" : [],
            "color"   : categories[i][ "color" ]
        };
        for( j in categories[i][ "stimuli" ] )
        {
            row[ "stimuli" ].push( j );
        }
        result.push( row );
    }
    return result;
}

// Pick a version randomly
// { 
//      "t1_left" : true,  // If true, target1 is left (else right)
//      "a1_left" : true   // If true, attribute1 is first paired with left target (else with right)
//  }
GiatFactory.pickVersion = function( practice )
{
    var version = {};
    version[ "t1_left" ] = Math.random() < .5;
    version[ "a1_left" ] = Math.random() < .5;

    if( practice !== undefined && practice )
    {
        version[ "p1_left" ] = Math.random() < .5;
    }
    return version;
}

// Setup default config
GiatFactory.defaultConfig = function()
{
    return {
        "responseWindow" : 4000,
        "buttons"        : { 
            69 : "left", // E key
            73 : "right" // I key
        },
        "stimuliType"    : "text",
        "keys"           : "#[giat_keys]",  
        "slideButtons"   : {
            69 : "previous",   // E key
            73 : "next"        // I key
        },
        "slideButtonTexts"  : {
            "first" : "#[giat_slide_keys_first]",
            "later" : "#[giat_slide_keys_later]"
        }
    }; 
}

// Create a Giat configured as a STIAT (Single Target IAT)
// version argument is for counterbalancing, undefined for random, or:
// { 
//      "t1_left" : true,  // If true, target1 is left (else right)
//      "a1_left" : true   // If true, attribute1 is first paired with left target (else with right)
//  }
GiatFactory.stiatConfig = function( 
    target,
    attribute1,
    attribute2,
    multiplier,  // Base repetition rate of each stimulus
    intro,
    version
) {
    // Create result array, copy vars from config
    var result   = GiatFactory.defaultConfig();

    // *********
    // *** Setup version
    
    // Random if undefined
    if( version === undefined )
    {
        version = GiatFactory.pickVersion();
    }
    // store version in task variable
    result[ "task" ] = version;
    
    // Setup target left and right
    var attributeLeft, attributeRight;
    if( version[ "a1_left" ] )
    {
        attributeLeft  = attribute1;
        attributeRight = attribute2;
    }
    else
    {
        attributeLeft  = attribute2;
        attributeRight = attribute1;    
    }
    
    // Translation Callbacks 
    result[ "translationCallbacks" ] = {
        "category_left_1"  : function() { return attributeLeft[  "label" ]; },
        "category_right_1" : function() { return attributeRight[ "label" ]; },
        "category_left_2"  : function() { return target[  "label" ]; },
        "category_right_2" : function() { return target[ "label" ];  }
    };
    
    // List of all categories
    var categoriesInput = [ attributeLeft, attributeRight, target ];    

    // *********
    // *** Setup stimuli
    var stimuli = GiatFactory.createStimuli(
        categoriesInput
    );
    result[ "stimuli" ] = stimuli;

    // *********
    // *** Setup categories
    var categories = GiatFactory.createCategories(
        categoriesInput
    );
    result[ "categories" ] = categories;

    // *********
    // *** Setup blocks
    
    // Default responses
    var responses = [
        { // Button 0
            "position" : "left",
            "button"   : "left",
            "labels" : [
                { 
                    "category" : attributeLeft[ "category" ], 
                    "color"    : "white" 
                }
            ]
        },
        { // Button 1
            "position" : "right", 
            "button"   : "right",
            "labels" : [
                { 
                    "category" : attributeRight[ "category" ], 
                    "color"    : "white" 
                }
            ]                    
        }
    ];
    
    // Stimulus overviews
    var discrOverview = GiatFactory.createOverview( [
        {
            "category":  attributeLeft[ "category" ],
            "stimuli" :  attributeLeft[ "stimuli" ]
        },
        {
            "category":  attributeRight[ "category" ],
            "stimuli" :  attributeRight[ "stimuli" ]
        }        
    ] );
        
    var combOverview = GiatFactory.createOverview( [
        {
            "category":  attributeLeft[ "category" ],
            "stimuli" :  attributeLeft[ "stimuli" ]
        },
        {
            "category":  attributeRight[ "category" ],
            "stimuli" :  attributeRight[ "stimuli" ]
        },
        {
            "category":  target[ "category" ],
            "stimuli" :  target[ "stimuli" ]
        }    
    ] );        
        
        
    
    // Block 0 - discrimination block
    var block0 = {
        "block"     : "discrimination",
        "intro"     : intro,
        "keys"      : "#[giat_keys_mono]",
        "responses" : JSON.parse( JSON.stringify( responses ) ),
        "overview"  : discrOverview,
        "trials"  : GiatFactory.createTrials( [
            {
                "stimuli" : attributeLeft[ "stimuli" ],
                "reps"    : multiplier * 2
            },
            {
                "stimuli" : attributeRight[ "stimuli" ],
                "reps"    : multiplier * 2
            }          
        ] )
    };
  

    // blockLeft - Left combination block
    
    // Add attribute label to responses
    responses[ 0 ][ "labels" ].push(
        {
            "category" : target[ "category" ],
            "color"    : "white"
        }
    );
    
    var blockLeft = {
        "block" : "target_left",
        "intro" : [ "#[stiat_slide_left]", "#[giat_word_overview]",  "#[stiat_keys_left]" ],
        "keys"  :   "#[stiat_keys_left]",
        "responses" : JSON.parse( JSON.stringify( responses ) ),
        "overview"  : combOverview,
        "trials"  : GiatFactory.createTrials( [
            {
                "stimuli" : attributeLeft[ "stimuli" ],
                "reps"    : multiplier * 2
            },
            {
                "stimuli" : attributeRight[ "stimuli" ],
                "reps"    : multiplier * 3
            },
            {
                "stimuli" : target[ "stimuli" ],
                "reps"    : multiplier * 2
            }            
        ] )        
    };
    
    // blockRight - Right combination block
    
    // Switch attribute label 
    responses[ 0 ][ "labels" ].pop();
    responses[ 1 ][ "labels" ].push(
        {
            "category" : target[ "category" ],
            "color"    : "white"
        }
    );
    
    var blockRight = {
        "block" : "target_right",
        "intro" : [ "#[stiat_slide_right]", "#[giat_word_overview]", "#[stiat_keys_right]" ],
        "keys"  :   "#[stiat_keys_right]",
        "responses" : JSON.parse( JSON.stringify( responses ) ),
        "overview"  : combOverview,
        "trials"  : GiatFactory.createTrials( [
            {
                "stimuli" : attributeLeft[ "stimuli" ],
                "reps"    : multiplier * 3
            },
            {
                "stimuli" : attributeRight[ "stimuli" ],
                "reps"    : multiplier * 2
            },
            {
                "stimuli" : target[ "stimuli" ],
                "reps"    : multiplier * 2
            }            
        ] )        
    };    

    // Add blocks in order deterimined by a1_left
    var blocks = [ block0 ];
    if( version[ "t1_left" ] )
    {
        blocks.push( blockLeft  );
        blocks.push( blockRight );
    }
    else
    {
        blocks.push( blockRight );        
        blocks.push( blockLeft  );
    }
    
    
    result[ "blocks" ] = blocks;
    return result;
}


// Create a Giat configured as a BIAT (Brief IAT)
// version argument is for counterbalancing, undefined for random, or:
// { 
//      "t1_left" : true,  // If true, target1 is left (else right)
//      "a1_left" : true   // If true, attribute1 is first paired with left target (else with right)
//      "p1_left" : true   // If true, practice1 is left (else right)
//  }
GiatFactory.biatConfig = function( 
    target1,
    target2,
    attribute1,
    attribute2,
    practice1,
    practice2,
    multiplier,  // Base repetition rate of each stimulus
    warmup,
    intro,
    version
) {
    // Create result array, copy vars from config
    var result   = GiatFactory.defaultConfig();

    // *********
    // *** Setup version
    
    // Random if undefined
    if( version === undefined )
    {
        version = GiatFactory.pickVersion( true ); // Version with practice
    }
    // store version in task variable
    result[ "task" ] = version;
    
    // Setup attribute left and right
    var attributeLeft, attributeRight;
    if( version[ "a1_left" ] )
    {
        attributeLeft  = attribute1;
        attributeRight = attribute2;
    }
    else
    {
        attributeLeft  = attribute2;
        attributeRight = attribute1;    
    }
    
    // Setup attribute left and right    
    var practiceLeft, practiceRight;
    if( version[ "p1_left" ] )
    {
        practiceLeft  = practice1;
        practiceRight = practice2;
    }
    else
    {
        practiceLeft  = practice2;
        practiceRight = practice1;    
    }    
    
    // Translation Callbacks 
    result[ "translationCallbacks" ] = {
        "category_left"     : function() { return attributeLeft[  "label" ]; },
        "category_right"    : function() { return attributeRight[ "label" ]; },
        "category_target"   : function() { return target1[        "label" ]; },
        "category_practice" : function() { return practiceLeft[   "label" ];  }
    };
    
    // List of all categories
    var categoriesInput = [ 
        practiceLeft,
        practiceRight,
        attributeLeft, 
        attributeRight, 
        target1,
        target2
    ];    

    // *********
    // *** Setup stimuli
    var stimuli = GiatFactory.createStimuli(
        categoriesInput
    );
    result[ "stimuli" ] = stimuli;

    // *********
    // *** Setup categories
    var categories = GiatFactory.createCategories(
        categoriesInput
    );
    result[ "categories" ] = categories;

    // *********
    // *** Setup blocks
 
    // Practice responses
    var responsesPractice = [
        { // Button 0
            "position" : "center",
            "button"   : "left",
            "labels" : [
                { 
                    "category" : practiceLeft[ "category" ], 
                    "color"    : "white" 
                }
            ]
        },
        { // Button 1
            "position" : "hide", 
            "button"   : "right",
            "labels" : [
                { 
                    "category" : practiceRight[ "category" ], 
                    "color"    : "white" 
                }
            ]                    
        }
    ];
 
 
    // Default responses
    var responses = [
        { // Button 0
            "position" : "center",
            "button"   : "left",
            "labels" : [
                { 
                    "category" : target1[ "category" ], 
                    "color"    : "cyan" 
                }
            ]
        },
        { // Button 1
            "position" : "hide", 
            "button"   : "right",
            "labels" : [
                { 
                    "category" : target2[ "category" ], 
                    "color"    : "cyan" 
                }
            ]                    
        }
    ];
    
    // Stimulus overviews
    var discrOverview = GiatFactory.createOverview( [
        {
            "category":  practiceLeft[ "category" ],
            "stimuli" :  practiceLeft[ "stimuli" ],
            "color"   :  "white"
        }
    ] );
    
    var leftOverview = GiatFactory.createOverview( [
        {
            "category":  target1[ "category" ],
            "stimuli" :  target1[ "stimuli"  ],
            "color"   :  "cyan"
        },
        {
            "category":  attributeLeft[ "category" ],
            "stimuli" :  attributeLeft[ "stimuli"  ],
            "color"   :  "yellow"
        }    
    ] );        
        
    var rightOverview = GiatFactory.createOverview( [
        {
            "category":  target1[ "category" ],
            "stimuli" :  target1[ "stimuli" ],
            "color"   :  "cyan"
        },
        {
            "category":  attributeRight[ "category" ],
            "stimuli" :  attributeRight[ "stimuli" ],
            "color"   :  "yellow"
        }    
    ] );                 
    
    // Block 0 - practice block
    var block0 = {
        "block"     : "practice",
        "intro"     : intro,
        "keys"      : "#[giat_keys_mono]",
        "responses" : JSON.parse( JSON.stringify( responsesPractice ) ),
        "overview"  : discrOverview,
        "trials"  : GiatFactory.createTrials( [
            {
                "stimuli" : practiceLeft[ "stimuli" ],
                "reps"    : multiplier
            },
            {
                "stimuli" : practiceRight[ "stimuli" ],
                "reps"    : multiplier
            }          
        ] )
    };
  

    // blockLeft - Left combination block
    
    // Add attribute labels to responses
    responses[ 0 ][ "labels" ].push(
        {
            "category" : attributeLeft[ "category" ],
            "color"    : "yellow"
        }
    );
    responses[ 1 ][ "labels" ].push(
        {
            "category" : attributeRight[ "category" ],
            "color"    : "yellow"
        }
    );

    var trials, targets, attributes, i;
    // First N are target trials
    trials = GiatFactory.createTrialsSubset(
        target1[ "stimuli" ],
        target2[ "stimuli" ],
        warmup
    );
    
    // Next are combined trials; alternate attribute and target
    targets = GiatFactory.createTrials( [
        {
            "stimuli" : attributeLeft[ "stimuli" ],
            "reps"    : multiplier
        },
        {
            "stimuli" : attributeRight[ "stimuli" ],
            "reps"    : multiplier
        } 
    ] );
    
    attributes = GiatFactory.createTrials( [
        {
            "stimuli" : target1[ "stimuli" ],
            "reps"    : multiplier
        },
        {
            "stimuli" : target2[ "stimuli" ],
            "reps"    : multiplier
        }            
    ] );

    for( i in targets )
    {
        trials.push( targets[i] );
        trials.push( attributes[i] );
    }

    var blockLeft = {
        "block"     : "target_left",
        "intro"     : [ "#[biat_left_slide]", "#[giat_word_overview]",  "#[biat_keys_left]" ],
        "keys"      :   "#[biat_keys_left]",
        "responses" : JSON.parse( JSON.stringify( responses ) ),
        "overview"  : leftOverview,
        "trials"    : trials        
    };
    
    // blockRight - Right combination block
    
    // Switch attribute label 
    responses[ 0 ][ "labels" ].pop();
    responses[ 1 ][ "labels" ].pop();
    responses[ 0 ][ "labels" ].push(
        {
            "category" : attributeRight[ "category" ],
            "color"    : "yellow"
        }
    );
    responses[ 1 ][ "labels" ].push(
        {
            "category" : attributeLeft[ "category" ],
            "color"    : "yellow"
        }
    );
        
    // First N are target trials
    trials = GiatFactory.createTrialsSubset(
        target1[ "stimuli" ],
        target2[ "stimuli" ],
        warmup
    );
    
    // Next are combined trials; alternate attribute and target
    targets = GiatFactory.createTrials( [
        {
            "stimuli" : attributeLeft[ "stimuli" ],
            "reps"    : multiplier
        },
        {
            "stimuli" : attributeRight[ "stimuli" ],
            "reps"    : multiplier
        } 
    ] );
    
    attributes = GiatFactory.createTrials( [
        {
            "stimuli" : target1[ "stimuli" ],
            "reps"    : multiplier
        },
        {
            "stimuli" : target2[ "stimuli" ],
            "reps"    : multiplier
        }            
    ] );

    for( i in targets )
    {
        trials.push( targets[i] );
        trials.push( attributes[i] );
    }        
    
    var blockRight = {
        "block"     : "target_right",
        "intro"     : [ "#[biat_right_slide]", "#[giat_word_overview]", "#[biat_keys_right]" ],
        "keys"      :   "#[biat_keys_right]",
        "responses" : JSON.parse( JSON.stringify( responses ) ),
        "overview"  : rightOverview,
        "trials"    : trials
    };    

    // Add blocks in order deterimined by a1_left
    var blocks = [ block0 ];
    if( version[ "t1_left" ] )
    {
        blocks.push( blockLeft  );
        blocks.push( blockRight );
    }
    else
    {
        blocks.push( blockRight );        
        blocks.push( blockLeft  );
    }
    
    result[ "blocks" ] = blocks;
        
    return result;
}

GiatFactory.createTrialsSubset = function( stim1, stim2, n )
{
    // Convert to indexed
    var set1 = [], set2 = [];    
    var i;
    for( i in stim1 )
    {
        set1.push( i );
    }
    for( i in stim2 )
    {
        set2.push( i );
    }
    set1 = Statistics.shuffle( set1 );
    set2 = Statistics.shuffle( set2 );
    
    // Pick first n from set1 and set2
    var trials = [];
    for( i = 0; i < n; i++ )
    {
       trials.push( set1[i] );
       trials.push( set2[i] );
    }
    return Statistics.shuffle( trials );
} 
