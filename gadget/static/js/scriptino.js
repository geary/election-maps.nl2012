// scriptino.js
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

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
		if( field ) {
			this.by = this.by || {};
			var by = this.by[field] = {};
			for( var i = 0, n = this.length;  i < n;  ++i ) {
				var obj = this[i];
				by[obj[field]] = obj;
				obj.index = i;
			}
		}
		else {
			for( var i = 0, n = this.length;  i < n;  ++i ) {
				var str = this[i];
				this[str] = i;
			}
		}
		return this;
	};
}

Array.prototype.random = function() {
	return this[ randomInt(this.length) ];
};

function deleteFromArray( array, value ) {
	for( var i = -1, n = array.length;  ++i < n; ) {
		if( array[i] == value ) {
			array.splice( i, 1 );
			return;
		}
	}
}

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
		this.cache[key] = { value: value, expire: now() + time };
		//console.log( 'cache#add', key, this.cache[key].expire );
	},
	get: function( key, loader ) {
		var item = this.cache[key];
		if( ! item ) {
			//console.log( 'cache#get miss', key );
			return null;
		}
		var expired = now() > item.expire;
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
		if( ! this.length ) return {
			left: 0, right: 0, top: 0, bottom: 0
		}
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

function htmlEscape( str ) {
	//return $('<div />').text(str).html();
	var div = document.createElement( 'div' );
	div.appendChild( document.createTextNode( str ) );
	return div.innerHTML;
}

function htmlUnescape( html ) {
	return $('<div />').html(html).text();
}

function percent0( n ) {
	var p = Math.round( n * 100 );
	if( p == 100  &&  n < 1 ) p = 99;
	if( p == 0  && n > 0 ) p = '&lt;1';
	return p + '%';
}

function percent1( n, decimal ) {
	decimal = decimal || '.';
	if( n == 1 ) return '100%';
	var p = Math.round( n * 1000 );
	if( p == 1000  &&  n < 1 ) p = 999;
	if( p == 0  && n > 0 ) return S( '&lt;0', decimal, '1%' );
	p = ( p < 10 ? '0' : '' ) + p;
	return S( p.slice(0,-1), decimal, p.slice(-1), '%' );
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

function oneshot() {
	var timer;
	return function( fun, time ) {
		clearTimeout( timer );
		timer = setTimeout( fun, time );
	};
}

function throttle( time ) {
	var timer, pending;
	function timeout() {
		timer = setTimeout( function() {
			timer = null;
			if( ! pending ) return;
			pending();
			pending = null;
			timeout();
		}, time );
	}
	return function( fun ) {
		if( ! time ) {
			// unthrottled
			fun();
		}
		else if( ! timer ) {
			// first call, do it now and throttle the next call
			fun();
			timeout();
		}
		else {
			// already throttling, save function for later
			pending = fun;
		}
	};
}

function now() {
	return +new Date;
}

function nowTZ( tzoHour, tzoMinute ) {
	var date = new Date;
	var offset = ( ( tzoHour || 0 ) * 60 + ( tzoMinute || 0 ) ) - date.getTimezoneOffset();
	return new Date( +date + offset * 60 * 1000 );
}

function dateFromYMD( yyyymmdd, tzoHour, tzoMinute ) {
	var ymd = yyyymmdd.split('-');
	var year = +ymd[0], month = +( ymd[1] || 1 ), day = +( ymd[2] || 1 );
	var hms = ( ymd[3] || '0:0:0' ).split(':');
	var hour = hms[0] || 0, minute = hms[1] || 0, second = hms[2] || 0;
	hour -= tzoHour || 0;
	minute -= tzoMinute || 0;
	return Date.UTC( year, month-1, day, hour, minute, 0, 0 );
}

var monthNames = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'
];

function longDateFromYMD( yyyymmdd ) {
	var ymd = yyyymmdd.split('-');
	if( ymd.length == 1 ) return ymd[0];
	var month = monthNames[ +ymd[1]-1 ];
	return(
		ymd.length == 2 ? S( month, ' ', ymd[0] ) :
		S( month, ' ', +ymd[2], ', ', ymd[0] )
	);
}
