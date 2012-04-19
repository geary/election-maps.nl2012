// results-map.js
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

var times = {
	gadgetLoaded: now(),
	offset: 0
};

// Default params
params.source = ( params.source == 'gop' ? 'gop' : 'ap' );
var hostPrefix = location.host.split('.')[0];
var match = hostPrefix.match( /^([a-z][a-z])2012(-\w+)$/ );
if( match ) {
	if( hostPrefix == 'nv2012' ) params.source = 'gop';
	params.state = match[1];
}
var $body = $('body');
$body.addClass( 'source-' + params.source );

// Hide Google Elections logo in IE <= 7
if( $.browser.msie ) {
	if( +$.browser.version.split('.')[0] <= 7 )
		$body.addClass( 'ie7' );
}

params.randomize = params.debug = true;  // TEMP

opt.randomized = params.randomize || params.zero;

var year = params.year in elections ? +params.year : 2012;
var parties = elections[year];
var party = params.party in parties ? params.party : 'fr';
var election = parties[party];
var currentCandidate;

if( params.date ) {
	var d = dateFromYMD( params.date, election.tzHour, election.tzMinute );
	times.offset = d - times.gadgetLoaded;
}

var current = {
	geoid: 'FR',
	national: true
};

//states.index('abbr').index('electionid').index('fips');

//for( var state, i = -1;  state = states[++i]; ) {
//	state.dateUTC = dateFromYMD( state.date, election.tzHour, election.tzMinute );
//}

//params.state = params.state || params.embed_state;
////params.state = params.state || 'zz';
//if( ( params.state || '' ).toLowerCase() == 'us' ) delete params.state;

//function State( abbr ) {
//	if( abbr && abbr.bbox && abbr.id ) abbr = abbr.id.split('US')[1].slice(0,2);
//	abbr = ( abbr || params.state || 'US' ).toUpperCase();
//	var state =
//		states.by.fips[abbr] ||
//		states.by.abbr[abbr] ||
//		states.by.electionid[abbr] ||
//		stateUS;
//	state.electionTitle = S( state.name, ' ', state.type || 'primary'.T() );
//	state.getResults = function() {
//		return ( this == stateUS  &&  view == 'county' ) ?
//			this.resultsCounty :
//			this.results;
//	};
//	return state;
//}
//
//var stateUS = State('US'), state = State();

//if( PolyGonzo.isVML() ) {
//	delete params.view;  // too slow for all-county view
//}

//var view = ( params.view == 'county' || ! current.national ? 'county' : 'state' );

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

var mapPixBounds;

var debug = params.debug;
//opt.state = params.state;
//opt.counties = !! opt.state;
//opt.candidate = '1';
//opt.zoom = opt.zoom || 3;
opt.fontsize = '15px';
var sidebarWidth = params.play ? 340 : 280;

opt.resultCacheTime = 30 * 1000;
opt.reloadTime = 60 * 1000;

// Non-auto-refresh settings to use after results are final
//opt.resultCacheTime = Infinity;  // cache forever
//opt.reloadTime = false;  // no auto-reload

var zoom;

election.candidates.index('id');

var candidateZero = { id: '0' };
//loadCandidatePatterns();

function loadCandidatePatterns( callback ) {
	var loading = 0;
	election.candidates.forEach( loadPattern );
	loadPattern( candidateZero );
	function loadPattern( candidate ) {
		++loading;
		var pattern = candidate.pattern = new Image();
		pattern.src = imgUrl( 'pattern-' + candidate.id + '.png' );
		pattern.onload = function() {
			if( --loading == 0 ) callback && callback();
		};
	}
}

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
		'a { font-size:13px; text-decoration:none; color:#1155CC; }',
		'a:hover { text-decoration:underline; }',
		//'a:visited { color:#6611CC; }',
		'a.button { display:inline-block; cursor:default; background-color:whiteSmoke; background-image:linear-gradient(top,#F5F5F5,#F1F1F1); border:1px solid #DCDCDC; border:1px solid rgba(0,0,0,0.1); border-radius:2px; box-shadow:none; color:#444; font-weight:bold; font-size:11px; height:27px; line-height:27px; padding:0 7px; }',
		'a.button.hover { background-color: #F6F6F6; background-image:linear-gradient(top,#F8F8F8,#F1F1F1); border:1px solid #C6C6C6; box-shadow:0px 1px 1px rgba(0,0,0,0.1); color:#222; }',
		'a.button.selected { background-color: #EEE; background-image:linear-gradient(top,#EEE,#E0E0E0); border:1px solid #CCC; box-shadow:inset 0px 1px 2px rgba(0,0,0,0.1); color:#333; }',
		'#outer {}',
		'.barvote { font-weight:bold; color:white; }',
		'div.topbar-header, div.sidebar-header { padding:3px; }',
		'div.title-text { font-size:16px; }',
		'div.subtitle-text { font-size:11px; color:#777; }',
		'div.body-text, div.body-text label { font-size:13px; }',
		'div.faint-text { font-size:12px; color:#777; }',
		'div.small-text, a.small-text { font-size:11px; }',
		'div.topbar-delegates { font-size:21px; line-height:21px; font-weight:bold; }',
		'body.narrow #topbar div.candidate-name { display:none; }',
		'.content table { xwidth:100%; }',
		'.content .contentboxtd { width:7%; }',
		'.content .contentnametd { xfont-size:24px; xwidth:18%; }',
		'.content .contentbox { height:24px; width:24px; xfloat:left; margin-right:4px; }',
		'.content .contentname { white-space:pre; }',
		'.content .contentvotestd { text-align:right; width:5em; }',
		'.content .contentpercenttd { text-align:right; width:2em; }',
		'.content .contentvotes, .content .contentpercent { xfont-size:', opt.fontsize, '; margin-right:4px; }',
		'.content .contentclear { clear:left; }',
		'.content .contentreporting { margin-bottom:8px; }',
		'.content .contentreporting * { xfont-size:20px; }',
		'.content {}',
		'div.scroller { overflow:scroll; overflow-x:hidden; }',
		'#maptip { position:absolute; z-index:10; border:1px solid #333; background:white; color:#222; white-space: nowrap; display:none; width:300px; }',
		'div.candidate-name { line-height:1em; }',
		'div.first-name { font-size:85%; }',
		'body.tv #election-title { font-size:24px; font-weight:bold; }',
		'body.tv #election-date { font-size:16px; color:#222; }',
		'body.tv #percent-reporting { font-size:20px; }',
		'body.tv div.candidate-name { margin-right:20px; }',
		'body.tv div.candidate-name div { line-height:1.1em; }',
		'body.tv div.first-name { font-size:20px; }',
		'body.tv div.last-name { font-size:24px; font-weight:bold; }',
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
		'#maptip div.candidate-delegates { font-size:130%; font-weight:bold; }',
		'#maptip div.candidate-percent { font-weight:bold; }',
		'#maptip div.candidate-votes { font-size:80%; }',
		'#maptip div.click-for-local { padding:4px; }',
		'body.tv #maptip div.candidate-percent { font-size:20px; font-weight:bold; }',
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
		'#ap-logo { right:64px; width:41px; background: url(', imgUrl('ap-logo-48x41.png'), ') no-repeat; }',
		'body.source-gop #ap-logo { display:none; }',
		'#google-logo { right:4px; background: url(', imgUrl('google-politics-48.png'), ') no-repeat; }',
		'#gop-logo { right:64px; width:48px; background: url(', imgUrl('gop-nv-48.png'), ') no-repeat; }',
		'body.hidelogo #gop-logo, body.hidelogo #ap-logo { right:4px; }',
		'body.hidelogo #google-logo { display:none; }',
		'body.ie7 #gop-logo, body.ie7 #ap-logo { right:4px; }',
		'body.ie7 #google-logo, body.ie7 #linkToMap { display:none; }',
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
	//'<a id="ap-logo" class="logo" target="_blank" href="http://www.youtube.com/apelections" title="', 'dataAttribTitle'.T(), '">',
	//'</a>',
	//'<a id="gop-logo" class="logo" target="_blank" href="http://www.nvgopcaucus.com/" title="', 'dataAttribTitleGOP'.T(), '">',
	//'</a>',
	'<a id="google-logo" class="logo" target="_blank" href="http://www.google.com/elections/ed/us/home" title="', 'googlePoliticsTitle'.T(), '">',
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
			//		//	sortArrayBy( stateUS.geo.state.features, 'name' )
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

//function usEnabled() {
//	return params.usa != 'false'  &&
//		( ! params.embed_state  ||  params.embed_state.toLowerCase() == 'us' );
//}

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
	
	var geoJSON = {};
	function loadRegion( geoid ) {
		var level =
			params.level != null ? params.level :
			geoid == 'FR' ? '4096' : '';
		geoid = geoid || current.geoid;
		var json = geoJSON[geoid];
		if( json ) {
			loadGeoJSON( json, true );
		}
		else {
			var file = S( 'france', '-', geoid, '-goog_geom', level, '.js' );
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
			}
		}
		var geoid = ( json.commune || json.departement ).id;
		current.geoid = geoid;
		current.national = ( geoid == 'FR' );
		if( ! geoJSON[geoid] ) {
			geoJSON[geoid] = json;
			for( var kind in json ) {
				var geo = json[kind];
				indexFeatures( geo );
			}
			oneTime();
		}
		//setCounties( true );
		getResults();
		//analytics( 'data', 'counties' );
	};
	
	function indexFeatures( geo ) {
		var features = geo.features;
		var by = features.by = {};
		for( var feature, i = -1;  feature = features[++i]; ) {
			by[feature.id] = feature;
		}
	}
	
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
				var topCandidates = getTopCandidates( state.results, -1, 'votes' );
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
			//setup: function() {
			//	var features = state.geo.county.features;
			//	//features.playOrder = sortArrayBy( features, function( feature ) {
			//	//	return(
			//	//		-feature.centroid[1] * 1000000000 + feature.centroid[0]
			//	//	);
			//	//});
			//	features.playOrder = sortArrayBy( features, 'name' );
			//},
			//tick: function() {
			//	var geo = state.geo.county;
			//	var order = geo.features.playOrder,
			//		next = order.next, length = order.length;
			//	if( ! next  ||  next >= length ) next = 0;
			//	while( next < length ) {
			//		var feature = order[next++], id = feature.id;
			//		var row = featureResults( results, feature );
			//		var use = row && row[col.NumCountedBallotBoxes];
			//		if( use ) {
			//			outlineFeature({ geo:geo, feature:feature });
			//			showTip( feature );
			//			break;
			//		}
			//	}
			//	order.next = next;
			//}
		}
	};
	
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
	
	var useSidebar;
	function setSidebar() {
		useSidebar = true;
		$body.toggleClass( 'sidebar', useSidebar );
	}
	
	$body.addClass( autoplay() ? 'autoplay' : 'interactive' );
	$body.addClass( tv() ? 'tv' : 'web' );
	setSidebar();
	// TODO: refactor with duplicate code in geoReady() and resizeViewNow()
	var mapWidth = ww - ( useSidebar ? sidebarWidth : 0 );
	$body
		.toggleClass( 'hidelogo', mapWidth < 140 )
		.toggleClass( 'narrow', ww < 770 );

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
		setSidebar();
		//setLegend();
		resizeViewOnly();
		if( geoMoveNext ) {
			geoMoveNext = false;
			moveToGeo();
		}
		//$('#view-usa').toggle( state.fips != '00' );
		polys();
		//mapIdled = false;
		$('#spinner').hide();
		if( ! opt.randomized  &&  opt.reloadTime  &&  params.refresh != 'false' ) {
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
	
	function currentGeo() {
		return currentGeos()[0];
	}
	
	function currentGeos() {
		var json = geoJSON[current.geoid];
		return json.commune ?
				[ json.commune, json.departement ] :
				[ json.departement, json.region, json.nation ];
	}
	
	function moveToGeo() {
		var json = geoJSON[current.geoid];
		if( ! json ) return;
		var geo = json.departement;
		$('#map').show();
		initMap();
		gme && map && gme.trigger( map, 'resize' );
		//overlays.clear();
		//$('script[title=jsonresult]').remove();
		//if( json.status == 'later' ) return;
		
		outlineFeature( null );
		
		if( current.geoid == 'FR' ) {
			geo = {
				bbox: [ -571432, 5032100, 1063003, 6596437 ],
				centerLL: [ 2.2104, 46.2260 ]
			};
		}
		geo && fitBbox( geo.bbox, geo.centerLL );
	}
	
	function fitBbox( bbox, centerLL ) {
		var z;
		if( params.zoom  &&  params.zoom != 'auto' ) {
			z = +params.zoom;
		}
		else {
			if( ! bbox ) return;
			z = PolyGonzo.Mercator.fitBbox( bbox, {
				width: $('#map').width(),
				height: $('#map').height()
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
	
	var dragged = false;
	var mapIdled;
	function addMapListeners( map ) {
		gme.addListener( map, 'dragstart', function() {
			dragged = true;
		});
		gme.addListener( map, 'idle', function() {
			//if( mapIdled )
				polys();
			mapIdled = true;
		});
/*
		usEnabled() && gme.addListener( map, 'zoom_changed', function() {
			var zoom = map.getZoom();
			if( zoom <= 4  &&  ! current.national )
				gotoGeo( '00', 'zoom' );
		});
*/
	}
	
	var touch;
	if( params.touch ) touch = { mouse: true };
	var polysThrottle = throttle(200), showTipThrottle = throttle(200);
	function polys() {
		var mousedown = false;
		colorize();
		var $container = $('#map');
		var events = playType() ? {} : {
			mousedown: function( event, where ) {
				if( touch  &&  ! touch.mouse ) return;
				showTip( false );
				mousedown = true;
				dragged = false;
			},
			mouseup: function( event, where ) {
				if( touch  &&  ! touch.mouse ) return;
				mousedown = false;
			},
			mousemove: function( event, where ) {
				if( touch || mousedown ) return;
				polysThrottle( function() {
					var feature = where && where.feature;
					if( feature == mouseFeature ) return;
					mouseFeature = feature;
					var cursor =
						! feature ? null :
						current.national ? 'pointer' :
						'default';
					map.setOptions({ draggableCursor: cursor });
					outlineFeature( where );
					showTipThrottle( function() { showTip(feature); });
				});
			},
			touchstart: function( event, where ) {
				touch = {};
				if( event.touches.length == 1 )
					touch.where = where;
				else  // multitouch
					this.touchcancel( event, where );
			},
			touchmove: function( event, where ) {
				this.touchcancel( event, where );
			},
			touchend: function( event, where ) {
				var feature = touch.where && touch.where.feature;
				if( feature != mouseFeature ) {
					mouseFeature = feature;
					outlineFeature( touch.where );
					showTip( feature );
					touch.moveTip = true;
				}
				else {
					if( current.national )
						gotoGeo( feature, 'tap' );
				}
			},
			touchcancel: function( event, where ) {
				delete touch.where;
				outlineFeature( null );
				showTip( false );
			},
			click: function( event, where ) {
				if( touch  && ! touch.mouse ) return;
				mousedown = false;
				var didDrag = dragged;
				dragged = false;
				events.mousemove( event, where );
				if( didDrag ) return;
				var feature = where && where.feature;
				if( ! feature ) return;
				if( touch && touch.mouse ) {
					touch.where = where;
					this.touchend( event, where );
				}
				else {
					if( current.national )
						gotoGeo( feature, 'click' );
				}
			}
		};
		//overlays.clear();
		// Let map display before drawing polys
		function draw() {
			var overlay = new PolyGonzo.PgOverlay({
				map: map,
				geos: currentGeos(),
				underlay: getInsetUnderlay,
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
	
	function colorize() {
		var json = geoJSON[current.geoid];
		if( json.commune ) {
			colorVotes( json.commune.features, '#666666', 1, 1 );
			colorSimple( json.departement.features, '#FFFFFF', '#444444', 1, 1.5 );
		}
		else {
			colorVotes( json.departement.features, '#666666', 1, 1 );
			colorSimple( json.region.features, '#FFFFFF', '#444444', 1, 1.5 );
			colorSimple( json.nation.features, '#FFFFFF', '#222222', 1, 2 );
		}
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
		var time = now() + times.offset;
		var results = currentGeo().results;
		var col = results && results.cols;
		var candidates = results && results.candidates;
		if( !( candidates && currentCandidate ) ) {
			for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
				var row = featureResults( results, feature );
				var diff = feature && feature.state ? time - feature.state.dateUTC : -1;
				var hatch = current.national  &&  diff >= 0  &&  diff <= (24+9) * 60 * 60 * 1000;
				hatch = false;  // TODO
				var candidate = row && candidates[row.candidateMax];
				if( candidate ) {
					feature.fillColor = hatch ? { image: candidate.pattern } : candidate.color;
					feature.fillOpacity = .6;
				}
				else {
					if( hatch ) {
						feature.fillColor = { image: candidateZero.pattern };
						feature.fillOpacity = .6;
					}
					else {
						feature.fillColor = '#FFFFFF';
						feature.fillOpacity = 0;
					}
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
				var diff = feature && feature.state ? time - feature.state.dateUTC : -1;
				var hatch = current.national  &&  diff >= 0  &&  diff <= (24+9) * 60 * 60 * 1000;
				hatch = false;  // TODO
				feature.fillColor = hatch ? { image: candidate.pattern } : candidate.color;
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
	
	function useInset() {
		return false;
		return current.national  &&  map.getZoom() == 4;
	}
	
	function insetFeatures( abbr, callback ) {
		var sf = stateUS.geo.state.features.by;
		var cf = ( view == 'county' ) && stateUS.geo.county.features.by;
		if( abbr == 'AK' ) {
			callback( sf.AK || sf['02'] );
			cf && callback( cf['02'] );
		}
		else {  // HI
			callback( sf.HI || sf['15'] );
			cf && '15001 15003 15005 15007 15009'.words( function( fips ) {
				callback( cf[fips] );
			});
		}
	}
	
	function getInsetUnderlay() {
		return null;
		function clear( feature ) {
			delete feature.zoom;
			delete feature.offset;
		}
		if( ! stateUS.geo ) return null;
		var kind = view == 'county' ? 'county' : 'state';
		var features = stateUS.geo[kind].features;
		if( ! useInset() ) {
			insetFeatures( 'AK', clear );
			insetFeatures( 'HI', clear );
			return null;
		}
		insetFeatures( 'AK', function( feature ) {
			feature.zoom = 1;
			feature.offset = { x: -1122, y: -211 };
		});
		insetFeatures( 'HI', function( feature ) {
			feature.zoom = 4;
			feature.offset = { x: 538, y: -89 };
		});
		var images = [{
			src: imgUrl('ak-hi.png'),
			width: 166, height: 84,
			left: -1380, top: -370
		}];
		if( view != 'county' )
			images = images.concat([{
				abbr: 'CT',
				width: 68, height: 14,
				left: -823, top: -482
			}, {
				abbr: 'DC',
				width: 55, height: 24,
				left: -876, top: -410
			}, {
				abbr: 'DE',
				width: 51, height: 14,
				left: -820, top: -442
			}, {
				abbr: 'MA',
				width: 81, height: 14,
				left: -784, top: -516
			}, {
				abbr: 'MD',
				width: 52, height: 14,
				left: -839, top: -426
			}, {
				abbr: 'NH',
				width: 61, height: 22,
				left: -760, top: -544
			}, {
				abbr: 'NJ',
				width: 64, height: 14,
				left: -814, top: -462
			}, {
				abbr: 'RI',
				width: 71, height: 14,
				left: -799, top: -500
			}, {
				abbr: 'VT',
				width: 49, height: 14,
				left: -764, top: -558
			}]);
		return {
			images: images,
			hittest: function( image, x, y ) {
				if( image.abbr )
					return {
						geo: stateUS.geo,
						feature: features.by[image.abbr]
					}
				var feature =
					x < 81 ? features.by.AK || features.by['02'] :
					view != 'county' ? features.by.HI :
					hittestBboxes( features, bboxesInsetHI, x, y );
				if( feature )
					return { geo: stateUS.geo, feature: feature }
				return null;
			}
		};
	}
	
	function hittestBboxes( features, places, x, y ) {
		for( var place, i = -1;  place = places[++i]; ) {
			var b = place.bbox;
			if( x >= b[0]  &&  x < b[2]  &&  y >= b[1]  &&  y < b[3] )
				return features.by[place.id];
		}
		return null;
	}
	
	var bboxesInsetHI = [
		{ id: '15001', bbox: [ 138,44, 163,67 ] },  // Hawaii
		{ id: '15003', bbox: [ 112,21, 129,47 ] },  // Honolulu
		{ id: '15007', bbox: [ 90,15, 112,42 ] },  // Kauai
		{ id: '15009', bbox: [ 129,29, 151,54 ] }  // Maui
	];
	
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
			strokeWidth: playCounties() ? 5 : opt.counties ? 1.5 : 2.5,
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
	var $maptip = $('#maptip'), tipHtml;
	if( ! playType() ) {
		$body.bind( 'click mousemove', moveTip );
		$maptip.click( function( event ) {
			if( event.target.id == 'close-tip' ) {
				showTip( false );
				event.preventDefault();
			}
			else if( current.national ) {
				// Only touch devices for now
				var feature = touch && touch.where && touch.where.feature;
				if( feature ) gotoGeo( feature, 'tap' );
			}
		});
	}
	
	function showTip( feature ) {
		tipHtml = formatTip( feature );
		if( tipHtml ) {
			$maptip.html( tipHtml ).show();
		}
		else {
			$maptip.hide();
			if( !( touch && touch.mouse ) )
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
		var border = 'transparent', photo = '';
		if( candidate.id ) {
			border = '#C2C2C2';
			photo = S(
				'background:url(',
					imgUrl( S( 'candidate-photos-fr-', year, '-', size, '.png' ) ),
				'); ',
				'background-position:-',
				election.candidates.by.id[candidate.id].index * size, 'px 0px; '
			);
		}
		return S(
			'<div style="', photo, ' width:', size, 'px; height:', size, 'px; border:1px solid ', border, ';">',
			'</div>'
		);
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
	
	function getTopCandidates( results, result, sortBy, max ) {
		max = max || Infinity;
		if( ! result ) return [];
		if( result == -1 ) result = results.totals;
		var col = results.colsById;
		var top = results.candidates.slice();
		for( var i = -1;  ++i < top.length; ) {
			var candidate = top[i], votes = result[i];
			candidate.votes = votes;
			candidate.vsAll = votes / result[col.TabTotal];
			//candidate.total = total;
		}
		top = sortArrayBy( top, sortBy, { numeric:true } )
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
	
	function getCandidateDelegates( state, candidate ) {
		var delegates = stateUS.delegates;
		if( ! delegates ) return 0;
		var iCol = delegates.colsById[ 'TabCount-' + candidate.id ];
		var row =
			current.national ? delegates.totals :
			delegates.rowsByID[state.abbr];
		return row ? row[iCol] : 0;
	}
	
	function setLegend() {
		$('#legend').html( formatLegend() );
	}
	
	function formatLegend() {
		return useSidebar ? formatSidebar() : formatTopbar();
	}
	
	function formatTopbar() {
		var candidatesHTML = '';
		var results = state.delegates;
		if( results ) {
			var topCandidates = getTopCandidates( results, -1, 'delegates', 4 );
			//var top = formatTopbarTopCandidates( topCandidates );
			var candidates =
				topCandidates.length ? topCandidates.map( formatTopbarCandidate ) :
				formatTopbarCandidate({});
			candidatesHTML = [ /*top*/ ].concat( candidates ).join('');
		}
		var test = testFlag( results );
		return S(
			'<div id="topbar" style="position:relative;">',
				'<div class="topbar-header" style="float:left;">',
					'<div id="election-title" class="title-text">',
						'topbarTitle'.T(),
					'</div>',
					'<div id="election-subtitle" class="subtitle-text" style="',
						test ? 'color:red; font-weight:bold;' : '',
					'">',
						test ? 'testData'.T() : 'topbarSubtitle'.T(),
					'</div>',
					'<div class="subtitle-text">',
						'delegatesAttrib'.T(),
					'</div>',
				'</div>',
				'<div id="topbar-candidates" style="position:relative; float:right;">',
					candidatesHTML,
					'<div style="clear:both;">',
					'</div>',
				'</div>',
				'<div style="clear:both;">',
				'</div>',
			'</div>'
		);
	}
	
	//function formatTopbarTopCandidates( topCandidates ) {
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
	
	function formatTopbarCandidate( candidate ) {
		var selected = ( candidate.id === currentCandidate ) ? ' selected' : '';
		var delegates = candidate.delegates;
		if( params.triple ) delegates = 999;
		return S(
			'<div style="float:left; padding:6px 5px 1px 12px;">',
				'<table cellpadding="0" cellspacing="0">',
					'<tr class="legend-candidate', selected, '" id="legend-candidate-', candidate.id, '">',
						'<td class="left">',
							'<div class="topbar-delegates" style="text-align:center; margin:-1px 0 0 2px;">',
								candidate.delegates == null ? ' ' :
									formatNumber( delegates ),
							'</div>',
							'<div style="margin-left:2px;">',
								formatDivColorPatch(
									candidate.color || 'white',
									delegates < 100 ? 23 : 34,
									12, '1px solid transparent'
								),
							'</div>',
						'</td>',
						'<td>',
							'<div style="padding:2px 1px;">',
								formatCandidateIcon( candidate, 32 ),
							'</div>',
						'</td>',
						'<td class="right">',
							'<div class="candidate-name" style="margin-right:2px;">',
								'<div class="first-name">',
									candidate.firstName || '&nbsp;',
								'</div>',
								'<div class="last-name">',
									candidate.lastName || '&nbsp;',
								'</div>',
							'</div>',
						'</td>',
					'</tr>',
				'</table>',
			'</div>'
		);
	}
	
	function nameCase( name ) {
		return name && name.split(' ').map( function( word ) {
			return word.slice( 0, 1 ) + word.slice( 1 ).toLowerCase();
		}).join(' ');
	}
	
	function testFlag( results ) {
		return debug && results && ( results.mode == 'test'  ||  opt.randomized );
	}
	
	function viewUsEnabled() {
		return ! current.national  &&  usEnabled();
	}
	
	function formatSidebar() {
		// TODO: refactor with formatTopbar()
		var resultsHeaderHTML = '';
		var resultsScrollingHTML = '';
		var results = state.results;
		if( results ) {
			var topCandidates = getTopCandidates( state.results, -1, 'votes' );
			var none = ! topCandidates.length;
			var top = none ? '' : formatSidebarTopCandidates( topCandidates.slice( 0, 4 ) );
			var test = testFlag( results );
			var viewUSA = usEnabled() ? S(
				'<div style="padding-bottom:6px;">',
					'<a href="#" id="viewUSA" title="', 'titleViewUSA'.T(), '" style="">',
						'viewUSA'.T(),
					'</a>',
				'</div>'
			) : '';
			resultsHeaderHTML = S(
				'<div id="percent-reporting" class="body-text">',
					'percentReporting'.T( totalReporting(state.results) ),
				'</div>',
				'<div id="auto-update" class="subtitle-text" style="margin-bottom:8px; ',
					test ? 'color:red; font-weight:bold;' : '',
				'">',
					test ? 'testData'.T() : 'automaticUpdate'.T(),
				'</div>',
				viewUSA
			);
			var candidates = topCandidates.map( formatSidebarCandidate );
			resultsScrollingHTML = none ? '' : S(
				formatCandidateList(
					[ top ].concat( candidates ),
					function( candidate ) {
						return candidate;
					},
					false
				)
			);
		}
		var linkHTML = !(
			params.usa ||
			params.hide_links ||
			params.embed_state
		) ? S(
			'<a href="http://www.google.com/elections/ed/us/results/2012/gop-primary/',
					state.abbr.toLowerCase(),
					'" target="_parent" id="linkToMap" class="small-text" title="',
					'linkToMapTitle'.T(), '">',
				'linkToMap'.T(),
			'</a>'
		) : '';
		return S(
			'<div id="sidebar">',
				'<div class="sidebar-header">',
					'<div id="election-title" class="title-text">',
						state.electionTitle,
					'</div>',
					'<div id="election-date-row" class="" style="margin-bottom:8px; position:relative;">',
						'<div id="election-date" class="subtitle-text" style="float:left;">',
							longDateFromYMD( state.date ),
						'</div>',
						'<div id="map-link" class="small-text" style="float:right; padding-right:3px;">',
							linkHTML,
						'</div>',
						'<div style="clear:both;">',
						'</div>',
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
	
	function formatCandidateList( topCandidates, formatter, header ) {
		if( ! topCandidates.length )
			return 'waitingForVotes'.T();
		var thead = header ? S(
			'<tr>',
				'<th colspan="3" style="text-align:left; padding-bottom:4px;">',
					'candidate'.T(),
				'</th>',
				'<th style="text-align:right; padding-bottom:4px;">',
					'votes'.T(),
				'</th>',
				'<th style="text-align:right; padding-bottom:4px;">',
					//current.national  &&  view != 'county' ? 'delegatesAbbr'.T() : '',
				'</th>',
			'</tr>'
		) : '';
		return S(
			'<table class="candidates" cellpadding="0" cellspacing="0">',
				thead,
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
						'<div style="margin:6px 0;">',
							formatCandidateIcon( candidate, 32 ),
						'</div>'
					) : '',
				'</td>',
				'<td>',
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
				'<td style="text-align:center;">',
					formatCandidateAreaPatch( candidate, 24 ),
				'</td>',
				'<td style="text-align:right; padding-left:6px;">',
					'<div class="candidate-percent">',
						pct,
					'</div>',
					web() ? S(
						'<div class="candidate-votes">',
							formatNumber( candidate.votes ),
						'</div>'
					) : '',
				'</td>',
				'<td class="right" style="text-align:right; padding-left:6px;">',
					//current.national  &&  view != 'county' ? S(
					//	'<div class="candidate-delegates">',
					//		candidate.delegates,
					//	'</div>'
					//) : '',
				'</td>',
			'</tr>'
		);
	}
	
	function formatFeatureName( feature ) {
		if( ! feature ) return '';
		return S( feature.name );
	}
	
	function mayHaveResults( row, col ) {
		return(
			row[col.TabTotal] > 0  ||
			row[col.NumCountedBallotBoxes] < row[col.NumBallotBoxes]
		);
	}
	
	function formatTip( feature ) {
		if( ! feature ) return null;
		var geoid = feature.id;
		var future = false;
		var geo = currentGeo(), results = geo.results, col = results && results.colsById;
		var row = featureResults( results, feature );
		var top = [];
		if( row  &&  col  &&  mayHaveResults(row,col) ) {
			row.geoid = geoid;
			row.geo = geo;
			top = getTopCandidates( results, row, 'votes', /*useSidebar ? 0 :*/ 4 );
			var content = S(
				'<div class="tipcontent">',
					formatCandidateList( top, formatListCandidate, true ),
				'</div>'
			);
			
			var boxes = row[col.NumBallotBoxes];
			var counted = row[col.NumCountedBallotBoxes];
		}
		
		var reporting =
			boxes ? 'percentReporting'.T({
				percent: percent1( counted / boxes ),
				counted: counted,
				total: boxes,
				kind: ''
			}) :
			future ? longDateFromYMD(st.date) :
			( current.national  &&  view != 'county' )  ||  ! results ? 'waitingForVotes'.T() :
			row ? 'noVotesHere'.T() :
			'neverVotesHere'.T();
		
		var clickForLocal =
			top.length && current.national ? S(
				'<div class="click-for-local faint-text">',
					( touch ? 'tapForLocal' : 'clickForLocal' ).T(),
				'</div>'
			) : '';
		// TODO
		var parent = null;  /* data.state.geo &&
			data.state.geo.features.by.id[feature.parent]; */
		
		var test = testFlag( results );
		
		var closebox = touch ? S(
			'<div style="position:absolute; right:6px; top:6px;">',
				'<a href="#">',
					'<img id="close-tip" border="0" style="width:24px; height:24px;" src="', imgUrl('close.png'), '" />',
				'</a>',
			'</div>'
		) : '';
		
		return S(
			'<div class="tiptitlebar">',
				'<div style="float:left;">',
					'<span class="tiptitletext">',
						formatFeatureName( feature ),
						//debug ? S(
						//	'<br>geo id: ', feature.id,
						//	'<br>ft id: ', row[col.ID]
						//) : '',
						' ',
					'</span>',
				'</div>',
				closebox,
				'<div style="clear:left;">',
				'</div>',
				parent ? ' ' + parent.name : '',
				parent && debug ? ' (#' + parent.id + ')' : '',
				'<div class="tipreporting">',
					reporting,
					test ? S(
						'<span style="color:red; font-weight:bold; font-size:100%;"> ',
							'testData'.T(),
						'</span>'
					) : '',
				'</div>',
			'</div>',
			content,
			clickForLocal
		);
	}
	
	function moveTip( event ) {
		if( ! tipHtml ) return;
		if( touch ) {
			if( ! touch.moveTip ) return;
			delete touch.moveTip;
		}
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
	
	function gotoGeo( id, why ) {
		if( typeof id != 'string' ) id = id && id.id;
		if( ! id ) return;
		stopCycle();
		//var select = $('#stateSelector')[0];
		//select && ( select.selectedIndex = state.selectorIndex );
		//opt.state = state.abbr.toLowerCase();
		geoMoveNext = true;
		loadViewID( id );
		if( why ) analytics( why, 'geo', id );
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
		mapPixBounds = $('#map').bounds();
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
				position: gm.ControlPosition.TOP_RIGHT,
				style: gm.ZoomControlStyle.SMALL
			}
		});
		map = new gm.Map( $('#map')[0],  mapopt );
		var mapType = new gm.StyledMapType( mapStyles );
		map.mapTypes.set( 'simple', mapType );
		addMapListeners( map );
		
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
		
		//gotoGeo( opt.state );
		
		//$('#stateSelector').bindSelector( 'change keyup', function() {
		//	var value = this.value.replace('!','').toLowerCase();
		//	if( opt.state == value ) return;
		//	opt.state = value;
		//	setCounties( value > 0 );
		//	var state = data.state.geo.features.by.id[value];
		//	fitBbox( state ? state.bbox : data.state.geo.bbox );
		//});
		
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
				if( id == 'top'  ||  id == currentCandidate ) id = null;
				$('#chkCycle').prop({ checked:false });
				stopCycle();
				setCandidate( id, 'click' );
			}
		});
		
		$legend.delegate( 'a', {
			mouseover: function( event ) {
				$(this).addClass( 'hover' );
			},
			mouseout: function( event ) {
				$(this).removeClass( 'hover' );
			}
		});
		
		$legend.delegate( '#viewUSA', {
			click: function( event ) {
				gotoGeo( '00', 'return' );
				event.preventDefault();
			}
		});
		
		$legend.delegate( '#btnCycle', {
			click: function( event ) {
				toggleCycle();
			}
		});
		
		setCandidate = function( id, why ) {
			currentCandidate = id;
			loadView();
			if( why ) analytics( why, 'candidate', id || 'all' );
		}
	}
	
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
	
	function hittest( latlng ) {
	}
	
	function loadView() {
		loadViewID( current.geoid );
	}
	
	function loadViewID( geoid ) {
		showTip( false );
		//overlays.clear();
		//opt.state = +$('#stateSelector').val();
		//var state = curState = data.state.geo.features.by.abbr[opt.abbr];
		$('#spinner').show();
		clearInterval( reloadTimer );
		reloadTimer = null;
		loadRegion( geoid );
	}
	
	var resizeOneshot = oneshot();
	function resizeView() {
		resizeOneshot( resizeViewNow, 250 );
	}
	
	function resizeViewOnly() {
		// TODO: refactor with duplicate code in geoReady()
		ww = $window.width();
		wh = $window.height();
		$body
			.css({ width: ww, height: wh })
			.toggleClass( 'hidelogo', mapWidth < 140 )
			.toggleClass( 'narrow', ww < 770 );
		
		$('#spinner').css({
			left: Math.floor( ww/2 - 64 ),
			top: Math.floor( wh/2 - 20 )
		});
		
		var mapLeft = 0, mapTop = 0, mapWidth = ww, mapHeight = wh;
		if( useSidebar ) {
			mapLeft = sidebarWidth;
			mapWidth -= mapLeft;
			//var $sidebarScroll = $('#sidebar-scroll');
			//$sidebarScroll.height( wh - $sidebarScroll.offset().top );
		}
		else {
			var topbarHeight = $('#topbar').height() + 1;
			//if( topbarHeight > 50 )  // two rows
			//	$('#topbar-candidates').css({ float:'left' });
			mapTop = topbarHeight;
			mapHeight -= mapTop;
		}
		mapPixBounds = $('#map')
			.css({
				position: 'absolute',
				left: mapLeft,
				top: mapTop,
				width: mapWidth,
				height: mapHeight
			})
			.bounds();
	}
	
	function resizeViewNow() {
		resizeViewOnly();
		moveToGeo();
	}
	
	//function getShapes( state, callback ) {
	//	if( state.shapes ) callback();
	//	else getJSON( 'shapes', opt.shapeUrl, state.abbr.toLowerCase() + '.json', 3600, function( shapes ) {
	//		state.shapes = shapes;
	//		//if( current.national ) shapes.features.state.index('state');
	//		callback();
	//	});
	//}
	
	var cacheResults = new Cache;
	
	function getResults() {
		if( true ) {
			loadTestResults( current.geoid, params.randomize );
			return;
		}
		var json = geoJSON[current.geoid];
		if( current.national  &&  view == 'county' )
			electionid = state.electionidCounties;
		
		//if( electionid == 'random' ) {
		//	opt.randomized = params.randomize = true;
		//	electionid += state.fips;
		//}
		
		var results =
			( ! current.national  ||  cacheResults.get( stateUS.electionidDelegates ) )  &&
			cacheResults.get( electionid );
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
		
		getElections(
			current.national ?
				[ id, stateUS.electionidDelegates ] :
				[ id ]
		);
	}
	
	var electionLoading, electionsPending = [];
	function getElections( electionids ) {
		electionLoading = electionids[0];
		electionsPending = [].concat( electionids );
		electionids.forEach( function( electionid ) {
			var url = S(
				'https://pollinglocation.googleapis.com/results?',
				'electionid=', electionid,
				'&_=', Math.floor( now() / opt.resultCacheTime )
			);
			getScript( url );
		});
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
		
		var rows = currentGeo().features.map( function( feature ) {
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
		deleteFromArray( electionsPending, electionid );
		json.electionid = '' + electionid;
		json.mode = mode;
		loadResultTable( json, true );
	};
	
	var lsadPrefixes = {
		cd: 'district'.T() + ' ',
		shd: 'district'.T() + ' '
	};
	
	var lsadSuffixes = {
		city: ' ' + 'city'.T(),
		county: ' ' + 'county'.T()
	};
	
	function featureResults( results, feature ) {
		if( !( results && feature ) ) return null;
		return results.rowsByID[feature.id];
	}
	
	var missingOK = {
		//US: { AS:1, GU:1, MP:1, PR:1, VI:1 }
	};
	
	function loadResultTable( json, loading ) {
		if( loading )
			cacheResults.add( json.electionid, json, opt.resultCacheTime );
		
		var geo = currentGeo();  //  geoJSON[current.geoid];
		var results = geo.results = json.table;
		results.mode = json.mode;
		var zero = ( json.mode == 'test'  &&  ! debug );
		
		var col = results.colsById = {};
		col.candidates = 0;
		var cols = results.cols;
		var totals = results.totals = [];
		for( var id, iCol = -1;  id = cols[++iCol]; ) {
			col[id] = iCol;
			totals.push( 0 );
		}
		
		var candidates = results.candidates = [];
		for( var i = 0, colID = col.ID;  i < colID;  ++i ) {
			var id = cols[i].split('-')[1].toLowerCase(), candidate = election.candidates.by.id[id];
			candidates.push( $.extend( {}, candidate ) );
		}
		candidates.index('id');
		
		//var fix = state.fix || {};
		var features = geo.features;
		
		var missing = [];
		var rowsByID = results.rowsByID = {};
		var rows = results.rows;
		for( var row, iRow = -1;  row = rows[++iRow]; ) {
			var id = row[col.ID];
			//var fixed = fix[id];
			//if( fixed ) {
			//	id = row[col.ID] = fixed;
			//}
			//if( state.geo ) {
			//	var feature = features.by[id];
			//	if( ! feature ) {
			//		var ok = missingOK[current.geoid];
			//		if( !( ok  &&  id in ok ) )
			//			if( ! features.didMissingCheck )
			//				missing.push( id );
			//	}
			//}
			rowsByID[id] = row;
			if( /^\d\d000$/.test(id) ) rowsByID[id.slice(0,2)] = row;
			var nCandidates = candidates.length;
			var max = 0,  candidateMax = -1;
			if( zero ) {
				for( iCol = -1;  ++iCol < nCandidates; ) {
					row[iCol] = 0;
				}
				row[col.TabTotal] = 0;
				totals[col.NumBallotBoxes] += row[col.NumBallotBoxes];
				row[col.NumCountedBallotBoxes] = 0;
			}
			else {
				for( iCol = -1;  ++iCol < nCandidates; ) {
					var count = row[iCol];
					totals[iCol] += count;
					if( count > max ) {
						max = count;
						candidateMax = iCol;
					}
				}
				totals[col.TabTotal] += row[col.TabTotal];
				totals[col.NumBallotBoxes] += row[col.NumBallotBoxes];
				totals[col.NumCountedBallotBoxes] += row[col.NumCountedBallotBoxes];
			}
			row.candidateMax = candidateMax;
		}
		features.didMissingCheck = true;
		
		if( electionsPending.length == 0 )
			geoReady();
		
		if( missing.length  &&  debug  &&  debug != 'quiet' ) {
			alert( S( 'Missing locations:\n', missing.sort().join( '\n' ) ) );
		}
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
