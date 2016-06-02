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
var demoName   = "demo_ModalDialog.js";

// Called on page load
load = function() {
    getScripts( [
            pathSrc + "ModalDialog.js"
        ],
        showLoading
    );
};

fail = function( message ) {
    report( demoName, message );
};


showLoading = function() {
    // Construct a ModalDialog
    dialog = new jasmin.ModalDialog($(document.body));
    
    // Present a spinner with loading text for 4 seconds. No option to click the dialog away
    dialog.show("Loading... One moment please.", true);
    setTimeout(showClickable, 4000);
};

showClickable = function() {
    dialog.hide();
    dialog.show("Click here to continue...", false, function() {
        alert("clicked !");
    });
};