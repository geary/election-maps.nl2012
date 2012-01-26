# -*- coding: utf-8 -*-

from map_simplification_program import simplify, vertex
import pg, private


def process():
	schema = 'carto2010'
	schemaVertex = 'carto2010_vertex'
	fullGeom = 'full_geom'
	googGeom = 'goog_geom'
	boxGeom = googGeom
	boxGeomLL = fullGeom  # temp hack until PolyGonzo supports mercator bbox
	
	for tolerance in ( None, ):
	#for tolerance in ( 1, ):
	#for tolerance in ( 8, ):
	#for tolerance in ( 128, ):
	#for tolerance in ( 1024, ):
	#for tolerance in ( 2048, ):
	#for tolerance in ( 4096, ):
	#for tolerance in ( 8192, ):
	#for tolerance in ( 8192, 16384, ):
		if tolerance is None:
			simpleGeom = googGeom
		else:
			simpleGeom = '%s%d' %( googGeom, tolerance )
		
		if 0:
			db.createSchema( schemaVertex )
			vertex.run(
				username = private.POSTGRES_USERNAME,
				password = private.POSTGRES_PASSWORD,
				hostname = 'localhost',
				database = 'usageo',
				tableGeo = schema+'.fl',
				colGeo = 'goog_geom',
				colId = 'gid',
				schemaVertex = schemaVertex,
				minDistance = tolerance,
			)
		
		if 0:
			simplify.run(
				username = private.POSTGRES_USERNAME,
				password = private.POSTGRES_PASSWORD,
				hostname = 'localhost',
				database = 'usageo',
				tableGeo = schema+'.fl',
				colGeo = 'goog_geom',
				tableVertex = schemaVertex + '.vertex' + str(tolerance),
				colId = 'gid',
				minDistance = tolerance,
			)
		
		if 0:
			db.mergeGeometry(
				schema+'.fl', 'state', simpleGeom,
				schema+'.state', 'state', simpleGeom
			)
		
		if 1:
			geoid = '12'
			name = 'Florida'
			where = "( state = '%s' )" %( geoid )
			
			geoState = db.makeFeatureCollection( schema+'.state', boxGeom, boxGeomLL, simpleGeom, '00', 'United States', where )
			geoCounty = db.makeFeatureCollection( schema+'.fl', boxGeom, boxGeomLL, simpleGeom, geoid, name, where )
			#geoTown = db.makeFeatureCollection( schema+'.cousub', boxGeom, boxGeomLL, simpleGeom, geoid, name, where )
			
			geo = {
				'state': geoState,
				'county': geoCounty,
				#'town': geoTown,
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
