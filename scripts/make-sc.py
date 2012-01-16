# -*- coding: utf-8 -*-

import csv, os.path

import pg
import private


database = 'usageo'
schema = 'carto2010'

fullGeom = 'full_geom'
googGeom = 'goog_geom'


def process():
	db = openDatabase()
	createSC( db )
	closeDatabase( db )


def openDatabase():
	print 'Opening database %s' % database
	return pg.Database( database=database )


def closeDatabase( db ):
	db.connection.commit()
	db.connection.close()


def createSC( db ):
	db.execute( '''
		DROP TABLE IF EXISTS %(target)s;
		
		CREATE TABLE %(target)s(
			LIKE %(source)s
				INCLUDING DEFAULTS
				INCLUDING CONSTRAINTS
				INCLUDING INDEXES
		);
		
		ALTER TABLE %(target)s DROP COLUMN full_geom;
		ALTER TABLE %(target)s DROP COLUMN goog_geom;
		
		SELECT AddGeometryColumn(
			'%(schema)s', '%(targetTable)s',
			'full_geom', 4269,
			'MULTIPOLYGON', 2
		);
		SELECT AddGeometryColumn(
			'%(schema)s', '%(targetTable)s',
			'goog_geom', 3857,
			'MULTIPOLYGON', 2
		);
		
		DROP SEQUENCE IF EXISTS %(target)s_gid_seq;
		CREATE SEQUENCE %(target)s_gid_seq;
		
		INSERT INTO %(target)s
			SELECT nextval('%(target)s_gid_seq'),
				geo_id, state, county,
				name, lsad, censusarea, full_geom, goog_geom
			FROM %(source)s
			WHERE state = '45';
	''' %({
		'schema': schema,
		'source': schema + '.county',
		'target': schema + '.sc',
		'targetTable': 'sc',
	}) )


def main():
	process()
	print 'Done!'


if __name__ == "__main__":
	main()
