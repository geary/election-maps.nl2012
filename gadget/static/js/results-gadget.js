// results-gadget.js
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

// Parse the query string in a URL and return an object of
// the key=value pairs.
// Example:
//     var url = 'http://example.com/test?a=b&c=d'
//     var p = parseQuery(url);
// Now p contains { a:'b', c:'d' }
function parseQuery( query ) {
	if( query == null ) return {};
	if( typeof query != 'string' ) return query;
	if( query.charAt(0) == '{') return eval('(' + query + ')');

	var params = {};
	if( query ) {
		var array = query.replace( /^[#?]/, '' ).split( '&' );
		for( var i = 0, n = array.length;  i < n;  ++i ) {
			var p = array[i].split( '=' ),
				key = decodeURIComponent( p[0] ),
				value = decodeURIComponent( p[1] );
			if( key ) params[key] = value;
		}
	}
	return params;
}

var params = parseQuery( location.search );

var opt = opt || {};

opt.writeScript = function( url, nocache ) {
	document.write(
		'<script src="',
			url,
			nocache ? '?' + (+new Date) : '',
			'">',
		'<\/script>' );
};

opt.writeScript( 'http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery' + ( opt.debug ? '.js' : '.min.js' ) );

opt.writeScript( 'http://maps.google.com/maps/api/js?v=3.5&sensor=false' );

opt.writeScript( 'js/polygonzo.js', opt.nocache );
opt.writeScript( 'js/results-map.js', opt.nocache );
