# -*- coding: utf-8 -*-

import pg, private

#import cProfile

schema = 'carto2010'
fullGeom = 'full_geom'
googGeom = 'goog_geom'
boxGeom = googGeom
boxGeomLL = fullGeom  # temp hack until PolyGonzo supports mercator bbox


def process():
	createGopPrimary( db )
	addLevels( db )


def createGopPrimary( db ):
	# KS reports votes by congressional district
	whereCD = '''
		( state = '20' )
	'''
	# CT, MA, NH, VT report votes by county subdivision ("town")
	whereCousub = '''
		( state = '09' OR state = '25' OR state = '33' OR state = '50' )
	'''
	db.execute( '''
		DROP TABLE IF EXISTS %(schema)s.gop2012;
		CREATE TABLE %(schema)s.gop2012 (
			LIKE %(schema)s.cousub
				INCLUDING DEFAULTS
				INCLUDING CONSTRAINTS
				INCLUDING INDEXES
		);
		DROP SEQUENCE IF EXISTS %(schema)s.gop2012_gid_seq;
		CREATE SEQUENCE %(schema)s.gop2012_gid_seq;
		INSERT INTO %(schema)s.gop2012
			SELECT nextval('%(schema)s.gop2012_gid_seq'),
				geo_id, state, county, '' AS cousub,
				name, lsad, censusarea, full_geom, goog_geom
			FROM %(schema)s.county
			WHERE
				NOT %(whereCousub)s
				AND NOT %(whereCD)s;
		INSERT INTO %(schema)s.gop2012
			SELECT nextval('%(schema)s.gop2012_gid_seq'),
				geo_id, state, county, cousub,
				name, lsad, censusarea, full_geom, goog_geom
			FROM %(schema)s.cousub
			WHERE %(whereCousub)s;
		INSERT INTO %(schema)s.gop2012
			SELECT nextval('%(schema)s.gop2012_gid_seq'),
				geo_id, state, cd AS county, '' AS cousub,
				name, lsad, censusarea, full_geom, goog_geom
			FROM %(schema)s.cd
			WHERE %(whereCD)s;
	''' %({
		'schema': schema,
		'whereCousub': whereCousub,
		'whereCD': whereCD,
	}) )


def addLevels( db ):
	for level in ( '00', '10', '20', '30', '40', '50', '60', '70', '80', '90', '95', '100', ):
	#for level in ( '50', ):
		if level is None:
			simpleGeom = googGeom
		else:
			simpleGeom = '%s%s' %( googGeom, level )
		
		shpfile = '%s/gop2012-%s/gop2012.shp' %(
			private.SIMPLIFIED_SHAPEFILE_PATH, level
		)
		table = '%s.gop2012' %( schema )
		temptable = '%s_%s'  %( table, level )
		simplegeom = 'goog_geom%s' %( level )
		db.dropTable( temptable )
		db.loadShapefile(
			shpfile, private.TEMP_PATH, temptable,
			simplegeom, '3857', 'LATIN1', True
		)
		db.addGeometryColumn( table, simplegeom, 3857, True )
		db.execute( '''
			UPDATE
				%(table)s
			SET
				%(simplegeom)s =
					%(temptable)s.%(simplegeom)s FROM %(temptable)s
					WHERE %(table)s.geo_id = %(temptable)s.geo_id
			;
		''' %({
			'table': table,
			'temptable': temptable,
			'simplegeom': simplegeom,
		}) )
		db.dropTable( temptable )
		
		if 0:
			db.mergeGeometry(
				schema+'.gop2012', 'state', simpleGeom,
				schema+'.state', 'state', simpleGeom
			)
		
		if 0:
			geoState = db.makeFeatureCollection( schema+'.state', boxGeom, boxGeomLL, simpleGeom, '00', 'United States', 'true' )
			geo = {
				'state': geoState,
			}
			filename = '%s/%s-%s-%s.jsonp' %(
				private.GEOJSON_PATH, schema, '00', simpleGeom
			)
			db.writeGeoJSON( filename, geo, 'loadGeoJSON' )
		
		#if 1:
		#	db.execute( 'SELECT state, name FROM %s.state ORDER BY state ASC;' %( schema ) )
		#	for state, name in db.cursor.fetchall():
		#		
		#	geoid = '12'
		#	name = 'Florida'
		#	where = "( state = '%s' )" %( geoid )
		#	
		#	geoState = db.makeFeatureCollection( schema+'.state', boxGeom, boxGeomLL, simpleGeom, '00', 'United States', where )
		#	geoCounty = db.makeFeatureCollection( schema+'.fl', boxGeom, boxGeomLL, simpleGeom, geoid, name, where )
		#	#geoTown = db.makeFeatureCollection( schema+'.cousub', boxGeom, boxGeomLL, simpleGeom, geoid, name, where )
		#	
		#	geo = {
		#		'state': geoState,
		#		'county': geoCounty,
		#		#'town': geoTown,
		#	}
		#	
		#	filename = '%s/%s-%s-%s.jsonp' %(
		#		private.GEOJSON_PATH, schema, geoid, simpleGeom
		#	)
		#	db.writeGeoJSON( filename, geo, 'loadGeoJSON' )


def main():
	global db
	db = pg.Database( database = 'usageo' )
	process()
	db.connection.commit()
	db.connection.close()


if __name__ == "__main__":
	main()
	#cProfile.run( 'main()' )
