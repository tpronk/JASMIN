// Log a set of dom events, call an update callback on critical events
// question - Question asked to participant
// restrict - Restriction on answer
function ItemTracker()
{
}

ItemTracker.prototype.track = function( object, events, callback, itemData, params )
{
    // Attach event handlers
    var event, critical;
    for( event in events )
    {
        critical = events[event];
        
        //alert( critical );
        object.bind(
            event,
            {
                self:     this,
                type:     event,
                critical: critical,
                callback: callback,
                itemData: itemData,
                params:   params
            },
            function( thisEvent )
            {
                thisEvent.data.self.trackCallback( 
                    thisEvent.data.type,
                    thisEvent.data.critical,
                    thisEvent.data.callback,
                    thisEvent.data.itemData,
                    thisEvent.data.params
                );
            }
        )
    }
}    

// Log an item event. Run callback if critical
ItemTracker.prototype.trackCallback = function(
    eventType,
    critical,
    callback,
    itemData,
    params
)
{
    // Log
    itemData.logger.log(
        itemData.source,
        eventType,
        itemData.id,
        params()
    );   
        
    itemData.report(
        "ItemTracker.trackCallback",
        "type: " + eventType + ", itemId: " + itemData.id + ", params: " + JSON.stringify( params() )
    );        
        
    // Critical? Call callback
    if( critical )
    {
        callback( params() );
    }
}