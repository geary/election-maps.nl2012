# -*- coding: utf-8 -*-

import json, os, os.path, shutil, tempfile, time
import psycopg2
from zipfile import ZipFile

import private


def splitTableName( table ):
	split = table.split('.')
	if len(split) == 1:
		split = [ 'public', table ]
	return split


def isGoogleSRID( srid ):
	return srid == 3857 or srid == 900913

class Database:
	
	def __init__( self, **kw ):
		self.database = kw.get( 'database' )
		self.connection = psycopg2.connect(
			host = kw.get( 'host', 'localhost' ),
			port = kw.get( 'port', '5432' ),
			database = self.database,
			user = kw.get( 'user', private.POSTGRES_USERNAME ),
			password = kw.get( 'password', private.POSTGRES_PASSWORD ),
		)
		self.cursor = self.connection.cursor()
	
	def execute( self, query ):
		print query
		self.cursor.execute( query )
	
	def createGeoDatabase( self, database ):
		isolation_level = self.connection.isolation_level
		self.connection.set_isolation_level(
			psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT
		)
		self.execute('''
			DROP DATABASE IF EXISTS %(database)s;
		''' % {
			'database': database,
		})
		self.execute('''
			CREATE DATABASE %(database)s
				WITH ENCODING = 'UTF8'
			TEMPLATE = template_postgis
			CONNECTION LIMIT = -1;
		''' % {
			'database': database,
		})
		self.connection.set_isolation_level( isolation_level )
	
	def createSchema( self, schema ):
		self.execute('''
			DROP SCHEMA IF EXISTS %(schema)s CASCADE;
			CREATE SCHEMA %(schema)s AUTHORIZATION postgres;
		''' % {
			'schema': schema,
		})
		self.connection.commit()
	
	def loadShapefile( self, zipfile, tempdir, tablename, create ):
		shpfile = zipfile
		zipname = os.path.basename( zipfile )
		basename, ext = os.path.splitext( zipname )
		shpname = basename + '.shp'
		sqlname = basename + '.sql'
		unzipdir = tempfile.mkdtemp( dir=tempdir )
		if ext.lower() == '.zip':
			print 'Unzipping %s to %s' %( zipname, unzipdir )
			ZipFile( zipfile, 'r' ).extractall( unzipdir )
			shpfile = os.path.join( unzipdir, shpname )
		print 'loadShapeFile %s' % shpfile
		sqlfile = os.path.join( unzipdir, sqlname )
		t1 = time.clock()
		command = 'shp2pgsql -g full_geom -s 4269 -W LATIN1 %s %s %s %s >%s' %(
			( '-a', '-c -I' )[create], shpfile, tablename, self.database, sqlfile
		)
		print 'Running shp2pgsql:\n%s' % command
		os.system( command )
		t2 = time.clock()
		print 'shp2pgsql %.1f seconds' %( t2 - t1 )
		command = 'psql -q -U postgres -d usageo -f %s' %(
			sqlfile
		)
		print 'Running psql:\n%s' % command
		os.system( command )
		t3 = time.clock()
		print 'psql %.1f seconds' %( t3 - t2 )
		shutil.rmtree( unzipdir )
		print 'loadShapeZip done'
	
	def getSRID( self, table, column ):
		( schema, table ) = splitTableName( table )
		self.execute('''
			SELECT Find_SRID( '%(schema)s', '%(table)s', '%(column)s');
		''' % {
			'schema': schema,
			'table': table,
			'column': column,
		})
		return self.cursor.fetchone()[0]
	
	def columnExists( self, table, column ):
		self.execute('''
			SELECT
				attname
			FROM
				pg_attribute
			WHERE
				attrelid = (
					SELECT oid FROM pg_class WHERE relname = '%(table)s'
				) AND attname = '%(column)s'
			;
		''' % {
			'table': table,
			'column': column,
		})
		return self.cursor.fetchone() is not None
	
	def addGeometryColumn( self, table, geom, srid=-1, always=False ):
		print 'addGeometryColumn %s %s' %( table, geom )
		( schema, table ) = splitTableName( table )
		vars = { 'schema':schema, 'table':table, 'geom':geom, 'srid':srid, }
		if self.columnExists( table, geom ):
			if not always:
				return
			self.execute('''
				ALTER TABLE %(schema)s.%(table)s DROP COLUMN IF EXISTS %(geom)s;
			''' % vars )
		self.execute('''
			SELECT
				AddGeometryColumn(
					'%(schema)s', '%(table)s', '%(geom)s',
					%(srid)d, 'MULTIPOLYGON', 2
				);
		''' % vars )
		self.connection.commit()
	
	def indexGeometryColumn( self, table, geom, index=None ):
		index = index or ( 'idx_' + geom )
		print 'indexGeometryColumn %s %s %s' %( table, geom, index )
		vars = { 'table':table, 'geom':geom, 'index':index, }
		t1 = time.clock()
		self.execute('''
			CREATE INDEX %(index)s ON %(table)s
			USING GIST ( %(geom)s );
		''' % vars )
		self.connection.commit()
		t2 = time.clock()
		print 'CREATE INDEX %.1f seconds' %( t2 - t1 )
		self.analyzeTable( table )
	
	def analyzeTable( self, table ):
		print 'analyzeTable %s' %( table )
		t1 = time.clock()
		isolation_level = self.connection.isolation_level
		self.connection.set_isolation_level(
			psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT
		)
		self.execute('''
			VACUUM ANALYZE %(table)s;
		''' % { 'table':table } )
		self.connection.set_isolation_level( isolation_level )
		t2 = time.clock()
		print 'VACUUM ANALYZE %.1f seconds' %( t2 - t1 )
	
	def addGoogleGeometry( self, table, llgeom, googeom ):
		print 'addGoogleGeometry %s %s %s' %( table, llgeom, googeom )
		self.addGeometryColumn( table, googeom, 3857, True )
		t1 = time.clock()
		self.execute('''
			UPDATE
				%(table)s
			SET
				%(googeom)s = ST_Multi(
					ST_Transform(
						ST_Force_2D(
							-- ST_MakeValid(
								%(llgeom)s
							-- )
						),
						3857
					)
				)
			;
		''' % {
			'table': table,
			'llgeom': llgeom,
			'googeom': googeom,
		})
		self.connection.commit()
		t2 = time.clock()
		print 'UPDATE ST_Transform %.1f seconds' %( t2 - t1 )
	
	def mergeGeometry( self,
		sourceTable, sourceIdCol, sourceGeom,
		targetTable, targetIdCol, targetGeom
	):
		print 'mergeGeometry %s %s %s %s %s %s' %(
			sourceTable, sourceIdCol, sourceGeom,
			targetTable, targetIdCol, targetGeom
		)
		t1 = time.clock()
		srid = self.getSRID( sourceTable, sourceGeom )
		self.addGeometryColumn( targetTable, targetGeom, srid, True )
		self.execute('''
			UPDATE
				%(targetTable)s
			SET
				%(targetGeom)s = (
					SELECT
						ST_Multi(
							-- ST_MakeValid(
								ST_Union(
									%(sourceGeom)s
								)
							-- )
						)
					FROM
						%(sourceTable)s
					WHERE
						%(targetTable)s.%(targetIdCol)s = %(sourceTable)s.%(sourceIdCol)s
					GROUP BY
						%(sourceTable)s.%(sourceIdCol)s
						-- %(targetTable)s.%(targetIdCol)s
				);
			
			SELECT Populate_Geometry_Columns();
		''' % {
			'sourceTable': sourceTable,
			'sourceIdCol': sourceIdCol,
			'sourceGeom': sourceGeom,
			'targetTable': targetTable,
			'targetIdCol': targetIdCol,
			'targetGeom': targetGeom,
		})
		self.connection.commit()
		t2 = time.clock()
		print 'UPDATE ST_Union %.1f seconds' %( t2 - t1 )
	
	def simplifyGeometry( self,
		table, sourceGeom, targetGeom, tolerance
	):
		print 'simplifyGeometry %s %s %s %f' %(
			table, sourceGeom, targetGeom, tolerance
		)
		self.addGeometryColumn(
			table, targetGeom,
			self.getSRID(table,sourceGeom), True
		)
		t1 = time.clock()
		self.execute('''
			UPDATE
				%(table)s
			SET
				%(targetGeom)s =
					ST_Multi(
						-- ST_MakeValid(
							ST_SimplifyPreserveTopology(
								%(sourceGeom)s,
								%(tolerance)f
							)
						-- )
					)
			;
			
			SELECT Populate_Geometry_Columns();
		''' % {
			'table': table,
			'sourceGeom': sourceGeom,
			'targetGeom': targetGeom,
			'tolerance': tolerance,
		})
		self.connection.commit()
		t2 = time.clock()
		print 'UPDATE ST_SimplifyPreserveTopology %.1f seconds' %( t2 - t1 )
	
	def makeGeoJSON( self, filename, table, boxGeom, boxGeomLL, polyGeom, geoid, name, where, jsonp ):
		print 'makeGeoJSON', filename
		t1 = time.clock()
		featurecollection = self.makeFeatureCollection( table, boxGeom, boxGeomLL, polyGeom, geoid, name, where )
		self.writeGeoJSON( filename, featurecollection, jsonp )
		t2 = time.clock()
		print 'makeGeoJSON %.1f seconds' %( t2 - t1 )


	def writeGeoJSON( self, filename, data, jsonp ):
		print 'writeGeoJSON', filename
		geojson = json.dumps( data )
		if jsonp:
			geojson = jsonp + '(' + geojson + ')'
		file( filename, 'wb' ).write( geojson )


	def makeFeatureCollection( self, table, boxGeom, boxGeomLL, polyGeom, geoid, name, where ):
		
		print 'makeFeatureCollection'
		srid = self.getSRID( table, polyGeom )
		digits = [ 6, 0 ][ isGoogleSRID(srid) ]  # integer for google projection
		
		t1 = time.clock()
		self.execute('''
			SELECT
				ST_AsGeoJSON( ST_Centroid( ST_Extent( %(polyGeom)s ) ), %(digits)s ),
				ST_AsGeoJSON( ST_Extent( %(boxGeom)s ), %(digits)s, 1 ),
				ST_AsGeoJSON( ST_Extent( %(boxGeomLL)s ), 6, 1 )
			FROM 
				%(table)s
			WHERE
				%(where)s
			;
		''' % {
			'table': table,
			'boxGeom': boxGeom,
			'boxGeomLL': boxGeomLL,
			'polyGeom': polyGeom,
			'where': where,
			'digits': digits,
		})
		( extentcentroidjson, extentjson, extentjsonll ) = self.cursor.fetchone()
		extentcentroid = json.loads( extentcentroidjson )
		extent = json.loads( extentjson )
		extentLL = json.loads( extentjsonll )
		t2 = time.clock()
		print 'ST_Extent %.1f seconds' %( t2 - t1 )
		
		self.execute('''
			SELECT
				geo_id, name, lsad,
				ST_AsGeoJSON( ST_Centroid( %(polyGeom)s ), %(digits)s, 1 ),
				ST_AsGeoJSON( %(polyGeom)s, %(digits)s, 1 )
			FROM
				%(table)s
			WHERE
				ST_IsValid( %(polyGeom)s )
			AND
				%(where)s
			;
		''' % {
			'table': table,
			'polyGeom': polyGeom,
			'digits': digits,
			'where': where,
		})
		t3 = time.clock()
		print 'SELECT rows %.1f seconds' %( t3 - t2 )
		
		features = []
		for featuregeoid, featurename, featurelsad, centroidjson, geomjson in self.cursor.fetchall():
			#if not centroidjson or not geomjson:
			#	continue
			geometry = json.loads( geomjson )
			centroid = json.loads( centroidjson )
			feature = {
				'type': 'Feature',
				'bbox': geometry['bbox'],
				'id': featuregeoid,
				'name': featurename,
				'lsad': featurelsad,
				'centroid': centroid['coordinates'],
				'geometry': geometry,
			}
			features.append( feature )
			del geometry['bbox']
		featurecollection = {
			'type': 'FeatureCollection',
			'bbox': extent['bbox'],
			'bboxLL': extentLL['bbox'],
			'id': geoid,
			'name': name,
			'centroid': extentcentroid['coordinates'],
			'features': features,
			'table': table,
		}
		if srid != -1:
			featurecollection['crs'] = {
				'type': 'name',
				'properties': {
					'name': 'urn:ogc:def:crs:EPSG::%d' % srid
				},
			}
		t4 = time.clock()
		print 'makeFeatureCollection %.1f seconds' %( t4 - t3 )
		return featurecollection


if __name__ == "__main__":
	pass  # TODO?
