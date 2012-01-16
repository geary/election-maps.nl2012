# -*- coding: utf-8 -*-

import csv, os.path, urllib2
from zipfile import ZipFile

import pg
import private


database = 'usageo'
schema = 'carto2010'

fullGeom = 'full_geom'
googGeom = 'goog_geom'


def cartoFileName( state, type ):
	return os.path.join(
		private.SHAPEFILE_PATH,
		'gz_2010_%s_%s_00_500k.zip' %( state, type )
	)


def process():
	createDatabase()
	db = openDatabase()
	addSimplificationFunction( db )
	createSchema( db )
	loadStates( db )
	loadCounties( db )
	#loadCountySubdivisions( db )
	#createCountyCousub( db )
	loadNH( db )
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


def loadShapefile( db, state, kind, table, create=True ):
	zipfile = cartoFileName( state, kind )
	table = schema + '.' + table
	print 'Loading %s' % zipfile
	db.loadShapefile( zipfile, private.TEMP_PATH, table, create )
	db.addGoogleGeometry( table, fullGeom, googGeom )


def loadStates( db ):
	loadShapefile( db, 'us', '040', 'state' )


def loadCounties( db ):
	loadShapefile( db, 'us', '050', 'county' )


def loadCountySubdivisions( db ):
	db.execute( 'SELECT state FROM %s.state ORDER BY state ASC;' %( schema ) )
	create = True
	for state, in db.cursor.fetchall():
		loadShapefile( db, state, '060', 'cousub', create )
		create = False


def loadNH( db ):
	loadShapefile( db, '33', '060', 'coucou' )


def createCountyCousub( db ):
	# CT, MA, NH, VT report votes by county subdivision ("town")
	whereCousub = '''
		( state = '09' OR state = '25' OR state = '33' OR state = '50' )
	'''
	db.execute( '''
		DROP TABLE IF EXISTS %(schema)s.coucou;
		CREATE TABLE %(schema)s.coucou (
			LIKE %(schema)s.cousub
				INCLUDING DEFAULTS
				INCLUDING CONSTRAINTS
				INCLUDING INDEXES
		);
		DROP SEQUENCE IF EXISTS %(schema)s.coucou_gid_seq;
		CREATE SEQUENCE %(schema)s.coucou_gid_seq;
		INSERT INTO %(schema)s.coucou
			SELECT nextval('%(schema)s.coucou_gid_seq'),
				geo_id, state, county, '' AS cousub,
				name, lsad, censusarea, full_geom, goog_geom
			FROM %(schema)s.county
			WHERE NOT %(whereCousub)s;
		INSERT INTO %(schema)s.coucou
			SELECT nextval('%(schema)s.coucou_gid_seq'),
				geo_id, state, county, cousub,
				name, lsad, censusarea, full_geom, goog_geom
			FROM %(schema)s.cousub
			WHERE %(whereCousub)s;
	''' %({
		'schema': schema,
		'whereCousub': whereCousub
	}) )


def main():
	process()
	print 'Done!'


if __name__ == "__main__":
	main()
