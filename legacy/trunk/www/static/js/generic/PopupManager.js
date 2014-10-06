/* 
 * PopupManager Constructor. Manages a popup with the help of cookies
 */
var PopupManager = function()
{
	this.popup      = undefined;    // Reference to popup
    this.popupOpen  = false;        // Popup open?
}

/* 
 * Create a popup and show it as big as we can
 * @param   url             URL to load in popup
 */
PopupManager.prototype.createPopup = function( url, feedbackDiv )
{
    this.feedbackDiv    = feedbackDiv;
    
    // Create it
    var popup = this.reconnectPopup( url );
    popup.focus();
    
    // Maximize popup
    var myTop = popup.top;
    myTop.window.moveTo(0,0);
    
    if( document.all ) 
    {
        myTop.window.resizeTo( screen.availWidth,screen.availHeight );
    }
    else if( document.layers || document.getElementById ) 
    {
        if( 
               myTop.window.outerHeight < screen.availHeight
            || myTop.window.outerWidth  < screen.availWidth
        ) {
            myTop.window.resizeTo( screen.availWidth, screen.availHeight );
        }
    }    
    
	return false;
}

/* 
 * Connect to an open popup (or reload if closed)
 * @param   url             URL to load in popup
 */
PopupManager.prototype.reconnectPopup = function( url )
{
    // Reopen popup if we can't find it or closed
    if( this.popup === undefined || !this.popupOpen )
    {
        var specs = 
              "toolbar=no,location=no,scrollbars=yes,resizable=yes,"
            + "width=800,height=600,left=0,top=0";
        
        // Open popup
        this.popupOpen = false;
        this.popup = window.open(
                url,      // URL
                "popup",  // name
                specs,    // specs
                true      // replace entry in history
        );
        
        // Check if popup indeed was opened
        var self = this;
        setTimeout( function() { self.checkPopup(); }, 2000 )
            
        //this.popupOpen = true;
    }
    
    return this.popup;
}

/* 
 * Close popup (by popup reference)
 * @param   popup           Reference to popup to close
 * @param   alreadyClosing  The popup is already closing (only update cookie)
 */
PopupManager.prototype.closePopup = function( alreadyClosing )
{
    // Close popup if we are not already closing
    if( !alreadyClosing )
    {
        var popup = this.reconnectPopup( "" );
        if( popup )
        {
            popup.close();
        }
    }
    
    this.popupOpen = false;
}    

/* 
 * Receive a confirmation that the popup is open
 */
PopupManager.prototype.confirmOpen = function()
{
    this.popupOpen  = true;
}


/* 
 * Check if popup was open, show message otherwise
 */
PopupManager.prototype.checkPopup = function()
{
    if( this.popupOpen )
    {
        $( this.feedbackDiv ).css( {
            "display" : "none"
        } );
    }
    else
    {
        $( this.feedbackDiv ).css( {
            "display" : "block"
        } );        
    }
}



// Create instance
popupManager = new PopupManager();