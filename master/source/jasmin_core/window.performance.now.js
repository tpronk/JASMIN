/**
 * Polyfill for performance.now(), falls back on (get Date()).getTime()
 * @private
 */

if( window.performance === undefined ) {
    window.performance = new Object();
};

// Fix for Android 4.3 browser
if( window.performance.now === undefined ) {
    window.performance.now = function() {
        return ( new Date() ).getTime();
    };
}