# -*- coding: utf-8 -*-

import csv, os.path, urllib2
from zipfile import ZipFile

import pg
import private


def cartoFileName( state, type ):
	return os.path.join(
		private.SHAPEFILE_PATH,
		'gz_2010_%s_%s_00_500k.zip' %( state, type )
	)


def process():
	database = 'usageo'
	schema = 'carto2010'
	
	print 'Creating database %s' % database
	db = pg.Database( database='postgres' )
	db.createGeoDatabase( database )
	db.connection.close()
	
	print 'Opening database %s' % database
	db = pg.Database( database=database )
	
	print 'Creating schema %s' % schema
	db.createSchema( schema )
	db.connection.commit()
	
	zipfile = cartoFileName( 'us', '040' )
	print 'Loading %s' % zipfile
	db.loadShapefile( zipfile, private.TEMP_PATH, schema+'.state', True )
	
	zipfile = cartoFileName( 'us', '050' )
	print 'Loading %s' % zipfile
	db.loadShapefile( zipfile, private.TEMP_PATH, schema+'.county', True )
	
	db.execute( 'SELECT state FROM %s.state ORDER BY state ASC;' %( schema ) )
	create = True
	for state, in db.cursor.fetchall():
		zipfile = cartoFileName( state, '060' )
		print 'Loading %s' % zipfile
		db.loadShapefile( zipfile, private.TEMP_PATH, schema+'.cousub', create )
		create = False
	
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
	
	db.connection.commit()
	db.connection.close()


def main():
	process()
	print 'Done!'


if __name__ == "__main__":
	main()
