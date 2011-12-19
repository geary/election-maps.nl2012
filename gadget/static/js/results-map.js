// results-map.js
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

// Keep this in sync with ALL_ALL.xml
var strings = {
	//nationwideLabel: 'Tüm Türkiye',
	//chooseLabel: 'Choose a state and select a race:',
	//stateLabel: 'İller:&nbsp;',
	//candidateLabel: 'Partiler:&nbsp;',
	topCandidate: 'Top Candidates',
	topCandidateShort: 'Top',
	//secondCandidate: 'Second',
	//thirdCandidate: 'Third',
	//fourthCandidate: 'Fourth',
	//turkey: 'Turkey',
	//countiesCheckbox: 'İlçeleri Göster',
	//legendLabel: 'Türkiye Genelinde Sonuçlar:',
	percentReporting: '{{percent}} reporting ({{counted}}/{{total}})',
	//countdownHeading: 'Live results in:',
	//countdownHours: '{{hours}} hours',
	//countdownHour: '1 hour',
	//countdownMinutes: '{{minutes}} minutes',
	//countdownMinute: '1 minute',
	noVotes: 'No votes reported'
};

var candidates = [
	{ color: '#FF0000', id: 'bachmann', firstName: 'Michelle', lastName: 'Bachmann', fullName: 'Michelle Bachmann' },
	{ color: '#00FF00', id: 'gingrich', firstName: 'Newt', lastName: 'Gingrich', fullName: 'Newt Gingrich' },
	{ color: '#0000FF', id: 'huntsman', firstName: 'Jon', lastName: 'Huntsman', fullName: 'Jon Huntsman' },
	{ color: '#00FFFF', id: 'johnson', firstName: 'Gary', lastName: 'Johnson', fullName: 'Gary Johnson' },
	{ color: '#FF00FF', id: 'paul', firstName: 'Ron', lastName: 'Paul', fullName: 'Ron Paul' },
	{ color: '#FFFF00', id: 'perry', firstName: 'Rick', lastName: 'Perry', fullName: 'Rick Perry' },
	{ color: '#800000', id: 'romney', firstName: 'Mitt', lastName: 'Romney', fullName: 'Mitt Romney' },
	{ color: '#008000', id: 'santorum', firstName: 'Rick', lastName: 'Santorum', fullName: 'Rick Santorum' }
];


// Voting results column offsets
var col = {};
col.candidates = 0;
col.ID = candidates.length;
col.NumVoters = col.ID + 1;
col.NumBallotBoxes = col.ID + 2;
col.NumCountedBallotBoxes = col.ID + 3;

function resultsFields() {
	return S(
		candidates.map( function( candidate ) {
			return S( "'VoteCount-", candidate.id, "'" );
		}).join( ',' ),
		',ID,NumVoters',
		',NumBallotBoxes,NumCountedBallotBoxes'
	);
}

document.write(
	'<style type="text/css">',
		'html, body { margin:0; padding:0; border:0 none; }',
	'</style>'
);

var gm = google.maps, gme = gm.event;

var $window = $(window), ww = $window.width(), wh = $window.height();

var data = {
	counties: { geo:null, results:null },
	states: { geo:null, results:null }
};

var $map, mapPixBounds;

var debug = prefs.getBool('debug');

opt.state = prefs.getString('state');
opt.counties = true;
opt.candidate = '1';
//opt.zoom = opt.zoom || 3;
opt.fontsize = '15px';
var sw = 300;

//opt.resultCacheTime = 60 * 1000;
opt.resultCacheTime = Infinity;  // cache forever
//opt.reloadTime = 120 * 1000;
opt.reloadTime = false;  // no auto-reload

opt.imgUrl = opt.imgUrl || opt.codeUrl + 'images/';
opt.shapeUrl = opt.shapeUrl || opt.codeUrl + 'shapes/json/';

var zoom;

if( ! Array.prototype.forEach ) {
	Array.prototype.forEach = function( fun /*, thisp*/ ) {
		if( typeof fun != 'function' )
			throw new TypeError();
		
		var thisp = arguments[1];
		for( var i = 0, n = this.length;  i < n;  ++i ) {
			if( i in this )
				fun.call( thisp, this[i], i, this );
		}
	};
}

if( ! Array.prototype.map ) {
	Array.prototype.map = function( fun /*, thisp*/ ) {
		var len = this.length;
		if( typeof fun != 'function' )
			throw new TypeError();
		
		var res = new Array( len );
		var thisp = arguments[1];
		for( var i = 0;  i < len;  ++i ) {
			if( i in this )
				res[i] = fun.call( thisp, this[i], i, this );
		}
		
		return res;
	};
}

Array.prototype.mapjoin = function( fun, delim ) {
	return this.map( fun ).join( delim || '' );
};

if( ! Array.prototype.index ) {
	Array.prototype.index = function( field ) {
		this.by = this.by || {};
		if( field ) {
			var by = this.by[field] = {};
			for( var i = 0, n = this.length;  i < n;  ++i ) {
				var obj = this[i];
				by[obj[field]] = obj;
				obj.index = i;
			}
		}
		else {
			var by = this.by;
			for( var i = 0, n = this.length;  i < n;  ++i ) {
				var str = this[i];
				by[str] = str;
				str.index = i;
			}
		}
		return this;
	};
}

Array.prototype.random = function() {
	return this[ randomInt(this.length) ];
};

// See scriptino-base.js in scriptino project for documentation
function sortArrayBy( array, key, opt ) {
	opt = opt || {};
	var sep = unescape('%uFFFF');
	var i = 0, n = array.length, sorted = new Array( n );
	
	// Separate loops for each case for speed
	if( opt.numeric ) {
		if( typeof key == 'function' ) {
			for( ;  i < n;  ++i )
				sorted[i] = [ ( 1000000000000000 + key(array[i]) + '' ).slice(-15), i ].join(sep);
		}
		else {
			for( ;  i < n;  ++i )
				sorted[i] = [ ( 1000000000000000 + array[i][key] + '' ).slice(-15), i ].join(sep);
		}
	}
	else {
		if( typeof key == 'function' ) {
			for( ;  i < n;  ++i )
				sorted[i] = [ key(array[i]), i ].join(sep);
		}
		else if( opt.caseDependent ) {
			for( ;  i < n;  ++i )
				sorted[i] = [ array[i][key], i ].join(sep);
		}
		else {
			for( ;  i < n;  ++i )
				sorted[i] = [ array[i][key].toLowerCase(), i ].join(sep);
		}
	}
	
	sorted.sort();
	
	var output = new Array( n );
	for( i = 0;  i < n;  ++i )
		output[i] = array[ sorted[i].split(sep)[1] ];
	
	return output;
}

String.prototype.repeat = function( n ) {
	return new Array( n + 1 ).join( this );
};

String.prototype.trim = function() {
	return this.replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' );
};

String.prototype.words = function( fun ) {
	this.split(' ').forEach( fun );
};

String.prototype.T = function( args ) {
	return ( prefs.getMsg(this) || strings[this] || '' ).replace( /\{\{(\w+)\}\}/g,
		function( match, name ) {
			var value = args[name];
			return value != null ? value : match;
		});
}

function S() {
	return Array.prototype.join.call( arguments, '' );
}

function join( array, delim ) {
	return Array.prototype.join.call( array, delim || '' );
}

function Cache() {
	this.cache = {};
}

$.extend( Cache.prototype, {
	add: function( key, value, time ) {
		this.cache[key] = { value: value, expire: +new Date + time };
		//console.log( 'cache#add', key, this.cache[key].expire );
	},
	get: function( key, loader ) {
		var item = this.cache[key];
		if( ! item ) {
			//console.log( 'cache#get miss', key );
			return null;
		}
		var expired = +new Date > item.expire;
		if( expired ) {
			//console.log( 'cache#get expired', key );
			delete this.cache[key];
			return null;
		}
		//console.log( 'cache#get hit', key );
		return item.value;
	},
	remove: function( key ) {
		//console.log( 'cache#remove', key );
		delete this.cache[key];
	}
});

jQuery.extend( jQuery.fn, {
	bindSelector: function( events, listener, delay ) {
		var timer;
		this.bind( events, function() {
			var self = this, args = arguments;
			if( timer ) clearTimeout( timer );
			timer = setTimeout( function() {
				timer = null;
				listener.apply( self, args );
			}, delay || 50 );
		});
	},
	
	bounds: function() {
		var offset = this.offset();
		return {
			left: offset.left,
			right: offset.left + this.width(),
			top: offset.top,
			bottom: offset.top + this.height()
		};
	}
//	html: function( a ) {
//		if( a == null ) return this[0] && this[0].innerHTML;
//		return this.empty().append( join( a.charAt ? arguments : a ) );
//	},
//	setClass: function( cls, yes ) {
//		return this[ yes ? 'addClass' : 'removeClass' ]( cls );
//	}
});

function randomInt( n ) {
	return Math.floor( Math.random() * n );
}

// hoverize.js
// Based on hoverintent plugin for jQuery

(function( $ ) {
	
	var opt = {
		slop: 7,
		interval: 200
	};
	
	function start() {
		if( ! timer ) {
			timer = setInterval( check, opt.interval );
			$(document.body).bind( 'mousemove', move );
		}
	}
	
	function clear() {
		if( timer ) {
			clearInterval( timer );
			timer = null;
			$(document.body).unbind( 'mousemove', move );
		}
	}
	
	function check() {
		if ( ( Math.abs( cur.x - last.x ) + Math.abs( cur.y - last.y ) ) < opt.slop ) {
			clear();
			for( var i  = 0,  n = functions.length;  i < n;  ++i )
				functions[i]();
		}
		else {
			last = cur;
		}
	}
	
	function move( e ) {
		cur = { x:e.screenX, y:e.screenY };
	}
	
	var timer, last = { x:0, y:0 }, cur = { x:0, y:0 }, functions = [];
	
	hoverize = function( fn, fast ) {
		
		function now() {
			fast && fast.apply( null, args );
		}
		
		function fire() {
			clear();
			return fn.apply( null, args );
		}
		functions.push( fire );
		
		var args;
		
		return {
			clear: clear,
			
			now: function() {
				args = arguments;
				now();
				fire();
			},
			
			hover: function() {
				args = arguments;
				now();
				start();
			}
		};
	}
})( jQuery );

candidates.index('id');

function cacheUrl( url, cache, always ) {
	if( opt.nocache ) {
		if( ! always )
			return url + '?q=' + new Date().getTime();
		cache = 0;
	}
	if( typeof cache != 'number' )
		cache = 3600;
	url = _IG_GetCachedUrl( url, { refreshInterval:cache } );
	if( ! url.match(/^http:/) )
		url = 'http://' + location.host + url;
	return url;
}

function imgUrl( name ) {
	return cacheUrl( opt.imgUrl + name );
}

document.body.scroll = 'no';

document.write(
	'<style type="text/css">',
		'html, body { width:', ww, 'px; height:', wh, 'px; overflow:hidden; }',
		'* { font-family: Arial,sans-serif; font-size: ', opt.fontsize, '; }',
		'#outer {}',
		'.barvote { font-weight:bold; color:white; }',
		'h2 { font-size:11pt; margin:0; padding:0; }',
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
		'#content-scroll { overflow:scroll; overflow-x:hidden; }',
		'#maptip { position:absolute; z-index:10; border:1px solid #333; background:#f7f5d1; color:#333; white-space: nowrap; display:none; }',
		'.tiptitlebar { padding:4px 8px; border-bottom:1px solid #AAA; }',
		'.tiptitletext { font-weight:bold; font-size:120%; }',
		'.tipcontent { padding:4px 8px 8px 8px; }',
		'.tipreporting { font-size:80%; padding:4px 8px; border-top:1px solid #AAA; }',
		'#selectors { background-color:#D0E3F8; }',
		'#selectors, #selectors * { font-size:14px; }',
		'#selectors label { font-weight:bold; }',
		'#selectors, #legend { width:100%; border-bottom:1px solid #C2C2C2; }',
		'#legend { background-color:#EAF0FA; }',
		'div.legend-candidate, div.legend-label { float:left; border:1px solid #EAF0FA; padding:6px 4px 5px 5px; }',
		'div.legend-candidate { cursor:pointer; margin-right:6px; }',
		'div.legend-candidate.hover, div.legend-candidate.selected { border:1px solid #6FA8DC; }',
		'div.legend-candidate.hover { background-color:#D6E9F8; }',
		'div.legend-candidate.selected { background-color:white; }',
		'.candidate, .candidate * { font-size:18px; font-weight:bold; }',
		'.candidate-small, .candidate-small * { font-size:14px; font-weight:bold; }',
		'#centerlabel, #centerlabel * { font-size:12px; xfont-weight:bold; }',
		'#spinner { z-index:999999; filter:alpha(opacity=70); opacity:0.70; -moz-opacity:0.70; position:absolute; left:', Math.floor( ww/2 - 64 ), 'px; top:', Math.floor( wh/2 - 20 ), 'px; }',
		'#error { z-index:999999; position:absolute; left:4px; bottom:4px; border:1px solid #888; background-color:#FFCCCC; font-weight:bold; padding:6px; }',
		//'#cihan-logo { display:block; position:absolute; right:6px; top:5px; width:42px; height:28px; background: url(', imgUrl('cihan-logo-42x28.png'), ') no-repeat; }',
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

function raceOption( value, name ) {
	return option( value, name, value == opt.infoType );
}

document.write(
	'<div id="outer">',
	'</div>',
	'<div id="maptip">',
	'</div>',
	//'<a id="cihan-logo" target="_blank" href="http://www.cihan.com.tr/">',
	//'</a>',
	'<div id="error" style="display:none;">',
	'</div>',
	'<div id="spinner">',
		'<img border="0" style="width:128px; height:128px;" src="', imgUrl('spinner-124.gif'), '" />',
	'</div>'
);

function contentTable() {
	return S(
		'<div>',
			'<div id="selectors">',
				'<div style="margin:0; padding:6px;">',
					//'<label for="stateSelector">',
					//	'stateLabel'.T(),
					//'</label>',
					//'<select id="stateSelector">',
					//	option( '-1', 'nationwideLabel'.T() ),
					//	option( '', '', false, true ),
					//	sortArrayBy( data.states.geo.features, 'name' )
					//		.mapjoin( function( state ) {
					//			return stateOption(
					//				state,
					//				state.abbr == opt.state
					//			);
					//		}),
					//'</select>',
					//'&nbsp;&nbsp;&nbsp;',
					'<label for="candidateSelector">',
						'candidateLabel'.T(),
					'</label>',
					'<select id="candidateSelector">',
						option( '-1', 'topCandidate'.T() ),
						//option( '-2', 'secondCandidate'.T() ),
						//option( '-3', 'thirdCandidate'.T() ),
						//option( '-4', 'fourthCandidate'.T() ),
						option( '', '', false, true ),
						candidates.mapjoin( function( candidate ) {
							return option( candidate.id, candidate.fullName );
						}),
					'</select>',
					//'&nbsp;&nbsp;&nbsp;',
					//'<input type="checkbox" id="chkCounties">',
					//'<label for="chkCounties">', 'countiesCheckbox'.T(), '</label>',
				'</div>',
			'</div>',
			'<div id="legend">',
				formatLegendTable(),
			'</div>',
			'<div style="width:100%;">',
				'<div id="map" style="width:100%; height:100%;">',
				'</div>',
			'</div>',
		'</div>'
	);
}

function formatLegendTable( candidateCells ) {
	return S(
		'<div style="position:relative; vertical-align: middle;">',
			'<div class="legend-label">',
				'legendLabel'.T(),
			'</div>',
			candidateCells || '&nbsp;',
			'<div style="clear:left;">',
			'</div>',
		'</div>'
	);
}

(function( $ ) {
	
	//function getJSON( type, path, file, cache, callback, retries ) {
	//	var stamp = +new Date;
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
		var level = 100;
		//var kind = ( opt.counties ? 'counties' : 'states' );
		var kind = 'county';  // TEMP
		var fips = '19';  // TEMP
		var json = jsonRegion[kind];
		if( json ) {
			loadGeoJSON( json );
		}
		else {
			var file = S( 'c2010.', kind, '-', fips, '-goog_geom_', level, '.jsonp' );
			getGeoJSON( opt.shapeUrl + file );
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
				$map.height( wh - $map.offset().top );
			}
		}
		json.kind = 'county';  // TEMP
		jsonRegion[json.kind] = json;
		//debugger;
		var loader = {
			// TODO: refactor
			state: function() {
				json.features.index('id').index('abbr');
				data.states.geo = json;
				oneTime();
				//setCounties( false );
				getResults();
				analytics( '/states' );
			},
			county: function() {
				json.features.index('id').index('abbr');
				data.counties.geo = json;
				oneTime();
				//setCounties( true );
				getResults();
				analytics( '/counties' );
			}
		}[json.kind];
		loader();
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
		analytics( '/' + type + '/' + file );
	}
	
	function analytics( path ) {
		analytics.seen = analytics.seen || {};
		if( analytics.seen[path] ) return;
		analytics.seen[path] = true;
		_IG_Analytics( 'UA-5730550-1', '/iowa2012' + path );
	}
	
	function htmlEscape( str ) {
		var div = document.createElement( 'div' );
		div.appendChild( document.createTextNode( str ) );
		return div.innerHTML;
	}
	
	function percent( n ) {
		var p = Math.round( n * 100 );
		if( p == 100  &&  n < 1 ) p = 99;
		if( p == 0  && n > 0 ) p = '&lt;1';
		return p + '%';
	}
	
	//NationwideControl = function( show ) {
	//	return $.extend( new GControl, {
	//		initialize: function( map ) {
	//			var $control = $(S(
	//				'<div style="color:black; font-family:Arial,sans-serif;">',
	//					'<div style="background-color:white; border:1px solid black; cursor:pointer; text-align:center; width:6em;">',
	//						'<div style="border-color:white #B0B0B0 #B0B0B0 white; border-style:solid; border-width:1px; font-size:12px;">',
	//							'nationwideLabel'.T(),
	//						'</div>',
	//					'</div>',
	//				'</div>'
	//			)).click( function() { setState(stateUS); } ).appendTo( map.getContainer() );
	//			return $control[0];
	//		},
	//		
	//		getDefaultPosition: function() {
	//			return new GControlPosition( G_ANCHOR_TOP_LEFT, new GSize( 50, 9 ) );
	//		}
	//	});
	//};
	
	var map, gonzo;
	
	var overlays = [];
	overlays.clear = function() {
		while( overlays.length ) overlays.pop().setMap( null );
	};
	
	//var state = states[opt.state];
	
	function pointLatLng( point ) {
		return new gm.LatLng( point[1], point[0] );
	}
	
	function randomColor() {
		return '#' + hh() + hh() + hh();
	}
	
	function randomGray() {
		var h = hh();
		return '#' + h + h + h;
	}
	
	function hh() {
		var xx = Math.floor( Math.random() *128 + 96 ).toString(16);
		return xx.length == 2 ? xx : '0'+xx;
	}
	
	var reloadTimer;
	
	var geoMoveNext = true;
	var polyTimeNext = 250;
	
	function geoReady() {
		setLegend();
		if( geoMoveNext ) {
			geoMoveNext = false;
			moveToGeo();
		}
		polys();
		$('#spinner').hide();
		if( opt.reloadTime  &&  ! reloadTimer )
			reloadTimer = setInterval( loadView, opt.reloadTime );
	}
	
	function currentGeos() {
		//data.states.geo.hittest = ! opt.counties;
		return opt.counties ?
			[ data.counties.geo, data.states.geo ] :
			[ data.states.geo ];
	}
	
	function currentResults() {
		return currentData().results;
	}
	
	function currentData() {
		return opt.counties ? data.counties: data.states;
	}
	
	function moveToGeo() {
		var json = currentGeos()[0];  // TODO
		$('#map').show();
		initMap();
		gme.trigger( map, 'resize' );
		//overlays.clear();
		//$('script[title=jsonresult]').remove();
		//if( json.status == 'later' ) return;
		fitBbox( json.bbox );
	}
	
	function fitBbox( bbox ) {
		if( ! bbox ) return;
		// TEMP
		bbox = [ -96.6372, 40.3741, -90.1416, 43.5014 ];
		// END TEMP
		map.fitBounds( new gm.LatLngBounds(
			new gm.LatLng( bbox[1], bbox[0] ),
			new gm.LatLng( bbox[3], bbox[2] )
		) );
		zoom = map.getZoom();
	}
	
	var  mouseFeature;
	
	function getStateCounties( features, state ) {
		var counties = [];
		for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
			if( feature.state.toUpperCase() == curState.abbr )
				counties.push( feature );
		}
		return counties;
	}
	
	function polys() {
		colorize( /* ?? */ );
		var $container = $('#map');
		function getFeature( event, where ) {
			return where && where.feature;
		}
		var events = {
			mousedown: function( event, where ) {
			},
			mouseup: function( event, where ) {
			},
			mousemove: function( event, where ) {
				var feature = getFeature( event, where );
				if( feature == mouseFeature ) return;
				mouseFeature = feature;
				map.setOptions({ draggableCursor: feature ? 'pointer' : null });
				outlineFeature( feature );
				showTip( feature );
			},
			click: function( event, where ) {
				events.mousemove( event, where );
				//var feature = getFeature( event, where );
				//if( ! feature ) return;
				//if( feature.type == 'state'  || feature.type == 'cd' )
				//	setState( feature.state );
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
	
	function colorize( /* ?? */ ) {
		//if( opt.counties ) {
		//	var features = data.states.geo.features;
		//	for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
		//		feature.fillColor = '#000000';
		//		feature.fillOpacity = 0;
		//		feature.strokeColor = '#666666';
		//		feature.strokeOpacity = 1;
		//		feature.strokeWidth = 2;
		//	}
		//}
		if( opt.counties ) {
			var source = data.counties, strokeWidth = 1, strokeColor = '#666666';
		}
		else {
			var source = data.states, strokeWidth = 2, strokeColor = '#222222';
		}
		var features = source.geo.features, results = source.results;
		var candidateID = $('#candidateSelector').val();
		var isMulti = ( candidateID < 0 );
		if( isMulti ) {
			for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
				var id = feature.id;
				var row = results.rowsByID[id];
				var candidate = row && candidates[row.candidateMax];
				if( candidate ) {
					feature.fillColor = candidate.color;
					feature.fillOpacity = .6;
				}
				else {
					feature.fillColor = '#FFFFFF';
					feature.fillOpacity = 0;
				}
				feature.strokeColor = strokeColor;
				feature.strokeOpacity = 1;
				feature.strokeWidth = strokeWidth;
			}
		}
		else {
			var rows = results.rows;
			var max = 0;
			var candidate = candidates.by.id[candidateID], color = candidate.color, index = candidate.index;
			var nCols = candidates.length;
			for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
				var id = feature.id;
				var row = results.rowsByID[id];
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
				var id = feature.id;
				var row = results.rowsByID[id];
				feature.fillColor = color;
				feature.fillOpacity = row && max ? row.fract / max : 0;
				feature.strokeColor = strokeColor;
				feature.strokeOpacity = 1;
				feature.strokeWidth = strokeWidth;
			}
		}
	}
	
	// TODO: refactor this into PolyGonzo
	var outlineOverlay;
	function outlineFeature( feature ) {
		if( outlineOverlay )
			outlineOverlay.setMap( null );
		outlineOverlay = null;
		if( ! feature ) return;
		var geo = currentGeos()[0];
		var feat = $.extend( {}, feature, {
			fillColor: '#000000',
			fillOpacity: 0,
			strokeWidth: opt.counties ? 3 : 4,
			strokeColor: '#000000',
			strokeOpacity: 1
		});
		outlineOverlay = new PolyGonzo.PgOverlay({
			map: map,
			geos: [{
				crs: geo.crs,
				kind: geo.kind,
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
	$('body').bind( 'click mousemove', moveTip );
	
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
			'<span style="border:', border, '; zoom:1;">',
				colors.mapjoin( function( color ) {
					return S(
						'<span style="background:', color, '; zoom:1;">',
							'&nbsp;'.repeat( spaces || 6 ),
						'</span>'
					);
				}),
			'</span>'
		);
	}
	
	function formatCandidateIcon( candidate, size ) {
		return S(
			'<div style="background:url(', imgUrl('candidate-photos-'+size+'.png'), '); background-position:-', candidate.index * size, 'px 0px; width:', size, 'px; height:', size, 'px; border:1px solid #C2C2C2;">',
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
	
	function topCandidatesByVote( result, max ) {
		if( ! result ) return [];
		if( result == -1 ) result = totalResults( currentResults() );
		var top = candidates.slice();
		var total = 0;
		for( var i = -1;  ++i < top.length; ) {
			total += result[i];
		}
		for( var i = -1;  ++i < top.length; ) {
			var candidate = top[i], votes = result[i];
			candidate.votes = votes;
			candidate.vsAll = votes / total;
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
		var topCandidates = topCandidatesByVote(
			totalResults( currentResults() ), 4
		);
		return formatLegendTable(
			formatLegendTopCandidates( topCandidates.slice( 0, 4 ) ) +
			topCandidates.mapjoin( formatLegendCandidate )
		);
	}
	
	function formatLegendTopCandidates( candidates ) {
		var colors = candidates.map( function( candidate ) {
			return candidate.color;
		});
		var selected = $('#candidateSelector').val() < 0 ? ' selected' : '';
		return S(
			'<div class="legend-candidate', selected, '" id="legend-candidate-top">',
				formatSpanColorPatch( colors, 2 ),
				'&nbsp;', 'topCandidateShort'.T(), '&nbsp;',
			'</div>'
		);
	}
	
	function formatLegendCandidate( candidate ) {
		var id = $('#candidateSelector').val();
		var selected = id == candidate.id ? ' selected' : '';
		return S(
			'<div class="legend-candidate', selected, '" id="legend-candidate-', candidate.id, '">',
				formatSpanColorPatch( candidate.color ),
				'&nbsp;', candidate.lastName, '&nbsp;',
				percent( candidate.vsAll ), '&nbsp;',
			'</div>'
		);
	}
	
	function nameCase( name ) {
		return name && name.split(' ').map( function( word ) {
			return word.slice( 0, 1 ) + word.slice( 1 ).toLowerCase();
		}).join(' ');
	}
	
	function formatTipCandidates( feature, result ) {
		var topCandidates = topCandidatesByVote( result, 4 )
		if( ! topCandidates.length )
			return 'noVotes'.T();
		return S(
			'<table cellpadding="0" cellspacing="0">',
				topCandidates.mapjoin( function( candidate ) {
					return S(
						'<tr>',
							'<td>',
								'<div style="margin:4px 6px 4px 0;">',
									formatCandidateIcon( candidate, 32 ),
								'</div>',
							'</td>',
							'<td style="">',
								'<div style="line-height:1em;">',
									'<div style="font-size:85%;">',
										candidate.firstName,
									'</div>',
									'<div style="font-weight:bold;">',
										candidate.lastName,
									'</div>',
								'</div>',
							'</td>',
							'<td style="text-align:right; padding:0 8px 0 12px;">',
								percent( candidate.vsAll ),
							'</td>',
							'<td>',
								formatCandidateAreaPatch( candidate, 24 ),
							'</td>',
						'</tr>'
					);
				}),
			'</table>'
		);
	}
	
	function formatTip( feature ) {
		if( ! feature ) return null;
		var boxColor = '#F2EFE9';
		var result = currentResults().rowsByID[feature.id];
		
		var content = footer = '';
		if( result ) {
			var content = S(
				'<div class="tipcontent">',
					formatTipCandidates( feature, result ),
				'</div>'
			);
			
			var boxes = result[col.NumBallotBoxes];
			var counted = result[col.NumCountedBallotBoxes];
			var footer = S(
				'<div class="tipreporting">',
					'percentReporting'.T({
						percent: percent( counted / boxes ),
						counted: counted,
						total: boxes
					}),
				'</div>'
			);
		}
		
		var parent = data.states.geo &&
			data.states.geo.features.by.id[feature.parent];
		
		return S(
			'<div class="tiptitlebar">',
				'<div style="float:left;">',
					'<span class="tiptitletext">',
						feature.name,
						debug ? ' (#' + feature.id + ')' : '',
						' ',
					'</span>',
				'</div>',
				'<div style="clear:left;">',
				'</div>',
				parent ? ' ' + parent.name : '',
				parent && debug ? ' (#' + parent.id + ')' : '',
			'</div>',
			content,
			footer
		);
	}
	
	var tipLeft, tipTop;
	
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
		var offsetLeft = width + tipOffset.x * 1.5;
		var offsetTop = height + tipOffset.y * 1.5;
		if( tipLeft ) {
			if( x - offsetLeft < pad )
				tipLeft = false;
			else
				x -= offsetLeft;
		}
		else {
			if( x + width > ww - pad )
				tipLeft = true,  x -= offsetLeft;
		}
		if( tipTop ) {
			if( y - offsetTop < pad )
				tipTop = false;
			else
				y -= offsetTop;
		}
		else {
			if( y + height > wh - pad )
				tipTop = true,  y -= offsetTop;
		}
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
	
	function setStateByAbbr( abbr ) {
		setState( states.by.abbr(abbr) );
	}
	
	function setState( state ) {
		if( ! state ) return;
		if( typeof state == 'string' ) state = states.by.abbr( state );
		var select = $('#stateSelector')[0];
		select && ( select.selectedIndex = state.selectorIndex );
		opt.state = state.abbr.toLowerCase();
		geoMoveNext = true;
		setCounties( true );
	}
	
	var mapStyles = [
		{
			featureType: "road",
			elementType: "all",
			stylers: [ { visibility: "off" } ]
		},{
			featureType: "transit",
			elementType: "all",
			stylers: [ { visibility: "off" } ]
		},{
			featureType: "landscape",
			elementType: "all",
			stylers: [ { saturation: -100 }, { lightness: 30 } ]
		},{
			featureType: "administrative",
			elementType: "all",
			stylers: [ { visibility: "off" } ]
		},{
			featureType: "administrative.locality",
			elementType: "labels",
			stylers: [ { visibility: "on" } ]
		}
	];
	
	function initMap() {
		if( map ) return;
		mapPixBounds = $map.bounds();
		map = new gm.Map( $map[0],  {
			mapTypeId: 'simple',
			streetViewControl: false,
			mapTypeControlOptions: {
				mapTypeIds: []
			},
			panControl: false,
			rotateControl: false,
			zoomControlOptions: {
				style: gm.ZoomControlStyle.SMALL
			}
		});
		var mapType = new gm.StyledMapType( mapStyles );
		map.mapTypes.set( 'simple', mapType );
		
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
		
		//setStateByAbbr( opt.state );
		
		$('#stateSelector').bindSelector( 'change keyup', function() {
			var value = this.value.replace('!','').toLowerCase();
			if( opt.state == value ) return;
			opt.state = value;
			setCounties( value > 0 );
			var state = data.states.geo.features.by.id[value];
			fitBbox( state ? state.bbox : data.states.geo.bbox );
		});
		
		$('#candidateSelector').bindSelector( 'change keyup mousemove', function() {
			var value = this.value;
			if( opt.infoType == value ) return;
			opt.infoType = value;
			loadView();
		});
		
		$('#chkCounties').click( function() {
			setCounties( this.checked );
		});
		
		var $legend = $('#legend');
		$legend.delegate( 'div.legend-candidate', {
			mouseover: function( event ) {
				$(this).addClass( 'hover' );
			},
			mouseout: function( event ) {
				$(this).removeClass( 'hover' );
			},
			click: function( event ) {
				var id = this.id.split('-')[2];
				if( id == 'top' ) id = -1;
				setCandidate( id );
			}
		});
		
		function setCandidate( id ) {
			$('#candidateSelector').val( id );
			$('#candidateSelector').trigger( 'change' );
		}
	}
	
	function oneshot() {
		var timer;
		return function( fun, time ) {
			clearTimeout( timer );
			timer = setTimeout( fun, time );
		};
	}
	
	function hittest( latlng ) {
	}
	
	function loadView() {
		showTip( false );
		//overlays.clear();
		var id = opt.state;
		var $select = $('#candidateSelector');
		opt.infoType = $select.val();
		
		opt.state = +$('#stateSelector').val();
		//var state = curState = data.states.geo.features.by.abbr[opt.abbr];
		$('#spinner').show();
		loadRegion();
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
		var results = cacheResults.get( opt.counties );
		if( results ) {
			loadResults( results, opt.counties, false );
			return;
		}
		// TEMP
		loadTestData();
		return;
		// END TEMP
		var url = S(
			'http://www.google.com/fusiontables/api/query?',
			'jsonCallback=', opt.counties ? 'loadCounties' : 'loadStates',
			'&_=', Math.floor( +new Date / opt.resultCacheTime ),
			'&sql=SELECT+',
			resultsFields(),
			'+FROM+',
			opt.counties ? '928540' : '933803'
		);
		getScript( url );
	}
	
	function loadTestData() {
		var rows = data.counties.geo.features.map( function( county ) {
			var nVoters = 0;
			var nPrecincts = randomInt( 33 ) + 1;
			return candidates.map( function( candidate ) {
				var n = randomInt( 100000 );
				nVoters += n;
				return n;
			}).concat(
				county.id, nVoters, nPrecincts, randomInt(nPrecincts)
			);
		});
		var json = {
			table: {
				rows: rows
			}
		};
		setTimeout( function() {
			loadCounties( json );
		}, 100 );
	}
	
	loadStates = function( json ) {
		loadResults( json, false, true );
	};
	
	loadCounties = function( json ) {
		loadResults( json, true, true );
	};
	
	function loadResults( json, counties, loading ) {
		if( loading )
			cacheResults.add( counties, json, opt.resultCacheTime );
		var results = currentData().results = json.table;
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
	
	$window.bind( 'load', function() {
		loadView();
	});

})( jQuery );
