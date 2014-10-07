/**
 * Polyfill for performance.now(), falls back on (get Date()).getTime()
 * @private
 */
if( window.performance === undefined ) {
    window.performance = new Object();
    window.performance.now = function() {
        return ( new Date() ).getTime();
    }
}