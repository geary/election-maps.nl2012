# -*- coding: utf-8 -*-

import pg, private

#import cProfile

schema = 'carto2010'
fullGeom = 'full_geom'
googGeom = 'goog_geom'
boxGeom = googGeom
boxGeomLL = fullGeom  # temp hack until PolyGonzo supports mercator bbox


def simpleGeom( level ):
	if level is None:
		return googGeom
	else:
		return '%s%s' %( googGeom, level )


def makeState():
	db = pg.Database( database = 'usageo_20m' )
	combineRegionTables( db, 'state' )
	table = '%s.state00' %( schema )
	simplegeom = 'goog_geom00'
	db.addGeometryColumn( table, simplegeom, 3857, True )
	#addStateLevel( db, table, simplegeom, '99', '16384' )
	#addStateLevel( db, table, simplegeom, '02', '65536' )
	#addStateLevel( db, table, simplegeom, '15', '8192' )
	addStateLevel( db, table, simplegeom, '99', '4096' )
	addStateLevel( db, table, simplegeom, '02', '32768' )
	addStateLevel( db, table, simplegeom, '15', '4096' )
	writeStatesOnly( db )
	db.connection.commit()
	db.connection.close()


def combineRegionTables( db, table ):
	county = ( '', 'county,' )[ table == 'county' ]
	table = schema + '.' + table
	db.createLikeTable( table+'00', table )
	
	for fips in ( '02', '15', '99', ):
		db.execute( '''
			INSERT INTO %(table)s00
				SELECT nextval('%(table)s00_gid_seq'),
					geo_id, state, %(county)s
					name, lsad, censusarea, full_geom, goog_geom
				FROM %(table)s%(fips)s;
		''' %({
			'table': table,
			'county': county,
			'fips': fips,
		}) )
	db.connection.commit()


def makeGopDetail():
	db = pg.Database( database = 'usageo_500k' )
	level = '512'
	if level is not None:
		addLevel( db, level )
	mergeStates( db, level )
	writeEachState( db, level )
	writeAllStates( db, level )
	db.connection.commit()
	db.connection.close()


def addStateLevel( db, table, simplegeom, fips, level ):
	shpname = 'us2012-state%(fips)s-20m-%(level)s' %({
		'fips': fips,
		'level': level,
	})
	shpfile = '%(path)s/%(shpname)s/%(shpname)s.shp' %({
		'path': private.OUTPUT_SHAPEFILE_PATH,
		'shpname': shpname,
	})
	temptable = '%s_%s'  %( table, level )
	db.dropTable( temptable )
	db.loadShapefile(
		shpfile, private.TEMP_PATH, temptable,
		simplegeom, '3857', 'LATIN1', True
	)
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
	db.connection.commit()
	db.dropTable( temptable )


def addLevel( db, level ):
	shpfile = '%(path)s/us2012-gop2012-500k-%(level)s/us2012-gop2012-500k-%(level)s.shp' %({
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


def writeStatesOnly( db ):
	geom = simpleGeom( '00' )
	where = 'true'
	fips = '00'
	geoState = db.makeFeatureCollection(
		schema + '.state00',
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
	makeState()
	#makeCounty()
	#makeGopCounty()
	makeGopDetail()


if __name__ == "__main__":
	main()
	#cProfile.run( 'main()' )
