# -*- coding: utf-8 -*-

import pg, private

#import cProfile

schema = 'france'
fullGeom = 'full_geom'
googGeom = 'goog_geom'
boxGeom = googGeom
boxGeomLL = fullGeom  # temp hack until PolyGonzo supports mercator bbox


def simpleGeom( level ):
	if level is None:
		return googGeom
	else:
		return '%s%s' %( googGeom, level )


def makeLegislative():
	db = pg.Database( database = 'france2012' )
	table = 'legislative'
	#for level in ( None, 512, 1024, ):
	for level in ( 1024, ):
		if level is not None:
			addLevel( db, table, 'id_circo', level )
		mergeGeometries( db, 'france.legislative', 'france.departement', level, '''
			WHERE
				france.legislative.id_dep = france.departement.code_dept
			GROUP BY
				france.legislative.id_dep
		''' )
		mergeGeometries( db, 'france.departement', 'france.reg2012', level, '''
			WHERE
				france.departement.code_reg = france.reg2012.region
			AND
				substring(france.departement.code_reg from 1 for 1) != '0'
			GROUP BY
				france.departement.code_reg
		''' )
		mergeGeometries( db, 'france.reg2012', 'france.france2012', level, '''
			WHERE
				true
		''' )
		#mergeGeometries( db, table, level )
		#writeEachLegislative( db, table, level )
		writeAllLegislative( db, table, level )
	db.connection.commit()
	db.connection.close()


def makeDepartments():
	db = pg.Database( database = 'france2012' )
	table = 'departement'
	#for level in ( None, 512, 1024, 2048, 4096, 8192, ):
	for level in ( None, 4096, ):
		if level is not None:
			addLevel( db, table, 'code_dept', level )
		mergeGeometries( db, 'france.departement', 'france.reg2012', level, '''
			WHERE
				france.departement.code_reg = france.reg2012.region
			AND
				substring(france.departement.code_reg from 1 for 1) != '0'
			GROUP BY
				france.departement.code_reg
		''' )
		mergeGeometries( db, 'france.reg2012', 'france.france2012', level, '''
			WHERE
				true
		''' )
		#mergeGeometries( db, table, level )
		#writeEachDepartment( db, table, level )
		writeAllDepartments( db, table, level )
	db.connection.commit()
	db.connection.close()


def makeCommunes():
	db = pg.Database( database = 'france2012' )
	table = 'commune'
	for level in ( None, 128, ):
		if level is not None:
			addLevel( db, table, 'code_dept,code_comm', level )
		mergeGeometries( db, 'france.commune', 'france.departement', level, '''
			WHERE
				france.commune.code_dept = france.departement.code_dept
			GROUP BY
				france.commune.code_dept
		''' )
	writeEachDepartment( db, table, None )
	db.connection.commit()
	db.connection.close()


def makeLegimunes():
	db = pg.Database( database = 'france2012' )
	table = 'legimune'
	for level in ( None, ):
		if level is not None:
			addLevel( db, table, 'code_leg,code_comm', level )
		mergeGeometries( db, 'france.legimune', 'france.legislative', level, '''
			WHERE
				france.legimune.code_dept = france.legislative.id_dep
			AND
				france.legimune.code_leg = france.legislative.id_circo
			GROUP BY
				france.legimune.code_dept, france.legimune.code_leg
		''' )
	writeEachLegislative( db, table, None )
	db.connection.commit()
	db.connection.close()


def addLevel( db, table, idcols, level ):
	shpfile = '%(path)s/fr2012-%(table)s-%(level)s/fr2012-%(table)s-%(level)s.shp' %({
		'path': private.OUTPUT_SHAPEFILE_PATH,
		'table': table,
		'level': level,
	})
	fulltable = '%s.%s' %( schema, table )
	temptable = '%s_%s'  %( fulltable, level )
	simplegeom = 'goog_geom%s' %( level )
	db.dropTable( temptable )
	db.loadShapefile(
		shpfile, private.TEMP_PATH, temptable,
		simplegeom, '3857', 'LATIN1', True
	)
	db.addGeometryColumn( fulltable, simplegeom, 3857 )
	# TODO: break out this cutesy code into a useful function?
	where = ' AND '.join( map(
		lambda idcol: (
			'%(fulltable)s.%(idcol)s = %(temptable)s.%(idcol)s' % ({
				'fulltable': fulltable,
				'temptable': temptable,
				'idcol': idcol
			})
		),
		idcols.split(',')
	) )
	db.execute( '''
		UPDATE
			%(fulltable)s
		SET
			%(simplegeom)s =
				ST_MakeValid(
					%(temptable)s.%(simplegeom)s
				)
		FROM %(temptable)s
		WHERE %(where)s
		;
	''' %({
		'fulltable': fulltable,
		'temptable': temptable,
		'simplegeom': simplegeom,
		'where': where,
	}) )
	#db.dropTable( temptable )
	pass


def mergeGeometries( db, sourceTable, targetTable, level, whereGroupBy ):
	geom = simpleGeom( level )
	db.mergeGeometry( sourceTable, geom, targetTable, geom, whereGroupBy )


def writeEachDepartment( db, table, level ):
	#db.execute( 'SELECT code_dept, nom_dept FROM %s.departement ORDER BY code_dept;' %( schema ) )
	db.execute( '''
		SELECT code_dept, nom_dept
		FROM %s.departement
		-- --
--		WHERE
--			( substring(code_dept from 1 for 2) = '97' AND code_dept != '97' )
--		OR
--			substring(code_dept from 1 for 2) = '98'
		-- --
--		WHERE
--			code_dept = '971' OR code_dept = '972'
		-- --
		ORDER BY code_dept;
	''' %( schema ) )
	for code_dept, nom_dept in db.cursor.fetchall():
		levels = { '973':128, '975':128, '986':128, '987':128, '988':128 }
		writeDepartment( db, table, levels.get(code_dept), code_dept, nom_dept )


def writeDepartment( db, table, level, code_dept, nom_dept ):
	geom = simpleGeom( level )
	where = "( code_dept = '%s' )" %( code_dept )
	
	geoDepartment = db.makeFeatureCollection(
		schema+'.departement',
		boxGeom, boxGeomLL, geom, 'FR', 'France',
		'code_dept', 'nom_dept', 'code_reg', where, fixGeoID
	)
	geoCommune = db.makeFeatureCollection(
		schema+'.'+table,
		boxGeom, boxGeomLL, geom, code_dept, nom_dept,
		'code_comm', 'nom_comm', 'code_dept', where, fixGeoID
	)
	
	geo = {
		'departement': geoDepartment,
		'commune': geoCommune,
	}
	
	writeGeoJSON( db, code_dept, googGeom, geo )


def writeAllDepartments( db, table, level ):
	geom = simpleGeom( level )
	where = 'true'
	geoid = 'FR'  # TODO
	geoDepartment = db.makeFeatureCollection(
		schema + '.departement',
		boxGeom, boxGeomLL, geom, geoid, 'France',
		'code_dept', 'nom_dept', 'code_reg', where, fixGeoID
	)
	geoRegion = db.makeFeatureCollection(
		schema + '.reg2012',
		None, None, geom, geoid, 'France',
		'region', 'nccenr', 'tncc', where, fixGeoID
	)
	geoNation = db.makeFeatureCollection(
		schema + '.france2012',
		None, None, geom, geoid, 'France',
		'nation', 'nccenr', 'nation', where, fixGeoID
	)
	geo = {
		'nation': geoNation,
		'region': geoRegion,
		'departement': geoDepartment,
	}
	writeGeoJSON( db, geoid, geom, geo )


def writeEachLegislative( db, table, level ):
	#db.execute( 'SELECT code_leg, nom_leg FROM %s.departement ORDER BY code_leg;' %( schema ) )
	db.execute( '''
		SELECT id_dep, id_circo
		FROM %s.legislative
		ORDER BY id_dep, id_circo;
	''' %( schema ) )
	for code_dep, code_leg in db.cursor.fetchall():
		#levels = { '973':128, '975':128, '986':128, '987':128, '988':128 }
		levels = {}
		writeLegislative( db, table, levels.get(code_leg), code_dep, code_leg )


def writeLegislative( db, table, level, code_dep, code_leg ):
	geom = simpleGeom( level )
	
	where = "( id_dep = '%s' AND id_circo = '%s' )" %( code_dep, code_leg )
	geoLegislative = db.makeFeatureCollection(
		schema+'.legislative',
		boxGeom, boxGeomLL, geom, 'FRL', 'France',
		"lpad( id_dep, 3, '0' ) || lpad( id_circo, 2, '0' )",
		'nom_circo', 'id_dep', where, fixGeoID
	)
	if geoLegislative is None:
		return
	
	where = "( code_dept = '%s' AND code_leg = '%s' )" %( code_dep, code_leg )
	geoCommune = db.makeFeatureCollection(
		schema+'.'+table,
		boxGeom, boxGeomLL, geom, code_dep.zfill(3) + code_leg, '',
		"lpad( code_dept, 3, '0' ) || lpad( code_leg, 2, '0' ) || lpad( code_comm, 3, '0' )",
		'nom_comm', 'code_leg', where, fixGeoID
	)
	if geoCommune is None:
		return
	
	geo = {
		'legislative': geoLegislative,
		'commune': geoCommune,
	}
	
	writeGeoJSON( db, 'L-%s%s' %( code_dep.zfill(3), code_leg.zfill(2) ), googGeom, geo )


def writeAllLegislative( db, table, level ):
	geom = simpleGeom( level )
	where = 'true'
	geoid = 'FRL'  # TODO
	geoLegislative = db.makeFeatureCollection(
		schema + '.legislative',
		boxGeom, boxGeomLL, geom, geoid, 'France',
		'id_circo', 'nom_circo', 'id_dep', where, fixGeoID
	)
	geoDepartment = db.makeFeatureCollection(
		schema + '.departement',
		boxGeom, boxGeomLL, geom, geoid, 'France',
		'code_dept', 'nom_dept', 'code_reg', where, fixGeoID
	)
	geoRegion = db.makeFeatureCollection(
		schema + '.reg2012',
		None, None, geom, geoid, 'France',
		'region', 'nccenr', 'tncc', where, fixGeoID
	)
	geoNation = db.makeFeatureCollection(
		schema + '.france2012',
		None, None, geom, geoid, 'France',
		'nation', 'nccenr', 'nation', where, fixGeoID
	)
	geo = {
		'nation': geoNation,
		'region': geoRegion,
		'departement': geoDepartment,
		'legislative': geoLegislative,
	}
	writeGeoJSON( db, geoid, geom, geo )


def fixGeoID( geoid, parentid=None ):
	g = fixGeoIDx( geoid, parentid )
	if g != geoid:
		print "fixGeoID( '%s', '%s' ) return '%s'" %( geoid, parentid, g )
	return g

def fixGeoIDx( geoid, parentid=None ):
	if geoid == 'FR':
		return geoid
	geoid = geoid.rjust( 3, '0' )
	if parentid:
		if parentid == 'FRL':
			if len(geoid) == 4:
				geoid = geoid.rjust( 5, '0' )
		elif parentid == '976':
			geoid = '5' + geoid[1:]
		elif parentid == '977':
			if geoid == '193':
				geoid = '701'
			elif geoid == '194':
				geoid = '801'
		elif parentid in [ '971', '972', '973', '974', '975', '988' ]:
			geoid = parentid[2] + geoid[1:]
	return geoid


def writeGeoJSON( db, geoid, geom, geo ):
	filename = '%s/%s-%s-%s' %(
		private.GEOJSON_PATH, schema, fixGeoID(geoid), geom
	)
	db.writeGeoJSON( filename + '.js', geo, 'loadGeoJSON' )
	db.writeGeoJSON( filename + '.geojson', geo )


def main():
	makeLegislative()
	makeDepartments()
	makeCommunes()
	makeLegimunes()


if __name__ == "__main__":
	main()
	#cProfile.run( 'main()' )
