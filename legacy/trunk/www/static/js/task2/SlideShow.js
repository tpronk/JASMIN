/**
 * SlideShow presents slideshows 
 * @constructor
 * @param {EventManager}    eventManager              EventManager to manage responses to slides
 */
function SlideShow( eventManager )
{
    this.eventManager = eventManager;
}

/**
 * Show a set of slides
 *  @param {jQueryDiv}  target               jQuery node to put slide in
 *  @param {array}      slides               Array of slides to show (containing text or jQuery nodes)
 *  @param {Function}   slideCallback        Function called when slideShow is done 
 *  @param {Object}     translateCallbacks   Associative array of the form { "term" : function }, where the translation of a custom "term" is the value returned by the function
 *  @param {String}     nextKey              Text informing the participant how to progress through the slides, if defined, this text is added with a line break below each slide
 */
SlideShow.prototype.showSlides = function( 
    target,     
    slides,     
    slideCallback,    
    translateCallbacks, 
    buttons,
    mouseType,
    touchButtons,   
    keyInstructions
) {
    // Slideshow settings
    this.target             = target;
    this.slides             = slides;
    this.slideCallback      = slideCallback;    
    this.translateCallbacks = translateCallbacks;
    this.keyInstructions    = keyInstructions;
    this.mouseType          = mouseType;
    this.touchButtons       = touchButtons;
    this.buttons            = buttons;

    // Start at first slide
    this.slideCounter       = 0;
    this.showSlide();
}

// Show a slide, if any left, else callback
SlideShow.prototype.showSlide = function()
{
    // No slides left? callback
    if( this.slideCounter >= this.slides.length )
    {
        this.slideCallback();
        return;
    }    
    
    // Slides left; setup slide content
    var slideContent = this.slides[ this.slideCounter ];
    
    // Setup key instruction
    if( this.keyInstructions !== undefined )
    {
        var keyInstruction;
        if( this.slideCounter == 0 )
        {
            keyInstruction = this.keyInstructions[ "first" ];
        } else {
            keyInstruction = this.keyInstructions[ "later" ];
        }
        
        slideContent += "<br><br>" + keyInstruction;
    }
    
    // Show slide
    this.target.html( translator.substitute( 
        slideContent,
        this.translateCallbacks
    ) );
        
    // wait for a response
    var self = this;
    this.eventManager.startEvent(
        this.setupResponses( "down", "specific" ),
        -1,                           // timeout   - When does this event timeout 
        function( eventData ) {
            self.response( eventData );
        },
        [],                           // params    - State to pass to callback
        "slide_" + this.slideCounter  // name      - Name for logging  
    );          
}

// Wait for keyup
SlideShow.prototype.response = function( eventData )
{
    this.buttonPressed = eventData[ "response" ][ "label" ];
    
    var self = this;
    this.eventManager.startEvent(
        this.setupResponses( "up", "all" ),    
        -1,                       // timeout   - When does this event timeout 
        function( eventData ) { 
            self.nextSlide( eventData );
        },                        // callback  - Function to return to after event
        null,                     // params   - State to pass to callback
        "keyup",
		false
    );       
}    

// Go to next slide if any, else go to callback
SlideShow.prototype.nextSlide = function( eventData )
{
    if( this.buttonPressed == "next" )
    {
        this.slideCounter++;
    }
    if( this.buttonPressed == "previous" && this.slideCounter > 0 )
    {
        this.slideCounter--;
    }
        
    this.showSlide();
}

SlideShow.prototype.setupResponses = function( type, which )
{
    // Setup responses
    var responses = {};
    
    // Keyboard
    responses[ "key" + type ] = {
        "type"    : which,
        "buttons" : this.buttons
    };
    
    // Touch
    responses[ "vmouse" + type ] = {
        "buttons" : this.touchButtons
    };
/*    
    // Mouse
    responses[ this.eventManager.pointerDeviceEvents[ "mouse" ][ type ] ] = {
        "buttons" : this.touchButtons
    };
*/    
    return responses;
}