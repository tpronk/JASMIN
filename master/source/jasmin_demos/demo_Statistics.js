// Copyright 2014, Thomas Pronk
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License. 
// 
// 
// ****************
// *** demo_Statistics
//
// Demonstrates Statistics functions, such as randomizations, permutations, 
// means, and standard errors. 

// Name of this demo
var demoName   = "demo_Statistics.js";

// Called on page load
load = function() {
    getScripts( [
            jasminPath + "jasmin_core/Statistics.js"
        ],
       runStatistics
    );
};

runStatistics = function() {
    // Repeat the value "badgers", 3 times
    report( demoName, JSON.stringify( 
        jasmin.Statistics.rep( "badgers", 3 ) 
    ) );
    
    // Generate 1,2,3,4,5
    report( demoName, JSON.stringify( 
        jasmin.Statistics.seq( 1, 5 ) 
    ) );
    
    // Generate 2,4,6,8
    report( demoName, JSON.stringify( 
        jasmin.Statistics.seq( 2, 8, 2 ) 
    ) );
    
    // Generate 1,1,1,1,2,2,2,2; this sequence we'll use for other stuff below
    sequence = jasmin.Statistics.seq( 1, 2, 1, 4 );
    report( demoName, JSON.stringify( sequence ) );
    

    // Check on repetitions length 4 in the sequnce (is present)
    report( demoName, JSON.stringify( 
        jasmin.Statistics.repetitions( sequence, 4 )
    ) );

    // Check on repetitions length 5 in the sequence (is not present)
    report( demoName, JSON.stringify( 
        jasmin.Statistics.repetitions( sequence, 5 )
    ) );

    // Shuffle the sequence
    report( demoName, JSON.stringify( 
        jasmin.Statistics.fisherYates( sequence ) 
    ) );


    // Create an indexed array of associative arrays
    nestedSequence = [
        { "color" : "blue", "arrow" : "left"  },
        { "color" : "blue", "arrow" : "left"  },
        { "color" : "blue", "arrow" : "right" },
        { "color" : "red",  "arrow" : "right" }        
    ];
    report( demoName, JSON.stringify( 
        nestedSequence 
    ) );
    
    // Check on repetitions of { "color" : "blue", "arrow" : "left"  } length 2 -> true
    report( demoName, JSON.stringify( 
        jasmin.Statistics.repetitions( nestedSequence, 2 )
    ) );

    // Check on repetitions of { "color" : "blue", "arrow" : "left"  } length 3 -> false
    report( demoName, JSON.stringify( 
        jasmin.Statistics.repetitions( nestedSequence, 3 )
    ) );

    // Check on repetitions of "color" : "blue" length 3 -> true
    report( demoName, JSON.stringify( 
        jasmin.Statistics.repetitions( nestedSequence, 3, "color" )
    ) );

    // Check on repetitions of "color" : "blue" length 4 -> false
    report( demoName, JSON.stringify( 
        jasmin.Statistics.repetitions( nestedSequence, 4, "color" )
    ) );

    // Shuffle nestedSequence
    report( demoName, JSON.stringify( 
        jasmin.Statistics.fisherYates( nestedSequence ) 
    ) );

};