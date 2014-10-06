/* 
 * SurveyNavigation - Creates tabs to navigate to sections of a survey, as well as next/previous buttons
 * @param   tabSpecs        Specs of navigation tabs
 * @param   getState        Callback to state logger (see Logger)
 * @param   getState        Callback to state logger (see Logger), called with arguments dirty and state
 */
function SurveyNavigation( 
    tabSpecs,
    getState,
    setState
)
{
    // Copy properties
    this.tabSpecs   = tabSpecs;
    this.getState   = getState;
    this.setState   = setState;
    
    // Initialize state if none
    this.state  = this.getState();

    if( !( this.state instanceof Object ) )
    {
        this.state = {
            "currentTab"   : 0,
            "currentPage"  : 0,
            "furthestTab"  : 0,
            "furthestPage" : 0,
            "tabs"         : {}
        };
    }
}

// Draw navigation menu
SurveyNavigation.prototype.drawNavigation = function( callback )
{
    var menu = $( "<div>" ).attr( "class", "PageNavigationBar" );
    
    // Store current tab for curvy hack
    var tabOuter, tabInner, anchor, name;
    this.currentTabVisible = false;
    for( var tabIndex in this.tabSpecs )
    {
        // Get tabSpecs with state
        var tabSpecs = this.tabSpecsWithState( tabIndex );
        
        // outer and inner div for menu item
        tabInner = $( "<div>" ).attr( "class", "Inner");
        tabOuter = $( "<div>" ).append( tabInner );
        menu.append( tabOuter );    
        
        // Translate name
        name =  translator.substitute( tabSpecs[ "name" ] );
        
        // Setup anchor and div (according to current or not current)
        if( tabIndex == this.state[ "currentTab" ] )
        {
            // Current tab
            tabOuter.attr( "class", "Current");
            tabOuter.attr( "id", "currentTab");  // id for curvy
            this.currentTabVisible = true;
            tabInner.text( name );
        }
        else
        {
            // Other tab; check if tab has been done already
            if( tabIndex <= this.state[ "furthestTab" ] )
            {
                // Already done; make Visitable
                tabOuter.attr( "class", "Visitable" );
                anchor = this.makeGotoLink( 
                    callback,
                    { 
                        "action" : "tab", 
                        "id"     : tabIndex
                    }
                );
                anchor.text( name );
                tabInner.append( anchor  );
            }
            else
            {
                // Not yet done; make NotVisitable
                tabOuter.attr( "class", "NotVisitable" );
                tabInner.text( name );
            }
        }
    }
    
    // Break
    menu.append( $( "<div>" ).attr( "class", "Clear" ) );
    
    return menu;
}

// Draw Previous and Next Buttons
SurveyNavigation.prototype.drawPrevNext = function( callback )
{
    var anchor;
    
    var prev    = $( "<div>" ).attr( "class", "Previous" );
    
    // Draw "previous page" of we're not at the first page
    if( !( this.state[ "currentTab" ] == 0 && this.state[ "currentPage" ] == 0 ) )
    {
        // Draw link
        anchor = this.makeGotoLink( 
            callback,
            {             
                "action" : "previous"
            } 
        );        
        anchor.text( translator.substitute( "◄ #[previous_page]" ) );        
    }
    else
    {
        // Draw 'Inactive'
        anchor = $( "<div>" ).attr( "class", "Inactive" ).text( 
            translator.substitute( "◄ #[previous_page]" )
        );
    }
    prev.append( anchor );
        
    var spacer  = $( "<div>" ).attr( "class", "Spacer" );
    spacer.text( " " );
    
    var next    = $( "<div>" ).attr( "class", "Next" );
        
    // Draw "next page" is we're not at the last page
    var tab = this.tabSpecsWithState( this.state[ "currentTab" ] );
    if( !( this.state[ "currentTab" ] == this.tabSpecs.length - 1 && this.state[ "currentPage" ] == ( tab[ "pages" ].length - 1 ) ) )
    {
        anchor = this.makeGotoLink( 
            callback,
            {             
                "action" : "next"
            } 
        );             
        anchor.text( translator.substitute( "#[next_page] ►" ) );
    }        
    else
    {
        // Draw 'Inactive'
        anchor = $( "<div>" ).attr( "class", "Inactive" ).text( 
            translator.substitute( "#[next_page] ►" )
        );        
    }
    
    next.append( anchor );    
    
    var prevNext = $( "<div>" ).attr( "class", "PrevNext" );
    prevNext.append( prev   );
    prevNext.append( spacer );
    prevNext.append( next   );
    
    return prevNext;
}


// Round corners
SurveyNavigation.prototype.roundCorners = function()
{
    // *** Curvy corners for inner page
    // Top left should be round if we are not at the first page
    var tlRadius = this.state[ "currentTab" ] == 0? 0: 16;

    // Curvy corners for inner page
    var settings = {
    tl: {radius: tlRadius},
    tr: {radius: 16},
    bl: {radius: 16},
    br: {radius: 16},
    antiAlias: true
    }
    curvyCorners( settings, "#PageInner" );

    // *** Curvy corners for current page link 
    if( this.currentTabVisible )
    {
        // auto-width hack
        var currentWidth = $( "#currentTab" ).width();
        $( "#currentTab" ).css( "width", currentWidth + 1 );

        var curvySettings = {
            tl: {radius: 8},
            tr: {radius: 8},
            bl: {radius: 0},
            br: {radius: 0},
            antiAlias: true
        };
        curvyCorners( curvySettings, "#currentTab" );
    }
}

// *********
// *** Go to

// Goto page callback
SurveyNavigation.prototype.goTo = function( params )
{
    var currentTab = this.tabSpecsWithState( this.state[ "currentTab" ] );
    var switchedTab = false;
    // Resolve action
    switch(  params[ "action" ] )
    {
        // Goto next page        
        case "next":
            // Check if there are more pages on this tab
            if( this.state[ "currentPage" ] < this.arrayLength( currentTab[ "pages" ] ) - 1 )
            {
                // more pages on tab; go to next page
                this.state[ "currentPage" ]++;
            }
            else
            {
                // no more pages on tab; go to next tab
                this.state[ "currentTab" ]++;
                this.state[ "currentPage" ] = 0;
                switchedTab = true;
            }

            // *** Update furthest if necessary

            if( this.state[ "currentTab" ] > this.state[ "furthestTab" ] )
            {
                // Update furthest Tab
                this.state[ "furthestTab"  ] = this.state[ "currentTab"  ];
                this.state[ "furthestPage" ] = this.state[ "currentPage" ];
            }
            else if( this.state[ "currentPage" ] > this.state[ "furthestPage" ] )
            {
                // ... or only update page in tab
                this.state[ "furthestPage" ] = this.state[ "currentPage" ];
            }
            break
        
        // Goto previous page
        case "previous":
            // Check if there are more pages on this tab
            if( this.state[ "currentPage" ] > 0 )
            {
                // more pages on tab; go to previous page
                this.state[ "currentPage" ]--;

            }
            else
            {
                // no more pages on tab; go to previous tab
                this.state[ "currentTab" ]--;
                switchedTab = true;
                // Calculate page count previous tab and go there
                var prevTab       = this.tabSpecsWithState( this.state[ "currentTab" ] );
                var prevTabLength = this.arrayLength( prevTab[ "pages" ] );
                this.state[ "currentPage" ] = prevTabLength - 1;
            }
            break;
            
        // Goto tab
        case "tab":
            switchedTab = true;
            var tabId = params[ "id" ];
            this.state[ "currentTab" ] = tabId;
            // Check if this is the furthest tab
            if( tabId == this.state[ "furthestTab" ] )
            {
                // Furthest tab; goto furthest page
                this.state[ "currentPage" ] = this.state[ "furthestPage" ];
            }
            else
            {
                // Other tab; goto first page
                this.state[ "currentPage" ] = 0;
            }
            break;

        // Goto page
        case "page":
            this.state[ "currentPage" ] = params[ "id" ];
            break;
    }
    
    // Update navigation state
    this.setState( this.state, true );
    
    // Return if we switched tabs
    return switchedTab;
}

// Only accept incomplete answers if we are not at the furtherst page
SurveyNavigation.prototype.requireComplete = function ( params )
{
    // Require complete if we are not on the furthest page, or 
    // if we are one the furthest page going to the next
    if(    this.state[ "currentTab"  ] == this.state[ "furthestTab"  ]
        && this.state[ "currentPage" ] == this.state[ "furthestPage" ]
    )
    {
        if( params[ "action" ] == "next" )
        {
            return true;
        }
        return false;
    }
    return true;
}

// Make a goto page hyperlink
SurveyNavigation.prototype.makeGotoLink = function( callback, params )
{
    var anchor = $( "<a>" );    
    anchor.attr( "href", "javascript:;" );
    anchor.bind( 
        "vmouseup", 
        {params: params, callback: callback}, 
        function( event )
        {                
            event.data.callback( event.data.params );
            return false;
        }
    );
    return anchor;
}

// Get current page
SurveyNavigation.prototype.getCurrentPage = function()
{
    var currentTab  = this.tabSpecsWithState( this.state[ "currentTab" ] );
    var currentPage = currentTab        
        [ "pages" ]
        [ this.state[ "currentPage" ] ];

    return currentPage;
}

// Merge tabSpecs with state
SurveyNavigation.prototype.tabSpecsWithState = function( tabIndex )
{
    // No state? Return specs
    if( this.state[ "tabs" ][ tabIndex ] === undefined )
    {
        return this.tabSpecs[ tabIndex ];
    }
    
    // Else, merge specs with state
    return $.extend( 
         {},
         this.tabSpecs[ tabIndex ],
         this.state[ "tabs" ][ tabIndex ]
    );
}

SurveyNavigation.prototype.arrayLength = function( array )
{
    var count = 0;
    for( var i in array )
        count++;
    return count;
}

SurveyNavigation.prototype.currentPageId = function()
{
    var tabSpecs = this.tabSpecsWithState( this.state[ "currentTab" ] );
    return tabSpecs[ "pages" ][ this.state[ "currentPage" ] ];
}


SurveyNavigation.prototype.currentTabId = function()
{
    return this.tabSpecs[ this.state[ "currentTab" ] ][ "id" ];
}

SurveyNavigation.prototype.tabIndexById = function( tab )
{
    for( var i in this.tabSpecs )
    {
        if( this.tabSpecs[i][ "id" ] == tab )
        {
            return i;
        }
    }
    
    return undefined;
}

