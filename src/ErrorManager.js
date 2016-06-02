//Copyright 2015, Thomas Pronk
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
 * ErrorManager handles errors
 * @requires jQuery
 * @constructor
 * @param {function} callback called on an error handled by this errorManager instance. Callback called with a single argument that contains error information such as errormessage, line, column etc.
 * @param {int} maxErrorCount maximum number of errors to call callback for. Default: 10
 */
jasmin.ErrorManager = function( callback, maxErrorCount ) {
    this.callback      = callback;
    this.maxErrorCount = maxErrorCount === undefined? 10: maxErrorCount;
    
    // Number of errors captured so far
    this.errorCount = 0;
};

/**
 * Returns a function that you can attach to window.onerror. The function parses 
 * an error event into an associative array.
 * @private
 * @returns {Function} window.onerror callback
 */
jasmin.ErrorManager.prototype.callbackWindowError = function() {
    var self = this;
    return function( msg, url, line, col, error ) {
        // If error is not an object, redefine it as object
        if( !( error instanceof Object ) ) {
            error = {};
        }
        // Make package, pass on to onError
        var errorPackage = {
            "from"     : "window.onerror",
            "msg"      : msg,
            "url"      : url,
            "line"     : line,
            "col"      : col,
            "stack"    : error.stack
        };
        self.onError( errorPackage ); 
    };
};

/**
 * Calls callback on error, passing on an errorPackage. It does to at most 
 * maxErrorCount times
 * @private
 * @param errorPackage Object with error information (as provided by callbackWindowError or callbackFail)
 */
jasmin.ErrorManager.prototype.onError = function( errorPackage ) {
    if( this.errorCount < this.maxErrorCount ) {
        this.errorCount++;
        this.callback( errorPackage );
    }
};

/**
 * Returns a function that you can use as a simple fail callback. The function
 * takes a single argument, which is passed on to the callback provided to the Errormanager constructor
 * @public
 * @returns {Function} fail callback
 */
jasmin.ErrorManager.prototype.callbackFail = function() {
    var self = this;
    return function( msg ) {
        // Make package, pass on to onError
        var errorPackage = {
            "from"     : "fail",
            "msg"      : msg
        };
        self.onError( errorPackage ); 
    };
};

/**
 * Takes an error callback, returns a function that sends the errorPackage
 * to the LOTUS JasminHandler via an AJAX request. Note that it's a static function.
 * Private for being a specialized function (as yet)
 * @private
 * @param {string} url    to make request to
 * @param {int}    runId  to idenify current run
 * @returns {Function} onerror callback, takes one argument, being the errorPackage
 */
jasmin.ErrorManager.errorToJasminHandler = function( url, runId ) {
    return function( errorPackage ) {
        // For LOTUS JasminHandler
        var lotusRequests = [ {
            "runId"     : runId,
            "requestId" : "error",
            "request"   : {
                "namespace" : "error",
                "info"      : errorPackage
            }
        } ];
        console.log( JSON.stringify( lotusRequests ) );
        // For jQuery ajax
        var ajaxArgs = {
            "url"      : url,
            "dataType" : "json",
            "type"     : "POST",
            "data"     : "data=" + encodeURI( JSON.stringify( lotusRequests ) )
        };
        $.ajax( ajaxArgs );
    };
};




