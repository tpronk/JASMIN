/* 
 * FocusManager Constructor. FocusManager tracks if a window is blurred and focussed. Three callbacks can be set:
 * 1. warning  - Called to warn user of window blur, receives as argument a callback to onFocus
 * 2. blur     - Called to stop any running tasks on blur
 * 3. focus    - Called to restart running tasks on focus (called in response to the user acting on warning)
 * @param   window     DOM node to check focus of
 * @param   logger     Logger
 */
function FocusManager( window, logger )
{
    this.window = window;
    this.logger = logger;
    
    var self = this;
    $( this.window ).blur( function() {
        self.blurred()
    } )
}    

/* 
 * Set warning
 */
FocusManager.prototype.setWarning = function( callback )
{
    this.warning = callback;
}

/* 
 * Set blur
 */
FocusManager.prototype.setBlur = function( callback )
{
    this.blur = callback;
}

/* 
 * Set focus
 */
FocusManager.prototype.setFocus = function( callback )
{
    this.focus = callback;
}

/* 
 * Triggered on blur; check if active, and if so, then call all the necessary functions
 */
FocusManager.prototype.blurred = function()
{
    // Log event
    this.logger.log(
        "FocusManager",
        "blurred",
        "",
        ""
    );       
    
    // Warn anything on blur
    if( this.blur !== undefined )
    {
        this.blur();
    }
        
    // Show feedback if any, providing callback to warnFocus (if any)
    if( this.warning !== undefined )
    {
        var self = this;
        this.warning( 
            function() {
                if( self.focus !== undefined )
                {
                    self.focus();
                }
            }
        );
    }
}
