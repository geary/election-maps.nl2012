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
	db.execute( create )
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
	db.execute('''
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
	
	geom = 'geom_' + level
	db.mergeGeometry(
		't2011.districts', 'parent', geom,
		't2011.provinces', 'id', geom
	)
	
	db.execute( 'DROP TABLE IF EXISTS %s;' % tableSHP )
	
	db.connection.commit()


# TODO: refactor!
def loadProvinceFT( db, schema ):
	for row in loadFT(
		db, schema, 'provinces',
		'CREATE TABLE t2011.provinces (' +
			'id integer, ' +
			'voters integer, ' +
			'boxes integer, ' +
			'name_tr varchar, ' +
			'CONSTRAINT provinces_pkey PRIMARY KEY (id)' +
		');',
		'SELECT+' +
			"ID,NumVoters,NumBallotBoxes,'DistrictName-tr'" +
			'+FROM+934719'
	):
		db.execute('''
			INSERT INTO t2011.provinces
			VALUES ( '%s', %d, %d, '%s' )
		''' % (
			row[0], int(float(row[1])), int(float(row[2])), row[3]
		) )


def loadDistrictFT( db, schema ):
	for row in loadFT(
		db, schema, 'districts',
		'CREATE TABLE t2011.districts (' +
			'id integer, ' +
			'parent integer, ' +
			'voters integer, ' +
			'boxes integer, ' +
			'name_tr varchar, ' +
			'CONSTRAINT districts_pkey PRIMARY KEY (id)' +
		');',
		'SELECT+' +
			"ID,ParentID,NumVoters,NumBallotBoxes,'DistrictName-tr'" +
			'+FROM+928147'
	):
		db.execute('''
			INSERT INTO t2011.districts
			VALUES ( '%s', '%s', %d, %d, '%s' )
		''' % (
			row[0], row[1], int(float(row[2])), int(float(row[3])), row[4]
		) )


def process():
	#db = pg.Database( database='postgres' )
	#db.createGeoDatabase( 'turkey' )
	#db.connection.close()
	
	db = pg.Database( database='turkey' )
	
	#db.createGeoDatabase( 'turkey' )
	
	schema = 't2011'
	db.createSchema( schema )
	db.connection.commit()
	
	loadProvinceFT( db, schema )
	loadDistrictFT( db, schema )
	
	#for level in '00 50 60 70 80 90'.split(' '):
	for level in '50'.split(' '):
		loadSHP( db, schema, 'districts', level )
		#for tbl in ( 'provinces', 'districts', ):
		for tbl in ( 'provinces', ):
			name = tbl # 'Turkey'
			table = '%s.%s' %( schema, tbl )
			gid = '-1'
			targetGeom = 'geom_' + level
			#boxGeom = 'geom_00'
			boxGeom = targetGeom
			#db.addGoogleGeometry( table, geom, googGeom )
			filename = '%s/turkey-%s-%s.jsonp' %(
				private.GEOJSON_PATH, tbl, targetGeom
			)
			db.makeGeoJSON( filename, table, boxGeom, targetGeom, tbl, name, gid, 'loadGeoJSON' )
	
	db.connection.commit()
	db.connection.close()


def main():
	process()
	print 'Done!'


if __name__ == "__main__":
	main()
