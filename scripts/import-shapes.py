# -*- coding: utf-8 -*-

import csv, os.path, urllib2
from zipfile import ZipFile

import pg
import private


database = 'usageo'
schema = 'carto2010'

fullGeom = 'full_geom'
googGeom = 'goog_geom'


def cartoFileName( state, type, version='00' ):
	return os.path.join(
		private.SHAPEFILE_PATH,
		'gz_2010_%s_%s_%s_500k.zip' %( state, type, version )
	)


def process():
	createDatabase()
	db = openDatabase()
	#addSimplificationFunction( db )
	createSchema( db )
	loadStates( db )
	loadCounties( db )
	loadCongressional( db )
	loadCountySubdivisions( db )
	closeDatabase( db )


def createDatabase():
	print 'Creating database %s' % database
	db = pg.Database( database='postgres' )
	db.createGeoDatabase( database )
	db.connection.close()


def openDatabase():
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


def loadCartoFile( db, state, kind, version, table, create=True ):
	zipfile = cartoFileName( state, kind, version )
	table = schema + '.' + table
	print 'Loading %s' % zipfile
	db.loadShapefile(
		zipfile, private.TEMP_PATH, table,
		'full_geom', '4269', 'LATIN1', create
	)
	db.addGoogleGeometry( table, fullGeom, googGeom )


def loadStates( db ):
	loadCartoFile( db, 'us', '040', '00', 'state' )


def loadCounties( db ):
	loadCartoFile( db, 'us', '050', '00', 'county' )


def loadCongressional( db ):
	loadForStates( db, '500', '11', 'cd', [ '20' ] )


def loadCountySubdivisions( db ):
	loadForStates( db, '060', '00', 'cousub', [ '09', '25', '33', '50' ] )


def loadForStates( db, code, version, table, states=None ):
	#if states is None:
	#	db.execute( 'SELECT state FROM %s.state ORDER BY state ASC;' %( schema ) )
	#	states = db.cursor.fetchall()
	#...for state, in states:
	create = True
	for state in states:
		loadCartoFile( db, state, code, version, table, create )
		create = False


#def loadNH( db ):
#	loadCartoFile( db, '33', '060', '00', 'gop2012' )


def main():
	process()
	print 'Done!'


if __name__ == "__main__":
	main()
