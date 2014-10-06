/* 
 * Survey Constructor
 * @param   id              Uniquely identifies item, used as name in log
 * @param   source          Source of events for logger (usually name of Survey)
 * @param   answer          Current answer on item
 * @param   callback        Function called if item state changes
 * @param   report          Function called for internal reporting
 */
function ItemData( id, source, answer, width, callback, logger, translator, report )
{
    this.id          = id;
    this.source      = source;
    this.answer      = answer;
    this.width       = width;
    this.callback    = callback;
    this.logger      = logger;
    this.translator  = translator;
    this.report      = report;    

    // Id prefixed with "item_", to use as DOM identifier/
    this.domId       = "item_" + this.id;

    // Item is not higlighted by default
    this.highlightOn = false;
}


