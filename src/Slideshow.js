//Copyright 2014, Thomas Pronk
//
//Licensed under the Apache License, Version 2.0 (the "License");
//you may not use this file except in compliance with the License.
//You may obtain a copy of the License at
//
//http://www.apache.org/licenses/LICENSE-2.0
//
//Unless required by applicable law or agreed to in writing, software
//distributed under the License is distributed on an "AS IS" BASIS,
//WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//See the License for the specific language governing permissions and
//limitations under the License. 

/** 
 * Init JASMIN namespace
 * @private
 */
if( jasmin === undefined ) { var jasmin = function() {}; }

/**
 * Slideshow presents Slideshows 
 * @constructor
 * @param {HTMLElement}  target           Where to put slide in
 * @param {EventManager} eventManager     EventManager to manage delayed button activation and slidehow responses 
 * @param {Object}       slideButtons     Responses for slide navigation (next/previous) and releasing buttons (up), see for details EventManager.startEvent. Buttons labeled "next" will let the slideshow go to next slide, while buttons labeled "previous" go to the previous slide. Recommended to use "up" type events (keyup/vmouseup).
 * @param {int}          buttonDelay      number of ms to wait until showing slideButtons and registering responses, default value = 0 (immediately show buttons)
 * @param {Function}     buttonHide       hides buttons for next/previous slide
 * @param {Function}     buttonShow       shows buttons for next/previous slide
 * @param {Translator}   translator       If defined, used to translate slide content
 */
jasmin.Slideshow = function( target, eventManager, slideButtons, buttonDelay, buttonHide, buttonShow, translator ) {
    this.target          = target;    
    this.eventManager    = eventManager;
    this.translator      = translator;
    this.slideButtons    = slideButtons;
    this.buttonDelay     = buttonDelay !== undefined? buttonDelay: 0;
    this.buttonHide      = buttonHide !== undefined? buttonHide: function() {};
    this.buttonShow      = buttonShow !== undefined? buttonShow: function() {};
    
    // Create dummy translator if none is defined
    if( translator === undefined ) {
        this.translator = {};
        this.translator.translate = function( term ) {
            return term;
        };
    } else {
        this.translator = translator;
    }
    
    // Create table logger to log slide events
    this.logger = new jasmin.TableLogger( 
        // columns
        [
            "set",          // {String}  Set of slides currently presented
            "slide",        // {int}     Index of current slide
            "delay",        // {int}     Number of ms until slide buttons shown
            "phase",        // {down/up} What phase of the slide are we in? down = waiting for down response, up = waiting for release
            "response",     // {String}  Button pressen "next" or "previous"
            "rt",           // {int}     Ressponse time
            "modality",     // {String}  Type of response (like keyup or mouseup)
            "id",           // {String}  ID of response (keycode or id of HTMLElement)
            "time_start",   // {int}     Time slide was presented
            "time_buttons", // {int}     Time buttons were activated
            "time_response" // {int}     Time slide was ended (by a response)
        ]
    );
    
    // Button mappings for eventManager and mapping buttons to "next" and "previous" (slideButtonRoles)
    this.buttonsActive = [];
    this.buttonMapping = {};
    var slideRoles = ["next","previous","up"], slideRole_i, slideRole, slideRoleButtons, slideRoleButton_i, slideRoleButton;;
    for (slideRole_i in slideRoles) {
        slideRole = slideRoles[slideRole_i];
        slideRoleButtons = slideButtons[slideRole];
        for (slideRoleButton_i in slideRoleButtons) {
            slideRoleButton = slideRoleButtons[slideRoleButton_i];
            this.buttonsActive.push(slideRoleButton);
            this.buttonMapping[slideRoleButton] = slideRole;
        }
    };
    
    DEBUG && console.log({
        "this.buttonMapping" : this.buttonMapping
    })
};

/**
 * Show a set of slides in target, then hides target again
 *  @param {array}        slides               Array of slides to show (containing plain or HTML)
 *  @param {Function}     callbackDone         Function called when Slideshow is done 
 *  @param {Function}     slideSet             (Default: "noname"). Name of to identify this set of slides in slideshow logs
 */
jasmin.Slideshow.prototype.show = function( 
    slides,
    callbackDone,
    slideSet
) {
    // If no slides, immediately go to callbackDone
    if (slides.length === 0) {
        callbackDone();
        return;
    }
    
    // Slideshow settings
    this.slides             = slides;
    this.callbackDone       = callbackDone;    
    this.slideSet           = slideSet !== undefined? slideSet: "noname";

    // Start at first slide
    this.firstSlide         = true;
    this.slideCounter       = 0;
    this.slideFurthest      = -1;
    this.showSlide();
};

// Wait for keyup, then go to showSlide
jasmin.Slideshow.prototype.nextSlide = function() {
    DEBUG && console.log( "nextSlide" );
    
    this.logSlideInfo( "down" );
    
    // Wait for up and call callback
    var self = this;
    this.eventManager.startEvent( 
        -1,
        function() {
            self.target.hide();
        },
        function() {
            self.showSlide();
        },
        this.slideButtons[ "up" ],
        "released_silent"
    );           
};

// Show a slide if any left, else callback
jasmin.Slideshow.prototype.showSlide = function() {
    DEBUG && console.log( "showSlide" );
    
    // Log if not first slide
    if( !this.firstSlide ) {
        this.timeResponse = window.performance.now();        
        this.logSlideInfo( "up" );
    } else {
        this.firstSlide = false;
    }
    
    var self = this;
    
    // No slides left? wait for up and call callback
    if( this.slideCounter >= this.slides.length ) {
        self.callbackDone();
        return;
    }    
    
    // Slides left; log timeStart
    this.timeStart = window.performance.now();
    
    // Setup a buttonDelay? Only if...
    // buttonDelay is not 0
    if( this.buttonDelay === 0 ) {
        this.showButtons();
    // this slide has not been delayed yet
    } else if( this.slideFurthest >= this.slideCounter ) {
        this.showButtons();
    // Still here? then delay buttons
    } else {
        // Update slideFurthest (that has had a delay)
        this.slideFurthest = this.slideCounter;
        
        // wait for buttonDelay until showing buttons
        this.eventManager.startEvent(
            this.buttonDelay,
            // Draw
            function() { 
                self.target.show();
                self.target.html( self.translator.translate( self.slides[ self.slideCounter ] ) ); 
                self.buttonHide();
            },
            // Done
            function() { self.showButtons(); },
            // activeResponses
            [],
            // resetRt
            true,
            // name
            "slide_nobutton_" + self.slideCounter
        );
    }
};

// Add buttons and start registering responses
jasmin.Slideshow.prototype.showButtons = function() {
    this.timeButtons = window.performance.now();
    
    // Wait for response to continue
    var self = this;
    this.eventManager.startEvent(
        -1,
        // Draw
        function() { 
            self.target.html( self.translator.translate( self.slides[ self.slideCounter ] ) );
            self.target.show();
            self.buttonShow();
        },
        // Done
        function() { 
            self.response(); 
        },
        // activeResponses
        this.buttonsActive,
        // name
        "slide_nobutton_" + self.slideCounter
    );
};
    
// Response given; go to next/previous slide slide
jasmin.Slideshow.prototype.response = function() {
    this.timeResponse = window.performance.now();

    var buttonPressed = this.buttonMapping[this.eventManager.responseLabel];
    
    if( buttonPressed === "next" ) {
        this.slideCounter++;
        this.nextSlide();
    } else if ( buttonPressed === "previous" && this.slideCounter > 0 ) {
        this.slideCounter--;
        this.nextSlide();
    } else {
        this.showSlide();
    }
};

// Logs information about slide and response
jasmin.Slideshow.prototype.logSlideInfo = function( phase ) {
    // responseData not available yet at start of first slide
    var modality = this.eventManager.responseManager.responseData[ "modality" ] !== undefined


    var slideLogs = {
        "set" : this.slideSet,
        "slide" : this.slideCounter,
        "delay" : this.buttonDelay,
        "phase" : phase,
        "response" : this.buttonMapping[this.eventManager.responseLabel],
        "rt" : this.eventManager.rt,
        "modality" : this.eventManager.responseManager.responseData[ "modality" ],
        "id" : this.eventManager.responseManager.responseData[ "id" ],
        "time_start" : this.timeStart,
        "time_buttons" : this.timeButtons,
        "time_response" : this.timeResponse
    };
    this.logger.log( slideLogs );
    DEBUG && console.log( slideLogs );
}
    
    