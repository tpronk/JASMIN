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
 * @param {HTMLElement}  target               Where to put slide in
 * @param {EventManager} eventManager     EventManager to manage delayed button activation and slidehow responses 
 * @param {Object}       activeResponses  Responses for going to next/previous slide, see for details EventManager.startEvent. Buttons labeled "next" will let the slideshow go to next slide, while buttons labeled "previous" go to the previous slide. Recommended to use "up" type events (keyup/vmouseup).
 * @param {Object}       buttonTexts      Associative array with texts instructing how to go to the next/previous slide, displayed two lines below slide content. Keys of buttonTexts can be "first", "last", or "middle" for first slide, last slide, and any other
 * @param {int}          buttonDelay      number of ms to wait until showing buttonTexts and registering responses, default value = 0 (immediately show buttons)
 * 
 */
jasmin.Slideshow = function( target, eventManager, activeResponses, buttonTexts, buttonDelay ) {
    this.eventManager    = eventManager;
    this.target          = target;
    this.activeResponses = activeResponses;
    this.buttonTexts     = buttonTexts;
    this.buttonDelay     = buttonDelay === undefined? 0 : buttonDelay;
};

/**
 * Show a set of slides in target, then hides target again
 *  @param {array}        slides               Array of slides to show (containing plain or HTML)
 *  @param {Function}     callbackDone         Function called when Slideshow is done 
 */
jasmin.Slideshow.prototype.show = function( 
    slides,     
    callbackDone
) {
    // Slideshow settings
    this.slides             = slides;
    this.callbackDone       = callbackDone;    

    // Start at first slide
    this.slideCounter       = 0;
    this.slideFurthest      = 0;
    this.showSlide();
};

// Show a slide if any left, else callback
jasmin.Slideshow.prototype.showSlide = function() {
    // No slides left? callback
    if( this.slideCounter >= this.slides.length ) {
        this.callbackDone();
        return;
    }    
    
    // Slides left; setup a buttonDelay? Only if...
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
        
        // Only slide now, buttons later
        var slideContent = this.slides[ this.slideCounter ];
        
        // wait for buttonDelay until showing buttons
        var self = this;
        this.eventManager.startEvent(
            this.buttonDelay,
            // Draw
            function() { self.target.html( slideContent ); },
            // Done
            function() { self.showButtons(); },
            // activeResponses
            {},
            // name
            "slide_nobutton_" + + self.slideCounter
        );
    }
};

// Add buttons and start registering responses
jasmin.Slideshow.prototype.showButtons = function()
{
    var slideContent = this.slides[ this.slideCounter ];

    // Add buttonTexts (if any)
    if( this.buttonTexts !== undefined ) {
        var buttonText;
        if( this.slideCounter === this.slides.length - 1 ) {
            buttonText = this.buttonTexts[ "last" ];
        } else if( this.slideCounter === 0 ) {
            buttonText = this.buttonTexts[ "first" ];
        } else {
            buttonText = this.buttonTexts[ "middle" ];
        }
        slideContent += "<br /><br />" + buttonText;
    }

    // Wait for response to continue
    var self = this;
    this.eventManager.startEvent(
        -1,
        // Draw
        function() { self.target.html( slideContent ); },
        // Done
        function() { self.response(); },
        // activeResponses
        this.activeResponses,
        // name
        "slide_nobutton_" + + self.slideCounter
    );
};
    
// Response given; go to next/previous slide slide
jasmin.Slideshow.prototype.response = function()
{
    var buttonPressed = eventManager.responseLabel;
    
    if( buttonPressed === "next" ) {
        this.slideCounter++;
    }
    if( buttonPressed === "previous" && this.slideCounter > 0 ) {
        this.slideCounter--;
    }
    
    this.showSlide();
};

