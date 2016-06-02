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
// *** demo_EventManager
//
// Demonstrates how to use the TaskManager

// Name of this demo
var demoName   = "demo_TaskManager.js";

// Called on page load
load = function() {
    getScripts( 
        [
            pathExt + "jquery.mobile-1.4.5.js",
            pathSrc + "polyfills.js",
            pathSrc + "RequestManager.js",
            pathSrc + "Loader.js",
            pathSrc + "SyncTimer.js",
            pathSrc + "ResponseManager.js",
            pathSrc + "EventManager.js",
            pathSrc + "Slideshow.js",
            pathSrc + "Translator.js",
            pathSrc + "TableLogger.js",
            pathSrc + "Statistics.js",
            pathSrc + "TaskManager.js"
        ],
        function() {
            setupGraphics();
            loadResources();
        }
    );
};

// Setup graphics
setupGraphics = function() {
    $( "#graphics_here" ).append( 
        $( "<p>" ).attr( {
            "id" : "text_container"
        } ).css( {
            "position" : "absolute",
            "width" : "220px",            
            "left" : "0px",
            "top" : "0px",
            "z-index" : 2,
            "text-align" : "center"
        } ).html( "Text here..." )
    );
    $( "#graphics_here" ).append( 
        $( "<div>" ).attr( {
                "id" : "button_left"
            } ).css( {
            "position" : "absolute",                
            "width" : "100px",
            "height" : "100px",
            "left" : "0px",
            "top" : "50px",
            "text-align" : "center",
            "background-color" : "yellow"
        } ).html(
            "&larr;"
        )
    );
    $( "#graphics_here" ).append( 
        $( "<div>" ).attr( {
            "id" : "button_right"
        } ).css( {
            "width"  : "100px",
            "height" : "100px",
            "position" : "absolute",
            "left"   : "120px",
            "top"    : "50px",
            "text-align" : "center",
            "z-index" : 2,
            "background-color" : "yellow"
        } ).html(
            "&rarr;"
        )
    );
    $( "#graphics_here" ).height( "140px" );    
};

// Get resources for Task
loadResources = function() {
    fail = function(msg) {
        console.log("Failed");
        console.log(msg);
    }
    io = new jasmin.RequestManager( fail );
    loader = new jasmin.Loader( io );

    var requests = {
        "task_config" : [ "json",   "files/TaskConfig.json" ],
        "task_engine" : [ "script", "files/TaskEngine.js" ]
    };

    loader.load( requests, resourcesLoaded );
};

// Setup Task and TaskManager
resourcesLoaded = function(replies) {
    // Task resources. 
    // Note that TaskEngine class is now available due to TaskEngine being loaded    
    taskConfig = replies["task_config"];
    taskEngine = new TaskEngine();
    
    // Constuct TaskManager
    taskManager = new jasmin.TaskManager(
        taskEngine,
        taskConfig,
        taskCompleted
    );
    taskManager.start();
};

// Called when task completed
taskCompleted = function() {
    DEBUG && console.log(demoName + ": task completed!");
};
