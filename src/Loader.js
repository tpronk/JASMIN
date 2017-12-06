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
 * Init JASMIN namespace
 * @private
 */
if( jasmin === undefined ) { var jasmin = function() {}; }

/**
 * The Loader provides a short API for making a set of requests (to get js/css/json/text/img/etc.). 
 * @param   {RequestManager} requestManager  Uses this to Handle the requests
 * @param   {Object}         baseUrls        Base URLs to prepend to urls passed to load. baseUrls can contain a key per request type (css, img, json, text, script, font, etc.)
 * @require RequestManager
 * @class
 */
jasmin.Loader = function( requestManager, baseUrls ) {
    this.requestManager = requestManager;
    this.baseUrls = baseUrls;
};

/**
 * Perform a set of requests and call a callback with all replies once all replies have completed
 * @param {Array}    requests  Associative array, in which the keys identify each request (for retrieving the replies later), while each value is an indexed array in which element 0 identifies the type of request element 1 contains the actual request. For type "img" the image downloader is used, "css" is downloaded via AJAX and put in the page head, any other type is passed on as dataType to a RequestManager AJAX request
 * @param {Function} allLoaded          called when all is loaded with the argument being the data downloaded (as an associative array)
 * @param {Function} progressCallback   (optional) callback for updating progress; this function receives one argument, being the progress made so far (ranging from 0 to 100)
 * @public
 */
jasmin.Loader.prototype.load = function( requests, allLoaded, progressCallback ) {
    this.allLoaded        = allLoaded;
    this.progressCallback = progressCallback === undefined? function() {} : progressCallback;
    
    this.replies  = {};    // Results of data requests
    this.loadCounter = 0;  // Counting progress
    this.loadTotal   = 0;  // Counting total

    // Report 0 progress
    this.progressCallback(0);

    // Make requests for includes
    this.doRequests( requests );

    // Flush and call callback
    var self = this;
    this.requestManager.flush( function() { 
        self.allLoaded( self.replies );
    } );
};
    
 jasmin.Loader.prototype.doRequests = function( requests ) {
    var self = this;
    for( var key in requests ) {
        this.loadTotal++;        
        
        // This closure sets up the right request and binds its arguments to the callback function
        var closure = function( key, dataType, url, request ) {
            var requestType, request;
            if (self.baseUrls !== undefined && self.baseUrls[dataType] !== undefined) {
              if (dataType !== "audio") {
                url = self.baseUrls[dataType] + url;
              } else {
                for (var i in url) {
                  url[i] = self.baseUrls[dataType] + url[i];
                }
              }
            }
            
            // Determine what kind of request to make
            switch( dataType ) {
                case "css":
                    requestType = jasmin.RequestManager.TYPE_AJAX;
                    request = {
                        "url"      : url,
                        "dataType" : "text"
                    };
                    break;
                case "img":
                    requestType = jasmin.RequestManager.TYPE_IMG;
                    request = url;
                    break;
                case "audio":
                    requestType = jasmin.RequestManager.TYPE_AUDIO;
                    request = url;
                    break;                    
                default:
                    requestType = jasmin.RequestManager.TYPE_AJAX;
                    if( request === undefined ) {
                        request = {};
                    }
                    request["dataType"] = dataType;
                    request["url"] = url;
                    break;                 
            }            
            
            // font; setup AJAX request to be binary
            if( dataType === "font" ) {
                request["dataType"]  = "binary";
                request["processData"] = false;
            }
            
            DEBUG && console.log({
                "what"     : "request",
                "key"      : key,
                "dataType" : dataType,
                "url"      : url,
                "request"  : request
            });
            
            // Do it
            self.requestManager.request(
                requestType,
                request, 
                function( reply ) {
                    DEBUG && console.log({
                        "what"     : "reply",
                        "key"      : key,
                        "dataType" : dataType,
                        "url"      : url,
                        "request"  : request,
                        "reply"    : reply
                    });
                    
                    // Special case for CSS; put in head
                    if( dataType === "css" ) {
                        $( '<link rel="stylesheet" type="text/css" href="' + url + '" />' ).appendTo( "head" );
                    }
                    // Special case for font; setup a font
                    if( dataType === "font" ) {
                        $( "head" ).prepend("<style type=\"text/css\">@font-face {"
                            + "src : url(\""    + request["url"] + "\");"
                            + "font-family : " + request["font-family"] + ";"
                            + "font-weight : " + request["font-weight"] + ";"
                            + "font-style  : " + request["font-style"] + ";"
                            + "}"
                        );
                    }
                    self.replies[ key ] = reply;
                    self.loadCounter++;
                    self.progress();
                }
            );            
        };
        closure( key, requests[key][0], requests[key][1], requests[key][2], requests[key][3] );
    }
};    
    
// Calls progressCallback with progress (scored 0 to 100)
jasmin.Loader.prototype.progress = function() {
    this.progressCallback( Math.round( 100 * this.loadCounter / this.loadTotal ) );
};