// results-map.js
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

var times = {
	gadgetLoaded: now(),
	offset: 0
};

// Temp workaround for projection error in NL GeoJSON
var nlDX = 500, nlDY = 42000;

// Default params
var defaultElectionKey = '2012';
params.year = params.year || '2012';

var $body = $('body');
$body.addClass( 'source-anp' );

// Hide Google Elections logo in IE <= 7
if( $.browser.msie ) {
	if( +$.browser.version.split('.')[0] <= 7 )
		$body.addClass( 'ie7' );
}

partiesNL2012.index('id');

opt.randomized = params.randomize || params.zero;

var electionKey, election;
setElection();

function setElection() {
	electionKey = params.year;
	election = elections[electionKey] || elections[defaultElectionKey];
}

function longDateFromYMD( yyyymmdd ) {
	var ymd = yyyymmdd.split('-'), year = ymd[0];
	if( ymd.length == 1 ) return year;
	return 'dateFormat'.T({
		year: year,
		monthName: ( 'monthName' + ymd[1] ).T(),
		dayOfMonth: +ymd[2]
	});
}

if( params.date ) {
	var d = dateFromYMD( params.date, election.tzHour, election.tzMinute );
	times.offset = d - times.gadgetLoaded;
}

var current = {
	geoid: 'NL',
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
		'#topbar, #sidebar, #maptip { font-family: Arial,sans-serif; font-size: ', opt.fontsize, '; background-color:white; }',
		'#topbar { position:absolute; left:', sidebarWidth, 'px; top:0; width:', ww - sidebarWidth, 'px; }',
		'a { font-size:13px; text-decoration:none; color:#1155CC; }',
		'a:hover { text-decoration:underline; }',
		//'a:visited { color:#6611CC; }',
		'a.button { display:inline-block; cursor:default; background-color:whiteSmoke; background-image:linear-gradient(top,#F5F5F5,#F1F1F1); border:1px solid #DCDCDC; border:1px solid rgba(0,0,0,0.1); border-radius:2px; box-shadow:none; color:#444; font-weight:bold; font-size:11px; xheight:27px; xline-height:27px; padding:2px 6px; text-decoration:none !important; }',
		'a.button.hover { background-color: #F6F6F6; background-image:linear-gradient(top,#F8F8F8,#F1F1F1); border:1px solid #C6C6C6; box-shadow:0px 1px 1px rgba(0,0,0,0.1); color:#222; }',
		'a.button.selected { background-color: #EEE; background-image:linear-gradient(top,#EEE,#E0E0E0); border:1px solid #CCC; box-shadow:inset 0px 1px 2px rgba(0,0,0,0.1); color:#333; }',
		'a.button.disabled { color:#AAA; }',
		'#outer {}',
		'.barvote { font-weight:bold; color:white; }',
		'div.topbar-header, div.sidebar-header { padding:3px; }',
		'div.title-text { font-size:16px; }',
		'div.subtitle-text { font-size:11px; color:#777; }',
		'div.body-text, div.body-text label { font-size:13px; }',
		'div.faint-text { font-size:12px; color:#777; }',
		'div.small-text, a.small-text { font-size:11px; }',
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
		'div.scroller::-webkit-scrollbar-track:vertical { background-color:#f5f5f5; margin-top:2px; }',
		'div.scroller::-webkit-scrollbar { height:16px; width:16px; }',
		'div.scroller::-webkit-scrollbar-button { height:0; width:0; }',
		'div.scroller::-webkit-scrollbar-button:start:decrement, div.scroller::-webkit-scrollbar-button:end:increment { display:block; }',
		'div.scroller::-webkit-scrollbar-button:vertical:start:increment, div.scroller::-webkit-scrollbar-button:vertical:end:decrement { display:none; }',
		'div.scroller::-webkit-scrollbar-track:vertical, div.scroller::-webkit-scrollbar-track:horizontal, div.scroller::-webkit-scrollbar-thumb:vertical, div.scroller::-webkit-scrollbar-thumb:horizontal { border-style:solid; border-color:transparent; }',
		'div.scroller::-webkit-scrollbar-track:vertical { background-clip:padding-box; background-color:#fff; border-left-width:5px; border-right-width:0; }',
		'div.scroller::-webkit-scrollbar-track:horizontal { background-clip:padding-box; background-color:#fff; border-bottom-width:0; border-top-width:5px; }',
		'div.scroller::-webkit-scrollbar-thumb { -webkit-box-shadow:inset 1px 1px 0 rgba(0,0,0,.1),inset 0 -1px 0 rgba(0,0,0,.07); background-clip:padding-box; background-color:rgba(0,0,0,.2); min-height:28px; padding-top:100px; }',
		'div.scroller::-webkit-scrollbar-thumb:hover { -webkit-box-shadow:inset 1px 1px 1px rgba(0,0,0,.25); background-color:rgba(0,0,0,.4); }',
		'div.scroller::-webkit-scrollbar-thumb:active { -webkit-box-shadow:inset 1px 1px 3px rgba(0,0,0,.35); background-color:rgba(0,0,0,.5); }',
		'div.scroller::-webkit-scrollbar-thumb:vertical { border-width:0; border-left-width:5px; }',
		'div.scroller::-webkit-scrollbar-thumb:horizontal { border-width:0; border-top-width:5px; }',
		'div.scroller::-webkit-scrollbar-track:vertical { border-left-width:6px; border-right-width:1px; }',
		'div.scroller::-webkit-scrollbar-track:horizontal { border-bottom:1px; border-top:6px; }',
		'div.scroller::-webkit-scrollbar-thumb:vertical { border-width:0; border-left-width:6px; border-right-width:1px; }',
		'div.scroller::-webkit-scrollbar-thumb:horizontal { border-width:0; border-bottom:1px; border-top:6px; }',
		'div.scroller::-webkit-scrollbar-track:hover { -webkit-box-shadow:inset 1px 0 0 rgba(0,0,0,.1); background-color:rgba(0,0,0,.05); }',
		'div.scroller::-webkit-scrollbar-track:active { -webkit-box-shadow:inset 1px 0 0 rgba(0,0,0,.14),inset -1px -1px 0 rgba(0,0,0,.07); background-color:rgba(0,0,0,.05); }',
		'#maptip { position:absolute; z-index:10; border:1px solid #333; background:white; color:#222; white-space: nowrap; display:none; min-width:200px; }',
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
		'.tiptitlebar { padding:4px 8px; border-bottom:1px solid #AAA; margin-bottom:4px; }',
		'.tiptitletext { font-weight:bold; font-size:120%; }',
		'.tipcontent { padding:4px 8px 8px 8px; border-bottom:1px solid #AAA; }',
		'.tipreporting { font-size:80%; padding:2px 0; }',
		'#selectors { background-color:#D0E3F8; }',
		'#selectors, #selectors * { font-size:14px; }',
		'#selectors label { font-weight:bold; }',
		'#selectors { width:100%; /*border-bottom:1px solid #C2C2C2;*/ }',
		'body.tv #legend { margin-top:8px; }',
		'#sidebar { width:', sidebarWidth, 'px; }',
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
		'#election-title { padding-bottom:2px; }',
		'#election-date-row { display:none; }',
		'tr.legend-candidate td, tr.legend-filler td { border:1px solid white; }',
		'div.legend-candidate, div.legend-filler { font-size:13px; padding:3px 0 3px 3px; }',
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
		'#anp-logo { right:64px; width:48px; background: url(', imgUrl('anp-tk2012-48x48-masked.png'), ') no-repeat; display:none; }',
		'#anp-attrib { display:none; position:absolute; font-family: Arial,sans-serif; font-size:13px; color:#444; text-align:right; right:2px; bottom:22px; }',
		'body.source-gop #ap-logo, body.source-anp #ap-logo { display:none; }',
		'body.source-anp #anp-logo, body.source-anp #anp-attrib { display:block; }',
		'#google-logo { right:4px; background: url(', imgUrl('google-politics-48.png'), ') no-repeat; }',
		'body.source-anp #google-logo, body.source-anp #anp-logo { bottom:38px; }',
		'#gop-logo { right:64px; width:48px; background: url(', imgUrl('gop-nv-48.png'), ') no-repeat; }',
		'body.hidelogo #gop-logo, body.hidelogo #ap-logo, body.hidelogo #anp-logo  { right:4px; }',
		'body.hidelogo #google-logo { display:none; }',
		'body.ie7 #gop-logo, body.ie7 #ap-logo, body.ie7 #anp-logo { right:4px; }',
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
	'<a id="anp-logo" class="logo" target="_blank" href="http://www.anp.nl/" title="', 'anpCopyright'.T(), '">',
	'</a>',
	'<a id="google-logo" class="logo" target="_blank" href="http://www.google.fr/elections/ed/fr" title="', 'googlePoliticsTitle'.T(), '">',
	'</a>',
	'<div id="error" style="display:none;">',
	'</div>',
	'<div id="anp-attrib">',
		'anpCopyright'.T(),
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
			'<div id="sidebar">',
				formatSidebarTable( [] ),
			'</div>',
			'<div id="topbar">',
				formatTopbar(),
			'</div>',
			'<div style="width:100%;">',
				'<div id="map" style="width:100%; height:100%;">',
				'</div>',
			'</div>',
		'</div>'
	);
}

function formatSidebarTable( cells ) {
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

	function formatTopbar() {
		return S(
			'<div id="topbar-content" style="position:relative;">',
				//'<div style="margin:0; padding:3px; float:right;">',
				//	//'<a class="button', params.year == 2007 ? ' selected' : '', '" id="btn2007">',
				//	//	2007,
				//	//'</a>',
				//	//'&nbsp;',
				//	//'<a class="button', params.year == 2012 ? ' selected' : '', '" id="btn2012">',
				//	//	2012,
				//	//'</a>',
				//	//'&nbsp;&nbsp;&nbsp;&nbsp;',
				//	//'<a class="button', params.contest == 'pres' ? ' selected' : '', '" id="btnContest-pres">',
				//	//	'presidential'.T(),
				//	//'</a>',
				//	//'&nbsp;',
				//	//'<a class="button', params.contest == 'leg' ? ' selected' : '', '" id="btnContest-leg">',
				//	//	'legislative'.T(),
				//	//'</a>',
				//	//'&nbsp;&nbsp;&nbsp;&nbsp;',
				//	//'<a class="button', params.round == 1 ? ' selected' : '', '" id="btnRound1">',
				//	//	'round1'.T(),
				//	//'</a>',
				//	//'&nbsp;',
				//	//'<a class="button',
				//	//			params.round == 2 ? ' selected' : '', '" id="btnRound2">',
				//	//	'round2'.T(),
				//	//'</a>',
				//'</div>',
				//'<div style="clear:both;">',
				//'</div>',
			'</div>'
		);
	}
	
function nationalEnabled() {
	return ! current.national;
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
	
	var geoJSON = {};
	function loadRegion( geoid ) {
		var level =
			params.level != null ? params.level :
			'512';
		geoid = geoid || current.geoid;
		var json = geoJSON[geoid];
		if( json ) {
			loadGeoJSON( json, true );
		}
		else {
			var file = S( 'nl-', geoid, '-', level, '.js' );
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
		var geoid = json.muni.id;
		current.national = ( geoid == 'NL' );
		current.geoid = geoid;
		if( ! geoJSON[geoid] ) {
			geoJSON[geoid] = json;
			for( var kind in json ) {
				var geo = json[kind];
				indexFeatures( geo );
			}
			var tweak = tweakGeoJSON[geoid];
			tweak && tweak( json, geoid );
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
	
	var tweakGeoJSON = {
		NL: function( json, geoid ) {
			var features = json.muni.features;
			nlTempHack( features );
			addLivingAbroad( features );
		}
	}
	
	function nlTempHack( features ) {
		function fix( points ) {
			var dx = nlDX, dy = nlDY;
			for( var i = 0, n = points.length - 1;  i < n;  i += 2 ) {
				points[i] += dx;
				points[i+1] += dy;
			}
		}
		features.forEach( function( feature ) {
			fix( feature.bbox );
			fix( feature.centroid );
			feature.geometry.coordinates.forEach( function( poly ) {
				poly.forEach( function( ring ) {
					ring.forEach( function( point ) {
						fix( point );
					});
				});
			});
		});
	}
	
	function addLivingAbroad( features ) {
		var width = 210000, height = 150000;
		var env = envelope( width, height );
		var feature = {
			bbox: env.bbox,
			centroid: [ 0, 0 ],
			click: false,
			draw: true,
			geometry: {
				coordinates: env.coordinates,
				type: 'MultiPolygon'
			},
			id: 'GM0998',
			name: "Briefstemmers",
			type: 'Feature'
		};
		features.push( feature );
		features.by['GM0998'] = feature;
	}
	
	function envelope( width, height ) {
		var right = width / 2, left = -right, top = height / 2, bottom = -top,
			peak = top - right, inset = 2 / 35 * width,
			cornerY = inset / 2, cornerX = peak + cornerY;
		
		return {
			bbox: [ left, bottom, right, top ],
			coordinates: [
				//[[	// outer
				//	[ left, bottom ],
				//	[ left, top ],
				//	[ right, top ],
				//	[ right, bottom ]
				//]],
				[[	// flap
					[ 0, peak ],
					[ left, top ],
					[ right, top ]
				]],
				[[	// left
					[ left, bottom ],
					[ left, top ],
					[ cornerX, -cornerY ],
					[ left + inset, bottom ]
				]],
				[[	// right
					[ right, bottom ],
					[ right, top ],
					[ -cornerX, -cornerY ],
					[ right - inset, bottom ]
				]],
				[[	// bottom
					[ left + inset, bottom ],
					[ cornerX, -cornerY ],
					[ 0, peak ],
					[ -cornerX, -cornerY ],
					[ right - inset, bottom ]
				]]
			]
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
				if( ! current.party ) {
					i = 0;
				}
				else {
					for( var i = 0;  i < topCandidates.length;  ++i ) {
						if( topCandidates[i].id == current.party ) {
							++i;
							if( i >= topCandidates.length )
								i = -1;
							break;
						}
					}
				}
				current.party = ( i >= 0  &&  topCandidates[i].id );
				setCandidate( current.party );
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
			//			showTip({ geo:geo, feature:feature });
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
	
	$body.addClass( autoplay() ? 'autoplay' : 'interactive' );
	$body.addClass( tv() ? 'tv' : 'web' );
	// TODO: refactor with duplicate code in geoReady() and resizeViewNow()
	var mapWidth = ww - sidebarWidth;
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
		setLegend();
		resizeViewOnly();
		if( geoMoveNext ) {
			geoMoveNext = false;
			moveToGeo();
		}
		else {
			polys();
		}
		//$('#view-usa').toggle( state.fips != '00' );
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
		return [ json.muni ];
	}
	
	function moveToGeo() {
		var json = geoJSON[current.geoid];
		if( ! json ) return;
		$('#map').show();
		initMap();
		gme && map && gme.trigger( map, 'resize' );
		//overlays.clear();
		//$('script[title=jsonresult]').remove();
		//if( json.status == 'later' ) return;
		
		outlineFeature( null );
		
		var bboxNL = {
			//bbox: [ 373491, 6536883, 803613, 7043980 ]
			bbox: [ 373491+nlDX, 6536883+nlDY, 803613+nlDX, 7043980+nlDY ]
		};
		
		var geo = {
			'NL': bboxNL,
			_: 0
		}[current.geoid] || json.muni;
		geo && fitBbox( geo.bbox );
	}
	
	var setCenter = 'setCenter';
	function fitBbox( bbox ) {
		addBboxOverlay( bbox );
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
		
		// Force a poly draw if the map is not going to move (much)
		// TODO: better calculation using pixel position
		var centerLL = PolyGonzo.Mercator.coordToLngLat([
			( bbox[0] + bbox[2] ) / 2,
			( bbox[1] + bbox[3] ) / 2,
		]);
		var centerNew = new gm.LatLng( centerLL[1], centerLL[0] );
		function near( a, b ) { return Math.abs( a - b ) < .001; }
		var centerMap = map.getCenter();
		if( centerMap  &&  z == map.getZoom() ) {
			if(
				near( centerMap.lat(), centerLL[1] )  &&
				near( centerMap.lng(), centerLL[0] )
			) {
				polys();
			}
		}
		map.setZoom( z );
		map[setCenter]( centerNew );
		setCenter = 'panTo';
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
	
	var bboxOverlay;
	function addBboxOverlay( bbox ) {
		if( ! params.bbox ) return;
		if( bboxOverlay )
			bboxOverlay.setMap( null );
		bboxOverlay = null;
		var geo = makeBboxGeo( bbox, {
			fillColor: '#000000',
			fillOpacity: 0,
			strokeWidth: 1,
			strokeColor: '#FF0000',
			strokeOpacity: .5
		});
		bboxOverlay = new PolyGonzo.PgOverlay({
			map: map,
			geos: [ geo ]
		});
		bboxOverlay.setMap( map );
	}
	
	function makeBboxGeo( bbox, settings ) {
		var feature = $.extend( {}, {
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[ bbox[0], bbox[1] ],
						[ bbox[0], bbox[3] ],
						[ bbox[2], bbox[3] ],
						[ bbox[2], bbox[1] ],
						[ bbox[0], bbox[1] ]
					]
				]
			}
		}, settings );
		return {
			crs: {
				type: 'name',
				properties: {
					name: 'urn:ogc:def:crs:EPSG::3857'
				}
			},
			features: [ feature ]
		}
	}
	
	var  mouseFeature;
	
	var dragged = false;
	function addMapListeners( map ) {
		gme.addListener( map, 'dragstart', function() {
			dragged = true;
		});
		gme.addListener( map, 'idle', function() {
			polys();
		});
/*
		nationalEnabled() && gme.addListener( map, 'zoom_changed', function() {
			var zoom = map.getZoom();
			if( zoom <= 4  &&  ! current.national )
				gotoGeo( '00', 'zoom' );
		});
*/
	}
	
	function maybeGo( where, feature, why ) {
		if(
			where.geo.id.slice(0,2) == 'FR'  &&
			feature.id != current.geoid  &&
			feature.click !== false
		) {
			gotoGeo( feature, why );
		}
	}
	
	var touch;
	if( params.touch ) touch = { mouse: true };
	var polysThrottle = throttle(200), showTipThrottle = throttle(200);
	
	var mousedown = false;
	var polyEvents = {
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
				if( feature && feature.id == current.geoid )
					where = feature = null;
				var cursor =
					! feature ? null :
					where.geo.id.slice(0,2) == 'FR'  &&  feature.click !== false ? 'pointer' :
					'default';
				map.setOptions({ draggableCursor: cursor });
				outlineFeature( where );
				showTipThrottle( function() { showTip(where); });
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
				showTip( touch.where );
				touch.moveTip = true;
			}
			else {
				maybeGo( where, feature, 'tap' );
			}
		},
		touchcancel: function( event, where ) {
			delete touch.where;
			outlineFeature( null );
			showTip( false );
		},
		click: function( event, where ) {
			event.stopPropagation();
			if( touch  &&  ! touch.mouse ) return;
			mousedown = false;
			var didDrag = dragged;
			dragged = false;
			polyEvents.mousemove( event, where );
			if( didDrag ) return;
			var feature = where && where.feature;
			if( ! feature ) return;
			if( touch && touch.mouse ) {
				touch.where = where;
				this.touchend( event, where );
			}
			else {
				maybeGo( where, feature, 'click' );
			}
		}
	};
	
	function draw() {
		var geos = currentGeos();
		if( useInset() )
			geos.unshift( insetGeo() );
		var overlay = new PolyGonzo.PgOverlay({
			map: map,
			geos: geos,
			underlay: getInsetUnderlay,
			events: playType() ? {} : polyEvents
		});
		overlay.setMap( map );
		setTimeout( function() {
			overlays.clear();
			overlays.push( overlay );
		}, 1 );
		//overlay.redraw( null, true );
	}
	
	function polys() {
		outlineFeature( null );
		colorize();
		//overlays.clear();
		// Let map display before drawing polys
		//var pt = polyTimeNext;
		//polyTimeNext = 0;
		//if( pt )
		//	setTimeout( draw, 250 );
		//else
			draw();
	}
	
	function colorize() {
		var json = geoJSON[current.geoid];
		colorVotes( json.muni, '#666666', 1, 1 );
		//colorSimple( json.prov, '#FFFFFF', '#444444', 1, 1.5 );
		//colorSimple( json.nation, '#FFFFFF', '#222222', 1, 2 );
	}
	
	function colorSimple( geo, fillColor, strokeColor, strokeOpacity, strokeWidth ) {
		if( ! geo ) return;
		var features = geo.features;
		for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
			feature.fillColor = fillColor;
			feature.fillOpacity = 0;
			feature.strokeColor = strokeColor;
			feature.strokeOpacity = strokeOpacity;
			feature.strokeWidth = strokeWidth;
		}
	}
	
	function colorVotes( geo, strokeColor, strokeOpacity, strokeWidth ) {
		if( ! geo ) return;
		var colIncr = 1;
		var features = geo.features;
		var time = now() + times.offset;
		var results = geoResults();
		var cols = results && results.cols, col = results && results.colsById;
		var parties = election.parties;
		if( !( parties && current.party ) ) {
			// Multiple party view
			for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
				var row = featureResults( results, feature );
				if( ! row  ||  row.candidateMax < 0 ) {
					var candidate = null;
				}
				else {
					var id = ( cols[row.candidateMax] || '' ).replace( 'TabCount-', '' );
					var candidate = row && id && election.candidates.by.id[id];
				}
				if( candidate ) {
					feature.fillColor = candidate.color;
					feature.fillOpacity = .6;
				}
				else {
					feature.fillColor = '#FFFFFF';
					feature.fillOpacity = 0;
				}
				//var complete = row &&
				//	row[col.NumCountedBallotBoxes] ==
				//	row[col.NumBallotBoxes];
				feature.strokeColor = strokeColor;
				feature.strokeOpacity = strokeOpacity;
				feature.strokeWidth = strokeWidth;
			}
		}
		else {
			// Single party heatmap
			var rows = results.rows;
			var minFract = Infinity, maxFract = 0;
			var partyID = current.party, party = parties.by.id[partyID],
				color = party.color;
			var iColParty = results.colsById[ 'TabCount-' + partyID ];
			var colID = col.ID;
			for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
				var row = featureResults( results, feature );
				var total = 0, value = 0;
				if( row ) {
					for( var iCol = 0;  iCol < colID;  iCol += colIncr )
						total += row[iCol];
					value = row[iColParty];
					var fract = row.fract = total ? value / total : 0
					if( fract ) {
						minFract = Math.min( minFract, fract );
						maxFract = Math.max( maxFract, fract );
					}
				}
			}
			var fractRange = maxFract - minFract;
			for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
				var row = featureResults( results, feature );
				feature.fillColor = party.color;
				feature.fillOpacity =
					! row  ||  row.fract == 0 ?
						0 :
					fractRange > 0 ?
						( row.fract - minFract ) / fractRange * .75 :
						.75;
				//var complete = row &&
				//	row[col.NumCountedBallotBoxes] ==
				//	row[col.NumBallotBoxes];
				feature.strokeColor = strokeColor;
				feature.strokeOpacity = strokeOpacity;
				feature.strokeWidth = strokeWidth;
			}
		}
	}
	
	function useInset() {
		return true;
	}
	
	function getInsetUnderlay() {
		var zoom = map.getZoom();
		var extra = zoom - 5;
		var pow = Math.pow( 2, extra );
		function clear( feature ) {
			delete feature.zoom;
			delete feature.offset;
		}
		function set( feature, z, x, y, centroidFeature ) {
			var centroid = ( centroidFeature || feature ).centroid;
			var p = PolyGonzo.Mercator.coordToPixel( centroid, z );
			feature.zoom = z + extra;
			feature.offset = { x: ( x - p[0] ) * pow, y: ( y - p[1] ) * pow };
		}
		function insetAll( action ) {
			function inset( id, z, x, y ) {
				var feature = featuresMuni[id];
				if( feature ) {
					action( feature, z, x, y );
					//var featureRgn = featuresRgn[ '0' + feature.code_reg ];
					//if( featureRgn )
					//	action( featureRgn, z, x, y, feature );
				}
			}
			inset( 'GM9003', 5.8, 85, -1427 );  // Saba
			inset( 'GM9002', 5.8, 89, -1423 );  // Sint Eustatius
			inset( 'GM9001', 5.0, 84, -1416.5 );  // Bonaire
			inset( 'GM0998', 2.1, 95, -1415 );  // Overseas
		}
		var geo = geoJSON[current.geoid];
		if( ! geo ) return null;
		var featuresMuni = geo.muni.features.by;
		//var featuresRgn = geo.region.features.by;
		if( ! useInset() ) {
			insetAll( clear );
			return null;
		}
		insetAll( set );
		return null;
	}
	
	function insetGeo() {
		var bbox = [ 385000, 6900000, 491000, 7000000 ];
		var geo = makeBboxGeo( bbox, {
			fillColor: '#F8F8F8',
			fillOpacity: 1,
			strokeWidth: 1.5,
			strokeColor: '#222222',
			strokeOpacity: 1
		});
		geo.hittest = false;
		geo.click = false;
		return geo;
	}
	
	function hittestBboxes( features, places, x, y ) {
		for( var place, i = -1;  place = places[++i]; ) {
			var b = place.bbox;
			if( x >= b[0]  &&  x < b[2]  &&  y >= b[1]  &&  y < b[3] )
				return features.by[place.id];
		}
		return null;
	}
	
	// TODO: refactor this into PolyGonzo
	var outlineOverlay;
	function outlineFeature( where ) {
		if( outlineOverlay )
			outlineOverlay.setMap( null );
		outlineOverlay = null;
		if( !( where && where.feature ) ) return;
		var faint = ( where.geo.draw === false );
		var feat = $.extend( {}, where.feature, {
			fillColor: '#000000',
			fillOpacity: 0,
			strokeWidth: playCounties() ? 5 : opt.counties ? 1.5 : 2.5,
			strokeColor: '#000000',
			strokeOpacity: faint ? .25 : 1
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
	
	function showTip( where ) {
		tipHtml = formatTip( where );
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
					imgUrl( S( 'candidate-photos-fr-', params.year, '-', size, '.png' ) ),
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
	
	function formatSidebarReporting( results ) {
		var totals = results.totals,
			col = totals.colsById.NumCountedBallotBoxes,
			counts = totals.row[col],
			total = counts[0] + counts[1] + counts[2];
		function formatRow( iCount, title ) {
			var count = counts[iCount];
			return count ? S(
				'<tr>',
					'<td align="right">', count, '</td>',
					'<td>', title.T(), ' (', formatPercent( count / total ),  ')</td>',
					//'<td>', title.T(), '</td>',
					//'<td align="right">(', formatPercent( count / total ),  ')</td>',
				'</tr>'
			) : '';
		}
		return S(
			'<table>',
				formatRow( 2, 'finalResults' ),
				formatRow( 1, 'partialResults' ),
				formatRow( 0, 'waitingForVotes' ),
			'</table>'
		);
	}
	
	function getTopCandidates( results, row, sortBy, max ) {
		var showAll = false;
		var colIncr = 1;
		max = max || Infinity;
		if( ! row ) return [];
		var col = results.colsById;
		if( row == -1 ) {
			row = results.totals.row;
			col = results.totals.colsById;
			colIncr = 1;
		}
		var top = ( row.candidates || results.parties || [] ).slice();
		var total = 0;
		for( var i = 0, iCol = 0;  i < top.length; ++i, iCol += colIncr ) {
			total += row[iCol];
		}
		for( var i = 0, iCol = 0;  i < top.length; ++i, iCol += colIncr ) {
			var candidate = top[i], votes = row[iCol];
			candidate.votes = votes;
			candidate.vsAll = votes / total;
			//candidate.total = total;
		}
		top = sortArrayBy( top, sortBy, { numeric:true } )
			.reverse()
			.slice( 0, max );
		if( ! showAll )
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
		makeCurrentCandidateValid();
		$('#topbar').html( formatTopbar() );
		$('#sidebar').html( formatSidebar() );
	}
	
	function makeCurrentCandidateValid() {
		if( ! current.party )
			return;
		var results = geoResults();
		var col = results.totals.colsById[ 'TabCount-' + current.party ];
		if( ! results.totals.row[col] )
			current.party = null;
	}
	
	function nameCase( name ) {
		return name && name.split(' ').map( function( word ) {
			return word.slice( 0, 1 ) + word.slice( 1 ).toLowerCase();
		}).join(' ');
	}
	
	function testFlag( results ) {
		return debug && results && ( results.mode == 'test'  ||  opt.randomized );
	}
	
	function viewNationalEnabled() {
		return ! current.national  &&  nationalEnabled();
	}
	
	function formatSidebar() {
		var resultsHeaderHTML = '';
		var resultsScrollingHTML = '';
		var geo = currentGeo();
		var results = geoResults();
		if( results ) {
			var topCandidates = getTopCandidates( results, -1, 'votes' );
			var none = ! topCandidates.length;
			var top = none ? '' : formatSidebarTopCandidates( topCandidates.slice( 0, 4 ) );
			var test = testFlag( results );
			var viewNational = nationalEnabled() ? S(
				'<a href="#" id="viewNational" title="', 'titleViewNational-fr'.T(), '" style="">',
					'viewNational-fr'.T(),
				'</a>'
			) : '&nbsp;';
			resultsHeaderHTML = S(
				'<div id="percent-reporting" class="body-text">',
					formatSidebarReporting( results ),
				'</div>',
				'<div id="auto-update" class="subtitle-text" style="margin-bottom:8px; ',
					test ? 'color:red; font-weight:bold;' : '',
				'">',
					test ? 'testData'.T() : 'automaticUpdate'.T(),
				'</div>',
				'<div style="padding-bottom:3px;">',
					viewNational,
				'</div>'
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
		//var linkHTML = !(
		//	params.usa ||
		//	params.hide_links ||
		//	params.embed_state
		//) ? S(
		//	'<a href="http://www.google.com/elections/ed/us/results/2012/gop-primary/',
		//			state.abbr.toLowerCase(),
		//			'" target="_parent" id="linkToMap" class="small-text" title="',
		//			'linkToMapTitle'.T(), '">',
		//		'linkToMap'.T(),
		//	'</a>'
		//) : '';
		return S(
			'<div id="sidebar">',
				'<div class="sidebar-header">',
					'<div id="election-title" class="title-text">',
						'<div style="font-weight:bold; padding:5px 0 0 2px; float:left;">',
							'theNetherlands'.T(),
						'</div>',

						'<div style="margin:0; padding:3px; float:right;">',
							'<a class="button', params.year == 2010 ? ' selected' : '', '" id="btn2010">',
								2010,
							'</a>',
							'&nbsp;',
							'<a class="button', params.year == 2012 ? ' selected' : '', '" id="btn2012">',
								2012,
							'</a>',
						'</div>',
						'<div style="clear:both;">',
						'</div>',


					'</div>',
					'<div id="election-date-row" class="" style="margin-bottom:8px; position:relative;">',
						'<div id="election-date" class="subtitle-text" style="float:left;">',
							longDateFromYMD( election.date ),
						'</div>',
						'<div id="map-link" class="small-text" style="float:right; padding-right:3px;">',
							//linkHTML,
						'</div>',
						'<div style="clear:both;">',
						'</div>',
					'</div>',
					'<div id="sidebar-results-header">',
						resultsHeaderHTML,
					'</div>',
				'</div>',
				'<div class="scroller" id="sidebar-scroll">',
					resultsScrollingHTML,
					//'<div id="sidebar-attrib" class="faint-text" style="padding:4px 8px 0; border-top:1px solid #C2C2C2;">',
					//	'frSource'.T(),
					//'</div>',
				'</div>',
			'</div>'
		);
	}
	
	function formatSidebarTopCandidates( topCandidates ) {
		var colors = topCandidates.map( function( candidate ) {
			return candidate.color;
		});
		var selected = current.party ? '' : ' selected';
		return S(
			'<tr class="legend-candidate', selected, '" id="legend-candidate-top">',
				'<td class="left">',
					'<div class="legend-candidate">',
						formatSpanColorPatch( colors, 2 ),
					'</div>',
				'</td>',
				'<td colspan="3" class="right">',
					'<div class="legend-candidate">',
						'allParties'.T(),
					'</div>',
				'</td>',
			'</tr>'
		);
	}
	
	function formatSidebarCandidate( candidate ) {
		var selected = ( candidate.id == current.party ) ? ' selected' : '';
		return S(
			'<tr class="legend-candidate', selected, '" id="legend-candidate-', candidate.id, '">',
				'<td class="left">',
					'<div class="legend-candidate">',
						formatSpanColorPatch( candidate.color, 8 ),
					'</div>',
				'</td>',
				'<td>',
					'<div class="legend-candidate">',
						candidate.name || candidate.lastName,
					'</div>',
				'</td>',
				'<td>',
					'<div class="legend-candidate" style="text-align:right;">',
						formatPercent( candidate.vsAll ),
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
				'<th colspan="1" style="padding-bottom:4px;">',
				'</th>',
				'<th colspan="2" style="text-align:center; padding-bottom:4px;">',
					'party'.T(),
				'</th>',
				'<th colspan="2" style="text-align:center; padding-bottom:4px;">',
					'votes'.T(),
				'</th>',
				//'<th style="text-align:right; padding-bottom:4px;">',
				//	//current.national  &&  view != 'county' ? 'delegatesAbbr'.T() : '',
				//'</th>',
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
		var selected = ( candidate.id == current.party ) ? ' selected' : '';
		var cls = i === 0 ? ' first' : '';
		var pct = formatPercent( candidate.vsAll );
		//var voteDivs = S(
		//	'<div class="candidate-percent">',
		//		pct,
		//	'</div>',
		//	web() ? S(
		//		'<div class="candidate-votes">',
		//			formatNumber( candidate.votes ),
		//		'</div>'
		//	) : ''
		//)
		return S(
			'<tr class="legend-candidate', cls, '" id="legend-candidate-', candidate.id, '">',
				'<td class="left">',
					election.photos ? S(
						'<div style="margin:6px 0;">',
							formatCandidateIcon( candidate, 32 ),
						'</div>'
					) : '',
				'</td>',
				'<td style="text-align:center;">',
					formatCandidateAreaPatch( candidate, 20 ),
				'</td>',
				'<td>',
					'<div class="candidate-name" style="',
								election.photos ? '' : 'margin-top:4px; margin-bottom:4px;',
							'">',
						'<div class="first-name">',
							candidate.firstName,
						'</div>',
						'<div class="last-name" style="font-weight:bold;">',
							//candidate.lastName,
							candidate.id,
						'</div>',
					'</div>',
				'</td>',
				'<td style="text-align:right; xpadding-left:6px;">',
					'<div class="candidate-percent">',
						pct,
					'</div>',
				'</td>',
				'<td style="text-align:right; xpadding-left:6px;">',
					'<div class="candidate-votes">',
						formatNumber( candidate.votes ),
					'</div>',
				'</td>',
				//'<td class="right" style="text-align:right; padding-left:6px;">',
				//	//current.national  &&  view != 'county' ? S(
				//	//	'<div class="candidate-delegates">',
				//	//		candidate.delegates,
				//	//	'</div>'
				//	//) : '',
				//'</td>',
			'</tr>'
		);
	}
	
	function ordinal( n ) {
		switch( params.hl ) {
			case 'fr':
				var suffix = ( n == 1 ? 're' : 'e' );
				break;
			default:
				var m = n > 20 ? n % 10 : n;
				var suffix = ( m == 1 ? 'st' : m == 2 ? 'nd' : m == 3 ? 'rd' : 'th' );
				break;
		}
		return n + suffix;
	}
	
	function formatFeatureName( feature ) {
		if( ! feature ) return '';
		return feature.name;
	}
	
	function formatTip( where ) {
		var feature = where && where.feature;
		if( ! feature ) return null;
		var geoid = where.feature.id;
		var future = false;
		var geo = where.geo, results = geoResults(geo), col = results && results.colsById;
		var row = geo.draw !== false  &&  featureResults( results, where.feature );
		var top = [];
		var iCount = 0;
		if( row  &&  col ) {
			row.geoid = geoid;
			row.geo = geo;
			top = getTopCandidates( results, row, 'votes', 8 );
			var content = S(
				'<div class="tipcontent">',
					formatCandidateList( top, formatListCandidate, false ),
				'</div>'
			);
			
			iCount = row[col.NumCountedBallotBoxes];
		}
		
		var reporting = [ 'waitingForVotes', 'partialResults', 'finalResults' ][iCount].T();
		
		//var clickForLocal =
		//	top.length &&
		//	current.national ? S(
		//		'<div class="click-for-local faint-text">',
		//			( feature.click === false ? 'noLocal' : touch ? 'tapForLocal' : 'clickForLocal' ).T(),
		//		'</div>'
		//	) : '';
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
							'TEST',  // 'testData'.T(),
						'</span>'
					) : '',
				'</div>',
			'</div>',
			content/*,
			clickForLocal*/
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
			if( params.debug == 'tip' ) return;
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
	
	// TODO: rewrite this
	function formatNumber( nStr ) {
		var dsep = 'decimalSep'.T(), tsep = 'thousandsSep'.T();
		nStr += '';
		x = nStr.split('.');
		x1 = x[0];
		x2 = x.length > 1 ? dsep + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while( rgx.test(x1) ) {
			x1 = x1.replace( rgx, '$1' + tsep + '$2' );
		}
		return x1 + x2;
	}
	
	function formatPercent( n ) {
		return percent1( n, 'decimalSep'.T() );
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
		outlineFeature( null );
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
				//position: gm.ControlPosition.TOP_RIGHT,
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
		
		var $topbar = $('#topbar');
		var $sidebar = $('#sidebar');
		$sidebar.delegate( 'tr.legend-candidate', {
			mouseover: function( event ) {
				$(this).addClass( 'hover' );
			},
			mouseout: function( event ) {
				$(this).removeClass( 'hover' );
			},
			click: function( event ) {
				var id = this.id.replace(/^legend-candidate-/,'');
				if( id == 'top'  ||  id == current.party ) id = null;
				$('#chkCycle').prop({ checked:false });
				stopCycle();
				setCandidate( id, 'click' );
			}
		});
		
		$topbar.delegate( 'a', {
			mouseover: function( event ) {
				if( ! $(this).hasClass('disabled') )
					$(this).addClass( 'hover' );
			},
			mouseout: function( event ) {
				if( ! $(this).hasClass('disabled') )
					$(this).removeClass( 'hover' );
			}
		});
		
		$sidebar.delegate( '#btn2010,#btn2012', {
			click: function( event ) {
				setYear( this.id.replace(/^btn/, '' ) );
				event.preventDefault();
			}
		});
		
		//$topbar.delegate( '#btnContest-pres,#btnContest-leg', {
		//	click: function( event ) {
		//		setContest( this.id.replace(/^btnContest-/, '' ) );
		//		event.preventDefault();
		//	}
		//});
		
		//$topbar.delegate( '#btnRound1,#btnRound2', {
		//	click: function( event ) {
		//		if( ! $(this).hasClass('disabled') )
		//			setRound( this.id.replace(/^btnRound/, '' ) );
		//		event.preventDefault();
		//	}
		//});
		
		//$sidebar.delegate( '#viewNational', {
		//	click: function( event ) {
		//		gotoGeo( 'NL', 'return' );
		//		event.preventDefault();
		//	}
		//});
		
		//$sidebar.delegate( '#btnCycle', {
		//	click: function( event ) {
		//		toggleCycle();
		//	}
		//});
		
		setCandidate = function( id, why ) {
			current.party = id;
			loadView();
			if( why ) analytics( why, 'candidate', id || 'all' );
		}
	}
	
	function setContest( contest ) {
		$body.removeClass( 'source-' + params.source );
		params.contest = contest;
		if( contest == 'leg' ) {
			params.source = 'articque';
			current.geoid = 'FRL';
			current.national = true;
			delete current.party;
		}
		else {
			delete params.source;
			current.geoid = 'FR';
			current.national = true;
			delete current.party;
		}
		$body.addClass( 'source-' + params.source );
		setElection();
		loadView();
	}
	
	function setRound( round ) {
		params.round = round;
		setElection();
		loadView();
	}
	
	function setYear( year ) {
		params.year = year;
		setElection();
		loadView();
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
		
		$('#topbar').css({
			position: 'absolute',
			left: sidebarWidth,
			top: 0,
			width: ww - sidebarWidth
		});
		var topbarHeight = $('#topbar').height() + 1;
		var mapLeft = sidebarWidth, mapTop = topbarHeight;
		var mapWidth = ww - mapLeft, mapHeight = wh - mapTop;
		var $sidebarScroll = $('#sidebar-scroll');
		$sidebarScroll.height( wh - $sidebarScroll.offset().top );
		
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
	
	function geoResults( geo ) {
		var results = ( geo || currentGeo() || {} ).results;
		return results && results[electionKey];
	}
	
	var cacheResults = new Cache;
	
	function getResults() {
		var electionid = election.electionids[current.geoid];
		
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
		
		getElections([ electionid ]);
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
		//delete params.randomize;
		
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
			var colID = col.ID;
			row[colID] = feature.id;
			var nVoters = 0;
			var nPrecincts = row[col.NumBallotBoxes] = random( 50 ) + 5;
			var nCounted = row[col.NumCountedBallotBoxes] =
				params.randomize == '100' ? nPrecincts :
				Math.max( 0,
					Math.min( nPrecincts,
						random( nPrecincts * 2 ) -
						Math.floor( nPrecincts / 2 )
					)
				);
			var total = 0;
			for( var iCol = -1;  ++iCol < colID; )
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
	
	handleJSONPError = function( json ) {
		//json = {
		//	"status": "REQUEST_FAILED",
		//	"error": {
		//		"code": 500,
		//		"debug_message": "Internal Server Error"
		//	}
		//};
		window.console && console.log( S(
			'JSON error: ', json.status, ' ',
			json.error && json.error.code, ' ', 
			json.error && json.error.debug_message
		) );
		// TODO: report to user? retry?
	};
	
	loadFilteredResults = function( json, electionid, geoid, mode ) {
		electionid += '&district=' + geoid;
		deleteFromArray( electionsPending, electionid );
		json.electionid = '' + electionid;
		json.mode = mode;
		loadResultTable( json, true );
	};
	
	loadResults = function( json, electionid, mode ) {
		deleteFromArray( electionsPending, electionid );
		json.electionid = '' + electionid;
		json.mode = mode;
		loadResultTable( json, true );
	};
	
	//var lsadPrefixes = {
	//	cd: 'district'.T() + ' ',
	//	shd: 'district'.T() + ' '
	//};
	
	//var lsadSuffixes = {
	//	city: ' ' + 'city'.T(),
	//	county: ' ' + 'county'.T()
	//};
	
	function featureResults( results, feature ) {
		if( !( results && feature ) ) return null;
		return results.rowsByID[feature.id];
	}
	
	var missingOK = {
		//US: { AS:1, GU:1, MP:1, PR:1, VI:1 }
	};
	
	function fixup( geoid, id ) {
		if( id === null )
			return null;
		switch( geoid ) {
			case '013':
				if( id == '055' )
					return null;
				if( id.match( /^055SR(\d\d)$/ ) )
					return null;
				var m = id.match( /^055AR(\d\d)$/ );
				if( m )
					return '2' + m[1];
				break;
			case '069':
				if( id == '123' )
					return null;
				var m = id.match( /^123AR0(\d)$/ );
				if( m )
					return '38' + m[1];
				break;
			case '075':
				if( id == '056' )
					return null;
				var m = id.match( /^056AR(\d\d)$/ );
				if( m )
					return '1' + m[1];
				break;
		}
		return id;
	}
	
	function loadResultTable( json, loading ) {
		if( loading )
			cacheResults.add( json.electionid, json, opt.resultCacheTime );
		
		var geo = currentGeo();  //  geoJSON[current.geoid];
		geo.results = geo.results || {};
		var results = geo.results[electionKey] = json.table;
		results.mode = json.mode;
		var zero = ( json.mode == 'test'  &&  ! debug );
		
		var col = results.colsById = {};
		col.candidates = 0;
		var cols = results.cols;
		for( var id, iCol = -1;  id = cols[++iCol]; ) {
			col[id] = iCol;
		}
		var colID = col.ID;
		
		var colIncr = 1;
		
		var rowT = [], colsT = [], colT = {};
		rowT.candidates = [];
		var totals = results.totals = {
			row: rowT,
			cols: colsT,
			colsById: colT
		};
		function totalPush( prefix, id, value, party ) {
			var colID = prefix ? prefix + id : id;
			colT[colID] = colsT.length;
			colsT.push( colID );
			rowT.push( value );
			if( party ) {
				rowT.candidates.push({
					color: party.color,
					id: id,
					party: party,
					name: party.name,
					// for candidates:
					firstName: party.firstName,
					lastName: party.lastName,
					fullName: party.fullName
				});
			}
		}
		election.parties.forEach( function( party ) {
			totalPush( 'TabCount-', party.id, 0, party );
		});
		totalPush( null, 'TabTotal', 0 );
		totalPush( null, 'NumBallotBoxes', 0 );
		totalPush( null, 'NumCountedBallotBoxes', [0,0,0] );
		
		//var fix = state.fix || {};
		var features = geo.features;
		
		var rowsByID = results.rowsByID = {};
		var rows = results.rows;
		
		// Fix up NL
		if( ! results.didFixup ) {
			for( var row, iRow = -1;  row = rows[++iRow]; ) {
				row[colID] = 'GM' + row[colID];
			}
			results.didFixup = true;
		}
		
		var geoid = geo.id;
		var winners = current.geoid == 'FRL' && election.winners;
		if( winners  &&  ! results.didWinners ) {
			results.didWinners = true;
			for( var id in winners ) {
				var winner = winners[id];
				var row = [];
				row[0] = 1;
				row[1] = winner.firstName;
				row[2] = winner.lastName;
				row[3] = winner.party;
				for( var iCol = 4;  iCol < colID;  iCol += colIncr ) {
					row[iCol] = 0;
					row[iCol+1] = '';
					row[iCol+2] = '';
					row[iCol+3] = '';
				}
				row[colID] = id;
				row[col.TabTotal] = 1;
				row[col.NumBallotBoxes] = 1;
				row[col.NumCountedBallotBoxes] = [0,0,0];
				rows.push( row );
				rowsByID[id] = row;
			}
		}
		for( var row, iRow = -1;  row = rows[++iRow]; ) {
			var id = row[colID];
			row[colID] = id = fixup( geoid, id );
			if( id === null ) continue;
			//var fixed = fix[id];
			//if( fixed ) {
			//	id = row[colID] = fixed;
			//}
			rowsByID[id] = row;
			if( /^\d\d000$/.test(id) ) rowsByID[id.slice(0,2)] = row;
			var max = 0,  candidateMax = -1;
			if( zero ) {
				for( var iCol = 0;  iCol < colID;  iCol += colIncr ) {
					row[iCol] = 0;
				}
				row[col.TabTotal] = 0;
				rowT[colT.NumBallotBoxes] += row[col.NumBallotBoxes];
				row[col.NumCountedBallotBoxes] = [0,0,0];
			}
			else {
				var candidates = row.candidates = [];
				for( var iCol = 0;  iCol < colID;  ++iCol ) {
					var idCol = cols[iCol], id = idCol.replace( 'TabCount-', '' );
					candidates.push( election.candidates.by.id[id] );
					var count = row[iCol];
					rowT[ colT[idCol] ] += count;
					if( count > max ) {
						max = count;
						candidateMax = iCol;
					}
				}
				rowT[colT.TabTotal] += row[col.TabTotal];
				rowT[colT.NumBallotBoxes] += row[col.NumBallotBoxes];
				++rowT[colT.NumCountedBallotBoxes][ row[col.NumCountedBallotBoxes] ];
			}
			row.candidateMax = candidateMax;
		}
		var missing = [];
		if( debug  &&  ! features.didMissingCheck ) {
			for( var row, iRow = -1;  row = rows[++iRow]; ) {
				var id = row[colID];
				if( ! features.by[id] )
					missing.push( S( id, ' in results but not in GeoJSON' ) );
			}
			for( var feature, iFeature = -1;  feature = features[++iFeature]; ) {
				var id = feature.id;
				if( ! rowsByID[id] )
					missing.push( S( id, ' in GeoJSON but not in results' ) );
			}
			features.didMissingCheck = true;
		}
		
		if( electionsPending.length == 0 )
			geoReady();
		
		if( debug == 'verbose'  ||  ( missing.length  &&  debug  &&  debug != 'quiet' ) ) {
			if( ! missing.length ) missing.push( 'none' );
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
