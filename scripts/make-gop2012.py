# -*- coding: utf-8 -*-

import pg, private

#import cProfile

schema = 'carto2010'
fullGeom = 'full_geom'
googGeom = 'goog_geom'
boxGeom = googGeom
boxGeomLL = fullGeom  # temp hack until PolyGonzo supports mercator bbox

#levels = ( '00', '10', '20', '30', '40', '50', '60', '70', '80', '90', '95', '100', )
#levels = ( '50', )
#levels = ( '256', '512', '1024', '2048', '4096', '8192', '16384' )
levels = ( '1024', )
#levels = ( None, )


def simpleGeom( level ):
	if level is None:
		return googGeom
	else:
		return '%s%s' %( googGeom, level )


def process():
	createGopPrimary( db )
	for level in levels:
		if level is not None:
			addLevel( db, level )
		mergeStates( db, level )
		writeEachState( db, level )
		writeAllStates( db, level )


def createGopPrimary( db ):
	# KS reports votes by congressional district
	whereCD = '''
		( state = '20' )
	'''
	# CT, MA, NH, VT report votes by county subdivision ("town")
	whereCousub = '''
		( state = '09' OR state = '25' OR state = '33' OR state = '50' )
	'''
	 # ME reports statewide votes only
	whereState = '''
		( state = '23' )
	'''
	db.createLikeTable( schema+'.gop2012', schema+'.cousub' )
	db.execute( '''
		INSERT INTO %(schema)s.gop2012
			SELECT nextval('%(schema)s.gop2012_gid_seq'),
				geo_id, state, county, '' AS cousub,
				name, lsad, censusarea, full_geom, goog_geom
			FROM %(schema)s.county
			WHERE
				NOT %(whereCousub)s
				AND NOT %(whereCD)s
				AND NOT %(whereState)s;
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
		INSERT INTO %(schema)s.gop2012
			SELECT nextval('%(schema)s.gop2012_gid_seq'),
				geo_id, state, '' AS county, '' AS cousub,
				name, lsad, censusarea, full_geom, goog_geom
			FROM %(schema)s.state
			WHERE %(whereState)s;
	''' %({
		'schema': schema,
		'whereCousub': whereCousub,
		'whereCD': whereCD,
		'whereState': whereState,
	}) )
	db.connection.commit()


def addLevel( db, level ):
	shpfile = '%(path)s/gop2012-%(level)s/gop2012-%(level)s.shp' %({
		'path': private.OUTPUT_SHAPEFILE_PATH,
		'level': level,
	})
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
				ST_MakeValid(
					%(temptable)s.%(simplegeom)s
				)
		FROM %(temptable)s
		WHERE %(table)s.geo_id = %(temptable)s.geo_id
		;
	''' %({
		'table': table,
		'temptable': temptable,
		'simplegeom': simplegeom,
	}) )
	#db.dropTable( temptable )
	pass


def mergeStates( db, level ):
	geom = simpleGeom( level )
	db.mergeGeometry(
		schema+'.gop2012', 'state', geom,
		schema+'.state', 'state', geom
	)


def writeEachState( db, level ):
	db.execute( 'SELECT geo_id, name FROM %s.state ORDER BY geo_id;' %( schema ) )
	for geo_id, name in db.cursor.fetchall():
		fips = geo_id.split('US')[1]
		writeState( db, level, fips, name )


def writeState( db, level, fips, name ):
	geom = simpleGeom( level )
	where = "( state = '%s' )" %( fips )
	
	geoState = db.makeFeatureCollection( schema+'.state', boxGeom, boxGeomLL, geom, '00', 'United States', where )
	geoCounty = db.makeFeatureCollection( schema+'.gop2012', boxGeom, boxGeomLL, geom, fips, name, where )
	#geoTown = db.makeFeatureCollection( schema+'.cousub', boxGeom, boxGeomLL, geom, fips, name, where )
	
	geo = {
		'state': geoState,
		'county': geoCounty,
		#'town': geoTown,
	};
	
	writeGeoJSON( db, fips, geom, geo )


def writeAllStates( db, level ):
	geom = simpleGeom( level )
	where = 'true'
	fips = '00'
	geoState = db.makeFeatureCollection(
		schema + '.state',
		boxGeom, boxGeomLL, geom,
		fips, 'United States', where
	)
	geo = {
		'state': geoState,
	}
	writeGeoJSON( db, fips, geom, geo )


def writeGeoJSON( db, fips, geom, geo ):
	filename = '%s/%s-%s-%s.jsonp' %(
		private.GEOJSON_PATH, schema, fips, geom
	)
	db.writeGeoJSON( filename, geo, 'loadGeoJSON' )


def main():
	global db
	db = pg.Database( database = 'usageo_500k' )
	process()
	db.connection.commit()
	db.connection.close()


if __name__ == "__main__":
	main()
	#cProfile.run( 'main()' )
