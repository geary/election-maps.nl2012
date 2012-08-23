# -*- coding: utf-8 -*-

import pg, private

#import cProfile

database = 'nl2012'
schema = 'nl'
fullGeom = 'full_geom'
boxGeom = fullGeom


def createDatabase( database ):
	print 'Creating database %s' % database
	db = pg.Database( database='postgres' )
	db.createGeoDatabase( database )
	db.connection.close()


def createSchema( db, schema ):
	print 'Creating schema %s' % schema
	db.createSchema( schema )
	db.connection.commit()


def makeMunis():
	db = pg.Database( database = database )
	createSchema( db, schema )
	table = schema + '.muni'
	for level in ( 'full', '512', '1024', ):
		db.dropTable( table )
		srcfile = 'nl2012-%s' % level
		filename = '../shapes/shp/%s/%s.shp' %( srcfile, srcfile )
		print 'Loading %s' % filename
		db.loadShapefile(
			filename, private.TEMP_PATH, table,
			fullGeom, '3857', 'LATIN1', True
		)
		#mergeGeometries( db, 'nl.muni', 'nl.prov', level, '''
		#	WHERE
		#		nl.muni.prov = nl.reg2012.region
		#	GROUP BY
		#		nl.muni.prov
		#''' )
		#mergeGeometries( db, 'nl.prov', 'nl.nl', level, '''
		#	WHERE
		#		true
		#''' )
		writeAllMunis( db, table, level )
	db.connection.commit()
	db.connection.close()


def mergeGeometries( db, sourceTable, targetTable, level, whereGroupBy ):
	geom = fullGeom
	db.mergeGeometry( sourceTable, geom, targetTable, geom, whereGroupBy )


def writeAllMunis( db, table, level ):
	geom = fullGeom
	where = 'true'
	geoid = 'NL'  # TODO
	geoMuni = db.makeFeatureCollection(
		schema + '.muni',
		boxGeom, geom, geoid, 'The Netherlands',
		'muni', 'name', 'prov', where #, fixGeoID
	)
	#geoRegion = db.makeFeatureCollection(
	#	schema + '.prov',
	#	None, None, geom, geoid, 'The Netherlands',
	#	'region', 'nccenr', 'tncc', where, fixGeoID
	#)
	#geoNation = db.makeFeatureCollection(
	#	schema + '.nl',
	#	None, None, geom, geoid, 'The Netherlands',
	#	'nation', 'nccenr', 'nation', where, fixGeoID
	#)
	geo = {
		#'nation': geoNation,
		#'region': geoRegion,
		'muni': geoMuni,
	}
	writeGeoJSON( db, geoid, level, geo )


def writeGeoJSON( db, geoid, level, geo ):
	filename = '%s/%s-%s-%s' %(
		private.GEOJSON_PATH, schema, geoid, level
	)
	db.writeGeoJSON( filename + '.js', geo, 'loadGeoJSON' )
	db.writeGeoJSON( filename + '.geojson', geo )


def main():
	createDatabase( database )
	makeMunis()


if __name__ == "__main__":
	main()
	#cProfile.run( 'main()' )
