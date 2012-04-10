# -*- coding: utf-8 -*-

import csv, os.path, urllib2
from zipfile import ZipFile

import pg
import private


schema = 'carto2010'

fullGeom = 'full_geom'
googGeom = 'goog_geom'


def cartoFileName(
	resolution, year, state, type, version='00',
	path=private.CENSUS_SHAPEFILE_PATH
):
	return os.path.join(
		path,
		'gz_%s_%s_%s_%s_%s.zip' %( year, state, type, version, resolution )
	)


def process():
	resolution = '500k'
	database = 'usageo_' + resolution
	createDatabase( database)
	db = openDatabase( database )
	#addSimplificationFunction( db )
	createSchema( db )
	loadStates( db, resolution )
	loadCounties( db, resolution )
	loadCongressional( db, resolution )
	loadCountySubdivisions( db, resolution )
	loadCustom( db, resolution )
	makeGopNationalTable( db )
	makeGopLocalTable( db )
	saveShapefile( db, resolution, 'gop2012nat' )
	saveShapefile( db, resolution, 'gop2012loc' )
	closeDatabase( db )


def createDatabase( database ):
	print 'Creating database %s' % database
	db = pg.Database( database='postgres' )
	db.createGeoDatabase( database )
	db.connection.close()


def openDatabase( database ):
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


def loadCartoFile(
	db, resolution, year, state, kind, version, table, create=True,
	path=private.CENSUS_SHAPEFILE_PATH
):
	filename = cartoFileName( resolution, year, state, kind, version, path )
	loadCartoFileName( db, filename, table, create )


def loadCartoFileName( db, filename, table, create=True ):
	table = schema + '.' + table
	print 'Loading %s' % filename
	db.loadShapefile(
		filename, private.TEMP_PATH, table,
		fullGeom, '4269', 'LATIN1', create
	)
	db.addGoogleGeometry( table, fullGeom, googGeom )
	db.fix180( table, fullGeom, googGeom, "( state = '02' )" )
	db.indexGeometryColumn( table, googGeom )


def loadStates( db, resolution ):
	loadCartoFile( db, resolution, '2010', 'us', '040', '00', 'state' )
	deletePR( db, 'state' )


def loadCounties( db, resolution ):
	loadCartoFile( db, resolution, '2010', 'us', '050', '00', 'county' )
	deletePR( db, 'county' )


def loadCongressional( db, resolution ):
	loadForStates( db, resolution, '2010', '500', '11', 'cd', [ '20' ] )


def loadCountySubdivisions( db, resolution ):
	loadForStates( db, resolution, '2010', '060', '00', 'cousub', [ '09', '25', '33', '50' ] )


def loadCustom( db, resolution ):
	loadForStates(
		db, resolution, '2012', '620', 'l2', 'shd', [ '38' ],
		os.path.join( private.OUTPUT_SHAPEFILE_PATH, 'custom' )
	)


def loadForStates(
	db, resolution, year, code, version, table, states=None,
	path=private.CENSUS_SHAPEFILE_PATH
):
	#if states is None:
	#	db.execute( 'SELECT state FROM %s.state ORDER BY state ASC;' %( schema ) )
	#	states = db.cursor.fetchall()
	#...for state, in states:
	create = True
	for state in states:
		loadCartoFile( db, resolution, year, state, code, version, table, create, path )
		create = False


def deletePR( db, table ):
	db.execute( '''
		DELETE FROM carto2010.%(table)s
		WHERE state = '72'
	''' %({
		'table': table,
	}) )
	db.connection.commit()


# TODO: refactor
def makeGopLocalTable( db ):
	# CT, MA, NH, VT report votes by county subdivision ("town")
	whereCousub = '''
		( state = '09' OR state = '25' OR state = '33' OR state = '50' )
	'''
	# ND reports votes by state house district
	whereSHD = '''
		( state = '38' )
	'''
	# AK, ME, and WY report statewide votes only
	whereState = '''
		( state = '02' OR state = '23' OR state = '56' )
	'''
	# PR is not reported in the primary
	whereNone = '''
		( state = '72' )
	'''
	db.createLikeTable( schema+'.gop2012loc', schema+'.cousub' )
	db.execute( '''
		INSERT INTO %(schema)s.gop2012loc
			SELECT nextval('%(schema)s.gop2012loc_gid_seq'),
				geo_id, state, county, '' AS cousub,
				name, lsad, censusarea, full_geom, goog_geom
			FROM %(schema)s.county
			WHERE
				NOT %(whereNone)s
				AND NOT %(whereCousub)s
				AND NOT %(whereSHD)s
				AND NOT %(whereState)s;
		INSERT INTO %(schema)s.gop2012loc
			SELECT nextval('%(schema)s.gop2012loc_gid_seq'),
				geo_id, state, county, cousub,
				name, lsad, censusarea, full_geom, goog_geom
			FROM %(schema)s.cousub
			WHERE %(whereCousub)s;
		INSERT INTO %(schema)s.gop2012loc
			SELECT nextval('%(schema)s.gop2012loc_gid_seq'),
				geo_id, state, '' AS county, '' AS cousub,
				name, lsad, censusarea, full_geom, goog_geom
			FROM %(schema)s.state
			WHERE %(whereState)s;
		INSERT INTO %(schema)s.gop2012loc
			SELECT nextval('%(schema)s.gop2012loc_gid_seq'),
				geo_id, state, sldl AS county, '' AS cousub,
				name, lsad, censusarea, full_geom, goog_geom
			FROM %(schema)s.shd
			WHERE %(whereSHD)s;
	''' %({
		'schema': schema,
		'whereNone': whereNone,
		'whereCousub': whereCousub,
		'whereSHD': whereSHD,
		'whereState': whereState,
	}) )
	db.connection.commit()


# TODO: refactor
def makeGopNationalTable( db ):
	# ND reports votes by state house district
	# Commented out for now, showing ND statewide in national county view
	whereSHD = '''
		( FALSE ) -- ( state = '38' )
	'''
	# AK, ME, ND, and WY display statewide votes only in national county view
	whereState = '''
		( state = '02' OR state = '23' OR state = '38' OR state = '56' )
	'''
	# PR is not reported in the primary
	whereNone = '''
		( state = '72' )
	'''
	db.createLikeTable( schema+'.gop2012nat', schema+'.county' )
	db.execute( '''
		INSERT INTO %(schema)s.gop2012nat
			SELECT nextval('%(schema)s.gop2012nat_gid_seq'),
				geo_id, state, county,
				name, lsad, censusarea, full_geom, goog_geom
			FROM %(schema)s.county
			WHERE
				NOT %(whereNone)s
				AND NOT %(whereSHD)s
				AND NOT %(whereState)s;
		INSERT INTO %(schema)s.gop2012nat
			SELECT nextval('%(schema)s.gop2012nat_gid_seq'),
				geo_id, state, '' AS county,
				name, lsad, censusarea, full_geom, goog_geom
			FROM %(schema)s.state
			WHERE %(whereState)s;
		INSERT INTO %(schema)s.gop2012nat
			SELECT nextval('%(schema)s.gop2012nat_gid_seq'),
				geo_id, state, sldl AS county,
				name, lsad, censusarea, full_geom, goog_geom
			FROM %(schema)s.shd
			WHERE %(whereSHD)s;
	''' %({
		'schema': schema,
		'whereNone': whereNone,
		'whereSHD': whereSHD,
		'whereState': whereState,
	}) )
	db.connection.commit()


def saveShapefile( db, resolution, table ):
	shpfile = 'us2012-%s-%s-full' %( table, resolution )
	table = schema + '.' + table
	db.saveShapefile(
		shpfile, private.OUTPUT_SHAPEFILE_PATH,
		table, 'goog_geom', '3857'
	)


def main():
	process()
	print 'Done!'


if __name__ == "__main__":
	main()
