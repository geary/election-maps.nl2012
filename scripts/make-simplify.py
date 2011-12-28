# -*- coding: utf-8 -*-

import pg, private


def process():
	table = 'c2010.county'
	fullGeom = 'full_geom'
	googGeom = 'goog_geom'
	boxGeom = googGeom
	#db.addGoogleGeometry( table, fullGeom, googGeom )
	
	for tolerance in ( 10, 100, 1000, 10000, 100000, ):
		simpleGeom = '%s_%d' %( googGeom, tolerance )
		
		#db.simplifyGeometry( table, googGeom, simpleGeom, tolerance )
		
		geoid = '19'
		name = 'Iowa'
		where = "( statefp10 = '%s' )" %( geoid )
		filename = '%s/%s-%s-%s.json' %(
			private.GEOJSON_PATH, table, geoid, simpleGeom
		)
		db.makeGeoJSON( filename, table, boxGeom, simpleGeom, geoid, name, where, 'loadGeoJSON' )


def main():
	global db
	db = pg.Database( database = 'census' )
	process()
	db.connection.close()


if __name__ == "__main__":
	main()
