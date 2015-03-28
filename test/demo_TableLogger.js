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
// *** demo_TableLogger
//
// Demonstrates how to use the TableLogger to log results

// Name of this demo
var demoName   = "demo_TableLogger.js";

// Called on page load
load = function() {
    getScripts( [
            pathSrc + "TableLogger.js"
        ],
        logStuff
    );
};

fail = function( message ) {
    report( demoName, message );
};


logStuff = function() {
    // Construct a TableLogger
    logger = new jasmin.TableLogger( 
        [ 
            "trial", 
            "response"
        ],
        fail  // called if logger fails
    );
    
    report( demoName, "Logging a valid row of data" );
    logger.log( {
        "trial"    : 1,
        "response" : "left"
    } );
    
    report( demoName, "Logging a row with an invalid column" );
    logger.log( {
        "trial"    : 2,
        "response" : "left",
        "rt"       : 1785
    } );
    
    report( demoName, "Logging row of with a missing column" );
    logger.log( {
        "trial"    : 1
    } );
        
    report( demoName, "Get logs in associative format" );
    report( 
        demoName,
        JSON.stringify( logger.getLogs( true ) )
    );

    report( demoName, "Get logs in indexed format" );
    report( 
        demoName,
        JSON.stringify( logger.getLogs( false ) )
    );
};