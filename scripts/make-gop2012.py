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


#def makeState():
#	db = pg.Database( database = 'usageo_20m' )
#	kind = 'state'
#	combineRegionTables( db, kind )
#	table = '%s.%s00' %( schema, kind )
#	simplegeom = 'goog_geom00'
#	db.addGeometryColumn( table, simplegeom, 3857, True )
#	#addStateLevel( db, kind, table, simplegeom, '99', '16384' )
#	#addStateLevel( db, kind, table, simplegeom, '02', '65536' )
#	#addStateLevel( db, kind, table, simplegeom, '15', '8192' )
#	addStateLevel( db, kind, table, simplegeom, '99', '4096' )
#	addStateLevel( db, kind, table, simplegeom, '02', '32768' )
#	addStateLevel( db, kind, table, simplegeom, '15', '4096' )
#	writeStatesOnly( db )
#	db.connection.commit()
#	db.connection.close()


## TODO: refactor
#def makeCounty():
#	db = pg.Database( database = 'usageo_20m' )
#	kind = 'county'
#	combineRegionTables( db, kind )
#	table = '%s.%s00' %( schema, kind )
#	simplegeom = 'goog_geom00'
#	db.addGeometryColumn( table, simplegeom, 3857, True )
#	addStateLevel( db, kind, table, simplegeom, '99', '4096' )
#	addStateLevel( db, kind, table, simplegeom, '02', '32768' )
#	addStateLevel( db, kind, table, simplegeom, '15', '4096' )
#	writeCountiesOnly( db )
#	db.connection.commit()
#	db.connection.close()


def makeGopNational():
	db = pg.Database( database = 'usageo_500k' )
	table = 'gop2012nat'
	level = '4096'
	if level is not None:
		addLevel( db, table, level )
	mergeStates( db, table, level )
	#writeEachState( db, table, level )
	writeAllStates( db, table, level )
	db.connection.commit()
	db.connection.close()


def makeGopDetail():
	db = pg.Database( database = 'usageo_500k' )
	table = 'gop2012loc'
	level = '512'
	if level is not None:
		addLevel( db, table, level )
	mergeStates( db, table, level )
	writeEachState( db, table, level )
	writeAllStates( db, table, level )
	db.connection.commit()
	db.connection.close()


def addStateLevel( db, kind, table, simplegeom, fips, level ):
	shpname = 'us2012-%(kind)s%(fips)s-20m-%(level)s' %({
		'kind': kind,
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


def addLevel( db, table, level ):
	shpfile = '%(path)s/us2012-%(table)s-500k-%(level)s/us2012-%(table)s-500k-%(level)s.shp' %({
		'path': private.OUTPUT_SHAPEFILE_PATH,
		'table': table,
		'level': level,
	})
	fulltable = '%s.%s' %( schema, table )
	temptable = '%s_%s'  %( fulltable, level )
	simplegeom = 'goog_geom%s' %( level )
	db.dropTable( temptable )
	db.loadShapefile(
		shpfile, private.TEMP_PATH, temptable,
		simplegeom, '3857', 'LATIN1', True
	)
	db.addGeometryColumn( fulltable, simplegeom, 3857, True )
	db.execute( '''
		UPDATE
			%(fulltable)s
		SET
			%(simplegeom)s =
				ST_MakeValid(
					%(temptable)s.%(simplegeom)s
				)
		FROM %(temptable)s
		WHERE %(fulltable)s.geo_id = %(temptable)s.geo_id
		;
	''' %({
		'fulltable': fulltable,
		'temptable': temptable,
		'simplegeom': simplegeom,
	}) )
	#db.dropTable( temptable )
	pass


def mergeStates( db, table, level ):
	geom = simpleGeom( level )
	db.mergeGeometry(
		schema+'.'+table, 'state', geom,
		schema+'.state', 'state', geom
	)


def writeEachState( db, table, level ):
	db.execute( 'SELECT geo_id, name FROM %s.state ORDER BY geo_id;' %( schema ) )
	for geo_id, name in db.cursor.fetchall():
		fips = geo_id.split('US')[1]
		writeState( db, table, level, fips, name )


def writeState( db, table, level, fips, name ):
	geom = simpleGeom( level )
	where = "( state = '%s' )" %( fips )
	
	geoState = db.makeFeatureCollection( schema+'.state', boxGeom, boxGeomLL, geom, '00', 'United States', where )
	geoCounty = db.makeFeatureCollection( schema+'.'+table, boxGeom, boxGeomLL, geom, fips, name, where )
	#geoTown = db.makeFeatureCollection( schema+'.cousub', boxGeom, boxGeomLL, geom, fips, name, where )
	
	geo = {
		'state': geoState,
		'county': geoCounty,
		#'town': geoTown,
	}
	
	writeGeoJSON( db, fips, geom, geo )


def writeAllStates( db, table, level ):
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
	
	geoGOP = db.makeFeatureCollection(
		schema + '.' + table,
		boxGeom, boxGeomLL, geom,
		fips, 'United States', where
	)
	geo = {
		'state': geoState,
		'county': geoGOP,
	}
	writeGeoJSON( db, fips+'-county', geom, geo )


#def writeStatesOnly( db ):
#	geom = simpleGeom( '00' )
#	where = 'true'
#	fips = '00'
#	geoState = db.makeFeatureCollection(
#		schema + '.state00',
#		boxGeom, boxGeomLL, geom,
#		fips, 'United States', where
#	)
#	geo = {
#		'state': geoState,
#	}
#	writeGeoJSON( db, fips, geom, geo )


#def writeCountiesOnly( db ):
#	geom = simpleGeom( '00' )
#	where = 'true'
#	fips = '00'
#	geoCounty = db.makeFeatureCollection(
#		schema + '.county00',
#		boxGeom, boxGeomLL, geom,
#		fips, 'United States', where
#	)
#	geo = {
#		'county': geoCounty,
#	}
#	writeGeoJSON( db, fips + '-county', geom, geo )


def writeGeoJSON( db, fips, geom, geo ):
	filename = '%s/%s-%s-%s.js' %(
		private.GEOJSON_PATH, schema, fips, geom
	)
	db.writeGeoJSON( filename, geo, 'loadGeoJSON' )


def main():
	#makeState()
	#makeCounty()
	makeGopNational()
	makeGopDetail()


if __name__ == "__main__":
	main()
	#cProfile.run( 'main()' )
