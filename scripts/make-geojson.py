# -*- coding: utf-8 -*-

import pg, private


def process():
	schema = 'carto2010'
	fullGeom = 'full_geom'
	googGeom = 'goog_geom'
	boxGeom = googGeom
	boxGeomLL = fullGeom  # temp hack until PolyGonzo supports mercator bbox
	
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
		
		geoState = db.makeFeatureCollection( schema+'.state', boxGeom, boxGeomLL, simpleGeom, '00', 'United States', where )
		geoCounty = db.makeFeatureCollection( schema+'.county', boxGeom, boxGeomLL, simpleGeom, geoid, name, where )
		geoTown = db.makeFeatureCollection( schema+'.cousub', boxGeom, boxGeomLL, simpleGeom, geoid, name, where )
		
		geo = {
			'state': geoState,
			'county': geoCounty,
			'town': geoTown
		};
		
		filename = '%s/%s-%s-%s.jsonp' %(
			private.GEOJSON_PATH, schema, geoid, simpleGeom
		)
		db.writeGeoJSON( filename, geo, 'loadGeoJSON' )


def main():
	global db
	db = pg.Database( database = 'usageo' )
	process()
	db.connection.close()


if __name__ == "__main__":
	main()
