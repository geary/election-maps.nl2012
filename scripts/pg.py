# -*- coding: utf-8 -*-

import json, os, os.path, re, shutil, tempfile, time, unicodedata
import psycopg2
from zipfile import ZipFile

import private


# 20037508.342789 is halfway around the equator in Google Mercator,
# as calculated by:
#	SELECT ST_AsText(
#		ST_Transform(
#			ST_SetSRID(
#				ST_Point(180,0),
#				4326
#			),
#			3857
#		)
#	);
GOOG_180 = 20037508.342789
GOOG_360 = GOOG_180 * 2


def splitTableName( table ):
	split = table.split('.')
	if len(split) == 1:
		split = [ 'public', table ]
	return split


def isGoogleSRID( srid ):
	return srid == 3857 or srid == 900913


def fixMultiPolygon180( geometry, fixer ):
	if not re.match( r'MULTIPOLYGON\(', geometry ):
		print 'ERROR: Not a MultiPolygon'
		return
	return re.sub( r'([\(,])((?:\d+)(?:\.\d+)?) ', fixer, geometry )


def fixCoord3857( match ):
	value = float( match.group(2) ) - GOOG_360
	return match.group(1) + str(value) + ' '


def fixCoord4326( match ):
	value = float( match.group(2) ) - 360
	return match.group(1) + str(value) + ' '


class Database:
	
	def __init__( self, **kw ):
		self.database = kw.get( 'database' )
		self.connection = psycopg2.connect(
			host = kw.get( 'host', private.POSTGRES_HOST ),
			port = kw.get( 'port', private.POSTGRES_PORT ),
			database = self.database,
			user = kw.get( 'user', private.POSTGRES_USERNAME ),
			password = kw.get( 'password', private.POSTGRES_PASSWORD ),
		)
		self.cursor = self.connection.cursor()
	
	def execute( self, query, verbose=True ):
		if verbose: print query
		self.cursor.execute( query )
	
	def executeCommit( self, query, verbose=True ):
		isolation_level = self.connection.isolation_level
		self.connection.set_isolation_level(
			psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT
		)
		self.execute( query, verbose )
		self.connection.set_isolation_level( isolation_level )
	
	def createGeoDatabase( self, database ):
		self.dropDatabase( database )
		self.executeCommit('''
			CREATE DATABASE %(database)s
				WITH ENCODING = 'UTF8'
			TEMPLATE = template_postgis_20
			CONNECTION LIMIT = -1;
		''' % {
			'database': database,
		})
	
	def addUtilityFunctions( self ):
		self.executeCommit('''
			CREATE OR REPLACE FUNCTION lpad_notrunc( text, int4, varchar(1) )
			RETURNS text
			AS $$
				SELECT repeat( $3, $2 - length($1) ) || $1;
			$$ LANGUAGE SQL;
		''' )
	
	def createLikeTable( self, target, source ):
		self.executeCommit('''
			DROP TABLE IF EXISTS %(target)s;
			CREATE TABLE %(target)s (
				LIKE %(source)s
					INCLUDING DEFAULTS
					INCLUDING CONSTRAINTS
					INCLUDING INDEXES
			);
			DROP SEQUENCE IF EXISTS %(target)s_gid_seq;
			CREATE SEQUENCE %(target)s_gid_seq;
		''' % {
			'target': target,
			'source': source,
		})
	
	def dropDatabase( self, name ):
		return self.drop( 'DATABASE', name )
	
	def dropSchema( self, name ):
		return self.drop( 'SCHEMA', name )
	
	def dropTable( self, name ):
		return self.drop( 'TABLE', name )
	
	def drop( self, kind, name ):
		self.executeCommit('''
			DROP %(kind)s IF EXISTS %(name)s;
		''' % {
			'kind': kind,
			'name': name,
		})
	
	def createSchema( self, schema ):
		self.executeCommit('''
			DROP SCHEMA IF EXISTS %(schema)s CASCADE;
			CREATE SCHEMA %(schema)s AUTHORIZATION postgres;
		''' % {
			'schema': schema,
		})
	
	def loadShapefile( self, zipfile, tempdir, tablename, column=None, srid=None, encoding=None, create=True, shpfilename=None, tweaksql=None ):
		if column is None: column = 'full_geom'
		if srid is None: srid = '4269'
		if encoding is None: encoding = 'LATIN1'
		shpfile = zipfile
		zipname = os.path.basename( zipfile )
		basename, ext = os.path.splitext( zipname )
		shpname = basename + '.shp'
		sqlname = basename + '.sql'
		unzipdir = tempfile.mkdtemp( dir=tempdir )
		if ext.lower() == '.zip':
			print 'Unzipping %s to %s' %( zipname, unzipdir )
			ZipFile( zipfile, 'r' ).extractall( unzipdir )
			shpfile = os.path.join( unzipdir, shpfilename or shpname )
		print 'loadShapefile %s' % shpfile
		sqlfile = os.path.join( unzipdir, sqlname )
		t1 = time.clock()
		command = '"%s/shp2pgsql" %s -g %s -s %s -W %s %s %s %s >%s' %(
			private.POSTGRES_BIN, ( '-a', '-c -I' )[create],
			column, srid, encoding,
			shpfile, tablename, self.database, sqlfile
		)
		print 'Running shp2pgsql:\n%s' % command
		os.system( command )
		t2 = time.clock()
		print 'shp2pgsql %.1f seconds' %( t2 - t1 )
		
		if tweaksql:
			sqlfile = tweaksql( sqlfile )
		
		command = '"%s/psql" -h %s -p %s -q -U %s -d %s -f %s' %(
			private.POSTGRES_BIN,
			private.POSTGRES_HOST,
			private.POSTGRES_PORT,
			private.POSTGRES_USERNAME,
			self.database, sqlfile
		)
		print 'Running psql:\n%s' % command
		os.system( command )
		t3 = time.clock()
		print 'psql %.1f seconds' %( t3 - t2 )
		
		shutil.rmtree( unzipdir )
		print 'loadShapefile done'
	
	def saveShapefile( self, shpfile, shpdir, tablename, column=None, srid=None ):
		if column is None: column = 'full_geom'
		if srid is None: srid = '4269'
		outdir = os.path.join( shpdir, shpfile )
		makeNewDir( outdir )
		print 'saveShapefile %s' % shpfile
		t1 = time.clock()
		command = '"%s/pgsql2shp" -f %s/%s -h %s -p %s -u %s -P %s -g %s %s %s' %(
			private.POSTGRES_BIN, outdir, shpfile,
			private.POSTGRES_HOST,
			private.POSTGRES_PORT,
			private.POSTGRES_USERNAME,
			private.POSTGRES_PASSWORD,
			column, self.database, tablename
		)
		print 'Running pgsql2shp:\n%s' % command
		os.system( command )
		t2 = time.clock()
		print 'pgsql2shp %.1f seconds' %( t2 - t1 )
		print 'saveShapefile done'
	
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
	
	def fix180( self, table, fullGeom, googGeom, where ):
		self.fixGeom180( table, fullGeom, 4326, 4269, fixCoord4326, where )
		self.fixGeom180( table, googGeom, 3857, 3857, fixCoord3857, where )
		
	def fixGeom180( self, table, geom, srid1, srid2, fixer, where ):
		print 'fixGeom180 %s %s %s %s' %( table, geom, fixer.func_name, where )
		self.execute('''
			SELECT
				gid,
				ST_AsText( ST_Transform( %(geom)s, %(srid1)d ) )
			FROM
				%(table)s
			WHERE
				%(where)s
			;
		''' % {
			'table': table,
			'geom': geom,
			'srid1': srid1,
			'where': where,
		})
		for gid, wkt in self.cursor.fetchall():
			wkt = fixMultiPolygon180( wkt, fixer )
			self.execute('''
				UPDATE
					%(table)s
				SET
					%(geom)s = ST_GeometryFromText( '%(wkt)s', %(srid2)d )
			WHERE
				gid = %(gid)s
				;
			''' % {
				'table': table,
				'geom': geom,
				'wkt': wkt,
				'srid2': srid2,
				'gid': gid,
			}, False )
		self.connection.commit()
	
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
	
	def indexGeometryColumn( self, table, geom ):
		print 'indexGeometryColumn %s %s' %( table, geom )
		vars = { 'table':table, 'geom':geom, }
		t1 = time.clock()
		self.executeCommit('''
			CREATE INDEX ON %(table)s
			USING GIST ( %(geom)s );
		''' % vars )
		t2 = time.clock()
		print 'CREATE INDEX %.1f seconds' %( t2 - t1 )
		self.analyzeTable( table )
	
	def analyzeTable( self, table ):
		print 'analyzeTable %s' %( table )
		t1 = time.clock()
		self.executeCommit('''
			VACUUM ANALYZE %(table)s;
		''' % { 'table':table } )
		t2 = time.clock()
		print 'VACUUM ANALYZE %.1f seconds' %( t2 - t1 )
	
	def addGoogleGeometry( self, table, llgeom, googeom ):
		print 'addGoogleGeometry %s %s %s' %( table, llgeom, googeom )
		self.addGeometryColumn( table, googeom, 3857 )
		t1 = time.clock()
		self.executeCommit('''
			UPDATE
				%(table)s
			SET
				%(googeom)s = ST_Multi(
					ST_Transform(
						ST_Force_2D(
							ST_MakeValid(
								%(llgeom)s
							)
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
		t2 = time.clock()
		print 'UPDATE ST_Transform %.1f seconds' %( t2 - t1 )
	
	def mergeGeometry( self,
		sourceTable, sourceGeom,
		targetTable, targetGeom,
		whereGroupBy
	):
		print 'mergeGeometry %s %s %s %s %s' %(
			sourceTable, sourceGeom,
			targetTable, targetGeom,
			whereGroupBy
		)
		t1 = time.clock()
		srid = self.getSRID( sourceTable, sourceGeom )
		self.addGeometryColumn( targetTable, targetGeom, srid )
		self.executeCommit('''
			UPDATE
				%(targetTable)s
			SET
				%(targetGeom)s = (
					SELECT
						ST_Multi(
							ST_MakeValid(
								ST_Union(
									--ST_SnapToGrid(
										%(sourceGeom)s
									--	,
									--	0.0000001
									--)
								)
							)
						)
					FROM
						%(sourceTable)s
					%(whereGroupBy)s
				);
			
			SELECT Populate_Geometry_Columns();
		''' % {
			'sourceTable': sourceTable,
			'sourceGeom': sourceGeom,
			'targetTable': targetTable,
			'targetGeom': targetGeom,
			'whereGroupBy': whereGroupBy,
		})
		t2 = time.clock()
		print 'UPDATE ST_Union %.1f seconds' %( t2 - t1 )
	
	# TODO: refactor with mergeGeometry
	def createMergedGeometryTable( self,
		sourceTable, sourceGeom,
		targetTable, targetGeom,
		cols, columns,
		whereGroupBy
	):
		print 'createMergedGeometryTable %s %s %s %s %s' %(
			sourceTable, sourceGeom,
			targetTable, targetGeom,
			whereGroupBy
		)
		t1 = time.clock()
		srid = self.getSRID( sourceTable, sourceGeom )
		self.executeCommit( '''
			CREATE TABLE %(targetTable)s (
				gid serial,
				%(columns)s
			);
			ALTER TABLE %(targetTable)s ADD PRIMARY KEY (gid);
		''' %({
			'targetTable': targetTable,
			'columns': columns,
		}) )
		self.addGeometryColumn( targetTable, targetGeom, srid )
		self.executeCommit('''
			INSERT INTO
				%(targetTable)s
			SELECT nextval('%(targetTable)s_gid_seq'),
				%(cols)s,
				ST_Multi(
					ST_MakeValid(
						ST_Union(
							--ST_SnapToGrid(
								%(sourceGeom)s
							--	,
							--	0.0000001
							--)
						)
					)
				)
			FROM
				%(sourceTable)s
			%(whereGroupBy)s;
			
			SELECT Populate_Geometry_Columns();
		''' % {
			'sourceTable': sourceTable,
			'sourceGeom': sourceGeom,
			'targetTable': targetTable,
			'targetGeom': targetGeom,
			'cols': cols,
			'columns': columns,
			'whereGroupBy': whereGroupBy,
		})
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
		self.executeCommit('''
			UPDATE
				%(table)s
			SET
				%(targetGeom)s =
					ST_Multi(
						ST_MakeValid(
							ST_SimplifyPreserveTopology(
								%(sourceGeom)s,
								%(tolerance)f
							)
						)
					)
			;
			
			SELECT Populate_Geometry_Columns();
		''' % {
			'table': table,
			'sourceGeom': sourceGeom,
			'targetGeom': targetGeom,
			'tolerance': tolerance,
		})
		t2 = time.clock()
		print 'UPDATE ST_SimplifyPreserveTopology %.1f seconds' %( t2 - t1 )
	
	def makeGeoJSON( self,
		filename, table, boxGeom, polyGeom,
		geoid, name, idCol, nameCol, extraCol, where, jsonp
	):
		print 'makeGeoJSON', filename
		t1 = time.clock()
		featurecollection = self.makeFeatureCollection(
			table, boxGeom, polyGeom,
			geoid, name, idCol, nameCol, extraCol, where
		)
		self.writeGeoJSON( filename, featurecollection, jsonp )
		t2 = time.clock()
		print 'makeGeoJSON %.1f seconds' %( t2 - t1 )


	def writeGeoJSON( self, filename, data, jsonp=None ):
		print 'writeGeoJSON', filename
		geojson = json \
			.dumps( data, separators=( ',', ':' ) ) \
			.replace( '"name":', '\n"name":' )
		if jsonp:
			geojson = jsonp + '(' + geojson + ')'
		file( filename, 'wb' ).write( geojson )


	def makeFeatureCollection( self,
		table, boxGeom, polyGeom,
		geoid, name, idCol, nameCol, extraCol, where, fixid=None
	):
		print 'makeFeatureCollection'
		if fixid is None: geoidfix = geoid
		else: geoidfix = fixid( geoid )
		srid = self.getSRID( table, polyGeom )
		digits = [ 6, 0 ][ isGoogleSRID(srid) ]  # integer for google projection
		
		if boxGeom is not None:
			t1 = time.clock()
			self.execute('''
				SELECT
					ST_AsGeoJSON(
						ST_Centroid(
							ST_Extent( %(boxGeom)s )
						),
						%(digits)s
					),
					ST_AsGeoJSON(
						ST_Extent( %(boxGeom)s ),
						%(digits)s, 1
					)
				FROM 
					%(table)s
				WHERE
					%(where)s
				;
			''' % {
				'table': table,
				'boxGeom': boxGeom,
				'polyGeom': polyGeom,
				'where': where,
				'digits': digits,
			})
			( centerjson, extentjson ) = self.cursor.fetchone()
			if centerjson is None:
				return None
			center = json.loads( centerjson )
			extent = json.loads( extentjson )
			t2 = time.clock()
			print 'ST_Extent %.1f seconds' %( t2 - t1 )
		else:
			t2 = time.clock()
		
		self.execute('''
			SELECT
				%(idCol)s, %(nameCol)s, %(extraCol)s, 
				ST_AsGeoJSON( ST_Centroid( %(polyGeom)s ), %(digits)s, 1 ),
				ST_AsGeoJSON( %(polyGeom)s, %(digits)s, 1 )
			FROM
				%(table)s
			WHERE
--				ST_IsValid( %(polyGeom)s )
--			AND
				%(where)s
			ORDER BY
				%(idCol)s
			;
		''' % {
			'table': table,
			'polyGeom': polyGeom,
			'digits': digits,
			'idCol': idCol,
			'nameCol': nameCol,
			'extraCol': extraCol, 
			'where': where,
		})
		t3 = time.clock()
		print 'SELECT rows %.1f seconds' %( t3 - t2 )
		
		features = []
		for featuregeoid, featurename, featureextra, centroidjson, geomjson in self.cursor.fetchall():
			#print featurename
			if fixid is None: featuregeoidfix = featuregeoid
			else: featuregeoidfix = fixid( featuregeoid, geoid )
			if not centroidjson or not geomjson:
				print 'NO GEOMETRY for %s %s %s' %( featuregeoidfix, featurename, featureextra )
				continue
			geometry = json.loads( geomjson )
			centroid = json.loads( centroidjson )
			feature = {
				'type': 'Feature',
				'bbox': geometry['bbox'],
				'id': featuregeoidfix,
				'name': featurename,
				extraCol: featureextra,
				'centroid': centroid['coordinates'],
				'geometry': geometry,
			}
			features.append( feature )
			del geometry['bbox']
		featurecollection = {
			'type': 'FeatureCollection',
			'id': geoidfix,
			'name': name,
			'features': features,
			'table': table,
		}
		if boxGeom is not None:
			featurecollection.update({
				'bbox': extent['bbox'],
				'center': center['coordinates'],
			})
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


def makeNewDir( path ):
	if os.path.exists( path ):
		shutil.rmtree( path )
		time.sleep( 1 )  # hack to prevent access not allowed error on os.mkdir
	os.mkdir( path )


def TTYstr( ustr ):
	return unicodedata.normalize( 'NFKD', ustr ).encode( 'ascii', 'ignore' ).upper()


if __name__ == "__main__":
	pass  # TODO?
