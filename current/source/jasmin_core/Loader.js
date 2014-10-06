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
 * Thw Loader loads a set of json requests and images and calls a callback after all are
 * loaded. Povides another callback to report on progress.
 * @param   {AjaxManager} ajaxManager  For json requests
 * @param   {Function}    fail         Called if loader fails
 * @class
 */
function Loader( ajaxManager, fail )
{
    this.ajaxManager     = ajaxManager;
	this.fail            = fail;
};

/**
 * Load a set of requests and images
 * @param {Object}   json               JSON Requests to ajax handler
 * @param {Object}   images             Images
 * @param {Function} callback           Callback when done
 * @param {Function} progressCallback   Callback for updating progress; this function receives one argument, being progress (ranging from 0 to 100)
 * @public
 */
Loader.prototype.load = function( 
    json,          
    images,            
    callback,          
    progressCallback
)
{
    this.requests         = {};
    this.images           = images;
    this.callback         = callback;
    this.progressCallback = progressCallback;
    
    this.totalCount      = 0;  // Total number of loads 
    this.totalCounter    = 0;  // Number of load that are done

    // Helper vars for images & counters
    this.imageMap     = [];  // Maps indexes in imageArray to keys in images
    this.imageArray   = [];
    this.imageResults = {};
    this.imageCounter = 0;
    var i;
    for( i in this.images )
    {
        this.totalCount++;
        this.imageMap.push( i );
        this.imageArray.push( this.images[i] );
    }

    // Helper vars for requests && counters
    this.requestsMap    = {}; // Maps requestIds to keys in requests 
    this.replies        = {};
    this.requestCounter = 0;
    this.requestCount   = 0;
    var requestsArray   = [];
    
    var self = this;
    var request;
    var callback;
    // All requests count as 1 in the total
    for( var i in json )
    {
        this.requestCount++;
        request = {};
        request[ "data" ]     = json[i];
        request[ "done" ]     = false;
        closure = function( index ) {
            var myIndex = index;
            return function( data ) {
                self.requestSuccess( myIndex, data ); 
            }
        };
        request[ "callback" ] = closure( i );
        
        this.requests[i] = request;
        requestsArray.push( request );
    }
    
    // If any ajax requests, first send those
    if( this.requestCount > 0 ) 
    {
        this.totalCount++;
        this.ajaxManager.sendMulti( 
            requestsArray, 
            false 
        );

        this.ajaxManager.flush();
    } else {
        // Else, go to images
        this.loadImage();
    }
    
    this.progress();
};

/**
 * Process a successfully completed request. Once all requests are in, we continue with the images
 * @param data               Data returned by the request
 * @private
 */
Loader.prototype.requestSuccess = function( index, reply )
{
   // Process reply only if not yet done
   if( !this.requests[ index ][ "done" ] )
   {
       this.requests[ index ][ "done" ] = true;
       this.requestCounter++;
       this.replies[ index ] = reply;

       // Done? update and go to images
       if( this.requestCounter === this.requestCount )
       {
           this.totalCounter++;
           this.progress();
           //this.imageFailCounter = 0;
           this.loadImage();
       }
   }
};

/**
 * Load next image. Once all images are loaded, we are done, so the callback is called
 * @private
 */
Loader.prototype.loadImage = function()
{
    // Show progress
    this.progress();    
    
    // More images to go?
    var self = this;
    if( this.imageCounter < this.imageArray.length )
    {
        this.imageResults[ this.imageMap[ this.imageCounter ] ] =
            $( "<img>" ).attr( 
                "src", this.imageArray[ this.imageCounter ]
            ).load( function() {
                self.imageCounter++;
                self.totalCounter++;
                self.loadImage();
                //setTimeout( function() { self.loadImage() }, 1000 );
            } ).error( function() {
				self.fail( "Loader: Could not load " + self.imageArray[ self.imageCounter ] );
			} );
    }
    else
    {
        // All loaded
        this.callback( this.replies, this.imageResults );   
    }
};

/**
 * Update progress display
 * @private
 */
Loader.prototype.progress = function()
{
    // Update progress
    var self = this;
    if( this.progressCallback !== undefined )
    {
        this.progressCallback(  Math.round( 100 * self.totalCounter / self.totalCount ) );
    }
};
