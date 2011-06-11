// turkey-results-map.js
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

// Keep this in sync with ALL_ALL.xml
var strings = {
	nationwideLabel: 'Tüm Türkiye',
	//chooseLabel: 'Choose a province and select a race:',
	provinceLabel: 'İller:&nbsp;',
	partyLabel: 'Partiler:&nbsp;',
	topParty: 'En Fazla Oy Oranı',
	//secondParty: 'Second',
	//thirdParty: 'Third',
	//fourthParty: 'Fourth',
	//turkey: 'Turkey',
	districtsCheckbox: 'İlçeleri Göster',
	legendLabel: 'Türkiye Genelinde Sonuçlar:&nbsp;&nbsp;',
	percentReporting: '{{percent}} açıldı ({{counted}}/{{total}})',
	//countdownHeading: 'Live results in:',
	//countdownHours: '{{hours}} hours',
	//countdownHour: '1 hour',
	//countdownMinutes: '{{minutes}} minutes',
	//countdownMinute: '1 minute',
	noVotes: 'Oy bilgisi alınmadı'
};

var parties1 = [
	{ id: 22, abbr: 'AKP', color: '#FFFF00', icon: 1, name: 'Adalet ve Kalkınma Partisi' },
	{ id: 7, abbr: 'BBP', color: '#6666CC', icon: 2, name: 'Büyük Birlik Partisi' },
	{ id: 23, abbr: 'CHP', color: '#008000', icon: 3, name: 'Cumhuriyet Halk Partisi' },
	{ id: 8, abbr: 'DP', color: '#800080', icon: 4, name: 'Demokrat Parti' },
	{ id: 4, abbr: 'DSP', color: '#000080', icon: 5, name: 'Demokratik Sol Parti' },
	{ id: 35, abbr: 'DYP', color: '#993300', icon: 6, name: 'Doğru Yol Partisi' },
	{ id: 9, abbr: 'EMEP', color: '#FF00FF', icon: 7, name: 'Emek Partisi' },
	{ id: 34, abbr: 'HAS', color: '#808080', icon: 8, name: 'Halkın Sesi Partisi' },
	{ id: 33, abbr: 'HEPAR', color: '#B3D580', icon: 9, name: 'Hak ve Eşitlik Partisi' },
	{ id: 13, abbr: 'LDP', color: '#FF6600', icon: 10, name: 'Liberal Demokrat Parti' },
	{ id: 24, abbr: 'MHP', color: '#FF0000', icon: 11, name: 'Milliyetçi Hareket Partisi' },
	{ id: 36, abbr: 'MMP', color: '#00FF00', icon: 12, name: 'Milliyetçi ve Muhafazakar Parti' },
	{ id: 14, abbr: 'MP', color: '#CCFFCC', icon: 13, name: 'Millet Partisi' },
	{ id: 16, abbr: 'SP', color: '#33CCCC', icon: 14, name: 'Saadet Partisi' },
	{ id: 17, abbr: 'TKP', color: '#993366', icon: 15, name: 'Türkiye Komünist Partisi' }
];

var partiesBGMZ = [
	{ id: 21, abbr: 'BGMZ', color: '#3366FF', icon: 0, bgmz: true, name: 'Bağımsız' },
	{ id: 20, abbr: 'BGMZ', color: '#3366FF', icon: 0, bgmz: true, name: 'Bağımsız' },
	{ id: 27, abbr: 'BGMZ', color: '#3366FF', icon: 0, bgmz: true, name: 'Bağımsız' },
	{ id: 28, abbr: 'BGMZ', color: '#3366FF', icon: 0, bgmz: true, name: 'Bağımsız' },
	{ id: 29, abbr: 'BGMZ', color: '#3366FF', icon: 0, bgmz: true, name: 'Bağımsız' },
	{ id: 30, abbr: 'BGMZ', color: '#3366FF', icon: 0, bgmz: true, name: 'Bağımsız' },
	{ id: 31, abbr: 'BGMZ', color: '#3366FF', icon: 0, bgmz: true, name: 'Bağımsız' },
	{ id: 32, abbr: 'BGMZ', color: '#3366FF', icon: 0, bgmz: true, name: 'Bağımsız' }
];

var parties = parties1.concat( partiesBGMZ );

var independents = {
	'20:1': 'MURAT BOZLAK',
	'20:2': 'VELİ BÜYÜKŞAHİN',
	'20:4': 'HALİL AKSOY',
	'20:6': 'MUSTAFA HULKİ CEVİZOĞLU',
	'27:6': 'CEYHAN MUMCU',
	'28:6': 'CERCİŞ UTAŞ',
	'20:84': 'ERDOGAN KARAKUS',
	'27:84': 'SADRETTIN GÜVENER',
	'20:7': 'İHSAN NERGİZ',
	'20:75': 'YÜKSEL AVŞAR',
	'20:9': 'MEHMET BAYRAKTAR',
	'20:10': 'TURAN CENGİZ',
	'20:72': 'BENGİ YILDIZ',
	'27:72': 'AYLA AKAT ATA',
	'20:12': 'İDRİS BALUKEN',
	'20:13': 'HÜSAMETTİN ZENDERLİOĞLU',
	'27:13': 'EDİP SAFDER GAYDALI',
	'20:16': 'MEHMET DENİZ BÜYÜK',
	'20:20': 'KEMAL BELER',
	'27:20': 'MUSTAFA GÜLEÇ',
	'28:20': 'KAZIM GÜRDAL',
	'20:21': 'LEYLA ZANA',
	'27:21': 'HATİP DİCLE',
	'28:21': 'NURSEL AYDOĞAN',
	'29:21': 'EMİNE AYNA',
	'30:21': 'ALTAN TAN',
	'31:21': 'ŞERAFETTİN ELÇİ',
	'32:21': 'MEHMET SELİM ENSARİOĞLU',
	'20:25': 'SEBAHATTIN YILMAZ',
	'20:26': 'HASAN YALÇINKAYA',
	'20:27': 'AKIN BİRDAL',
	'20:30': 'ESAT CANAN',
	'27:30': 'SELAHATTİN DEMİRTAŞ',
	'28:30': 'ADİL KURT',
	'20:31': 'MAHMUT AYDINCI',
	'20:76': 'PERVİN BULDAN',
	'20:34': 'SEBAHAT TUNCEL',
	'27:34': 'AHMET TUNCAY ÖZKAN',
	'20:82': 'SIRRI SÜREYYA ÖNDER',
	'27:82': 'ÇETİN DOĞAN',
	'20:83': 'MUSTAFA AVCI',
	'27:83': 'ABDULLAH LEVENT TÜZEL',
	'28:83': 'HANİFİ AVCI',
	'20:35': 'MEHMET TANHAN',
	'27:35': 'YAŞAR MÜJDECİ',
	'28:35': 'TUNCER SÜMER',
	'29:35': 'İSMAİL ALTIKULAÇ',
	'20:85': 'DOĞU PERİNÇEK',
	'27:85': 'ERDAL AVCI ',
	'28:85': 'RAHMİYE KUBİLAY',
	'29:85': 'TERCAN ÜLÜK',
	'30:85': 'ALİ ACAR',
	'20:46': 'MUSTAFA NAMAKLI',
	'20:36': 'MÜLKİYE BİRTANE',
	'20:40': 'FAİK KARADAŞ',
	'20:41': 'EMRULLAH BINGÜL',
	'20:42': 'HACI MEHMET BOZDAĞ',
	'20:44': 'KANİ ŞAVATA',
	'20:45': 'NİZAMETTİN ÖZTÜRK',
	'20:47': 'SÜLEYMAN BÖLÜNMEZ',
	'27:47': 'GÜLSEREN YILDIRIM',
	'28:47': 'EROL DORA',
	'29:47': 'AHMET TÜRK',
	'20:33': 'ERTUĞRUL KÜRKÇÜ',
	'20:48': 'ŞEHBAL ŞENYURT ARINLI',
	'20:49': 'SIRRI SAKIK',
	'27:49': 'DEMİR ÇELİK',
	'20:52': 'MURAT HAZİNEDAR',
	'20:80': 'KAMURAN BABRAK',
	'20:54': 'HÜSEYİN TANAS',
	'20:56': 'GÜLTAN KIŞANAK',
	'20:58': 'ABDÜLLATİF ŞENER',
	'20:63': 'İBRAHİM BİNİCİ',
	'27:63': 'İBRAHİM AYHAN',
	'28:63': 'AHMET ERSİN BUCAK',
	'29:63': 'ZÜLFÜKAR İZOL',
	'20:73': 'HASİP KAPLAN',
	'27:73': 'FAYSAL SARIYILDIZ',
	'28:73': 'SELMA IRMAK',
	'20:59': 'KEREM TOSUN',
	'20:62': 'FERHAT TUNÇ YOSLUN',
	'20:65': 'AYSEL TUĞLUK',
	'27:65': 'KEMAL AKTAŞ',
	'28:65': 'NAZMİ GÜR',
	'29:65': 'ÖZDAL ÜÇER',
	'20:77': 'İHSAN COŞKUN',
	'20:67': 'ALİ UZUN'
};

// Voting results column offsets
var col = {};
col.parties = 0;
col.bgmz = parties1.length;
col.ID = parties.length;
col.NumVoters = col.ID + 1;
col.NumBallotBoxes = col.ID + 2;
col.NumCountedBallotBoxes = col.ID + 3;

function resultsFields() {
	return S(
		parties.map( function( party ) {
			return S( "'VoteCount-", party.id, "'" );
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

var geos = {};
var $map;

var prefs = new _IG_Prefs();
var debug = prefs.getBool('debug');

var opt = window.GoogleElectionMapOptions || {};
opt.province = -1;
opt.districts = false;
opt.fontsize = '15px';
var sw = 300;

opt.resultCacheTime = 60 * 1000;
opt.reloadTime = 120 * 1000;

opt.codeUrl = opt.codeUrl || 'http://election-results.googlecode.com/hg/turkey2011/';
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
	add: function( key, data, time ) {
		this.cache[key] = { data: data, expire: +new Date + time };
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
		return item.data;
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

parties.index('id');

function imgUrl( name ) {
	return opt.imgUrl + name;
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
		'#legend { padding: 6px 6px 6px 6px; background-color:#EAF0FA; }',
		'#selectors, #legend { width:100%; border-bottom:1px solid #C2C2C2; }',
		'.candidate, .candidate * { font-size:18px; font-weight:bold; }',
		'.candidate-small, .candidate-small * { font-size:14px; font-weight:bold; }',
		'#centerlabel, #centerlabel * { font-size:12px; xfont-weight:bold; }',
		'#spinner { z-index:999999; filter:alpha(opacity=70); opacity:0.70; -moz-opacity:0.70; position:absolute; left:', Math.floor( ww/2 - 64 ), 'px; top:', Math.floor( wh/2 - 20 ), 'px; }',
		'#error { z-index:999999; position:absolute; left:4px; bottom:4px; border:1px solid #888; background-color:#FFCCCC; font-weight:bold; padding:6px; }',
		'#cihan-logo { display:block; position:absolute; right:6px; top:5px; width:42px; height:28px; background: url(', imgUrl('cihan-logo-42x28.png'), ') no-repeat; }',
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

function provinceOption( province, selected ) {
	province.selectorIndex = index;
	return option( province.id, province.name, selected );
}

function raceOption( value, name ) {
	return option( value, name, value == opt.infoType );
}

document.write(
	'<div id="outer">',
	'</div>',
	'<div id="maptip">',
	'</div>',
	'<a id="cihan-logo" target="_blank" href="http://www.cihan.com.tr/">',
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
			'<div id="selectors">',
				'<div style="margin:0; padding:6px;">',
					'<label for="provinceSelector">',
						'provinceLabel'.T(),
					'</label>',
					'<select id="provinceSelector">',
						option( '-1', 'nationwideLabel'.T() ),
						option( '', '', false, true ),
						geos.provinces.features.mapjoin( function( province ) {
							return provinceOption( province, province.abbr == opt.province );
						}),
					'</select>',
					'&nbsp;&nbsp;&nbsp;',
					'<label for="partySelector">',
						'partyLabel'.T(),
					'</label>',
					'<select id="partySelector">',
						option( '-1', 'topParty'.T() ),
						//option( '-2', 'secondParty'.T() ),
						//option( '-3', 'thirdParty'.T() ),
						//option( '-4', 'fourthParty'.T() ),
						option( '', '', false, true ),
						parties.mapjoin( function( party ) {
							return party.bgmz ? '' : option(
								party.id,
								party.abbr + ' - ' + party.name
							);
						}),
						option( '', '', false, true ),
						option( '0', 'BGMZ - Bağımsız' ),
					'</select>',
					'&nbsp;&nbsp;&nbsp;',
					'<input type="checkbox" id="chkDistricts">',
					'<label for="chkDistricts">', 'districtsCheckbox'.T(), '</label>',
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

function formatLegendTable( partyCells ) {
	partyCells = partyCells || S(
		'<td>',
			'<div style="background:transparent; width:1px; height:14px; border:1px transparent">',
			'</div>',
		'</td>',
		'<td style="font-size:16px;">',
			'&nbsp;',
		'</td>'
	);
	return S(
		'<table cellspacing="0" cellpadding="0">',
			'<tr valign="middle">',
				'<td>',
					'legendLabel'.T(),
				'</td>',
				partyCells,
			'</tr>',
		'</table>'
	);
}

(function( $ ) {
	
	opt.province = prefs.getString('province');
	opt.districts = false;
	
	opt.party = '1';
	
	//opt.zoom = opt.zoom || 3;
	
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
		var level = 90;
		var kind = ( opt.districts ? 'districts' : 'provinces' );
		var json = jsonRegion[kind];
		if( json ) {
			loadGeoJSON( json );
		}
		else {
			var file = S( 'turkey-', kind, '-geom_', level, '.jsonp' );
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
		getScript( url );
	}
	
	var didLoadGeoJSON;
	loadGeoJSON = function( json ) {
		jsonRegion[json.kind] = json;
		//debugger;
		var loader = {
			// TODO: refactor
			provinces: function() {
				json.features.index('id').index('abbr');
				geos.provinces = json;
				if( ! didLoadGeoJSON ) {
					didLoadGeoJSON = true;
					$('#outer').html( contentTable() );
					initSelectors();
					$map = $('#map');
					$map.height( wh - $map.offset().top );
				}
				//setDistricts( false );
				getResults();
				analytics( '/provinces' );
			},
			districts: function() {
				json.features.index('id').index('abbr');
				geos.districts = json;
				//setDistricts( true );
				getResults();
				analytics( '/districts' );
			}
		}[json.kind];
		loader();
	};
	
	var setDistrictsFirst = true;
	function setDistricts( districts, force ) {
		districts = !! districts;
		if( districts == opt.districts  &&  ! force  &&  ! setDistrictsFirst )
			return;
		setDistrictsFirst = false;
		opt.districts = districts;
		$('#chkDistricts').prop( 'checked', districts );
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
		_IG_Analytics( 'UA-5730550-1', '/turkey2011' + path );
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
	
	NationwideControl = function( show ) {
		return $.extend( new GControl, {
			initialize: function( map ) {
				var $control = $(S(
					'<div style="color:black; font-family:Arial,sans-serif;">',
						'<div style="background-color:white; border:1px solid black; cursor:pointer; text-align:center; width:6em;">',
							'<div style="border-color:white #B0B0B0 #B0B0B0 white; border-style:solid; border-width:1px; font-size:12px;">',
								'nationwideLabel'.T(),
							'</div>',
						'</div>',
					'</div>'
				)).click( function() { setProvince(stateUS); } ).appendTo( map.getContainer() );
				return $control[0];
			},
			
			getDefaultPosition: function() {
				return new GControlPosition( G_ANCHOR_TOP_LEFT, new GSize( 50, 9 ) );
			}
		});
	};
	
	var map, gonzo;
	
	var overlays = [];
	overlays.clear = function() {
		while( overlays.length ) overlays.pop().setMap( null );
	};
	
	//var province = provinces[opt.province];
	
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
		if( ! reloadTimer )
			reloadTimer = setInterval( loadView, opt.reloadTime );
	}
	
	function currentGeos() {
		geos.provinces.hittest = ! opt.districts;
		return opt.districts ?
			[ geos.districts, geos.provinces ] :
			[ geos.provinces ];
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
		map.fitBounds( new gm.LatLngBounds(
			new gm.LatLng( bbox[1], bbox[0] ),
			new gm.LatLng( bbox[3], bbox[2] )
		) );
		zoom = map.getZoom();
	}
	
	var  mouseFeature;
	
	function getProvinceDistricts( features, province ) {
		var districts = [];
		for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
			if( feature.province.toUpperCase() == curProvince.abbr )
				districts.push( feature );
		}
		return districts;
	}
	
	function polys() {
		var dragging;
		colorize( /* ?? */ );
		var $container = $('#map');
		function getFeature( event, where ) {
			return where && where.feature;
		}
		var events = {
			mousedown: function( event, where ) {
				dragging = true;
				showTip( false );
			},
			mouseup: function( event, where ) {
				dragging = false;
				mouseFeature = null;
			},
			mousemove: function( event, where ) {
				if( dragging ) return;
				var feature = getFeature( event, where );
				if( feature == mouseFeature ) return;
				mouseFeature = feature;
				map.setOptions({ draggableCursor: feature ? 'pointer' : null });
				outlineFeature( feature );
				showTip( feature );
			},
			click: function( event, where ) {
				var feature = getFeature( event, where );
				if( ! feature ) return;
				if( feature.type == 'province'  || feature.type == 'cd' )
					setProvince( feature.province );
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
		if( opt.districts ) {
			var features = geos.provinces.features;
			for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
				feature.fillColor = '#000000';
				feature.fillOpacity = 0;
				feature.strokeColor = '#666666';
				feature.strokeOpacity = 1;
				feature.strokeWidth = 2;
			}
		}
		if( opt.districts ) {
			var geo = geos.districts, strokeWidth = 1, strokeColor = '#666666';
		}
		else {
			var geo = geos.provinces, strokeWidth = 2, strokeColor = '#222222';
		}
		var features = geo.features;
		var partyID = $('#partySelector').val();
		var isMulti = ( partyID < 0 );
		var isBGMZ = ( partyID == 0 );
		if( isMulti ) {
			for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
				var id = feature.id;
				var row = curResults.rowsByID[id];
				var party = row && parties[row.partyMax];
				if( party ) {
					feature.fillColor = party.color;
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
			var rows = curResults.rows;
			var max = 0;
			if( isBGMZ ) {
				var color = '#3366FF';
			}
			else {
				var party = parties.by.id[partyID], color = party.color, index = party.index;
			}
			var nCols = parties.length, bgmzCol = col.bgmz;
			for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
				var id = feature.id;
				var row = curResults.rowsByID[id];
				var total = 0, value = 0;
				if( row ) {
					if( isBGMZ ) {
						for( var iCol = -1;  ++iCol < bgmzCol; )
							total += row[iCol];
						while( iCol < nCols )
							value += row[iCol++];
						total += value;
						max = Math.max( max,
							row.fract = total ? value / total : 0
						);
					}
					else {
						var total = 0;
						for( var iCol = -1;  ++iCol < nCols; )
							total += row[iCol];
						value = row[index];
					}
					max = Math.max( max,
						row.fract = total ? value / total : 0
					);
				}
			}
			for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
				var id = feature.id;
				var row = curResults.rowsByID[id];
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
			strokeWidth: opt.districts ? 3 : 4,
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
	$('body').bind( 'mousemove', moveTip );
	
	function showTip( feature ) {
		if( ! $maptip ) $maptip = $('#maptip');
		tipHtml = formatTip( feature );
		if( tipHtml ) {
			$maptip.html( tipHtml ).show();
		}
		else {
			$maptip.hide();
		}
	}
	
	function formatPartyAreaPatch( party, max ) {
		var size = Math.round( Math.sqrt( party.vsTop ) * max );
		var margin1 = Math.floor( ( max - size ) / 2 );
		var margin2 = max - size - margin1;
		return S(
			'<div style="margin:', margin1, 'px ', margin2, 'px ', margin2, 'px ', margin1, 'px;">',
				formatColorPatch( party.color, size, size ),
			'</div>'
		);
	}
	
	function formatColorPatch( color, width, height, border ) {
		border = border || '1px solid #C2C2C2';
		return S(
			'<div style="background:', color, '; width:', width, 'px; height:', height, 'px; border:', border, '">',
			'</div>'
		);
	}
	
	function formatPartyIcon( party, size ) {
		return S(
			'<div style="background:url(', imgUrl('parties-'+size+'.png'), '); background-position:-', party.icon * size, 'px 0px; width:', size, 'px; height:', size, 'px; border:1px solid #C2C2C2;">',
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
	
	function topPartiesByVote( result, max ) {
		if( ! result ) return [];
		if( result == -1 ) result = totalResults( curResults );
		var top = parties.slice();
		var total = 0;
		for( var i = -1;  ++i < parties.length; ) {
			total += result[i];
		}
		for( var i = -1;  ++i < parties.length; ) {
			var party = top[i], votes = result[i];
			party.votes = votes;
			party.vsAll = votes / total;
			//party.total = total;
		}
		// TODO: use fast sort?
		top = top.sort( function( a, b ) {
			return(
				a.votes < b.votes ? 1 :
				a.votes > b.votes ? -1 :
				0
			);
		}).slice( 0, max );
		while( top.length  &&  ! top[top.length-1].votes )
			top.pop();
		if( top.length ) {
			var most = top[0].votes;
			for( var i = -1;  ++i < top.length; ) {
				var party = top[i];
				party.vsTop = party.votes / most;
			}
		}
		return top;
	}
	
	function setLegend() {
		$('#legend').html( formatLegend() );
	}
	
	function formatLegend() {
		var nParties = ww < 900 ? 4 : 6;
		var topParties = topPartiesByVote(
			totalResults(curResults),
			nParties
		);
		return formatLegendTable(
			topParties.mapjoin( formatLegendParty )
		);
	}
	
	function formatLegendParty( party ) {
		return S(
			'<td>',
				formatColorPatch( party.color, 24, 14 ),
			'</td>',
			'<td style="font-size:16px;">',
				'&nbsp;', party.abbr, '&nbsp;&nbsp;',
				percent( party.vsAll ), '&nbsp;&nbsp;&nbsp;&nbsp;', 
			'</td>'
		);
	}
	
	function nameCase( name ) {
		return name && name.split(' ').map( function( word ) {
			return word.slice( 0, 1 ) + word.slice( 1 ).toLowerCase();
		}).join(' ');
	}
	
	function formatTipParties( feature, result ) {
		var topParties = topPartiesByVote( result, 4 )
		if( ! topParties.length )
			return 'noVotes'.T();
		return S(
			'<table cellpadding="0" cellspacing="0">',
				topParties.mapjoin( function( party ) {
					var name = party.abbr;
					if( party.bgmz ) {
						var id = party.id + ':' + ( feature.parent || feature.id );
						name = nameCase(independents[id]) || name;
					}
					return S(
						'<tr>',
							'<td>',
								'<div style="margin:4px 10px 4px 0;">',
									formatPartyIcon( party, 24 ),
								'</div>',
							'</td>',
							'<td style="">',
								name,
							'</td>',
							'<td style="text-align:right; padding:0 8px 0 12px;">',
								percent( party.vsAll ),
							'</td>',
							'<td>',
								formatPartyAreaPatch( party, 24 ),
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
		var result = curResults.rowsByID[feature.id];
		
		var content = footer = '';
		if( result ) {
			var content = S(
				'<div class="tipcontent">',
					formatTipParties( feature, result ),
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
		
		var parent = geos.provinces.features.by.id[feature.parent];
		
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
	
	function setProvinceByAbbr( abbr ) {
		setProvince( provinces.by.abbr(abbr) );
	}
	
	function setProvince( province ) {
		if( ! province ) return;
		if( typeof province == 'string' ) province = provinces.by.abbr( province );
		var select = $('#provinceSelector')[0];
		select && ( select.selectedIndex = province.selectorIndex );
		opt.province = province.abbr.toLowerCase();
		geoMoveNext = true;
		setDistricts( true );
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
		
		gme.addListener( map, 'zoom_changed', function() {
			var oldZoom = zoom;
			zoom = map.getZoom();
			if( zoom > oldZoom  &&  zoom >= 7 )
				setDistricts( true );
			else if( zoom < oldZoom  &&  zoom < 7 )
				setDistricts( false );
		});
	}
	
	function initSelectors() {
		
		//setProvinceByAbbr( opt.province );
		
		$('#provinceSelector').bindSelector( 'change keyup', function() {
			var value = this.value.replace('!','').toLowerCase();
			if( opt.province == value ) return;
			opt.province = value;
			setDistricts( value > 0 );
			var province = geos.provinces.features.by.id[value];
			fitBbox( province ? province.bbox : geos.provinces.bbox );
		});
		
		$('#partySelector').bindSelector( 'change keyup mousemove', function() {
			var value = this.value;
			if( opt.infoType == value ) return;
			opt.infoType = value;
			loadView();
		});
		
		$('#chkDistricts').click( function() {
			setDistricts( this.checked );
		});
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
		var id = opt.province;
		var $select = $('#partySelector');
		opt.infoType = $select.val();
		
		opt.province = +$('#provinceSelector').val();
		//var province = curProvince = geos.provinces.features.by.abbr[opt.abbr];
		$('#spinner').show();
		loadRegion();
	}
	
	//function getShapes( province, callback ) {
	//	if( province.shapes ) callback();
	//	else getJSON( 'shapes', opt.shapeUrl, province.abbr.toLowerCase() + '.json', 3600, function( shapes ) {
	//		province.shapes = shapes;
	//		//if( province == stateUS ) shapes.features.province.index('province');
	//		callback();
	//	});
	//}
	
	var cacheResults = new Cache;
	
	function getResults() {
		var results = cacheResults.get( opt.districts );
		if( results ) {
			loadResults( results, opt.districts, false );
			return;
		}
		var url = S(
			'http://www.google.com/fusiontables/api/query?',
			'jsonCallback=', opt.districts ? 'loadDistricts' : 'loadProvinces',
			'&_=', Math.floor( +new Date / opt.resultCacheTime ),
			'&sql=SELECT+',
			resultsFields(),
			'+FROM+',
			opt.districts ? '928540' : '933803'
		);
		getScript( url );
	}
	
	loadProvinces = function( json ) {
		loadResults( json, false, true );
	};
	
	loadDistricts = function( json ) {
		loadResults( json, true, true );
	};
	
	function loadResults( json, districts, loading ) {
		opt.district = districts;
		$('#chkDistricts').prop( 'checked', districts );
		if( loading )
			cacheResults.add( districts, json, opt.resultCacheTime );
		var results = curResults = json.table;
		var rowsByID = results.rowsByID = {};
		var rows = curResults.rows;
		for( var row, iRow = -1;  row = rows[++iRow]; ) {
			rowsByID[ row[col.ID] ] = row;
			var nParties = parties.length;
			var max = 0,  partyMax = -1;
			for( iCol = -1;  ++iCol < nParties; ) {
				var count = row[iCol];
				if( count > max ) {
					max = count;
					partyMax = iCol;
				}
			}
			row.partyMax = partyMax;
		}
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
