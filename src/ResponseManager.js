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
if (jasmin === undefined) { var jasmin = function() {}; }

/**
 * ResponseManager manages keyboard, touch, and mouse responses.
 * @param {Object} override This response overrides normal ResponseManager behavior by calling the corresponding callback regardless of the state of the ResponseManager
 * @requires jasmin_ext/jquery.js
 * @requires jasmin_ext/jquery.mobile.js
 * @requires window.performance.now
 * @constructor
 */
jasmin.ResponseManager = function(override) {
   this.override = override;
   // Initial state
   this.active = false;  
   this.buttonsActive = undefined;
   this.callbackResponse = undefined;
   this.responseData = undefined;
};

/**
 * Attach event handlers 
 * @public
 * @param {Object} buttonDefinitions Responses handled by ResponseManager
 */
jasmin.ResponseManager.prototype.attach = function(buttonDefinitions) {
    this.buttonDefinitions = buttonDefinitions;
    this.bindEvents(true);
};

/**
 * Detach event handlers 
 * @public
 */
jasmin.ResponseManager.prototype.detach = function() {
    this.bindEvents(false);
};
    
/**
 * Bind or unbind event handlers
 * @public
 * @param {boolean} on If true, attach, if false detach
 */    
jasmin.ResponseManager.prototype.bindEvents = function(on) {    
    var self = this;    
    
    // attach event handler to a button, binds type, label, and id 
    var pointerCallback = function(type, id, label) {
        // if id is "all", attach to document
        var target = id !== "all"? $(id): $(window.document);
        var callback = function(event) {
            var time = window.performance.now();
            self.stopBubble(event);
            self.response(event, type, id, label, time, event.pageX, event.pageY);
        };
        if (on) {
            target.off(type);
            target.on(type, callback);
        } else {
            target.off(type);
        }
    };
    
    // keyboardMapping maps keyboard event type and keycode to button label
    this.keyboardMapping = {
        "keyup"   : {},
        "keydown" : {}
    };
    
    // elements to which we already attached cancel event handlers
    var attachedCancel = [];
    // attach stopbubble to cancel events, if not done already
    var stopCancelBubble = function(id) {
        if (attachedCancel.indexOf(id) === -1) {
            attachedCancel.push(id);
            var target = id !== "all"? $(id): $(window.document);
            // cancel events; stop these in event handler
            var cancelTypes = ["vmousecancel","mousecancel","touchcancel"], cancelType_i, cancelType;
            for (cancelType_i in cancelTypes) {
                cancelType = cancelTypes[cancelType_i];
                // pointer event; attach event handler
                var callback = function(event) {
                    self.stopBubble(event);
                }; 
                if (on) {
                    target.on(cancelType, callback);
                } else {
                    target.off(cancelType);
                }                
            }
        }
    };
    
    for (button_i in this.buttonDefinitions) {
        button = this.buttonDefinitions[button_i];
        for (modality_i in button["modalities"]) {
            modality = button["modalities"][modality_i];  
            if (modality["type"] === "keyup" || modality["type"] === "keydown") {
                // keyboard event; add to mapping
                this.keyboardMapping[modality["type"]][modality["id"]] = button["label"];
            } else {
                // pointer event; attach event handler
                pointerCallback(
                    modality["type"],
                    modality["id"],
                    button["label"]
                );                
                // Stop cancel bubble
                stopCancelBubble(modality["id"]);
            }
        }
    }
    
    // Attach keyboard event handlers
    var keyboardCallback = function(type) {
        var callback = function(event) {
            var time = window.performance.now();
            self.stopBubble(event);
            var id = event.which;
            
            // Map keylabel via keyboardMapping
            var keyLabel = self.keyboardMapping[type][id];
            // No keylabel found? try "all" key
            keyLabel = keyLabel !== undefined? keyLabel: self.keyboardMapping[type]["all"];
            self.response(event, type, event.which, keyLabel, time);
        };
        if (on) {
            $(window.document).on(type, callback);
        } else {
            $(window.document).off(type);
        }            
    };
    var keyboardTypes = ["keydown", "keyup"], keyboardType_i, keyboardType;
    for (keyboardType_i in keyboardTypes) {
        keyboardType = keyboardTypes[keyboardType_i];
        keyboardCallback(keyboardType);
    }
};
    
/**
 * ResponseManager calls callbackResponse if a response was given that
 * matches the specifications of buttonsActive
 * @public
 * @param {Array}     buttonsActive     An associative array defining responses that stop the event (if any). See <a href="../source/jasmin_demos/demo_choose.html">these demos </a> for examples.
 * @param {Function}  callbackResponse  Callback called upon a response
 */
jasmin.ResponseManager.prototype.activate = function(
    buttonsActive,    
    callbackResponse
) {
    this.buttonsActive    = buttonsActive;
    this.callbackResponse = callbackResponse;
    this.active           = true;
};

/**
 * Every keyboard and registered touch event triggers a callback to response
 * In response we determine whether we should call callbackResponse
 * @private
 * @param {Object}    event        Event as received by JS event handler
 * @param {String}    modality     Type of response (keydown, vmouseup etc.) 
 * @param {String}    id           ID of HTMLElement or keycode
 * @param {String}    label        Button label, if any
 * @param {String}    time         Time of response in ms (via window.performance.now())
 * @param {String}    x            If pointer: pageX 
 * @param {String}    y            If pointer: pageY 
 */
jasmin.ResponseManager.prototype.response = function(event, modality, id, label, time, x, y) {
   var callCallback = false;

   // Check on override
   if (this.override !== undefined && this.override["type"] === modality && this.override["id"] === id) {
      this.override["callback"]();
   }

   // register response if the response was an active button
   if (this.active && this.buttonsActive !== undefined && this.buttonsActive.indexOf(label) !== -1) {
       callCallback = true;
   }

   if(callCallback) {
       // Setup responseData
       this.responseData = {
           "modality" : modality,
           "id"       : id,
           "label"    : label,
           "time"     : time,
           "x"        : x,
           "y"        : y,
           "event"    : event            
       };    

       // Do callback
       this.callbackResponse();
   }
};

/**
 * Provides response data of previous response
 * @returns {Object} response data
 * @public
 */
jasmin.ResponseManager.prototype.getResponseLog = function() {
    return this.responseData;
};

// Stop event bubbling 
jasmin.ResponseManager.prototype.stopBubble = function(event) {
    event.stopPropagation(); 
    event.preventDefault();
};

/**
 * Deactivate; don't call responseCallback on any response anymore
 * @public
 */
jasmin.ResponseManager.prototype.deactivate = function() {
    // Stop event
    this.active = false;    
};