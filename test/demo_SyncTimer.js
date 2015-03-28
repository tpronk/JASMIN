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

// ****************
// *** demo_SyncTimer
//
// Demonstrates how the SyncTimer times timeouts 
// Assignments:
//   - Set the timeouts to 16 ms; can your browser handle it?

// Name of this demo
var demoName   = "demo_SyncTimer.js";

// How many ms should the events last?
var eventDuration = 333;

// Called on page load
load = function() {
    getScripts( [
            pathSrc + "SyncTimer.js"
        ],
        setupDemo
    );
}

// Initialise touch fields and create eventManager
setupDemo = function() {
    // Setup touch divs
    $( "#graphics_here" ).append( 
        $( "<div>" ).attr( {
            "id"               : "square"
        } ).css( {
            "width"            : "100px",
            "height"           : "100px",
            "position"         : "relative",
            "left"             : "0px",
            "background-color" : "black"
        } )
    );

    // Create a SyncTimer
    syncTimer = new jasmin.SyncTimer( report );    
    
    // Sync it; calls startRed when done
    //report( demoName, "Syncing, then starting events that last " + eventDuration + " ms" );
    syncTimer.sync( startRed )
}

// Called on sync or startBlue
startRed = function() {
    report( demoName, JSON.stringify( syncTimer.getPrevTimeoutLog() ) );
    syncTimer.setTimeout(
        eventDuration,
        drawRed,
        startBlue
    );
}

// Called on draw (synced with requestAnimationFrame)
drawRed = function() {
    $( "#square" ).css( "background-color", "red" );
}

// Called on draw (synced with requestAnimationFrame)
startBlue = function() {
    //reportSyncTimer();
    syncTimer.setTimeout(
        eventDuration,
        drawBlue,
        startRed
    );
}

// Called on draw (synced with requestAnimationFrame)
drawBlue = function() {
    $( "#square" ).css( "background-color", "blue" );
}