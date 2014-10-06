dummyReplies = {
    // State for each task
    "aat"         : false,
    "vpt"         : false,
    "biat"        : false,
    "stroop"      : false,
    
    // Current session settings
    "settings"    : {
        "graphics_url"     : "graphics/",        
        "stimuli_url"      : "stimuli/alcohol_italy/", // Varies across drugs
        "stimuli_extension": ".jpg",
        "task"             : "aat",          // Task to administer (aat, vpt, biat, stroop)
        "aat_approach"     : "right",        // AAT approach tilt (left or right), kept constant for a participant
        
        // AAT Parts for Demo
        "aat_parts" : [ 
            {   
                "type"    : "train",
                "placebo" : true,
                "reps"    : 2,                         
                "stimuli" : [ 
                    // 8 pairs: 4 active, 4 passive
                    "a1", "a2", "a3", "a4",
                    "p1", "p2", "p3", "p4"
                    // "p11", "p68"
                    // "sw_a_18", "sw_a_19"
                ],            
                "blocks"  : [                          
                    [ 
                        "#[gaat_task_intro_slide_1]",
                        "#[gaat_task_intro_slide_2]"
                    ]
                ]
            },
            {   
                "type"    : "train",
                "placebo" : true,
                "reps"    : 2,                         
                "stimuli" : [ 
                ],            
                "blocks"  : [                          
                    [ 
                        "#[all_done]"
                    ]
                ]
            },
        ],
        
        // VPT Parts for Demo
        "vpt_parts" : [ 
            {   
                "type"    : "train",                
                "placebo" : true, // true if placebo, false if training
                "reps"    : 1,    // 2 if placebo, 4 if training
                "keep"    : "no",
                "stimuli" : [ 
                    // 12 pairs, 6 active, 6 passive
                    "a1", "a2", "a3", "a4",
                    "p1", "p2", "p3", "p4"
                ],            
                "blocks"  : [                          
                    [ 
                        "#[gvpt_task_intro_slide_1]",
                        "#[gvpt_task_intro_slide_2]"
                    ]
                ]
            },
            {   
                "type"    : "train",                
                "placebo" : true, // true if placebo, false if training
                "reps"    : 1,    // 2 if placebo, 4 if training
                "keep"    : "both",
                "stimuli" : [ 
                    // 12 pairs, 6 active, 6 passive
                ],            
                "blocks"  : [                          
                    [ 
                        "#[all_done]"
                    ]
                ]
            }             
        ],
        
        // Stroop Parts
        "stroop_parts" : [ 
            {   // assessment part
                "type"    : "practice1",               // Type of these blocks (logged)      
                "labels"  : "color",                   // Color of onscreen labels (color, white, or none)
                "stimuli" : {                          // Stimuli used this part
					// 1x blue, 1x green, 1x yellow, 2x red 
                    "stroop_word_neutral1" : [ 1, 1, 1, 2 ]
				},              
                "blocks"  : [                          // One block, three intro slides
                    [
                        "#[stroop_task_intro_slide_intro]",
                        "#[stroop_task_intro_slide_keys]",
                        "#[stroop_task_intro_slide_1_1]",
                        "#[stroop_task_intro_slide_2]"
                    ]                
                ]
            }
        ],        
        "biat_config" : {
            "target1"      : {   
                "category" : "alcohol",
                "label"    : "#[word_alcohol_category]",
                "stimuli"  : {
                    "alc1" : "#[word_alcohol_1]" 
                }
            },
            "target2"      : {   
                "category" : "soda",
                "label"    : "#[word_soda_category]",
                "stimuli"  : {
                    "sod1" : "#[word_soda_1]" 
                }
            },
            "attribute1"  : {   
                "category" : "approach",
                "label"    : "#[word_approach_category]",
                "stimuli"  : {
                    "pos1" : "#[word_approach_1]"  
                }
            },
            "attribute2"  : {   
                "category" : "avoid",
                "label"    : "#[word_avoid_category]",
                "stimuli"  : {
                    "neg1" : "#[word_avoid_1]"     
                }  
            },
            "practice1"   : {   
                "category" : "mammal",
                "label"    : "#[word_mammal_category]",
                "stimuli"  : {
                    "mam1" : "#[word_mammal_1]"     
                }  
            },
            "practice2"   : {   
                "category" : "bird",
                "label"    : "#[word_bird_category]",
                "stimuli"  : {
                    "bir1" : "#[word_bird_1]"     
                }  
            },
            "stimReps"    : 1,  // Number of times each stimulus is presented in a block
            "warmup"      : 1,  // Number of trials from target1 and target2 used as warmup
            "blockReps"   : 2,  // Number of times both combination blocks are repeated
            "intro"       : [   // Slides that introduce the first block
                "#[biat_practice_slide_1]", 
                "#[giat_word_overview]",  
                "#[biat_keys_practice]" , 
                "#[giat_intro_slide]" 
            ]
        }
    }
};

// Launcher callback
var launcherCallback;
loadDummyReplies = function( launcherCallbackParam )
{
	launcherCallback = launcherCallbackParam;
	
    // Current UNIX time
    dummyReplies[ "now" ] = new Date();

    // Read translations from file
    readFile( translationsFile );
}
 
doneLoading = function( data )
{
    dummyReplies[ "translations" ] = convertFileToTranslations( data );
    launcherCallback();    
}
// Read a textfile, then call done
readFile = function( filename )
{
    $.ajax( {
        "url"      : filename,
        "data"     : "",
        "success"  : doneLoading,
        "dataType" : "text",
        "contentType" : "application/x-www-form-urlencoded;charset=ISO-8859-15"
    } );
}

// Reads translations from a tab and newline separate string, returns a translation array for use in Translator
convertFileToTranslations = function( data )
{
    // Lines to array
    data = data.split( "\n" );
    
    // Get relevant columns
    var header = rowToArray( data[0] );
    var indexTerm  = searchStringInArray( "term", header );
    var indexTrans = searchStringInArray( "value",     header );
    if( indexTerm  == - 1 ) { alert( "Error: No terms found; no column in translations has the name 'term'" ) }
    if( indexTrans == - 1 ) { alert( "Error: No translations found; no column in translations has the name 'value'" ) }    
    
    var translation, output = {};
    for( var i = 1; i < data.length; i++ )
    {
        translation = rowToArray( data[i] );
        if( translation.length != 1 )
        {
            output[ translation[ indexTerm ] ] = translation[ indexTrans ];
        }
    }
    return output;
}

rowToArray = function( source )
{
    // Remove additional control char before endline
    if( source.charCodeAt( source.length - 1 ) == 13 )
    {
        source = source.substr( 0, source.length - 1 );
    }    
    
    return source.split( "\t" );    
}

searchStringInArray = function( needle, haystack ) 
{
    for( var j = 0; j< haystack.length; j++ ) 
    {
        if( haystack[j].match( needle ) ) return j;
    }
    return -1;
}
