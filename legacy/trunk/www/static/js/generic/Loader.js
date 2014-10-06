/* 
 * Loader Constructor
 * @param   ajaxManager  AjaxManager
 * @param   report       Report callback (see reporter)
 */
function Loader( ajaxManager, fail, report )
{
    this.ajaxManager     = ajaxManager;
	this.fail            = fail;
    this.report          = report;
}

/* 
 * Load a set of requests and images
 * @param requests           Requests to ajax_handler
 * @param images             Images
 * @param callback           Callback when done
 * @param progressCallback   Callback for updating progress
 * @param progressMessage    Message do display progress with. Can contain a term "[progress]" for displaying percent loaded
 */
Loader.prototype.load = function( 
    requests,          
    images,            
    callback,          
    progressCallback,  
    progressMessage    
)
{
    this.requests         = requests;
    this.images           = images
    this.callback         = callback;
    this.progressCallback = progressCallback;
    this.progressMessage  = progressMessage;
    
    this.totalCount      = 0;  // Total number of loads 
    this.totalCounter    = 0;  // Number of load that are done

    var i;
    
    // Helper vars for images & counters
    this.imageMap     = [];  // Maps indexes in imageArray to keys in images
    this.imageArray   = [];
    this.imageResults = {};
    this.imageCounter = 0;
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
    var requestsKeyMap  = [];
    var requestIds;
    
    var self = this;
    var request;
    
    // All requests count as 1 in the total
    for( var i in this.requests )
    {
        this.requestCount++;
        request = this.requests[i];
        request[ "done" ]    = false; 
        request[ "calback" ] = function( data ) { self.requestSuccess( data ); }
        requestsArray.push( request );
        requestsKeyMap.push( i );
    }
    
    // If AJAX is not enabled, use dummyReplies
    if( !this.ajaxManager.ajaxEnabled )
    {
       this.replies = dummyReplies;
    }
    
    // If any ajax requests, first send those
    if( this.requestCount > 0 ) 
    {
        this.totalCount++;

        if( this.ajaxManager.ajaxEnabled )
        {
            requestIds = this.ajaxManager.send_multi( 
                requestsArray, 
                false 
            );

            for( i in requestIds )
            {
                this.requestsMap[ requestIds[i] ] = requestsKeyMap[i];
            }
            
            this.ajaxManager.sendOpenRequests();
        }
    }
    
    this.progress();
    
    // If no requests or not ajaxEnabled, goto loadImage
    if( this.requestCount == 0 || !this.ajaxManager.ajaxEnabled )
    {  
        // Else, go to images
        this.loadImage();
    }
}

/* 
 * Process a successfully completed request. Once all requests are in, we continue with the images
 * @param data               Data returned by the request
 * @private
 */
Loader.prototype.requestSuccess = function( data )
{
   // Get keys
   var requestId  = data[ "requestId" ];
   var requestKey = this.requestsMap[ requestId ];
   
   // Process reply only if not yet done
   if( !this.requests[ requestKey ][ "done" ] )
   {
       this.requests[ requestKey ][ "done" ] = true;
       this.requestCounter++;
       this.replies[ requestKey ] = data[ "reply" ];
       
       // Update progress
       this.progress();
       
       // Done? update and go to images
       if( this.requestCounter == this.requestCount )
       {
           this.totalCounter++;
           this.progress();
           this.loadImage();
       }
   }
}

/* 
 * Load next image. Once all images are loaded, we are done, so the callback is called
 * @private
 */
Loader.prototype.loadImage = function()
{
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
                self.progress();
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
}

/* 
 * Update progress display
 */
Loader.prototype.progress = function()
{
    // Update progress
    var self = this;
    if( this.progressCallback !== undefined )
    {
        //this.progressCallback( Math.round( 100 * self.totalCounter / self.totalCount ) + "%" );
        this.progressCallback( translator.substitute(
            this.progressMessage,
            {
                "progress" : function() { 
                    return Math.round( 100 * self.totalCounter / self.totalCount ) + "%";
                }
            }
        ) );
    }
}
