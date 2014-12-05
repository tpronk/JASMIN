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
 * The Loader provides a short API for requesting a set of includes (js/css) 
 * and data (json/text/img/etc.).
  * @param   {RequestManager} requestManager  Handles the requests
  * @require RequestManager
 * @class
 */
function Loader( requestManager ) {
    this.requestManager = requestManager;
};

/**
 * Load a set of includes and data
 * @param {Array}    includes           Indexed array of includes to load, each element of includes should be an indexed array with the first element specifying type of include "js" and "css", and the second element specifying the url/src
 * @param {Object}   data               Associative array of data to load, each element having the same structure as for includes. All type values are passed as dataType to jQuery.ajax (via RequestManager), except "css" (which is added to the head) and "img", for which the image-requested of the RequestManager is used
 * @param {Function} allLoaded          Callback called when all is loaded with the argument being the data downloaded (as an associative array)
 * @param {Function} progressCallback   (option) Callback for updating progress; this function receives one argument, being progress (ranging from 0 to 100)
 * @public
 */
Loader.prototype.load = function( includes, data, allLoaded, progressCallback ) {
    this.allLoaded        = allLoaded;
    this.progressCallback = progressCallback == undefined? function() {} : progressCallback;
    
    this.replies  = {};    // Results of data requests
    this.loadCounter = 0;  // Counting progress
    this.loadTotal   = 0;  // Counting total

    // Make requests for includes
    this.makeRequests( 
        includes, 
        function() {}
    );

    // Report 0 progress
    this.progress();

    // Make requests for data; put reply via callback in replies
    var self = this;
    this.makeRequests( 
        data, 
        function( key, reply ) {
            self.replies[ key ] = reply;
        }
    );

    // Flush and call callback
    this.requestManager.flush( function() { 
        self.allLoaded( self.replies );
        //alert( JSON.stringify( this.replies ));
    } );
};
    
 Loader.prototype.makeRequests = function( requests, callback ) {
    var self = this;
    for( var key in requests ) {
        this.loadTotal++;        
        
        // This closure sets up the right request and binds its arguments to the callback function
        var closure = function( key, fileType, url, callback ) {
            var requestType, request;
            switch( fileType ) {
                
                // Determine what kind of request to make
                case "js":
                    requestType = RequestManager.TYPE_AJAX;
                    request = {
                        "url"      : url,
                        "dataType" : "script"
                    };
                    break;
                case "css":
                    requestType = RequestManager.TYPE_AJAX;
                    request = {
                        "url"      : url,
                        "dataType" : "text"
                    };
                    break;
                case "img":
                    requestType = RequestManager.TYPE_IMG;
                    request = url;
                    break;
                default:
                    requestType = RequestManager.TYPE_AJAX;
                    request = {
                        "url"      : url,
                        "dataType" : fileType
                    };           
                    break;                 
            }            
            
            // Do it
            self.requestManager.request(
                requestType,
                request, 
                function( reply ) {
                    // Special case for CSS; put in head
                    if( fileType === "css" ) {
                        $( '<link rel="stylesheet" type="text/css" href="' + url + '" />' ).appendTo( "head" );
                    }
                    callback( key, reply );
                    self.loadCounter++;
                    self.progress();
                }
            );            
        };
        closure( key, requests[key][0], requests[key][1], callback );
    }
};    
    
// Calls progressCallback with progress (scored 0 to 100)
Loader.prototype.progress = function() {
    this.progressCallback( Math.round( 100 * this.loadCounter / this.loadTotal ) );
    //alert( "XXX");
};