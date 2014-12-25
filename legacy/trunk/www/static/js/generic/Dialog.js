/* 
 * Constructor
 * @param   output   HTML node to add the dialog HTML to (dialogContainer)
 */
function Dialog( output, logger )
{
    this.hiddenContainer = output;
    
    this.logger = logger;
    
    // Setup dialog and mask
    this.loadingIcon       = $( "<img>" ).attr( "src", 
        config[ "img_location" ] + "icons/busy32.gif"
    );
    this.loadingContainer  = $( "<div>" ).attr( {
            "class" : "LoadingContainer"
    } );
    this.loadingContainer.append( this.loadingIcon );
    
    this.messageContainer  = $( "<div>" ).attr( {
            "class" : "MessageContainer"
    } );
    
    this.topContainer  = $( "<div>" ).attr( "class", "TopContainer" );
    this.topContainer.append( this.loadingContainer );
    this.topContainer.append( this.messageContainer );
    
    this.buttonContainer   = $( "<div>" ).attr( "class", "ButtonDiv" );
    
    
    this.box               = $( "<div>" ).attr( "class", "Box" );
    this.box.append( this.topContainer );
    this.box.append( this.buttonContainer  );
    
    this.boxContainer   = $( "<div>" ).attr( "class", "BoxContainer" );
    this.boxContainer.append( this.box );
    
    this.boxContainer2  = $( "<div>" ).attr( "class", "BoxContainer2" );
    this.boxContainer2.append( this.boxContainer );
    
  
    this.mask    = $( "<div>" ).attr( "class", "Mask" );

    this.dialogContainer   = $( "<div>" ).attr( "id", "dialogContainer" );
    this.hide();
    this.dialogContainer.append( this.mask );
    this.dialogContainer.append( this.boxContainer2  );
    
    output.append( this.dialogContainer );

    // Buttons
    this.okButton = $( "<input type='button' />" ).attr( "value", "OK" );

    // Event handlers
    var self = this;
    // if box button is clicked
    this.dialogContainer.click( function( e ) { 
        e.preventDefault();
        self.clicked( "general" );
    });    
}

/* 
 * Show an alert (with an OK button)
 * @param   message   Message to display 
 * @param   callback  Callback called once the user clicked the dialog
 */
Dialog.prototype.alert = function( message, callback, width )
{
    
    this.showLoading( false );
    
    // Set type and callback
    this.type     = "alert";
    this.callback = callback;
    
    // Set message and button
    this.messageContainer.html( message );
    this.buttonContainer.empty();
    this.buttonContainer.append( this.okButton );

    this.show( width );
}

/* 
 * Show a message (without OK button)
 * @param   message   Message to display 
 * @param   callback  Callback called once the user clicked the dialog
 */
Dialog.prototype.message = function( message, callback )
{
    this.showLoading( false );
    
    // Set type and callback
    this.type     = "message";
    this.callback = callback;
    
    // Set message and button
    this.messageContainer.html( message );
    this.buttonContainer.empty();

    this.show();
}

/* 
 * Show a loading message (with the loading animation)
 * @param   message   Message to display 
 * @param   callback  Callback called once the user clicked the dialog
 */
Dialog.prototype.loading = function( message, callback )
{
    this.showLoading( true );
    
    // Set type and callback
    this.type     = "message";
    this.callback = callback;
    
    // Set message and button
    this.messageContainer.html( message );
    this.buttonContainer.empty();

    this.dialogContainer.show();    
}

/* 
 * Show or hide the loading animation 
 * @param   show      true = show, false = hide
 */
Dialog.prototype.showLoading = function( show )
{
    if( show )
    {
        this.loadingContainer.show();
        return;
    }
    this.loadingContainer.hide();
}

/* 
 * Register a click; hide and call callback
 * @param   where      Where did the participant click (currently only "general")
 */
Dialog.prototype.clicked = function( where )
{
    // Log event
    this.logger.log(
        "Dialog",
        "clicked",
        "",
        ""
    );       
    
    // If type was alert, hide on any click
    if( this.type == "alert" )
    {
        this.hide();

        // If there is callback, call it
        if( this.callback !== undefined )
        {
            this.callback();
        }
    }
}
 
/* 
 * Hide dialog
 */ 
Dialog.prototype.hide = function()
{
    this.dialogContainer.hide();
    this.dialogContainer.css( { 
        "display": "none",
        "opacity": 1
    } );    
    this.hiddenContainer.hide();
}

/* 
 * Show dialog
 */ 
Dialog.prototype.show = function( width )
{
    width = width === undefined? "350px": width;
    $( "#dialogContainer .Box" ).css( "max-width", width );
    this.dialogContainer.show();
    this.dialogContainer.css( { 
        "display": "block",
        "opacity": 1
    } );
    this.hiddenContainer.show();
}