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
// *** demo_Translator
//
// Demonstrates how the Translator translates terms, incorporates custom callbacks,
// and supports honorifics (such as t-form and v-form)

// Name of this demo
var demoName   = "demo_ErrorManager.js";

// Called on page load
load = function() {
    getScripts( [
            pathSrc + "ErrorManager.js"
        ],
        start
    );
};

// Run the actual demo's
start = function() {
    // Attach your errorHandler here
    var errorHandler = function( errorPackage ) {
        console.log( errorPackage );
    };
    // Construct the ErrorManager, provide errorHandler
    var errorManager = new jasmin.ErrorManager( errorHandler );
    // Attach to window.onerror
    window.onerror = errorManager.callbackWindowError();
    // Attach to fail; use fail to generate a simple Error
    var fail = errorManager.callbackFail();

    // *** Run a test
    var test = prompt( 
"1: use undefined var\n\
2: parse invalid JSON\n\
3: use undefined function (in function)\n\
4: repeating error\n\
5: controlled error (call fail)\
" );
    switch( test ) {
        case "1":
            x = x + 1;
            break;
        case "2":
            JSON.parse( "{" );
            break;
        case "3":
            existentFunction();
            break;
        case "4":
            setInterval(
                function() {
                    x = x * 2;
                },
                100
            );
            break;
        case "5":
            fail( "Triggered controlled failure" );
            break;                        

    }
};

existentFunction = function() {
    nonExistentFunction();                
};