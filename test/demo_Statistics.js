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
            pathSrc + "Statistics.js"
        ],
       runStatistics
    );
};

runStatistics = function() {
    // Repeat the value "badgers", 3 times
    console.log(
        jasmin.Statistics.rep( "badgers", 3 ) 
    );
    
    // Generate 1,2,3,4,5
    console.log( 
        jasmin.Statistics.seq( 1, 5 ) 
    );
    
    // Generate 2,4,6,8
    console.log(
        jasmin.Statistics.seq( 2, 8, 2 ) 
    );
    
    // Generate 1,1,1,1,2,2,2,2; this sequence we'll use for other stuff below
    sequence = jasmin.Statistics.seq( 1, 2, 1, 4 );
    console.log( 
        sequence 
    );
    console.log(sequence );

    // Check on repetitions length 4 in the sequnce (is present)
    console.log(
        jasmin.Statistics.repetitions( sequence, 4 )
    );

    // Check on repetitions length 5 in the sequence (is not present)
    console.log(
        jasmin.Statistics.repetitions( sequence, 5 )
    );

    // Shuffle the sequence
    console.log(
        jasmin.Statistics.fisherYates( sequence ) 
    );


    // Create an indexed array of associative arrays
    nestedSequence = [
        { "color" : "blue", "arrow" : "left", "response"  : 1, "rt" : 1200, },
        { "color" : "blue", "arrow" : "left", "response"  : 2, "rt" : 789,  },
        { "color" : "blue", "arrow" : "right", "response" : 1, "rt" : 1400, },
        { "color" : "red",  "arrow" : "right", "response" : 1, "rt" : 1900, }        
    ];
    console.log(
        nestedSequence 
    );
    
    // Check on repetitions of { "color" : "blue", "arrow" : "left"  } length 2 -> true
    console.log(
        jasmin.Statistics.repetitions( nestedSequence, 2 )
    );

    // Check on repetitions of { "color" : "blue", "arrow" : "left"  } length 3 -> false
    console.log(
        jasmin.Statistics.repetitions( nestedSequence, 3 )
    );

    // Check on repetitions of "color" : "blue" length 3 -> true
    console.log(
        jasmin.Statistics.repetitions( nestedSequence, 3, "color" )
    );

    // Check on repetitions of "color" : "blue" length 4 -> false
    console.log(
        jasmin.Statistics.repetitions( nestedSequence, 4, "color" )
    );

    // Shuffle nestedSequence
    console.log(
        jasmin.Statistics.fisherYates( nestedSequence ) 
    );
    
    // Apply a function to the sequence
    console.log( 
        jasmin.Statistics.apply(
            nestedSequence,
            function (row) {
                alert("x");
                console.log(row);
            }
        )
    );

    // Apply a function to the sequence; get all correct rows (those with response === 1)
    var correctRows = jasmin.Statistics.applyRow(
        nestedSequence,
        function (row) {
            return (row["response"] === 1? row: undefined);
        }
    );
    console.log(correctRows);
    
    // Apply another function; get RTs of correct rows
    var rts = jasmin.Statistics.applyRow(
        correctRows,
        function (row) {
            return (row["rt"]);
        }
    );
    console.log(rts);

    // Mean of of RTs for correct row
    console.log(
        jasmin.Statistics.mean(rts)
    );
    
    
    //get a 100 random integers between 1 and 10 (a JGW addition)
    randomIntegers = [];
    
    while (randomIntegers.length <101)
    {
        randomIntegers.push(jasmin.Statistics.randomInt(1,10));        
    }
    console.log(
            randomIntegers 
    );
    
    var x=1;
    var counts = [0,0,0,0,0,0,0,0,0,0];
    while (x<10000){
        counts[jasmin.Statistics.randomInt(1,10)-1]++        
        x++;
    };
    var y=1;
    while (y<11){
        report(demoName, y + ": " + counts[y-1]);
        y++;
    }

    // Generate a sequence with balanced labels, each item should get labelA twice
    console.log(jasmin.Statistics.balancedSequence(
        ["x", "y", "z"],
        4,
        .5,
        "a",
        "b"
    ));
    
    // Generate a sequence with balanced labels, each item should get labelA once,
    // with an additional labelA randomly applied to one of the remaining items.
    // items get key "my_item" and labels get key "my_label"
    console.log(jasmin.Statistics.balancedSequence(
        ["x", "y", "z"],
        3,
        .5,
        "a",
        "b",
        "my_item",
        "my_label"
    ));
    
};