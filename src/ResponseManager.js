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
   
   // Gamepad handling
   this.gamepadConnected = false;
   this.gamepadAxisLimits = [];
   
   var self = this;
   window.addEventListener("gamepadconnected", function(e) {
      console.log("gamepadconnected");
      self.gamepadConnected = true;
      self.gamepadAxes = JSON.parse(JSON.stringify(e.gamepad.axes));
      requestAnimationFrame(function() { self.pollGamepad(); });
   });
   window.addEventListener("gamepaddisconnected", function(e) {
      console.log("gamepaddisconnected");
      self.gamepad = undefined;
   });   
};

jasmin.ResponseManager.prototype.pollGamepad = function () {
   this.gamepad = undefined;
   var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
   for (var i = 0; i < gamepads.length && this.gamepad === undefined; i++) {
      if (gamepads[i] !== null) {
         this.gamepad = gamepads[i];
      }
   }
   if (this.gamepad !== undefined) {
      //console.log(this.gamepad.axes);
      //console.log(this.gamepadAxisLimits);
      //console.log(this.gamepadAxes, this.gamepad.axes);
      var i, j;
      for (i = 0; i < this.gamepadAxes.length && i < this.gamepadAxisLimits.length; i++) {
         if (this.gamepadAxes[i] !== this.gamepad.axes[i]) {
            this.gamepadAxes[i] = this.gamepad.axes[i];
            if (this.callbackEvent !== undefined) {
               this.callbackEvent(
                  "axischange", 
                  "gamepadaxis", 
                  i, 
                  undefined, 
                  window.performance.now(), 
                  this.gamepadAxes[i]
               );
            }
            for (j = 0; j < this.gamepadAxisLimits[i].length; j++) {
               // If current axis i is in the min/max range gamepadAxisLimits[i][j], then call response
               if ( (max >= min && this.gamepad.axes[i] >= this.gamepadAxisLimits[i][j]["min"] && this.gamepad.axes[i] <= this.gamepadAxisLimits[i][j]["max"]) ||
                    (min >  max && this.gamepad.axes[i] >= this.gamepadAxisLimits[i][j]["min"] || this.gamepad.axes[i] <= this.gamepadAxisLimits[i][j]["max"])
                  
                  ) {
                  this.response(
                     "axischange", 
                     "gamepadaxis", 
                     i, 
                     this.gamepadAxisLimits[i][j]["label"], 
                     window.performance.now(), 
                     this.gamepadAxes[i]                     
                  );
               }
            }
         }
         /*
         //console.log(i);
         if(this.gamepadAxes[i] !== this.gamepad.axes[i]) {
            console.log([i,this.gamepad.axes[i]]);
            this.gamepadAxes[i] = this.gamepad.axes[i];
         }
         */
      }
   }   
   
   // Compare axis states with previous poll
   //console.log(this.gamepad);
   
   var self = this;
   requestAnimationFrame(function() { self.pollGamepad(); });
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
            var pageX, pageY;
            if (type === "touchstart" || type === "touchend" || type === "touchmove" || type === "touchcancel") {
               var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
               pageX = touch.pageX;
               pageY = touch.pageY;
            } else {
               pageX = event.pageX;
               pageY = event.pageY;
            }
            self.response(event, type, id, label, time, pageX, pageY);
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
    
    // 3 gamepad axes
    this.gamepadAxisLimits = [];
    for (var i = 0; i < 8; i++) {
       this.gamepadAxisLimits[i] = [];
    }
    
    var button, button_i, modality, modality_i;
    for (button_i in this.buttonDefinitions) {
        button = this.buttonDefinitions[button_i];
        for (modality_i in button["modalities"]) {
            modality = button["modalities"][modality_i];  
            
            // keyboard event; add to keyboardMapping
            if (modality["type"] === "keyup" || modality["type"] === "keydown") {
               this.keyboardMapping[modality["type"]][modality["id"]] = button["label"];
            // gamepad event
            } else if (modality["type"] === "gamepadaxis") {
               this.gamepadAxisLimits[modality["index"]].push({
                  "min" : modality["min"],
                  "max" : modality["max"],
                  "label" : button["label"]
               });
            // pointer event; attach event handler               
            } else {
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
 * @param {Function}  callbackEvent     Function called upon each response event (a more finegrained way of processing responses without deactivating ResponseManager
 */
jasmin.ResponseManager.prototype.activate = function(
   buttonsActive,    
   callbackResponse,
   callbackEvent
) {
   this.buttonsActive    = buttonsActive;
   this.callbackResponse = callbackResponse;
   this.active           = true;
   this.callbackEvent    = callbackEvent;
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

   // Check on callbackEvent
   if (this.callbackEvent !== undefined) {
      this.callbackEvent(event, modality, id, label, time, x, y);
   }

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