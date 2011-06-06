# -*- coding: utf-8 -*-

import csv, os.path, urllib2
from zipfile import ZipFile

import pg
import private


# TODO:
'''
CREATE DATABASE turkey
  WITH ENCODING='UTF8'
       TEMPLATE=template_postgis
       CONNECTION LIMIT=-1;
'''

def loadFT( db, schema, name, create, query ):
	table = '%s.%s' %( schema, name )
	print 'Loading %s' % table
	db.cursor.execute( create )
	query = 'http://www.google.com/fusiontables/api/query?sql=' + query
	reader = csv.reader( urllib2.urlopen(query) )
	header = reader.next()
	for row in reader:
		yield row
	db.connection.commit()
	db.analyzeTable( table )

	
def loadSHP( db, schema, name, level ):
	table = '%s.%s' %( schema, name )
	tableSHP = '%s%s' %( table, level )
	db.loadShapefile(
		'../shapes/shp/%s-%s/%s.shp' %( name, level, name ),
		private.TEMP_PATH, tableSHP, True
	)
	db.connection.commit()
	geom = 'geom_' + str(level)
	#db.addGeometryColumn( table, geom, 3857 )
	db.addGeometryColumn( table, geom, 4269 )
	db.connection.commit()
	db.cursor.execute('''
		UPDATE
			%(table)s
		SET
			-- %(geom)s = ST_Transform( ST_Force_2D(shp.full_geom), 3857 )
			%(geom)s = ST_Force_2D(shp.full_geom)
		FROM
			%(tableSHP)s shp
		WHERE
			%(table)s.id = shp.name::INTEGER
		;
	''' % {
		'table': table,
		'tableSHP': tableSHP,
		'geom': geom,
	})
	db.connection.commit()

def process():
	#db = pg.Database( database='postgres' )
	#db.createGeoDatabase( 'turkey' )
	#db.connection.close()
	
	db = pg.Database( database='turkey' )
	
	#db.createGeoDatabase( 'turkey' )
	
	schema = 't2011'
	db.createSchema( schema )
	db.connection.commit()
	
	# TODO: refactor!
	for row in loadFT(
		db, schema, 'provinces',
		'CREATE TABLE t2011.provinces (' +
			'id integer, ' +
			'voters integer, ' +
			'boxes integer, ' +
			'nametr varchar, ' +
			'CONSTRAINT provinces_pkey PRIMARY KEY (id)' +
		');',
		'SELECT+' +
			"ID,NumVoters,NumBallotBoxes,'DistrictName-tr'" +
			'+FROM+934719'
	):
		db.cursor.execute('''
			INSERT INTO t2011.provinces
			VALUES ( '%s', %d, %d, '%s' )
		''' % (
			row[0], int(float(row[1])), int(float(row[2])), row[3]
		) )
		
	for row in loadFT(
		db, schema, 'districts',
		'CREATE TABLE t2011.districts (' +
			'id integer, ' +
			'parent integer, ' +
			'voters integer, ' +
			'boxes integer, ' +
			'nametr varchar, ' +
			'CONSTRAINT districts_pkey PRIMARY KEY (id)' +
		');',
		'SELECT+' +
			"ID,ParentID,NumVoters,NumBallotBoxes,'DistrictName-tr'" +
			'+FROM+928147'
	):
		db.cursor.execute('''
			INSERT INTO t2011.districts
			VALUES ( '%s', '%s', %d, %d, '%s' )
		''' % (
			row[0], row[1], int(float(row[2])), int(float(row[3])), row[4]
		) )
	
	loadSHP( db, schema, 'districts', '00' )
	loadSHP( db, schema, 'districts', '50' )
	loadSHP( db, schema, 'districts', '60' )
	loadSHP( db, schema, 'districts', '70' )
	loadSHP( db, schema, 'districts', '80' )
	loadSHP( db, schema, 'districts', '90' )
	
	db.connection.commit()
	db.connection.close()


def main():
	process()
	print 'Done!'


if __name__ == "__main__":
	main()
