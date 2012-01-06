# -*- coding: utf-8 -*-

import pg, private


def process():
	kind = 'cousub'
	schema = 'carto2010'
	table = schema + '.' + kind
	fullGeom = 'full_geom'
	googGeom = 'goog_geom'
	boxGeom = googGeom
	
	#db.addGoogleGeometry( table, fullGeom, googGeom )
	
	#for tolerance in ( 10, 100, 1000, 10000, 100000, ):
	for tolerance in ( None, ):
		if tolerance is None:
			simpleGeom = googGeom
		else:
			simpleGeom = '%s_%d' %( googGeom, tolerance )
		
		#db.simplifyGeometry( table, googGeom, simpleGeom, tolerance )
		
		geoid = '33'
		name = 'New Hampshire'
		where = "( state = '%s' )" %( geoid )
		filename = '%s/%s-%s-%s.jsonp' %(
			private.GEOJSON_PATH, table, geoid, simpleGeom
		)
		db.makeGeoJSON( filename, table, boxGeom, simpleGeom, geoid, name, where, 'loadGeoJSON' )


def main():
	global db
	db = pg.Database( database = 'usageo' )
	process()
	db.connection.close()


if __name__ == "__main__":
	main()
