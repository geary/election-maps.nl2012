// results-map.js
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

var times = {
	gadgetLoaded: now()
};

// Default params
params.sidebar = ( params.sidebar !== 'false' );
params.source = ( params.source == 'gop' ? 'gop' : 'ap' );
if( location.host.split('.')[0] == 'nv2012' ) params.source = 'gop';
var $body = $('body');
$body.addClass( 'source-' + params.source );

// Hide Google Elections logo in IE <= 7
if( $.browser.msie ) {
	if( +$.browser.version.split('.')[0] <= 7 )
		$body.addClass( 'ie7' );
}

opt.randomized = params.randomize || params.zero;

var strings = {
	viewUSA: 'View USA',
	titleViewUSA: 'View entire USA',
	allCandidates: 'All Candidates',
	allCandidatesShort: 'All',
	percentReporting: '{{percent}} reporting ({{counted}}/{{total}}{{kind}})',
	noVotesHere: 'This location does not report voting results',
	randomized: 'Displaying random test data',
	automaticUpdate: 'This page updates automatically',
	cycle: 'Cycle Candidates',
	cycleTip: 'Cycle through the candidate maps automatically',
	cycleStopTip: 'Stop cycling through the candidate maps',
	//countdownHeading: 'Live results in:',
	//countdownHours: '{{hours}} hours',
	//countdownHour: '1 hour',
	//countdownMinutes: '{{minutes}} minutes',
	//countdownMinute: '1 minute',
	noVotes: 'Waiting for results&hellip;'
};

var year = params.year in elections ? +params.year : 2012;
var parties = elections[year];
var party = params.party in parties ? params.party : 'gop';
var election = parties[party];
var currentCandidate;

states.index('abbr').index('electionid').index('fips');

var defaultState = 'US';

function State( abbr ) {
	if( this == window ) return new State( abbr );
	if( abbr && abbr.bbox && abbr.id ) abbr = abbr.id.split('US')[1].slice(0,2);
	abbr = ( abbr || params.state || defaultState ).toUpperCase();
	var state =
		states.by.fips[abbr] ||
		states.by.abbr[abbr] ||
		states.by.electionid[abbr];
	$.extend( this, state );
	this.electionTitle = S( this.name, ' ', this.type || 'Primary' );
	return this;
}

$.extend( State.prototype, {
});

var state = State(), stateUS = State('00');

// Analytics
var _gaq = _gaq || [];
_gaq.push([ '_setAccount', 'UA-27854559-1' ]);
//_gaq.push([ '_setDomainName', '.election-maps.appspot.com' ]);
_gaq.push([ '_trackPageview' ]);

//function resultsFields() {
//	return S(
//		election.candidates.map( function( candidate ) {
//			return S( "'TabCount-", candidate.id, "'" );
//		}).join( ',' ),
//		',ID,TabTotal',
//		',NumBallotBoxes,NumCountedBallotBoxes'
//	);
//}

document.write(
	'<style type="text/css">',
		'html, body { margin:0; padding:0; border:0 none; }',
	'</style>'
);

var gm, gme;

var $window = $(window), ww = $window.width(), wh = $window.height();

var data = {
	state: { geo:null, results:null },
	county: { geo:null, results:null },
	town: { geo:null, results:null }
};

var $map, mapPixBounds;

var debug = params.debug;
opt.state = params.state;
opt.counties = !! opt.state;
opt.candidate = '1';
//opt.zoom = opt.zoom || 3;
opt.fontsize = '15px';
var sidebarWidth = params.play ? 340 : 280;

opt.resultCacheTime = 30 * 1000;
opt.reloadTime = 60 * 1000;

// Non-auto-refresh settings to use after results are final
//opt.resultCacheTime = Infinity;  // cache forever
//opt.reloadTime = false;  // no auto-reload

var zoom;

String.prototype.T = function( args ) {
	return ( /*prefs.getMsg(this) ||*/ strings[this] || '' ).replace( /\{\{(\w+)\}\}/g,
		function( match, name ) {
			var value = args[name];
			return value != null ? value : match;
		});
}

election.candidates.index('id');

function cacheUrl( url ) {
	return opt.nocache ? S( url, '?q=', times.gadgetLoaded ) : url;
}

function imgUrl( name ) {
	return cacheUrl( 'images/' + name );
}

document.body.scroll = 'no';

document.write(
	'<style type="text/css">',
		'html, body { width:', ww, 'px; height:', wh, 'px; margin:0; padding:0; overflow:hidden; color:#222; background-color:white; }',
		'* { font-family: Arial,sans-serif; font-size: ', opt.fontsize, '; }',
		'a.button { display:inline-block; cursor:default; background-color:whiteSmoke; background-image:linear-gradient(top,#F5F5F5,#F1F1F1); border:1px solid #DCDCDC; border:1px solid rgba(0,0,0,0.1); border-radius:2px; box-shadow:none; color:#444; font-weight:bold; font-size:11px; height:27px; line-height:27px; padding:0 8px; }',
		'a.button.hover { background-color: #F6F6F6; background-image:linear-gradient(top,#F8F8F8,#F1F1F1); border:1px solid #C6C6C6; box-shadow:0px 1px 1px rgba(0,0,0,0.1); color:#222; }',
		'a.button.selected { background-color: #EEE; background-image:linear-gradient(top,#EEE,#E0E0E0); border:1px solid #CCC; box-shadow:inset 0px 1px 2px rgba(0,0,0,0.1); color:#333; }',
		'#outer {}',
		'.barvote { font-weight:bold; color:white; }',
		'h2 { font-size:11pt; margin:0; padding:0; }',
		'div.sidebar-header { padding:8px; }',
		'div.title-text { font-size:16px; }',
		'div.body-text, div.body-text label { font-size:13px; }',
		'div.faint-text { font-size:11px; color:#777; }',
		'.content table { xwidth:100%; }',
		'.content .contentboxtd { width:7%; }',
		'.content .contentnametd { xfont-size:24px; xwidth:18%; }',
		'.content .contentbox { height:24px; width:24px; xfloat:left; margin-right:4px; }',
		'.content .contentname { xfont-size:12pt; white-space:pre; }',
		'.content .contentvotestd { text-align:right; width:5em; }',
		'.content .contentpercenttd { text-align:right; width:2em; }',
		'.content .contentvotes, .content .contentpercent { xfont-size:', opt.fontsize, '; margin-right:4px; }',
		'.content .contentclear { clear:left; }',
		'.content .contentreporting { margin-bottom:8px; }',
		'.content .contentreporting * { xfont-size:20px; }',
		'.content {}',
		'div.scroller { overflow:scroll; overflow-x:hidden; }',
		'#maptip { position:absolute; z-index:10; border:1px solid #333; background:white; color:#222; white-space: nowrap; display:none; width:275px; }',
		'div.candidate-name { line-height:1em; }',
		'div.first-name { font-size:85%; }',
		'body.tv #election-title { font-size:24px; font-weight:bold; }',
		'body.tv #election-date { font-size:16px; color:#222; }',
		'body.tv #percent-reporting { font-size:20px; }',
		'body.tv #button-row, body.tv #auto-update { display:none; }',
		'body.tv div.candidate-name { margin-right:20px; }',
		'body.tv div.candidate-name div { line-height:1.1em; }',
		'body.tv div.first-name { font-size:20px; }',
		'body.tv div.last-name { font-size:24px; font-weight:bold; }',
		'body.tv td.candidate-percent { font-size:20px; font-weight:bold; }',
		'body.tv #maptip { border:none; }',
		'body.tv #map { border-left:1px solid #333; }',
		'body.tv span.tiptitletext { font-size:28px; }',
		'body.tv div.tipreporting { font-size:20px; }',
		'body.tv table.candidates td { padding:4px 0; }',
		'.tiptitlebar { padding:4px 8px; border-bottom:1px solid #AAA; }',
		'.tiptitletext { font-weight:bold; font-size:120%; }',
		'.tipcontent { padding:4px 8px 8px 8px; border-bottom:1px solid #AAA; }',
		'.tipreporting { font-size:80%; padding:2px 0; }',
		'#selectors { background-color:#D0E3F8; }',
		'#selectors, #selectors * { font-size:14px; }',
		'#selectors label { font-weight:bold; }',
		'#selectors, #legend { width:100%; border-bottom:1px solid #C2C2C2; }',
		'#legend { background-color:white; }',
		'body.tv #legend { margin-top:8px; }',
		'body.sidebar #legend { width:', sidebarWidth, 'px; }',
		'#sidebar table.candidates { width:100%; }',
		'table.candidates td { border-top:1px solid #E7E7E7; }',
		'#maptip table.candidates { width:100%; }',
		'#maptip table.candidates tr.first td { border-top:none; }',
		'#sidebar-scroll { padding:0 4px; }',
		'tr.legend-candidate td, tr.legend-filler td { border:1px solid white; }',
		'div.legend-candidate, div.legend-filler { font-size:13px; padding:4px; }',
		//'body.tv div.legend-candidate, body.tv div.legend-filler { font-size:22px; }',
		'body.web div.legend-candidate { color:#333; }',
		'body.tv div.legend-candidate, body.tv div.legend-filler { font-size:21px; font-weight:bold; }',
		'td.legend-filler { border-color:transparent; }',
		//'tr.legend-candidate td { width:20%; }',
		'tr.legend-candidate td { cursor:pointer; }',
		'tr.legend-candidate.hover td { background-color:#F5F5F5; border:1px solid #F5F5F5; border-top:1px solid #D9D9D9; border-bottom:1px solid #D9D9D9; }',
		'tr.legend-candidate.hover td.left { border-left:1px solid #D9D9D9; }',
		'tr.legend-candidate.hover td.right { border-right:1px solid #D9D9D9; }',
		'tr.legend-candidate.selected td { background-color:#E7E7E7; border:1px solid #E7E7E7; border-top:1px solid #CCCCCC; border-bottom:1px solid #CCCCCC; }',
		'tr.legend-candidate.selected td.left { border-left:1px solid #CCCCCC; }',
		'tr.legend-candidate.selected td.right { border-right:1px solid #CCCCCC; }',
		'span.legend-candidate-color { font-size:15px; }',
		'#sidebar span.legend-candidate-color { font-size:16px; }',
		'body.tv span.legend-candidate-color { font-size:18px; }',
		'#centerlabel, #centerlabel * { font-size:12px; xfont-weight:bold; }',
		'#spinner { z-index:999999; position:absolute; left:', Math.floor( ww/2 - 64 ), 'px; top:', Math.floor( wh/2 - 20 ), 'px; }',
		'#error { z-index:999999; position:absolute; left:4px; bottom:4px; border:1px solid #888; background-color:#FFCCCC; font-weight:bold; padding:6px; }',
		'a.logo { position:absolute; bottom:24px; width:48px; height:48px;}',
		'#gop-logo { right:64px; width:48px; background: url(', imgUrl('gop-nv-48.png'), ') no-repeat; }',
		'body.source-ap #gop-logo { display:none; }',
		'#ap-logo { right:64px; width:67px; background: url(', imgUrl('ap-logo-48x67.png'), ') no-repeat; }',
		'body.source-gop #ap-logo { display:none; }',
		'#google-logo { right:4px; background: url(', imgUrl('google-politics-48.png'), ') no-repeat; }',
		'#gop-logo { right:64px; width:48px; background: url(', imgUrl('gop-nv-48.png'), ') no-repeat; }',
		'body.hidelogo #gop-logo, body.hidelogo #ap-logo { right:4px; }',
		'body.hidelogo #google-logo { display:none; }',
		'body.ie7 #gop-logo, body.ie7 #ap-logo { right:4px; }',
		'body.ie7 #google-logo { display:none; }',
	'</style>'
);


var index = 0;
function option( value, name, selected, disabled ) {
	var html = optionHTML( value, name, selected, disabled );
	++index;
	return html;
}

function optionHTML( value, name, selected, disabled ) {
	var id = value ? 'id="option-' + value + '" ' : '';
	var style = disabled ? 'color:#AAA; font-style:italic; font-weight:bold;' : '';
	selected = selected ? 'selected="selected" ' : '';
	disabled = disabled ? 'disabled="disabled" ' : '';
	return S(
		'<option ', id, 'value="', value, '" style="', style, '" ', selected, disabled, '>',
			name,
		'</option>'
	);
}

function stateOption( state, selected ) {
	state.selectorIndex = index;
	return option( state.id, state.name, selected );
}

document.write(
	'<div id="outer">',
	'</div>',
	'<div id="maptip">',
	'</div>',
	'<a id="ap-logo" class="logo" target="_blank" href="http://www.youtube.com/apelections" title="Data from the Associated Press">',
	'</a>',
	'<a id="gop-logo" class="logo" target="_blank" href="http://www.nvgopcaucus.com/" title="Data from the Nevada GOP">',
	'</a>',
	'<a id="google-logo" class="logo" target="_blank" href="http://www.google.com/elections" title="Google Politics & Elections">',
	'</a>',
	'<div id="error" style="display:none;">',
	'</div>',
	'<div id="spinner">',
		'<img border="0" style="width:128px; height:128px;" src="', imgUrl('spinner-124.gif'), '" />',
	'</div>'
);

function contentTable() {
	return S(
		'<div>',
			//'<div id="selectors">',
			//	'<div style="margin:0; padding:6px;">',
			//		//'<label for="stateSelector">',
			//		//	'stateLabel'.T(),
			//		//'</label>',
			//		//'<select id="stateSelector">',
			//		//	option( '-1', 'nationwideLabel'.T() ),
			//		//	option( '', '', false, true ),
			//		//	sortArrayBy( data.state.geo.features, 'name' )
			//		//		.mapjoin( function( state ) {
			//		//			return stateOption(
			//		//				state,
			//		//				state.abbr == opt.state
			//		//			);
			//		//		}),
			//		//'</select>',
			//		//'&nbsp;&nbsp;&nbsp;',
			//		//'&nbsp;&nbsp;&nbsp;',
			//		//'<input type="checkbox" id="chkCounties">',
			//		//'<label for="chkCounties">', 'countiesCheckbox'.T(), '</label>',
			//	'</div>',
			//'</div>',
			'<div id="legend">',
				formatLegendTable( [] ),
			'</div>',
			'<div style="width:100%;">',
				'<div id="map" style="width:100%; height:100%;">',
				'</div>',
			'</div>',
		'</div>'
	);
}

function formatLegendTable( cells ) {
	function filler() {
		return S(
			'<td class="legend-filler">',
				'<div class="legend-filler">',
					'&nbsp;',
				'</div>',
			'</td>'
		);
	}
	function row( cells ) {
		return S(
			'<tr>',
				cells.length ? cells.join('') : filler(),
			'</tr>'
		);
	}
	return S(
		'<table cellpadding="0" cellspacing="0" style="width:100%; vertical-align:middle;">',
			row( cells.slice( 0, 5 ) ),
			row( cells.slice( 5 ) ),
		'</table>'
	);
}

(function( $ ) {
	
	// TODO: Refactor and use this exponential retry logic
	//function getJSON( type, path, file, cache, callback, retries ) {
	//	var stamp = now();
	//	if( ! opt.nocache ) stamp = Math.floor( stamp / cache / 1000 );
	//	if( retries ) stamp += '-' + retries;
	//	if( retries == 3 ) showError( type, file );
	//	_IG_FetchContent( path + file + '?' + stamp, function( json ) {
	//		// Q&D test for bad JSON
	//		if( json && json.charAt(0) == '{' ) {
	//			$('#error').hide();
	//			callback( eval( '(' + json + ')' ) );
	//		}
	//		else {
	//			reportError( type, file );
	//			retries = ( retries || 0 );
	//			var delay = Math.min( Math.pow( 2, retries ), 128 ) * 1000;
	//			setTimeout( function() {
	//				getJSON( type, path, file, cache, callback, retries + 1 );
	//			}, delay );
	//		}
	//	}, {
	//		refreshInterval: opt.nocache ? 1 : cache
	//	});
	//}
	
	var jsonRegion = {};
	function loadRegion() {
		var level = params.level || state.level || '00';
		var kind = ( opt.counties ? 'counties' : 'states' );
		if( kind == 'counties' ) level = '512';  // TEMP
		var fips = state.fips;
		var json = jsonRegion[fips];
		if( json ) {
			loadGeoJSON( json );
		}
		else {
			//var file = S( 'carto2010.', kind, '-', fips, '-goog_geom', level, '.jsonp' );
			var file = S( 'carto2010', '-', fips, '-goog_geom', level, '.jsonp' );
			getGeoJSON( 'shapes/json/' + file );
		}
	}
	
	function getScript( url ) {
		$.ajax({
			url: url,
			dataType: 'script',
			cache: true
		});
	}
	
	function getGeoJSON( url ) {
		clearInterval( reloadTimer );
		reloadTimer = null;
		$('#spinner').show();
		getScript( cacheUrl( url ) );
	}
	
	var didLoadGeoJSON;
	loadGeoJSON = function( json ) {
		function oneTime() {
			if( ! didLoadGeoJSON ) {
				didLoadGeoJSON = true;
				$('#outer').html( contentTable() );
				initSelectors();
				$map = $('#map');
			}
		}
		var fips = json.county ? json.county.id : json.state.id;
		jsonRegion[fips] = json;
		function set( kind ) {
			var geo = json[kind];
			if( ! geo ) return;
			geo.features.index('id').index('abbr');
			data[kind].geo = geo;
		}
		set( 'state' );
		set( 'county' );
		set( 'town' );
		oneTime();
		//setCounties( true );
		geoReady();
		getResults();
		//analytics( 'data', 'counties' );
	};
	
	function setPlayback() {
		var play = getPlaybackParams();
		if( ! play ) return;
		play.player.setup();
		setInterval( play.player.tick, play.time );
	}
	
	function getPlaybackParams() {
		var play = params.play;
		if( ! play ) return false;
		play = play.split( ',' );
		var time = Math.max( play[1] || 5000, 1000 );
		var type = play[0];
		var player = players[type];
		if( ! player ) return false;
		return {
			player: player,
			type: type,
			time: time
		};
	}
	
	function playType() {
		var play = getPlaybackParams();
		return play && play.type;
	}
	
	function playCandidates() {
		return playType() == 'candidates';
	}
	
	function playCounties() {
		return playType() == 'counties';
	}
	
	function autoplay() {
		return !! playType();
	}
	
	function interactive() {
		return ! autoplay();
	}
	
	function tv() {
		return autoplay();
	}
	
	function web() {
		return ! tv();
	}
	
	var players = {
		candidates: {
			setup: function() {
			},
			tick: function() {
				var topCandidates = topCandidatesByVote(
					totalResults( currentResults() )
				);
				if( ! currentCandidate ) {
					i = 0;
				}
				else {
					for( var i = 0;  i < topCandidates.length;  ++i ) {
						if( topCandidates[i].id == currentCandidate ) {
							++i;
							if( i >= topCandidates.length )
								i = -1;
							break;
						}
					}
				}
				currentCandidate = ( i >= 0  &&  topCandidates[i].id );
				setCandidate( currentCandidate );
			}
		},
		counties: {
			setup: function() {
				var features = data.county.geo.features;
				//features.playOrder = sortArrayBy( features, function( feature ) {
				//	return(
				//		-feature.centroid[1] * 1000000000 + feature.centroid[0]
				//	);
				//});
				features.playOrder = sortArrayBy( features, 'name' );
			},
			tick: function() {
				var geo = data.county.geo;
				var order = geo.features.playOrder,
					next = order.next, length = order.length;
				if( ! next  ||  next >= length ) next = 0;
				while( next < length ) {
					var feature = order[next++], id = feature.id;
					var row = featureResults( results, feature );
					var use = row && row[col.NumCountedBallotBoxes];
					if( use ) {
						outlineFeature({ geo:geo, feature:feature });
						showTip( feature );
						break;
					}
				}
				order.next = next;
			}
		}
	};
	
	var setCountiesFirst = true;
	function setCounties( counties, force ) {
		counties = !! counties;
		if( counties == opt.counties  &&  ! force  &&  ! setCountiesFirst )
			return;
		setCountiesFirst = false;
		opt.counties = counties;
		$('#chkCounties').prop( 'checked', counties );
		loadView();
	}
	
	function showError( type, file ) {
		file = file.replace( '.json', '' ).replace( '-all', '' ).toUpperCase();
		$('#error').html( S( '<div>Error loading ', type, ' for ', file, '</div>' ) ).show();
		$('#spinner').hide();
	}
	
	function reportError( type, file ) {
		analytics( 'error', type, file );
	}
	
	function analytics( category, action, label, value, noninteraction ) {
		//analytics.seen = analytics.seen || {};
		//if( analytics.seen[path] ) return;
		//analytics.seen[path] = true;
		_gaq.push([ '_trackEvent',
			category, action, label, value, noninteraction
		]);
	}
	
	function addNationwideControl( map ) {
		var $control = $(S(
			'<div id="view-usa" style="display:none; margin-top:6px; cursor:pointer;">',
				'<div style="direction:ltr; overflow:hidden; text-align:center; position:relative; color:black; font-family:Arial,sans-serif; -moz-user-select:none; font-size:12px; background-color:rgb(250,250,250); background:-moz-linear-gradient( center top, rgb(254,254,254), rgb(243,243,243) ) repeat scroll 0% 0% transparent; line-height:160%; padding:0px 6px; border-radius:2px 0pt 0pt 2px; box-shadow:2px 2px 3px rgba(0,0,0,0.35); border:1px solid rgb(169,187,223); font-weight:normal;" title="',
					'titleViewUSA'.T(),
				'">',
					'viewUSA'.T(),
				'</div>',
			'</div>'
		)), control = $control[0];
		$control.click( function() { setState('00'); } );
		control.index = 1;
		map.controls[google.maps.ControlPosition.TOP_LEFT].push( control );
	};

	$body.addClass( autoplay() ? 'autoplay' : 'interactive' );
	$body.addClass( tv() ? 'tv' : 'web' );
	if( params.sidebar ) $body.addClass( 'sidebar' );
	var mapWidth = ww - ( params.sidebar ? sidebarWidth : 0 );
	$body.toggleClass( 'hidelogo', mapWidth < 140 );

	var map;
	
	var overlays = [];
	overlays.clear = function() {
		while( overlays.length ) overlays.pop().setMap( null );
	};
	
	//var state = states[opt.state];
	
	var reloadTimer;
	
	var geoMoveNext = true;
	var polyTimeNext = 250;
	
	var didGeoReady;
	function geoReady() {
		// TODO: refactor with duplicate code in resizeViewNow()
		setLegend();
		var mapTop = $map.offset().top;
		if( params.sidebar ) {
			mapTop = 0;
			$map.css({
				position: 'absolute',
				left: sidebarWidth,
				top: mapTop,
				width: ww - sidebarWidth,
				height: wh
			});
			//var $sidebarScroll = $('#sidebar-scroll');
			//$sidebarScroll.height( wh - $sidebarScroll.offset().top );
		}
		$map.height( wh - mapTop );
		if( geoMoveNext ) {
			geoMoveNext = false;
			moveToGeo();
		}
		$('#view-usa').toggle( state.fips != '00' );
		polys();
		$('#spinner').hide();
		if( ! opt.randomized  &&   opt.reloadTime ) {
			clearInterval( reloadTimer );
			reloadTimer = setInterval( function() {
				loadView();
			}, opt.reloadTime );
		}
		if( ! didGeoReady ) {
			setPlayback();
			didGeoReady = true;
		}
	}
	
	function currentGeos() {
		//data.state.geo.hittest = ! opt.counties;
		//return opt.counties ?
		//	[ data.county.geo, data.state.geo ] :
		//	[ data.state.geo ];
		if( state.votesby == 'state' ) {
			if( data.county.geo ) data.county.geo.hittest = false;
			return [ data.state.geo ];
		}
		else {
			data.state.geo.hittest = false;
			//data.county.geo.hittest = false;
			return [ /*data.town.geo,*/ data.county.geo, data.state.geo ];
		}
	}
	
	function currentResults() {
		return currentData().results;
	}
	
	function currentData() {
		return opt.counties ? data.county : data.state;
		//return data.town;
	}
	
	function moveToGeo() {
		var json = currentGeos()[0];  // TODO
		$('#map').show();
		initMap();
		gme && map && gme.trigger( map, 'resize' );
		//overlays.clear();
		//$('script[title=jsonresult]').remove();
		//if( json.status == 'later' ) return;
		
		if( json.id == '00' ) {
			json = {
				bbox: [ -13885233, 2819924, -7452828, 6340332 ],
				centerLL: [ -95.841534, 38.004972 ]
			};
		}
		
		json && fitBbox( json.bbox, json.centerLL );
	}
	
	function fitBbox( bbox, centerLL ) {
		var z;
		if( params.zoom  &&  params.zoom != 'auto' ) {
			z = +params.zoom;
		}
		else {
			if( ! bbox ) return;
			z = PolyGonzo.Mercator.fitBbox( bbox, {
				width: $map.width(),
				height: $map.height()
			});
		}
		z = Math.floor( z );
		
		map.setCenter( new gm.LatLng( centerLL[1], centerLL[0] ) );
		map.setZoom( z );
		zoom = map.getZoom();
	}
	
	//function shrinkBbox( bbox, amount ) {
	//	var dx = ( bbox[2] - bbox[0] ) * amount / 2;
	//	var dy = ( bbox[3] - bbox[1] ) * amount / 2;
	//	return [
	//		bbox[0] + dx,
	//		bbox[1] + dy,
	//		bbox[2] - dx,
	//		bbox[3] - dy
	//	];
	//}
	
	var  mouseFeature;
	
	function getStateCounties( features, state ) {
		var counties = [];
		for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
			if( feature.state.toUpperCase() == curState.abbr )
				counties.push( feature );
		}
		return counties;
	}
	
	var polysThrottle = throttle(200), showTipThrottle = throttle(200);
	function polys() {
		var mousedown = false;
		colorize( currentGeos() );
		var $container = $('#map');
		var events = playType() ? {} : {
			mousedown: function( event, where ) {
				showTip( false );
				mousedown = true;
			},
			mouseup: function( event, where ) {
				mousedown = false;
			},
			mousemove: function( event, where ) {
				if( mousedown ) return;
				polysThrottle( function() {
					var feature = where && where.feature;
					if( feature == mouseFeature ) return;
					mouseFeature = feature;
					map.setOptions({ draggableCursor: feature ? 'pointer' : null });
					outlineFeature( where );
					showTipThrottle( function() { showTip(feature); });
				});
			},
			click: function( event, where ) {
				events.mousemove( event, where );
				var feature = where && where.feature;
				if( ! feature ) return;
				//if( feature.type == 'state'  || feature.type == 'cd' )
					setState( feature );
			}
		};
		//overlays.clear();
		// Let map display before drawing polys
		function draw() {
			var overlay = new PolyGonzo.PgOverlay({
				map: map,
				geos: currentGeos(),
				events: events
			});
			overlay.setMap( map );
			setTimeout( function() {
				overlays.clear();
				overlays.push( overlay );
			}, 1 );
			//overlay.redraw( null, true );
		}
		var pt = polyTimeNext;
		polyTimeNext = 0;
		if( pt ) setTimeout( draw, 250 );
		else draw();
	}
	
	function colorize( geos ) {
		//if( opt.counties ) {
		//	var features = data.state.geo.features;
		//	for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
		//		feature.fillColor = '#000000';
		//		feature.fillOpacity = 0;
		//		feature.strokeColor = '#666666';
		//		feature.strokeOpacity = 1;
		//		feature.strokeWidth = 2;
		//	}
		//}
		geos.forEach( function( geo ) {
			var features = geo.features;
			var kind = geo.table.split('.')[1];
			if(
			   kind == 'coucou'  ||
			   kind == 'gop2012'  ||  /*TEMP*/ 
			   kind == 'fl'  ||  /*TEMP*/
			   kind == 'sc'  /*TEMP*/
			) {
				kind = 'cousub';
			}
			if(
			   kind == 'state00'
			) {
				kind = 'state';
			}
			var colorizers = {
				state: function() {
					if( state.votesby == 'state' )
						colorVotes( features, '#666666', 1, 2 );
					else
						colorSimple( features, '#FFFFFF', '#222222', 1, 2 );
				},
				county: function() {
					colorSimple( features, '#FFFFFF', '#444444', .5, 1 );
				},
				cousub: function() {
					colorVotes( features, '#666666', .5, 1 );
				}
			};
			colorizers[kind]();
		});
	}
	
	function colorSimple( features, fillColor, strokeColor, strokeOpacity, strokeWidth ) {
		for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
			feature.fillColor = fillColor;
			feature.fillOpacity = 0;
			feature.strokeColor = strokeColor;
			feature.strokeOpacity = strokeOpacity;
			feature.strokeWidth = strokeWidth;
		}
	}
			
	function colorVotes( features, strokeColor, strokeOpacity, strokeWidth ) {
		var results = currentResults(), col = results && results.cols;
		var candidates = results && results.candidates;
		if( ! currentCandidate ) {
			for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
				var row = featureResults( results, feature );
				var candidate = row && candidates[row.candidateMax];
				if( candidate ) {
					feature.fillColor = candidate.color;
					feature.fillOpacity = .6;
				}
				else {
					feature.fillColor = '#FFFFFF';
					feature.fillOpacity = 0;
				}
				var complete = row &&
					row[col.NumCountedBallotBoxes] ==
					row[col.NumBallotBoxes];
				feature.strokeColor = strokeColor;
				feature.strokeOpacity = strokeOpacity;
				feature.strokeWidth = strokeWidth;
			}
		}
		else {
			var rows = results.rows;
			var max = 0;
			var candidate = candidates.by.id[currentCandidate], color = candidate.color, index = candidate.index;
			var nCols = candidates.length;
			for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
				var row = featureResults( results, feature );
				var total = 0, value = 0;
				if( row ) {
					var total = 0;
					for( var iCol = -1;  ++iCol < nCols; )
						total += row[iCol];
					value = row[index];
					max = Math.max( max,
						row.fract = total ? value / total : 0
					);
				}
			}
			for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
				var row = featureResults( results, feature );
				feature.fillColor = color;
				feature.fillOpacity = row && max ? row.fract / max * .75 : 0;
				var complete = row &&
					row[col.NumCountedBallotBoxes] ==
					row[col.NumBallotBoxes];
				feature.strokeColor = strokeColor;
				feature.strokeOpacity = strokeOpacity;
				feature.strokeWidth = strokeWidth;
			}
		}
	}

	
	// TODO: refactor this into PolyGonzo
	var outlineOverlay;
	function outlineFeature( where ) {
		if( outlineOverlay )
			outlineOverlay.setMap( null );
		outlineOverlay = null;
		if( !( where && where.feature ) ) return;
		var feat = $.extend( {}, where.feature, {
			fillColor: '#000000',
			fillOpacity: 0,
			strokeWidth: playCounties() ? 5 : opt.counties ? 2 : 3,
			strokeColor: '#000000',
			strokeOpacity: 1
		});
		outlineOverlay = new PolyGonzo.PgOverlay({
			map: map,
			geos: [{
				crs: where.geo.crs,
				kind: where.geo.kind,
				features: [ feat ]
			}]
		});
		outlineOverlay.setMap( map );
	}
	
	function getSeats( race, seat ) {
		if( ! race ) return null;
		if( seat == 'One' ) seat = '1';
		if( race[seat] ) return [ race[seat] ];
		if( race['NV'] ) return [ race['NV'] ];
		if( race['2006'] && race['2008'] ) return [ race['2006'], race['2008'] ];
		return null;
	}
	
	var tipOffset = { x:10, y:20 };
	var $maptip, tipHtml;
	if( ! playType() )
		$body.bind( 'click mousemove', moveTip );
	
	function showTip( feature ) {
		if( ! $maptip ) $maptip = $('#maptip');
		tipHtml = formatTip( feature );
		if( tipHtml ) {
			$maptip.html( tipHtml ).show();
		}
		else {
			$maptip.hide();
			mouseFeature = null;
		}
	}
	
	function formatCandidateAreaPatch( candidate, max ) {
		var size = Math.round( Math.sqrt( candidate.vsTop ) * max );
		var margin1 = Math.floor( ( max - size ) / 2 );
		var margin2 = max - size - margin1;
		return S(
			'<div style="margin:', margin1, 'px ', margin2, 'px ', margin2, 'px ', margin1, 'px;">',
				formatDivColorPatch( candidate.color, size, size ),
			'</div>'
		);
	}
	
	function formatDivColorPatch( color, width, height, border ) {
		border = border || '1px solid #C2C2C2';
		return S(
			'<div style="background:', color, '; width:', width, 'px; height:', height, 'px; border:', border, '">',
			'</div>'
		);
	}
	
	function formatSpanColorPatch( colors, spaces, border ) {
		if( ! colors.push ) colors = [ colors ];
		border = border || '1px solid #C2C2C2';
		return S(
			'<span class="legend-candidate-color" style="border:', border, '; zoom:1;">',
				colors.mapjoin( function( color ) {
					return S(
						'<span class="legend-candidate-color" style="background:', color, '; zoom:1;">',
							'&nbsp;'.repeat( spaces || 6 ),
						'</span>'
					);
				}),
			'</span>'
		);
	}
	
	function formatCandidateIcon( candidate, size ) {
		return S(
			'<div style="background:url(',
					imgUrl( S( 'candidate-photos-', year, '-', size, '.png' ) ),
				'); background-position:-', election.candidates.by.id[candidate.id].index * size, 'px 0px; width:', size, 'px; height:', size, 'px; border:1px solid #C2C2C2;">',
			'</div>'
		);
	}
	
	function totalResults( results ) {
		var rows = results.rows;
		var total = [];
		for( var row, i = -1;  row = rows[++i]; )
			for( var n = row.length, j = -1;  ++j < n; )
				total[j] = ( total[j] || 0 ) + row[j];
		return total;
	}
	
	function totalReporting( results ) {
		var col = results.colsById;
		var rows = results.rows;
		var counted = 0, total = 0;
		for( var row, i = -1;  row = rows[++i]; ) {
			counted += row[col.NumCountedBallotBoxes];
			total += row[col.NumBallotBoxes];
		}
		return {
			counted: counted,
			total: total,
			percent: percent1( counted / total ),
			kind: ''  // TODO
		};
	}
	
	function topCandidatesByVote( result, max ) {
		max = max || Infinity;
		if( ! result ) return [];
		if( result == -1 ) result = totalResults( currentResults() );
		var results = currentResults();
		var col = results.colsById;
		var top = results.candidates.slice();
		for( var i = -1;  ++i < top.length; ) {
			var candidate = top[i], votes = result[i];
			candidate.votes = votes;
			candidate.vsAll = votes / result[col.TabTotal];
			//candidate.total = total;
		}
		top = sortArrayBy( top, 'votes', { numeric:true } )
			.reverse()
			.slice( 0, max );
		while( top.length  &&  ! top[top.length-1].votes )
			top.pop();
		if( top.length ) {
			var most = top[0].votes;
			for( var i = -1;  ++i < top.length; ) {
				var candidate = top[i];
				candidate.vsTop = candidate.votes / most;
			}
		}
		return top;
	}
	
	function setLegend() {
		$('#legend').html( formatLegend() );
	}
	
	function formatLegend() {
		/*if( params.sidebar )*/ return formatSidebar();
		
		//var topCandidates = topCandidatesByVote(
		//	totalResults( currentResults() )
		//);
		//var top = formatLegendTopCandidates( topCandidates.slice( 0, 4 ) );
		//var candidates = topCandidates.map( formatLegendCandidate );
		//return formatLegendTable( [ top ].concat( currentResults().candidates ) );
	}
	
	//function formatLegendTopCandidates( topCandidates ) {
	//	var colors = topCandidates.map( function( candidate ) {
	//		return candidate.color;
	//	});
	//	var selected = currentCandidate ? '' : ' selected';
	//	return S(
	//		'<td class="legend-candidate', selected, '" id="legend-candidate-top">',
	//			'<div class="legend-candidate">',
	//				formatSpanColorPatch( colors, 2 ),
	//				'&nbsp;', 'allCandidatesShort'.T(), '&nbsp;',
	//			'</div>',
	//		'</td>'
	//	);
	//}
	
	//function formatLegendCandidate( candidate ) {
	//	var selected = ( candidate.id == currentCandidate ) ? ' selected' : '';
	//	return S(
	//		'<td class="legend-candidate', selected, '" id="legend-candidate-', candidate.id, '">',
	//			'<div class="legend-candidate">',
	//				formatSpanColorPatch( candidate.color, 8 ),
	//				'&nbsp;', candidate.lastName, '&nbsp;',
	//				percent1( candidate.vsAll ), '&nbsp;',
	//			'</div>',
	//		'</td>'
	//	);
	//}
	
	function nameCase( name ) {
		return name && name.split(' ').map( function( word ) {
			return word.slice( 0, 1 ) + word.slice( 1 ).toLowerCase();
		}).join(' ');
	}
	
	function formatSidebar() {
		// TODO: refactor with formatLegend()
		var resultsHeaderHTML = '';
		var resultsScrollingHTML = '';
		var results = currentResults();
		if( results ) {
			var topCandidates = topCandidatesByVote(
				totalResults( currentResults() )
			);
			var none = ! topCandidates.length;
			var top = none ? '' : formatSidebarTopCandidates( topCandidates.slice( 0, 4 ) );
			resultsHeaderHTML = S(
				'<div id="percent-reporting" class="body-text">',
					'percentReporting'.T( totalReporting( currentResults() ) ),
				'</div>',
				'<div id="auto-update" class="faint-text" style="margin-bottom:8px;">',
					opt.randomized ? 'randomized'.T() : 'automaticUpdate'.T(),
				'</div>',
				none ? '' : S(
					'<div id="button-row" class="body-text" style="padding-top:4px;">',
						'<a class="button ',
							opt.cycleTimer ? 'selected' : '',
							'" id="btnCycle" title="',
							opt.cycleTimer ? 'cycleStopTip'.T() : 'cycleTip'.T(),
							'">',
								'cycle'.T(),
						'</a>',
					'</div>'
				)
			);
			var candidates = topCandidates.map( formatSidebarCandidate );
			resultsScrollingHTML = none ? '' : S(
				formatCandidateList(
					[ top ].concat( candidates ),
					function( candidate ) {
						return candidate;
					}
				)
			);
		}
		return S(
			'<div id="sidebar">',
				'<div class="sidebar-header">',
					'<div id="election-title" class="title-text">',
						state.electionTitle,
					'</div>',
					'<div id="election-date" class="faint-text" style="margin-bottom:8px;">',
						state.date,
					'</div>',
					'<div id="sidebar-results-header">',
						resultsHeaderHTML,
					'</div>',
				'</div>',
				'<div xclass="scroller" id="sidebar-scroll">',
					resultsScrollingHTML,
				'</div>',
			'</div>'
		);
	}
	
	function formatSidebarTopCandidates( topCandidates ) {
		var colors = topCandidates.map( function( candidate ) {
			return candidate.color;
		});
		var selected = currentCandidate ? '' : ' selected';
		return S(
			'<tr class="legend-candidate', selected, '" id="legend-candidate-top">',
				'<td class="left">',
					'<div class="legend-candidate">',
						formatSpanColorPatch( colors, 2 ),
					'</div>',
				'</td>',
				'<td colspan="3" class="right">',
					'<div class="legend-candidate">',
						'allCandidates'.T(),
					'</div>',
				'</td>',
			'</tr>'
		);
	}
	
	function formatSidebarCandidate( candidate ) {
		var selected = ( candidate.id == currentCandidate ) ? ' selected' : '';
		return S(
			'<tr class="legend-candidate', selected, '" id="legend-candidate-', candidate.id, '">',
				'<td class="left">',
					'<div class="legend-candidate">',
						formatSpanColorPatch( candidate.color, 8 ),
					'</div>',
				'</td>',
				'<td>',
					'<div class="legend-candidate">',
						candidate.lastName,
					'</div>',
				'</td>',
				'<td>',
					'<div class="legend-candidate" style="text-align:right;">',
						percent1( candidate.vsAll ),
					'</div>',
				'</td>',
				'<td class="right">',
					'<div class="legend-candidate" style="text-align:right;">',
						formatNumber( candidate.votes ),
					'</div>',
				'</td>',
			'</tr>'
		);
	}
	
	function formatTipCandidates( result ) {
		return formatCandidateList(
			topCandidatesByVote( result, /*params.sidebar ? 0 :*/ 4 ),
			formatListCandidate
		);
	}
	
	function formatCandidateList( topCandidates, formatter ) {
		if( ! topCandidates.length )
			return 'noVotes'.T();
		return S(
			'<table class="candidates" cellpadding="0" cellspacing="0">',
				topCandidates.mapjoin( formatter ),
			'</table>'
		);
	}
	
	function formatListCandidate( candidate, i ) {
		var selected = ( candidate.id == currentCandidate ) ? ' selected' : '';
		var cls = i === 0 ? ' first' : '';
		var pct = percent1( candidate.vsAll );
		return S(
			'<tr class="legend-candidate', cls, '" id="legend-candidate-', candidate.id, '">',
				'<td class="left">',
					election.photos ? S(
						'<div style="margin:6px 6px 6px 0;">',
							formatCandidateIcon( candidate, 32 ),
						'</div>'
					) : '',
				'</td>',
				'<td style="padding-right:16px;">',
					'<div class="candidate-name" style="',
								election.photos ? '' : 'margin-top:4px; margin-bottom:4px;',
							'">',
						'<div class="first-name">',
							candidate.firstName,
						'</div>',
						'<div class="last-name" style="font-weight:bold;">',
							candidate.lastName,
						'</div>',
					'</div>',
				'</td>',
				'<td>',
					formatCandidateAreaPatch( candidate, 24 ),
				'</td>',
				'<td class="candidate-percent" style="text-align:right; padding-left:6px;">',
					pct,
				'</td>',
				web() ? S(
					'<td class="candidate-votes right" style="text-align:right; padding-left:10px;">',
						formatNumber( candidate.votes ),
					'</td>'
				) : '',
			'</tr>'
		);
	}
	
	function formatFeatureName( feature ) {
		if( ! feature ) return '';
		var state = State( feature );
		var suffixes = state.suffixes || lsadSuffixes;
		var lsad = ( feature.lsad || '' ).toLowerCase();
		var suffix = suffixes[lsad] || '';
		return S( feature.name, suffix );
	}
	
	function formatTip( feature ) {
		if( ! feature ) return null;
		var results = currentResults(), col = results && results.colsById;
		if( ! col ) return null;
		var row = featureResults( results, feature );
		
		var content;
		if( row ) {
			var content = S(
				'<div class="tipcontent">',
					formatTipCandidates( row ),
				'</div>'
			);
			
			var boxes = row[col.NumBallotBoxes];
			var counted = row[col.NumCountedBallotBoxes];
		}
		
		var parent = data.state.geo &&
			data.state.geo.features.by.id[feature.parent];
		
		return S(
			'<div class="tiptitlebar">',
				'<div style="float:left;">',
					'<span class="tiptitletext">',
						formatFeatureName( feature ),
						debug ? S(
							'<br>geo id: ', feature.id,
							'<br>ft id: ', row[col.ID]
						) : '',
						' ',
					'</span>',
				'</div>',
				'<div style="clear:left;">',
				'</div>',
				parent ? ' ' + parent.name : '',
				parent && debug ? ' (#' + parent.id + ')' : '',
				'<div class="tipreporting">',
					! boxes ? 'noVotesHere'.T() : 'percentReporting'.T({
						percent: percent1( counted / boxes ),
						counted: counted,
						total: boxes,
						kind: ''
					}),
				'</div>',
			'</div>',
			content
		);
	}
	
	function moveTip( event ) {
		if( ! tipHtml ) return;
		var x = event.pageX, y = event.pageY;
		if(
			x < mapPixBounds.left  ||
			x >= mapPixBounds.right  ||
			y < mapPixBounds.top  ||
			y >= mapPixBounds.bottom
		) {
			showTip( false );
		}
		x += tipOffset.x;
		y += tipOffset.y;
		var pad = 2;
		var width = $maptip.width(), height = $maptip.height();
		var offsetLeft = width + tipOffset.x * 2;
		var offsetTop = height + tipOffset.y * 2;
		
		if( x + width > ww - pad ) {
			x -= width + pad + tipOffset.x * 2;
		}
		if( x < pad ) {
			x = pad;
		}
		
		if( y + height > wh - pad )
			y -= height + pad + tipOffset.y * 2;
		if( y < pad )
			y = wh - pad - height - tipOffset.y * 2;
		
		$maptip.css({ left:x, top:y });
	}
	
	function formatNumber( nStr ) {
		nStr += '';
		x = nStr.split('.');
		x1 = x[0];
		x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		return x1 + x2;
	}
	
	function getLeaders( locals ) {
		var leaders = {};
		for( var localname in locals ) {
			var votes = locals[localname].votes[0];
			if( votes ) leaders[votes.name] = true;
		}
		return leaders;
	}
	
	// Separate for speed
	function getLeadersN( locals, n ) {
		var leaders = {};
		for( var localname in locals ) {
			for( var i = 0;  i < n;  ++i ) {
				var votes = locals[localname].votes[i];
				if( votes ) leaders[votes.name] = true;
			}
		}
		return leaders;
	}
	
	function setState( s ) {
		if( ! s ) return;
		s = State( s );
		if( ! s.abbr ) return;
		state = s;
		var select = $('#stateSelector')[0];
		select && ( select.selectedIndex = state.selectorIndex );
		opt.state = state.abbr.toLowerCase();
		geoMoveNext = true;
		setCounties( state.fips != '00' );
	}
	
	var mapStyles = [
		{
			stylers: [ { saturation: -25 } ]
		},{
			featureType: "road",
			elementType: "labels",
			stylers: [ { visibility: "off" } ]
		},{
			featureType: "road",
			elementType: "geometry",
			stylers: [ { lightness: 50 }, { saturation: 10 }, { visibility: "simplified" } ]
		},{
			featureType: "transit",
			stylers: [ { visibility: "off" } ]
		},{
			featureType: "landscape",
			stylers: [ { lightness: 100 }, { saturation: -100 } ]
		},{
			featureType: "administrative",
			elementType: "geometry",
			stylers: [ { visibility: "off" } ]
		},{
			featureType: "administrative.country",
			elementType: "labels",
			stylers: [ { visibility: "off" } ]
		//},{
		//	featureType: "administrative",
		//	stylers: [ { visibility: "off" } ]
		//},{
		//	featureType: "administrative.locality",
		//	stylers: [ { visibility: "on" } ]
		},{
			featureType: "poi.park",
			elementType: "geometry",
			stylers: [{ lightness: 60 }]
		}
	];
	
	function initMap() {
		if( map ) return;
		gm = google.maps, gme = gm.event;
		mapPixBounds = $map.bounds();
		var mapopt = $.extend({
			mapTypeControl: false,
			mapTypeId: 'simple',
			streetViewControl: false,
			panControl: false,
			rotateControl: false
		},
		params.play ? {
			zoomControl: false
		} : {
			zoomControlOptions: {
				style: gm.ZoomControlStyle.SMALL
			}
		});
		map = new gm.Map( $map[0],  mapopt );
		var mapType = new gm.StyledMapType( mapStyles );
		map.mapTypes.set( 'simple', mapType );
		addNationwideControl( map );
		
		//if( ! PolyGonzo.isVML() ) {
		//	gme.addListener( map, 'zoom_changed', function() {
		//		var oldZoom = zoom;
		//		zoom = map.getZoom();
		//		if( zoom > oldZoom  &&  zoom >= 7 )
		//			setCounties( true );
		//		else if( zoom < oldZoom  &&  zoom < 7 )
		//			setCounties( false );
		//	});
		//}
	}
	
	function initSelectors() {
		
		//setState( opt.state );
		
		$('#stateSelector').bindSelector( 'change keyup', function() {
			var value = this.value.replace('!','').toLowerCase();
			if( opt.state == value ) return;
			opt.state = value;
			setCounties( value > 0 );
			var state = data.state.geo.features.by.id[value];
			fitBbox( state ? state.bbox : data.state.geo.bbox );
		});
		
		$('#chkCounties').click( function() {
			setCounties( this.checked );
		});
		
		var $legend = $('#legend');
		$legend.delegate( 'tr.legend-candidate', {
			mouseover: function( event ) {
				$(this).addClass( 'hover' );
			},
			mouseout: function( event ) {
				$(this).removeClass( 'hover' );
			},
			click: function( event ) {
				var id = this.id.split('-')[2];
				if( id == 'top' ) id = null;
				$('#chkCycle').prop({ checked:false });
				stopCycle();
				setCandidate( id );
			}
		});
		
		$legend.delegate( '#btnCycle', {
			mouseover: function( event ) {
				$(this).addClass( 'hover' );
			},
			mouseout: function( event ) {
				$(this).removeClass( 'hover' );
			},
			click: function( event ) {
				toggleCycle();
			}
		});
		
		function toggleCycle() {
			if( opt.cycleTimer ) stopCycle();
			else startCycle();
		}
		
		var startCycleTime;
		function startCycle() {
			if( opt.cycleTimer ) return;
			startCycleTime = now();
			this.title = 'cycleStopTip'.T();
			var player = players.candidates;
			opt.cycleTimer = setInterval( player.tick, 3000 );
			player.tick();
			analytics( 'cycle', 'start' );
		}
		
		function stopCycle() {
			if( ! opt.cycleTimer ) return;
			clearInterval( opt.cycleTimer );
			opt.cycleTimer = null;
			$('#btnCycle')
				.removeClass( 'selected' )
				.prop({ title: 'cycleTip'.T() });
			var seconds = Math.round( ( now() - startCycleTime ) / 1000 );
			analytics( 'cycle', 'stop', '', seconds );
		}
		
		setCandidate = function( id ) {
			currentCandidate = id;
			loadView();
		}
	}
	
	function hittest( latlng ) {
	}
	
	function loadView() {
		showTip( false );
		//overlays.clear();
		//opt.state = +$('#stateSelector').val();
		//var state = curState = data.state.geo.features.by.abbr[opt.abbr];
		$('#spinner').show();
		clearInterval( reloadTimer );
		reloadTimer = null;
		loadRegion();
	}
	
	var resizeOneshot = oneshot();
	function resizeView() {
		resizeOneshot( resizeViewNow, 250 );
	}
	
	function resizeViewNow() {
		// TODO: refactor with duplicate code in geoReady()
		ww = $window.width();
		wh = $window.height();
		$body.css({ width: ww, height: wh });
		$('#spinner').css({
			left: Math.floor( ww/2 - 64 ),
			top: Math.floor( wh/2 - 20 )
		});
		var mapWidth = ww - sidebarWidth;
		var mapHeight = wh;
		$body.toggleClass( 'hidelogo', mapWidth < 140 );
		$map.css({ width: mapWidth, height: mapHeight });
		moveToGeo();
	}
	
	//function getShapes( state, callback ) {
	//	if( state.shapes ) callback();
	//	else getJSON( 'shapes', opt.shapeUrl, state.abbr.toLowerCase() + '.json', 3600, function( shapes ) {
	//		state.shapes = shapes;
	//		//if( state == stateUS ) shapes.features.state.index('state');
	//		callback();
	//	});
	//}
	
	var cacheResults = new Cache;
	
	function getResults() {
		var electionid = state.electionid;
		//if( electionid == 'random' ) {
		//	opt.randomized = params.randomize = true;
		//	electionid += state.fips;
		//}
		
		var results = cacheResults.get( electionid );
		if( results ) {
			loadResultTable( results, false );
			return;
		}
		
		if( params.zero ) delete params.randomize;
		if( params.randomize || params.zero ) {
			loadTestResults( electionid, params.randomize );
			return;
		}
		
		var e = electionid.split( '|' );
		var id = params.source == 'gop' ? e[1] : e[0];
		
		var url = S(
			
			////'http://fusiontables.googleusercontent.com/fusiontables/api/query?',
			////'http://localhost:8080/vote-data?',
			//'http://nh2012-test.election-maps.appspot.com/vote-data?',
			//'jsonCallback=', opt.counties ? 'loadCounties' : 'loadStates',
			//'&_=', Math.floor( now() / opt.resultCacheTime ),
			//'&sql=SELECT+',
			//resultsFields(),
			//'+FROM+',
			////opt.counties ? '2458834' : 'TODO'
			//params.tableid || '{{tableid}}'
			
			'https://pollinglocation.googleapis.com/results?',
			'electionid=', id,
			'&_=', Math.floor( now() / opt.resultCacheTime )
		);
		getScript( url );
	}
	
	function loadTestResults( electionid, randomize ) {
		var random = randomize ? randomInt : function() { return 0; };
		opt.resultCacheTime = Infinity;
		opt.reloadTime = false;
		clearInterval( reloadTimer );
		reloadTimer = null;
		delete params.randomize;
		
		var col = [];
		election.candidates.forEach( function( candidate ) {
			if( candidate.skip ) return;
			col.push( 'TabCount-' + candidate.id );
		});
		col = col.concat(
			'ID',
			'TabTotal',
			'NumBallotBoxes',
			'NumCountedBallotBoxes'
		);
		col.index();
		
		var region = data[ state.votesby || 'county' ];
		var rows = region.geo.features.map( function( feature ) {
			var row = [];
			row[col.ID] = feature.id;
			var nVoters = 0;
			var nPrecincts = row[col.NumBallotBoxes] = random( 50 ) + 5;
			var nCounted = row[col.NumCountedBallotBoxes] =
				Math.max( 0,
					Math.min( nPrecincts,
						random( nPrecincts * 2 ) -
						Math.floor( nPrecincts / 2 )
					)
				);
			var total = 0;
			for( iCol = -1;  ++iCol < col.ID; )
				total += row[iCol] = nCounted ? random(100000) : 0;
			row[col.TabTotal] = total + random(total*2);
			return row;
		});
		
		var json = {
			electionid: electionid,
			mode: 'test',
			table: {
				cols: col,
				rows: rows
			}
		};
		
		loadResultTable( json, true );
	}
	
	loadResults = function( json, electionid, mode ) {
		json.electionid = electionid;
		json.mode = mode;
		loadResultTable( json, true );
	};
	
	function fixCountyIDs( json ) {
		var result = json.table, col = result.cols;
		col.index();
		var fixer = idFixers[ ( opt.state || '' ).toUpperCase() ];
		if( ! fixer ) return;
		if( typeof fixer == 'function' ) {
			fixer( json );
		}
		else {
			result.rows.forEach( function( row ) {
				var id = fixer[ row[col.ID] ];
				if( id ) {
					row[col.ID] = id;
				}
			});
		}
	}
	
	var idFixers = {
		IA: function( json ) {
			var result = json.table, col = result.cols;
			result.rows.forEach( function( row ) {
				var id = row[col.ID];
				if( id.length < 5 ) {
					while( id.length < 3 ) id = '0' + id;
					row[col.ID] = '19' + id;
				}
			});
		},
		MN: {
			'Lac Qui Parle': 'Lac qui Parle'
		},
		MO: {
			'LaClede': 'Laclede'
		},
		NH: {
			//'Waterville': 'Waterville Valley',
			//'Harts Location': "Hart's Location"
			'Waterville': '3300979380',
			'Harts Location': '3300334500'
		}
	};
	
	var lsadSuffixes = {
		city: ' City',
		county: ' County'
	};
	
	function featureResults( results, feature ) {
		if( !( results && feature ) ) return null;
		var fips = feature.id.split('US')[1];
		var state = fips.length == 2  &&  states.by.fips[fips];  // TEMP
		var abbr = state && state.abbr;  // TEMP
		return (
			results.rowsByID[ fips ] ||
			results.rowsByID[ abbr ] ||  // TEMP
			results.rowsByID[ feature.name ]  ||
			results.rowsByID[ feature.name + (
				lsadSuffixes[ ( feature.lsad || '' ).toLowerCase() ]
				|| ''
			) ]
		);
	}
	
	function fixShortFIPS( col, rows ) {
		rows.forEach( function( row ) {
			var id = row[col];
			if( /^\d\d\d\d$/.test(id) ) row[col] = '0' + id;
		});
	}
	
	function isCountyTEMP( json ) {
		try {
			var table = json.table, cols = table.cols, rows = table.rows;
			var col = cols.index()['ID'];
			var id = rows[0][col];
			if( /^\d\d\d\d$/.test(id) ) fixShortFIPS( col, rows );
			return ! /^[A-Z][A-Z]$/.test(id);
		}
		catch( e ) {
			return false;
		}
	}

	function loadResultTable( json, loading ) {
		var counties = isCountyTEMP( json );
		if( counties )
			fixCountyIDs( json );
		if( loading )
			cacheResults.add( json.electionid, json, opt.resultCacheTime );
		
		var results = currentData().results = json.table;

		var col = results.colsById = {};
		col.candidates = 0;
		var cols = results.cols;
		for( var id, iCol = -1;  id = cols[++iCol]; ) {
			col[id] = iCol;
		}

		var candidates = results.candidates = [];
		for( var i = 0, colID = col.ID;  i < colID;  ++i ) {
			var id = cols[i].split('-')[1].toLowerCase(), candidate = election.candidates.by.id[id];
			candidates.push( $.extend( {}, candidate ) );
		}
		candidates.index('id');

		var rowsByID = results.rowsByID = {};
		var rows = results.rows;
		for( var row, iRow = -1;  row = rows[++iRow]; ) {
			rowsByID[ row[col.ID] ] = row;
			var nCandidates = candidates.length;
			var max = 0,  candidateMax = -1;
			for( iCol = -1;  ++iCol < nCandidates; ) {
				var count = row[iCol];
				if( count > max ) {
					max = count;
					candidateMax = iCol;
				}
			}
			row.candidateMax = candidateMax;
		}

		if( counties == opt.counties )
			geoReady();
	}
	
	function objToSortedKeys( obj ) {
		var result = [];
		for( var key in obj ) result.push( key );
		return result.sort();
	}
	
	var blank = imgUrl( 'blank.gif' );
	
	$('body.interactive a.logo')
		.css({ opacity: .5 })
		.mouseover( function() {
			$(this).stop().fadeTo( 250, 1 );
		})
		.mouseout( function() {
			$(this).stop().fadeTo( 500, .5 );
		});
	
	$window
		.bind( 'load', loadView )
		.bind( 'resize', resizeView );
	
	getScript( S(
		location.protocol == 'https:' ? 'https://ssl' : 'http://www',
		'.google-analytics.com/',
		debug ? 'u/ga_debug.js' : 'ga.js'
	) );
	
	analytics( 'map', 'load' );
	
})( jQuery );
