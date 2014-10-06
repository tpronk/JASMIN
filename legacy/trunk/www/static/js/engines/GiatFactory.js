function GiatFactory() {};

// Setup default config
GiatFactory.defaultConfig = function( filePrefix )
{
    return {
        "images"               : {
            "incorrect"  : filePrefix + "incorrect.png"
        },        
        "responseWindow" : 4000,
        "buttons"        : { 
            69 : "left", // E key
            73 : "right" // I key
        },
        "touchButtons"   : {
            "#touch0" : "left",
            "#touch1" : "right"
        },
        "keyLabels"      : [
            "E",
            "I"
        ],
        "stimuliType"    : "text",
        "keys"           : "#[giat_keys]",  
        "slideButtons"   : {
            69 : "previous",   // E key
            73 : "next"        // I key
        },
        "slideTouchButtons"   : {
            "#touch0" : "previous",
            "#touch1" : "next"
        },        
        "slideButtonTexts"  : {
            "first" : "#[giat_slide_keys_first]",
            "later" : "#[giat_slide_keys_later]"
        },
        "mouseType" : "touch",
        "touch" : false
    }; 
}


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
                trials.push( {
                    "cat"  : categories[i][ "category" ],
                    "stim" : j,
                    "reps" : k
                } );
            }
        }
    }
    
    return Statistics.shuffle( trials );
} 

GiatFactory.createTrialsSubset = function( stim1, stim2, n )
{
    // Convert to indexed
    var set1 = [], set2 = [];    
    var i;
    for( i in stim1[ "stimuli" ] )
    {
        set1.push( {
            "cat"  : stim1[ "category" ],
            "stim" : i,
            "reps" : "w"
        } );
    }
    for( i in stim2[ "stimuli" ] )
    {
        set2.push( {
            "cat"  : stim2[ "category" ],
            "stim" : i,
            "reps" : "w"
        } );        
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
//      "t1_left" : true,  // If true, target1 is left (else right). Used in STIAT.
//      "a1_left" : true   // If true, attribute1 is first paired with left target (else with right). Used in STIAT and BIAT.
//      "p1_left" : true,  // If true, practice1 is focal (else practice2). Used in BIAT
//  }
GiatFactory.pickVersion = function( properties )
{
    var version = {};
    
    for( var i in properties )
    {
        version[ properties[i] ] = Math.random() < .5;
        
    }
    
    return version;
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
    filePrefix,
    version
) {
    // Create result array, copy vars from config
    var result   = GiatFactory.defaultConfig( filePrefix );

    // *********
    // *** Setup version
    
    // Random if undefined
    if( version === undefined )
    {
        version = GiatFactory.pickVersion( [ "a1_left", "t1_left" ] );
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
                "category" : attributeLeft[ "category" ],
                "stimuli"  : attributeLeft[ "stimuli" ],
                "reps"     : multiplier * 2
            },
            {
                "category" : attributeRight[ "category" ],
                "stimuli"  : attributeRight[ "stimuli" ],
                "reps"     : multiplier * 2
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
                "category" : attributeLeft[ "category" ],
                "stimuli"  : attributeLeft[ "stimuli"  ],
                "reps"     : multiplier * 2
            },
            {
                "category" : attributeRight[ "category" ],
                "stimuli"  : attributeRight[ "stimuli" ],
                "reps"     : multiplier * 3
            },
            {
                "category" : target[ "category" ],
                "stimuli"  : target[ "stimuli" ],
                "reps"     : multiplier * 2
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
                "category" : attributeLeft[ "category" ],
                "stimuli"  : attributeLeft[ "stimuli" ],
                "reps"     : multiplier * 3
            },
            {
                "category" : attributeRight[ "category" ],
                "stimuli"  : attributeRight[ "stimuli" ],
                "reps"     : multiplier * 2
            },
            {
                "category" : target[ "category" ],
                "stimuli"  : target[ "stimuli" ],
                "reps"     : multiplier * 2
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
    stimReps,  // Base repetition rate of each stimulus
    warmup,
    blockReps,
    intro,
    filePrefix,
    version
) {
    // Create result array, copy vars from config
    var result   = GiatFactory.defaultConfig( filePrefix );

    // *********
    // *** Setup version
    
    // Random if undefined
    if( version === undefined )
    {
        version = GiatFactory.pickVersion( [ "a1_first", "p1_focal" ] ); // Version with practice
    }
    // store version in task variable
    result[ "task" ] = version;
    
    // Setup attribute left and right
    var attributeFirst, attributeSecond;
    if( version[ "a1_first" ] )
    {
        attributeFirst  = attribute1;
        attributeSecond = attribute2;
    }
    else
    {
        attributeFirst  = attribute2;
        attributeSecond = attribute1;    
    }
    
    // Setup attribute left and right    
    var practiceLeft, practiceRight;
    if( version[ "p1_focal" ] )
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
        "category_first"    : function() { return attributeFirst[  "label" ]; },
        "category_second"   : function() { return attributeSecond[ "label" ]; },
        "category_target"   : function() { return target1[         "label" ]; },
        "category_practice" : function() { return practiceLeft[    "label" ];  }
    };
    
    // List of all categories
    var categoriesInput = [ 
        practiceLeft,
        practiceRight,
        attributeFirst, 
        attributeSecond, 
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
    var blocks = [];
    
    // Practice block
    blocks.push( GiatFactory.createBiatBlock(
        "practice",
        intro,
        "#[biat_keys_practice]",
        target1,
        target2,
        practiceLeft,
        practiceRight,
        warmup,
        stimReps
    ) );

    // Combination blocks
    for( var i = 0; i < blockReps; i++ )
    {
        blocks.push( GiatFactory.createBiatBlock(
            "combine1",
            [ "#[biat_first_slide]", "#[giat_word_overview]",  "#[biat_keys_first]" ],
            "#[biat_keys_first]",
            target1,
            target2,
            attributeFirst,
            attributeSecond,
            warmup,
            stimReps
        ) );

        blocks.push( GiatFactory.createBiatBlock(
            "combine2",
            [ "#[biat_second_slide]", "#[giat_word_overview]",  "#[biat_keys_second]" ],
            "#[biat_keys_second]",
            target1,
            target2,
            attributeSecond,
            attributeFirst,
            warmup,
            stimReps
        ) );
    }
       
    result[ "blocks" ] = blocks;    
    return result;
}

// Create one BIAT block
GiatFactory.createBiatBlock = function(
    name,
    intro,
    keys,
    targetLeft,
    targetRight,
    attributeLeft,
    attributeRight,
    warmup,
    stimReps
) {
    // *** Responses
    var responses = [
        { // Button 0
            "position" : "center",
            "button"   : "left",
            "labels" : [
                { 
                    "category" : targetLeft[ "category" ], 
                    "color"    : "cyan" 
                },
                { 
                    "category" : attributeLeft[ "category" ], 
                    "color"    : "yellow" 
                },
            ]
        },
        { // Button 1
            "position" : "hide", 
            "button"   : "right",
            "labels" : [
                { 
                    "category" : targetRight[ "category" ], 
                    "color"    : "cyan" 
                },
                { 
                    "category" : attributeRight[ "category" ], 
                    "color"    : "yellow" 
                },
            ]          
        }
    ];
    
    // *** Overview
    var overview = GiatFactory.createOverview( [
        {
            "category":  targetLeft[ "category" ],
            "stimuli" :  targetLeft[ "stimuli"  ],
            "color"   :  "cyan"
        },
        {
            "category":  attributeLeft[ "category" ],
            "stimuli" :  attributeLeft[ "stimuli"  ],
            "color"   :  "yellow"
        }    
    ] );        

    // *** Trials
    var trials;
    // First N are target trials
    trials = GiatFactory.createTrialsSubset(
        { 
            "category" : targetLeft[ "category" ],
            "stimuli"  : targetLeft[ "stimuli"  ]
        },
        { 
            "category" : targetRight[ "category" ],
            "stimuli"  : targetRight[ "stimuli"  ]
        },
        warmup
    );

    // Next are combined trials; alternate attribute and target
    var attributes = GiatFactory.createTrials( [
        {
            "category" : attributeLeft[ "category" ],
            "stimuli"  : attributeLeft[ "stimuli" ],
            "reps"     : stimReps
        },
        {
            "category" : attributeRight[ "category" ],            
            "stimuli"  : attributeRight[ "stimuli" ],
            "reps"     : stimReps
        } 
    ] );
    
    var targets = GiatFactory.createTrials( [
        {
            "category" : targetLeft[ "category" ],
            "stimuli"  : targetLeft[ "stimuli" ],
            "reps"     : stimReps
        },
        {
            "category" : targetRight[ "category" ],            
            "stimuli"  : targetRight[ "stimuli" ],
            "reps"     : stimReps
        }            
    ] );

    for( var i in targets )
    {
        trials.push( targets[i] );
        trials.push( attributes[i] );
    }        

    return {        
        "block"     : name,
        "intro"     : intro,
        "keys"      : keys,
        "responses" : JSON.parse( JSON.stringify( responses ) ),
        "overview"  : overview,
        "trials"    : trials        
    };
}
