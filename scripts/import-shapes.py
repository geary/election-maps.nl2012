# -*- coding: utf-8 -*-

import csv, os.path, urllib2
from zipfile import ZipFile

import pg
import private


schema = 'carto2010'

fullGeom = 'full_geom'
googGeom = 'goog_geom'


def cartoFileName( resolution, state, type, version='00' ):
	return os.path.join(
		private.CENSUS_SHAPEFILE_PATH,
		'gz_2010_%s_%s_%s_%s.zip' %( state, type, version, resolution )
	)


def process():
	for resolution in ( '500k', '5m', '20m', ):
		database = 'usageo_' + resolution
		createDatabase( database)
		db = openDatabase( database )
		#addSimplificationFunction( db )
		createSchema( db )
		loadStates( db, database, resolution )
		loadCounties( db, database, resolution )
		if resolution == '500k':
			loadCongressional( db, database, resolution )
			loadCountySubdivisions( db, database, resolution )
		closeDatabase( db )


def createDatabase( database ):
	print 'Creating database %s' % database
	db = pg.Database( database='postgres' )
	db.createGeoDatabase( database )
	db.connection.close()


def openDatabase( database):
	print 'Opening database %s' % database
	return pg.Database( database=database )


def closeDatabase( db ):
	db.connection.commit()
	db.connection.close()


def addSimplificationFunction( db ):
	db.execute( file( 'map_simplification_program/func.sql').read() )

def createSchema( db ):
	print 'Creating schema %s' % schema
	db.createSchema( schema )
	db.connection.commit()


def loadCartoFile( db, database, resolution, state, kind, version, table, create=True ):
	zipfile = cartoFileName( resolution, state, kind, version )
	table = schema + '.' + table
	print 'Loading %s' % zipfile
	db.loadShapefile(
		database, zipfile, private.TEMP_PATH, table,
		'full_geom', '4269', 'LATIN1', create
	)
	db.addGoogleGeometry( table, fullGeom, googGeom )
	db.indexGeometryColumn( table, googGeom )


def loadStates( db, database, resolution ):
	loadCartoFile( db, database, resolution, 'us', '040', '00', 'state' )


def loadCounties( db, database, resolution ):
	loadCartoFile( db, database, resolution, 'us', '050', '00', 'county' )


def loadCongressional( db, database, resolution ):
	loadForStates( db, database, resolution, '500', '11', 'cd', [ '20' ] )


def loadCountySubdivisions( db, database, resolution ):
	loadForStates( db, database, resolution, '060', '00', 'cousub', [ '09', '25', '33', '50' ] )


def loadForStates( db, database, resolution, code, version, table, states=None ):
	#if states is None:
	#	db.execute( 'SELECT state FROM %s.state ORDER BY state ASC;' %( schema ) )
	#	states = db.cursor.fetchall()
	#...for state, in states:
	create = True
	for state in states:
		loadCartoFile( db, database, resolution, state, code, version, table, create )
		create = False


def main():
	process()
	print 'Done!'


if __name__ == "__main__":
	main()
