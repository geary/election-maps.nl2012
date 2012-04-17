# -*- coding: utf-8 -*-

import csv, os, os.path, re, urllib2
from zipfile import ZipFile

import pg
import private


database = 'france2012'
schema = 'france'

fullGeom = 'full_geom'
googGeom = 'goog_geom'


def process():
	createDatabase( database)
	db = openDatabase( database )
	#addSimplificationFunction( db )
	createSchema( db )
	loadRegionTable( db )
	loadDepartmentTable( db )
	loadArrondTable( db )
	loadCantonTable( db )
	loadCommuneTable( db )
	loadDepartmentShapes( db )
	loadCommuneShapes( db )
	updateDepartmentNames( db )
	updateCommuneNames( db )
	saveShapefile( db, 'departement'  )
	saveShapefile( db, 'commune'  )
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


#def addSimplificationFunction( db ):
#	db.execute( file( 'map_simplification_program/func.sql').read() )


def createSchema( db ):
	print 'Creating schema %s' % schema
	db.createSchema( schema )
	db.connection.commit()


def loadRegionTable( db ):
	loadTable( db,
		'reg2012',
		'region, cheflieu, tncc, ncc, nccenr',
		'''
			region varchar(2),
			cheflieu varchar(5),
			tncc varchar(1),
			ncc varchar(70),
			nccenr varchar(70)
		'''
	)


def loadDepartmentTable( db ):
	loadTable( db,
		'depts2012',
		'region, dep, cheflieu, tncc, ncc, nccenr',
		'''	
			region varchar(2),
			dep varchar(3),
			cheflieu varchar(5),
			tncc varchar(1),
			ncc varchar(70),
			nccenr varchar(70)
		'''
	)


def loadArrondTable( db ):
	loadTable( db,
		'arrond2012',
		'region, dep, ar, cheflieu, tncc, artmaj, ncc, artmin, nccenr',
		'''	
			region varchar(2),
			dep varchar(3),
			ar varchar(1),
			cheflieu varchar(5),
			tncc varchar(1),
			artmaj varchar(5),
			ncc varchar(70),
			artmin varchar(5),
			nccenr varchar(70)
		'''
	)


def loadCantonTable( db ):
	loadTable( db,
		'canton2012',
		'region, dep, ar, canton, typct, cheflieu, tncc, artmaj, ncc, artmin, nccenr',
		'''	
			region varchar(2),
			dep varchar(3),
			ar varchar(1),
			canton varchar(2),
			typct varchar(1),
			cheflieu varchar(5),
			tncc varchar(1),
			artmaj varchar(5),
			ncc varchar(70),
			artmin varchar(5),
			nccenr varchar(70)
		'''
	)


def loadCommuneTable( db ):
	loadTable( db,
		'comsimp2012',
		'cdc, cheflieu, reg, dep, com, ar, ct, tncc, artmaj, ncc, artmin, nccenr',
		'''	
			cdc varchar(1),
			cheflieu varchar(1),
			reg varchar(2),
			dep varchar(3),
			com varchar(3),
			ar varchar(1),
			ct varchar(2),
			tncc varchar(1),
			artmaj varchar(5),
			ncc varchar(70),
			artmin varchar(5),
			nccenr varchar(70)
		'''
	)


def loadTable( db, table, cols, columns ):
	source = '../shapes/insee/%s.txt' %( table )
	target = '%s/%s-utf8.txt' %( private.TEMP_PATH, table )
	utf8 = file(source).read().decode('latin1').encode('utf8')
	file( target, 'w' ).write( utf8 )
	#cols = re.sub( r'\s*(\S+)\s+([^\n])+(\n)\s*', r'\1,', columns )
	db.execute( '''
		CREATE TABLE %(table)s (
			gid serial,
			%(columns)s
		);
		
		ALTER TABLE %(table)s ADD PRIMARY KEY (gid);
		
		COPY %(table)s ( %(cols)s )
			FROM '%(target)s'
			WITH CSV HEADER DELIMITER E'\t';
	''' %({
		'table': schema + '.' + table,
		'cols': cols,
		'columns': columns,
		'target': target,
	}) )
	db.connection.commit()
	os.remove( target )


def loadDepartmentShapes( db ):
	table = schema + '.departement'
	zipfile = 'FR_DOM_Mayotte_shp_WGS84'
	filename = '../shapes/geofla/%s.zip' % zipfile
	print 'Loading %s' % filename
	db.loadShapefile(
		filename, private.TEMP_PATH, table,
		fullGeom, '4326', 'LATIN1', True,
		'%s/DEPARTEMENT.shp' % zipfile
	)
	db.addGoogleGeometry( table, fullGeom, googGeom )
	db.indexGeometryColumn( table, googGeom )


def updateDepartmentNames( db ):
	fromWhere = '''
		FROM france.depts2012
		WHERE (
			france.departement.code_dept = france.depts2012.dep
		)
	'''
	db.execute( '''
		CREATE INDEX france_departement_code_dept_idx
			ON france.departement(code_dept);
		CREATE INDEX france_departement_code_chf_idx
			ON france.departement(code_chf);
		CREATE INDEX france_depts2012_dep_idx
			ON france.depts2012(dep);
		CREATE INDEX france_depts2012_cheflieu_idx
			ON france.depts2012(cheflieu);
		
		UPDATE france.departement
		SET code_dept = '97', code_reg = '06'
		WHERE code_dept = '985';
		
		UPDATE france.departement
		SET code_dept = 'Z' || substring( code_reg from 2 for 1 )
		WHERE code_dept = '97';
		
		UPDATE france.depts2012
		SET dep = 'Z' || substring( region from 2 for 1 )
		WHERE dep = '97';
		
		UPDATE france.departement
		SET nom_dept = (
			SELECT nccenr %(fromWhere)s
		)	
		WHERE EXISTS (
			SELECT NULL %(fromWhere)s
		);
	''' % {
		'fromWhere': fromWhere,
	})
	db.connection.commit()


def loadCommuneShapes( db ):
	table = schema + '.commune'
	def load( zipfile, suffix, srid, create=False ):
		filename = '../shapes/geofla/%s.zip' % zipfile
		srctable = table + '_' + suffix
		print 'Loading %s' % filename
		db.loadShapefile(
			filename, private.TEMP_PATH, srctable,
			fullGeom, srid, 'LATIN1', True,
			'%s/COMMUNES/COMMUNE.shp' % zipfile
		)
		if create:
			db.createLikeTable( table, srctable )
			db.addGeometryColumn( table, fullGeom, 4326, True )
		db.executeCommit('''
			INSERT INTO %(table)s
				SELECT nextval('%(table)s_gid_seq'),
					id_geofla, code_comm, insee_com, nom_comm, statut,
					x_chf_lieu, y_chf_lieu, x_centroid, y_centroid, z_moyen, superficie,
					population, code_cant, code_arr, code_dept, nom_dept, code_reg,
					nom_region,
					ST_Transform( ST_SetSRID( full_geom, %(srid)s ), 4326 )
				FROM %(srctable)s;
		''' %({
			'table': table,
			'srctable': srctable,
			'srid': srid,
		}) )
	load( 'GEOFLA_1-1_SHP_LAMB93_FR-ED111', 'fr', '2154', True )
	load( 'GEOFLA_1-1_SHP_RGM04UTM38S_YT-ED111', 'yt', '32738' ) # '6892'
	load( 'GEOFLA_1-1_SHP_RGR92UTM40S_RE-ED111', 're', '2975' )
	load( 'GEOFLA_1-1_SHP_UTM20W84_GP-ED111', 'gp', '32620' )
	load( 'GEOFLA_1-1_SHP_UTM20W84_MQ-ED111', 'mq', '2973' )
	load( 'GEOFLA_1-1_SHP_UTM22RGFG95_GF-ED111', 'gf', '2972' )
	db.addGoogleGeometry( table, fullGeom, googGeom )
	db.indexGeometryColumn( table, googGeom )


def updateCommuneNames( db ):
	fromWhere = '''
			FROM france.comsimp2012
			WHERE
				france.commune.code_dept = france.comsimp2012.dep
			AND
				france.commune.code_comm = france.comsimp2012.com
	'''
	db.execute( '''
		CREATE INDEX france_commune_code_dept_idx
			ON france.commune(code_dept);
		CREATE INDEX france_commune_code_comm_idx
			ON france.commune(code_comm);
		CREATE INDEX france_comsimp2012_dep_idx
			ON france.comsimp2012(dep);
		CREATE INDEX france_comsimp2012_com_idx
			ON france.comsimp2012(com);
		
		UPDATE france.commune
		SET code_dept = 'Z' || substring( code_reg from 2 for 1 )
		WHERE code_dept = '97';
		
		UPDATE france.comsimp2012
		SET dep = 'Z' || substring( reg from 2 for 1 )
		WHERE dep = '97';
		
		UPDATE france.commune
		SET nom_comm = (
			SELECT nccenr %(fromWhere)s
		)	
		WHERE EXISTS (
			SELECT NULL %(fromWhere)s
		);
	''' % {
		'fromWhere': fromWhere,
	})
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


def saveShapefile( db, table ):
	shpfile = 'fr2012-%s-full' %( table )
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
