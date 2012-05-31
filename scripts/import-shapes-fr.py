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
	# data.gouv.fr tables
	loadLegislativeTable( db )
	# Insee tables
	loadNationTable( db )
	loadRegionTable( db )
	loadDepartmentTable( db )
	loadArrondTable( db )
	loadCantonTable( db )
	loadCommuneTable( db )
	# GEOFLA and GADM shapefiles
	loadDepartmentShapes( db )
	loadCommuneShapes( db )
	updateDepartments( db )
	updateCommunes( db )
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


# TODO: these are all the columns used in the Insee tables.
# Use these to simplify the code?
# ar varchar(1)
# artmaj varchar(5)
# artmin varchar(5)
# canton varchar(2)
# cdc varchar(1)
# cheflieu varchar(5)
# com varchar(3)
# ct varchar(2)
# dep varchar(3)
# nation varchar(2)
# ncc varchar(70)
# nccenr varchar(70)
# reg varchar(2)
# region varchar(2)
# tncc varchar(1)
# typct varchar(1)


def loadLegislativeTable( db ):
	loadGouvTable( db,
		'legislative',
		'''
			code_dept_cant,
			code_dept, nom_dept,
			code_cant, nom_cant,
			code_comm, nom_comm,
			circ_leg_1986, circ_leg_2012
		''',
		'''
			code_dept_cant varchar(4),
			code_dept varchar(3),
			nom_dept varchar(50),
			code_cant varchar(3),
			nom_cant varchar(50),
			code_comm varchar(7),
			nom_comm varchar(50),
			circ_leg_1986 varchar(9),
			circ_leg_2012 varchar(2)
		'''
	)


def loadNationTable( db ):
	loadInseeTable( db,
		'france2012',
		'nation, ncc, nccenr',
		'''
			nation varchar(2),
			ncc varchar(70),
			nccenr varchar(70)
		'''
	)


def loadRegionTable( db ):
	loadInseeTable( db,
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
	loadInseeTable( db,
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
	loadInseeTable( db,
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
	loadInseeTable( db,
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
	loadInseeTable( db,
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


def loadGouvTable( db, table, cols, columns ):
	source = '../shapes/data.gouv.fr/%s.csv' %( table )
	return loadCsvTable( db, source, table, cols, columns )


def loadCsvTable( db, source, table, cols, columns, copyopt='HEADER' ):
	target = '%s/%s-utf8.txt' %( private.TEMP_PATH, table )
	utf8 = file(source).read().decode('latin1').encode('utf8')
	file( target, 'w' ).write( utf8 )
	db.executeCommit( '''
		CREATE TABLE %(table)s (
			gid serial,
			%(columns)s
		);
		
		ALTER TABLE %(table)s ADD PRIMARY KEY (gid);
		
		COPY %(table)s ( %(cols)s )
			FROM '%(target)s'
			WITH CSV %(copyopt)s;
	''' %({
		'table': schema + '.' + table,
		'cols': cols,
		'columns': columns,
		'target': target,
		'copyopt': copyopt,
	}) )
	os.remove( target )


def loadTsvTable( db, source, table, cols, columns ):
	return loadCsvTable( db, source, table, cols, columns, "HEADER DELIMITER E'\t' " )


def loadInseeTable( db, table, cols, columns ):
	source = '../shapes/insee/%s.txt' %( table )
	return loadTsvTable( db, source, table, cols, columns )


def loadGadmShapes( db, loader ):
	loader( db, 'SPM', '975', '1', '1' )
	loader( db, 'MAF', '977', '0', 'local' )
	loader( db, 'BLM', '+977', '0', 'local' )
	loader( db, 'WLF', '986', '2', '2' )
	loader( db, 'PYF', '987', '0', 'local' )
	loader( db, 'NCL', '988', '2', '2' )


def tweakDepartmentSQL( sqlfile ):
	sql = file( sqlfile ).read()
	sql = re.sub(
		'"nom_dept" varchar\(30\)',
		'"nom_dept" varchar(40)',
		sql, 1
	)
	newfile = re.sub( '\.sql$', '-tweak.sql', sqlfile )
	file( newfile, 'w' ).write( sql )
	return newfile


def loadDepartmentShapes( db ):
	table = schema + '.departement'
	zipfile = 'FR_DOM_Mayotte_shp_WGS84'
	filename = '../shapes/geofla/%s.zip' % zipfile
	print 'Loading %s' % filename
	db.loadShapefile(
		filename, private.TEMP_PATH, table,
		fullGeom, '4326', 'LATIN1', True,
		'%s/DEPARTEMENT.shp' % zipfile,
		tweaksql=tweakDepartmentSQL
	)
	loadGadmShapes( db, loadGadmDepartment )
	db.addGoogleGeometry( table, fullGeom, googGeom )
	db.indexGeometryColumn( table, googGeom )


def loadGadmDepartment( db, abbr, geoid, level, suffix ):
	table = schema + '.departement'
	srctable = table + '_' + abbr.lower()
	zipfile = abbr + '_adm'
	filename = '../shapes/gadm/%s.zip' % zipfile
	print 'Loading %s' % filename
	db.loadShapefile(
		filename, private.TEMP_PATH, srctable,
		fullGeom, '4326', 'LATIN1', True,
		'%s0.shp' % zipfile
	)
	vars = {
		'table': table,
		'srctable': srctable,
		'dept': geoid,
	}
	if geoid[0] == '+':
		vars['dept'] = geoid = geoid[1:]
		db.executeCommit('''
			UPDATE %(table)s
			SET full_geom = ST_Union(
				ARRAY[
					full_geom,
					( SELECT ST_SetSRID(full_geom,4326) FROM %(srctable)s )
				]
			)
			WHERE %(table)s.code_dept = '%(dept)s';			
		''' % vars )
	else:
		db.executeCommit('''
			INSERT INTO %(table)s
				SELECT nextval('%(table)s_gid_seq'),
					'%(dept)s' AS id_geofla,
					'%(dept)s' AS code_dept, name_local AS nom_dept,
					'' AS code_chf, '' AS nom_chf,
					'' AS x_chf_lieu, '' AS y_chf_lieu,
					'' AS x_centroid, '' AS y_centroid,
					'' AS code_reg, '' AS nom_region,
					ST_SetSRID( full_geom, 4326 )
				FROM %(srctable)s;
		''' % vars )


def updateDepartments( db ):
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
		SET nom_dept = 'Saint-Martin et Saint-Barthélemy'
		WHERE code_dept = '977';
		
		UPDATE france.departement
		SET code_dept = '976', code_reg = '06'
		WHERE code_dept = '985';
		
		UPDATE france.departement
		SET code_dept = code_dept || substring( code_reg from 2 for 1 )
		WHERE code_dept = '97';
		
		UPDATE france.depts2012
		SET dep = dep || substring( region from 2 for 1 )
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


def tweakCommuneSQL( sqlfile ):
	sql = file( sqlfile ).read()
	sql = re.sub(
		'"code_dept" varchar\(2\)',
		'"code_dept" varchar(3)',
		sql, 1
	)
	newfile = re.sub( '\.sql$', '-tweak.sql', sqlfile )
	file( newfile, 'w' ).write( sql )
	return newfile


def loadCommuneShapes( db ):
	table = schema + '.commune'
	def load( zipfile, suffix, srid, create=False ):
		filename = '../shapes/geofla/%s.zip' % zipfile
		srctable = table + '_' + suffix
		print 'Loading %s' % filename
		db.loadShapefile(
			filename, private.TEMP_PATH, srctable,
			fullGeom, srid, 'LATIN1', True,
			'%s/COMMUNES/COMMUNE.shp' % zipfile,
			tweaksql=tweakCommuneSQL
		)
		if create:
			db.createLikeTable( table, srctable )
			db.addGeometryColumn( table, fullGeom, 4326, True )
		if 1:
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
	load( 'GEOFLA_1-1_SHP_UTM20W84_MQ-ED111', 'mq', '32620' )
	load( 'GEOFLA_1-1_SHP_UTM22RGFG95_GF-ED111', 'gf', '2972' )
	loadGadmShapes( db, loadGadmCommune )
	db.addGoogleGeometry( table, fullGeom, googGeom )
	db.indexGeometryColumn( table, googGeom )


def loadGadmCommune( db, abbr, geoid, level, suffix ):
	# TODO: refactor with loadGadmDepartment
	if level is None: return
	table = schema + '.commune'
	srctable = table + '_' + abbr.lower()
	zipfile = abbr + '_adm'
	filename = '../shapes/gadm/%s.zip' % zipfile
	print 'Loading %s' % filename
	db.loadShapefile(
		filename, private.TEMP_PATH, srctable,
		fullGeom, '4326', 'LATIN1', True,
		'%s%s.shp' % ( zipfile, level )
	)
	if abbr == 'NCL':
		loadGadmTable( db, abbr )
		mergePoya( db )
		updateGadmCommune( db, abbr )
	if geoid[0] == '+':
		geoid = geoid[1:]
	db.executeCommit('''
		INSERT INTO %(table)s
			SELECT nextval('%(table)s_gid_seq'),
				id_%(level)s AS id_geofla,
				id_%(level)s AS code_comm,
				id_%(level)s AS insee_com,
				name_%(suffix)s AS nom_comm,
				'' AS statut,
				0 AS x_chf_lieu, 0 AS y_chf_lieu,
				0 AS x_centroid, 0 AS y_centroid,
				0 AS z_moyen, 0 AS superficie, 0 AS population,
				'' AS code_cant, '' AS code_arr,
				'%(dept)s' AS code_dept, '' AS nom_dept,
				'' AS code_reg, '' AS nom_region,
				ST_SetSRID( full_geom, 4326 )
			FROM %(srctable)s;
	''' %({
		'table': table,
		'srctable': srctable,
		'dept': geoid,
		'level': level,
		'suffix': suffix,
	}) )


def mergePoya( db ):
	db.executeCommit('''
		UPDATE
			france.commune_ncl
		SET
			full_geom = (
				SELECT
					ST_Multi(
						ST_MakeValid(
							ST_Union(
								Array(
									SELECT full_geom
									FROM france.commune_ncl
									WHERE id_2 = 18 OR id_2 = 32
								)
							)
						)
					)
			)
		WHERE id_2 = 18;
		
		UPDATE
			france.commune_ncl
		SET
			name_2 = 'Poya'
		WHERE
			id_2 = 18;
		
		DELETE FROM
			france.commune_ncl
		WHERE id_2 = 32;
	''')


def loadGadmTable( db, abbr ):
	table = '%s_communes' % abbr
	source = '../shapes/gadm/%s.tsv' %( table )
	loadTsvTable( db,
		source, table,
		'gadm_id, gadm_name, gov_id, gov_name',
		'''
			gadm_id int4, gadm_name varchar(70),
			gov_id int4, gov_name varchar(70)
		'''
	)


def updateGadmCommune( db, abbr ):
	table = 'commune_%s' % abbr
	fixer = '%s_communes' % abbr
	db.executeCommit('''
		UPDATE %(table)s
		SET id_2 = (
			SELECT gov_id FROM %(fixer)s
			WHERE id_2 = %(fixer)s.gadm_id
		)
	''' %({
		'table': schema + '.' + table,
		'fixer': schema + '.' + fixer,
	}) )

def updateCommunes( db ):
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
		SET code_dept = code_dept || substring( code_reg from 2 for 1 )
		WHERE code_dept = '97';
		
		UPDATE france.comsimp2012
		SET dep = dep || substring( reg from 2 for 1 )
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
