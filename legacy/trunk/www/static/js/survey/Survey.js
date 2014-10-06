/* 
 * Survey Constructor
 * @param   surveySpecs     Specs of the Survey, array with keys for: "general", "items", and "pages"
 * @param   navigation      A SurveyNavigation (should implement navigation)
 * @param   getState        Callback to state logger (see Logger)
 * @param   getState        Callback to state logger (see Logger), called with arguments dirty and state
 * @param   targetDiv       HTML Node to append survey to
 * @param   engine          A function called upon certain survey events, see documentation
 * $param   unanswered      A function called to notify that items are unanswered
 * $param   report          A function called with internal reports about the survey
 */
function Survey( 
    surveySpecs, 
    navigation,
    getState,
    setState,
    targetDiv,
    engine,
    unanswered,
    logger,
    translator,
    popup,
    report,
    callback
)
{
    // Copy properties
    this.surveySpecs  = surveySpecs;
    this.navigation   = navigation;
    this.getState     = getState;
    this.setState     = setState;
    this.targetDiv    = targetDiv;
    this.engine       = engine;
    this.unanswered   = unanswered;
    this.logger       = logger;
    this.translator   = translator;
    this.popup        = popup;
    this.report       = report;
    this.callback     = callback;
    
    //Initialize state if none
    this.state = this.getState();
    if( !this.state )
    {
        this.state = {
            "items"     : {},
            "pages"     : {}
        };
    }
}

/* 
 * Draw the current page with navigation
 */
Survey.prototype.draw = function( fadeInPage )
{
    fadeInPage = fadeInPage === undefined? true: fadeInPage;
    
    // Empty target
    var oldHeight = $( "#PageInner" ).height();
    $( "#" + this.targetDiv ).empty();
    
    var currentPageIndex = this.navigation.getCurrentPage();

    // Setup page class and style
    var page = this.pageSpecsWithState( currentPageIndex );
    
    if( page === undefined )
    {
        report( "Error", "Survey.draw Undefined page " + currentPageIndex );
    }
    
    var output = $( "<div>" ).attr( "class", page[ "class" ] );
    output.attr( "id", "Page" );

    // *** Draw navigation
    if( page[ "navigation" ] )
    {
        var navigation = this.navigation.drawNavigation( this.goToCallback() );
        output.append( navigation );
    }
    
    // *** Page and prev/next in separate div (for rounded corners)
    var pageInner   = $( "<div>" ).attr( {
        "id"    : "PageInner" ,
        "class" : "PageInnerClass"
    } );
    
    // Curvy top-left corner if not first tab
    if( page[ "navigation" ] && this.navigation.state[ "currentTab" ] > 0 )
    {
        pageInner.css( {
            "border-top-left-radius" : "8px"
        } );
    }    

    var pagePadding = $( "<div>" ).attr( "class", "PagePadding" );
    pageInner.append( pagePadding );
    pagePadding = this.drawPage( page, pagePadding );
    
    if( page[ "prevNext" ] )
    {
        var prevNext = this.navigation.drawPrevNext( this.goToCallback() );
        pagePadding.append( prevNext );
        pagePadding.append( $( "<div>" ).attr( "class", "Clear" ) );        
    }
    output.append( pageInner );

    // Add to target
    $( "#" + this.targetDiv ).append( output );
    
    // Start custom items
    for( var i in this.starters )
    {
        this.starters[i]();
    }
    
    // Call engine with page drawn event                ;
    this.engine( { "action" : "drawn" } );  

    // Round corners
    if( page[ "rounded" ] )
    {
        //this.navigation.roundCorners();
    }
    
    // Log event
    this.logger.log(
        this.surveySpecs[ "general" ][ "source" ],
        "page",
        "drawn",
        { "tab" : this.navigation.currentTabId(), "page" : this.navigation.currentPageId() }
    );        

    // Draw page immediately if not standard
    if( page[ "class" ] != "PageDefault" )
    {
        $( ".PagePadding" ).css( { opacity: 0 } );
        $( ".PagePadding" ).fadeTo( 1000, 1 );
        return;
    }
    
    // Fade in or animate
    if( fadeInPage )
    {
        $( "#Page" ).css( { opacity: 0 } );
        $( ".PagePadding" ).css( { opacity: 0 } );
        $( "#Page" ).fadeTo( 1000, 1, function() 
        {
            $( ".PagePadding" ).css( { opacity: 0 } );
            $( ".PagePadding" ).fadeTo( 1000, 1 )
        } );
    } else {
        var newHeight = $( "#PageInner" ).height();
        $( ".PagePadding" ).css( { opacity: 0 } );
        //alert( oldHeight );
        $( "#PageInner" ).css( "height", oldHeight );
        $( "#PageInner" ).animate( 
            { 
                "height" : newHeight,
                "border-bottom-left-radius" : "8px",
                "border-bottom-right-radius" : "8px"
            }, 
            1000, 
            function() 
            {
                $( "#PageInner" ).css( "height", newHeight );
                $( ".PagePadding" ).css( { opacity: 0 } );
                $( ".PagePadding" ).fadeTo( 1000, 1 );
            } 
        );
    }
}

/* 
 * Draw the items of this page
 */
Survey.prototype.drawPage = function( page, output )
{
    this.items   = {};    // Items on current page
    this.starters = [];   // Start functions for custom items (called just after page is drawn)
    var itemId;
    var item;
    var itemData;
    var itemType;
    var state;
    var itemDom;
    
    // *** Draw items
    var self = this;
    var itemCounter = 0;
    var itemSpacing = undefined;
    for( var key in page[ "items" ] )
    {
        // itemId - unique item identifier
        itemId = page[ "items" ][ key ];
     
        // item - specs for this item
        item   = this.surveySpecs[ "items" ][ itemId ];
        
        // Get answer( if any)
        state = null;
        if( this.state[ "items" ][ itemId ] !== undefined )
        {
            state = this.state[ "items" ][ itemId ];
        }
                    
        // Create item
        itemData = new ItemData( 
            itemId,                                     // id
            this.surveySpecs[ "general" ][ "source" ],  // source
            state,                                      // state
            surveySpecs[ "general" ][ "width" ],
            // callback - function called if item state changes
            function( itemId, newState ) { self.updateState( itemId, newState ) },
            this.logger,
            this.translator,
            this.report        // reporting
        );
            
        // Report undefined item
        if( item === undefined )
        {
            report( "Error", "Survey.drawPage Undefined item " + itemId );
        }
        
        // Create view
        itemType = null;
        switch( item[ "type" ] )
        {
            case "custom":
                itemType = item[ "specs" ][ "object" ];
                itemType.construct( itemData );
                if( itemType.start !== undefined )
                {
                    this.starters.push( function() { itemType.start() } );
                }
                break;               
            case "paragraph":
                itemType = new ItemTypeParagraph(
                    itemData,
                    item[ "specs" ]
                );
                break;            
            case "open":
                itemType = new ItemTypeOpen(
                    itemData,
                    item[ "specs" ]
                );
                break;
            case "likert":
                itemType = new ItemTypeLikert(
                    itemData,
                    item[ "specs" ]
                );
                break;
            case "flash":
                itemType = new ItemTypeFlash(
                    itemData,
                    item[ "specs" ]
                );
                break;
            case "dropdown":
                itemType = new ItemTypeDropdown(
                    itemData,
                    item[ "specs" ]
                );
                break;      
            case "date":
                itemType = new ItemTypeDate(
                    itemData,
                    item[ "specs" ]
                );
                break;            
            case "vertical":
                itemType = new ItemTypeVertical(
                    itemData,
                    item[ "specs" ]
                );
                break;                   
        }
        
        // Item has been created?
        if( itemType !== null )
        {
            // Add to item set
            this.items[ itemId ] = itemType;
        
            // Draw item
            itemDom = itemType.draw();
            
            // A bit of top margin if not first (and specified)
            itemSpacing = page[ "itemspacing" ] === undefined? this.surveySpecs[ "general" ][ "itemspacing" ]: page[ "itemspacing" ];
            if( itemCounter > 0 && itemSpacing !== undefined )
            {
                
                itemDom.css( "margin-top", itemSpacing );
            }
            
            output.append( itemDom );
        }
        else
        {
            // Report error
            this.report(
                "Survey.drawPage error",
                "Unrecognized item type: " + item[ "type" ]
            );            
        }
        
        itemCounter++;
    }

    return output;
}



// Check answerd
Survey.prototype.checkAnswered = function( target )
{
    // *** Check if everything is answered
    
    // If all are answered, call engine and draw next page
    if( this.allAnswered() )
    {
        return true;
    }
    
    // Not all answered? 
    // Show message
    this.unanswered();
    
    // Enable highlight
    for( var i in this.items )
    {
        this.items[i].itemData.highlightOn = true;
        this.items[i].highlight();
    }
    
    return false;
}

// Check if all items are answered
Survey.prototype.allAnswered = function()
{
    for( var i in this.items )
    {
        this.report( 
            "Survey.allAnswered",
            "Checking: " + this.items[i].itemData.id
        );
        
        if( !this.items[i].isAnswered() )
        {
            return false;
        }
    }    
    return true;
}

// Update state
Survey.prototype.updateState = function( itemId, value )
{
    this.state[ "items" ][ itemId ] = value;
    
    // Update state
    this.setState( this.state, true );
    
    // Call callback
    this.callback( itemId, value );
}

// Merge specs with state
Survey.prototype.pageSpecsWithState = function( pageIndex )
{ 
    // No state? Return specs
    if( this.state[ "pages" ][ pageIndex ] === undefined )
    {
        return this.surveySpecs[ "pages" ][ pageIndex ];
    }
    
    // Else, merge specs with state
    return $.extend( 
         {},
         this.surveySpecs[ "pages" ][ pageIndex ],
         this.state[ "pages" ][ pageIndex ]
    );
};

// ***********
// *** Goto links

// If page complete, check 
Survey.prototype.goTo = function( params )
{
    var allow = !this.navigation.requireComplete( params ) || this.checkAnswered();
    
    // Log goto event
    params[ "allow" ] = allow;
    this.logger.log(
        this.surveySpecs[ "general" ][ "source" ],
        "page",
        "goto",
        params
    );        

    // Check survey incompleteness if required
    if( allow )
    {
        // Survey complete or not required to be, so continue
        // Run engine, might change params
        var params = this.engine( params );
        // Start fadeOut animation
        var self = this;
        $( ".PagePadding" ).fadeOut(
            400,
            function()
            {
                $( ".PagePadding" ).css( {
                    "display"    : "block",
                    "visibility" : "hidden"
                } );
                // If switched tab, fade Page
                if( !self.navigation.goTo( params ) )
                {   
                    self.draw( false );
                } else {
                    $( "#Page" ).fadeOut(
                        400,                    
                        function() {
                            self.draw( true );
                        } 
                    );
                }                        
            }
        );
    }
    else
    {
        // Hack to prevent beforeunload message in IE
        var leaveMessage = this.popup.leaveMessage;
        this.popup.leaveMessage = undefined;
        setTimeout(
            function() { this.popup.leaveMessage = leaveMessage; },
            300
        );
    }
    
    return false;
}

Survey.prototype.goToCallback = function( params )
{
    var self = this;
    return function( params ) { return self.goTo( params ) }
}

