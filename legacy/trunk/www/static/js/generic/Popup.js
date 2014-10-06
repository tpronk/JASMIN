/* 
 * Popup Constructor. Attempts to comminicate with a popupManager in the opener window (see "PopupManager.js")
 * @param   ajaxManager     AjaxManager
 * @param   logger          Logger
 * @param   report          Report callback (see reporter)
 */
function Popup( ajaxManager, logger )
{
    this.ajaxManager  = ajaxManager;
    this.logger       = logger;    
    
    var self = this;
    
    // On unload, warn popupManager, else set cookie yourself
    $( window ).unload( function() {
        if( self.popupManagerExists() )
        {
            window.opener.popupManager.closePopup( true );
        }
    } );

    // On load, warn popupManager, else set cookie yourself
    $( window ).load( function() {
        //alert( "LOEAD");
        if( self.popupManagerExists() )
        {
            window.opener.popupManager.confirmOpen();
        }
    } );
        
    // On beforeunload, send remaininglogs
    $( window ).bind( "beforeunload", function()
    {
        if( self.logger !== undefined )
        {
            self.logger.send();
        }
        
        if( self.leaveMessage !== undefined  )
        {
            return self.leaveMessage;
        }
    } );
    
    // On unload, flush ajaxManager requests
    $( window ).bind( "unload", function()
    {
        if( self.ajaxManager !== undefined )
        {
            self.ajaxManager.sendOpenRequests( true );
        }
    } );    
}

/* 
 * Check if popupManager exists in opener window
 * @return true if popupManager exxists
 */
Popup.prototype.popupManagerExists = function()
{
    return window.opener && window.opener.popupManager;
}
