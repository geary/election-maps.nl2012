# -*- coding: utf-8 -*-

import csv, os.path, urllib2
from zipfile import ZipFile

import pg
import private


database = 'usageo'
schema = 'carto2010'
	

def cartoFileName( state, type ):
	return os.path.join(
		private.SHAPEFILE_PATH,
		'gz_2010_%s_%s_00_500k.zip' %( state, type )
	)


def process():
	createDatabase()
	db = openDatabase()
	createSchema( db )
	loadStates( db )
	loadCounties( db )
	loadCountySubdivisions( db )
	createCountyCousub( db )
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


def createSchema( db ):
	print 'Creating schema %s' % schema
	db.createSchema( schema )
	db.connection.commit()


def loadStates( db ):
	zipfile = cartoFileName( 'us', '040' )
	print 'Loading %s' % zipfile
	db.loadShapefile( zipfile, private.TEMP_PATH, schema+'.state', True )


def loadCounties( db ):
	zipfile = cartoFileName( 'us', '050' )
	print 'Loading %s' % zipfile
	db.loadShapefile( zipfile, private.TEMP_PATH, schema+'.county', True )


def loadCountySubdivisions( db ):
	db.execute( 'SELECT state FROM %s.state ORDER BY state ASC;' %( schema ) )
	create = True
	for state, in db.cursor.fetchall():
		zipfile = cartoFileName( state, '060' )
		print 'Loading %s' % zipfile
		db.loadShapefile( zipfile, private.TEMP_PATH, schema+'.cousub', create )
		create = False

	
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
				name, lsad, censusarea, full_geom
			FROM %(schema)s.county
			WHERE NOT %(whereCousub)s;
		INSERT INTO %(schema)s.coucou
			SELECT nextval('%(schema)s.coucou_gid_seq'),
				geo_id, state, county, cousub,
				name, lsad, censusarea, full_geom
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
