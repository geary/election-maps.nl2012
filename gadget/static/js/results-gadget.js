// results-gadget.js
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

opt.writeScript( 'http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery' + ( opt.debug ? '.js' : '.min.js' ) );
opt.writeScript( 'http://maps.google.com/maps/api/js?v=3.5&sensor=false' );

opt.writeScript( opt.codeUrl + 'js/polygonzo.js', opt.nocache );
opt.writeScript( opt.codeUrl + 'js/results-map.js', opt.nocache );
