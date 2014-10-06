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


/**
 * Thw Loader loads a collection of includes and data, then calls callback
 * once all are loaded.
 * @param   {AjaxManager} ajaxManager  For json requests
 * @param   {Function}    fail         Called if loader fails
 * @require RequestManager
 * @class
 */
function Loader( requestManager ) {
    this.requestManager = requestManager;
};

/**
 * Load a set of includes and data
 * @param {Array}    includes           Indexed array of includes to load, each element of includes should be an indexed array with the first element specifying type of include "js" and "css", and the second element specifying the url/src
 * @param {Object}   data               Associative array of data to load, each element having the same structure as for includes. All values of type except "img" are passed as dataType to jQuery.ajax (via RequestManager)
 * @param {Function} callback           Callback called when all is loaded with the argument being the data downloaded (as an associative array)
 * @param {Function} progressCallback   Callback for updating progress; this function receives one argument, being progress (ranging from 0 to 100)
 * @public
 */
Loader.prototype.load = function( includes, data, allLoaded, progressCallback ) {
    this.allLoaded        = allLoaded;
    this.progressCallback = progressCallback;
    
    this.results  = {};    // Results of data requests

    this.loadCounter = 0;  // Counting progress
    this.loadTotal   = 0;  // Counting total
    

    
    // Making a closure to remember something
    var closure = function( func, boundVar ) {
        var myFunc     = func;
        var myBoundVar = boundVar;
        return function() {
            return myFunc( myBoundVar );
        };
    };
    
    var i, self = this, myClosure, rememberUrl;    
    for( var i = 0; i < includes.length; i++ ) {
        this.loadTotal++;        
        
        // A closure for each callback with includes[i]
        var attach = function( rememberMe ) {
            var willRemember = rememberMe;
            return function() {
                alert( willRemember )
            };
        }
        
        var url = attach( includes[i][1] );

        if( includes[i][0] === "js" ) {
            this.requestManager.request(
                RequestManager.TYPE_AJAX,
                {
                    "url"      : includes[i][1],
                    "dataType" : "script"
                }, 
                function() { 
                    ( url() ); self.progress; }
            );
        } else {
            this.requestManager.request(
                RequestManager.TYPE_AJAX,
                {
                    "url"      : includes[i][1],
                    "dataType" : "text"
                },
                function() {
                    ( url() );
                    //myClosure();
                    //var url = closure( includes[i][1] )();
                    $( '<link rel="stylesheet" type="text/css" href="' + url() + '" />' ).appendTo( "head" );
                }
            );
        }
    }
};
    
Loader.prototype.progress = function() {
    //alert( "XXX");
};