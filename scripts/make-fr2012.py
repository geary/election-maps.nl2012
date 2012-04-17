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


def makeDepartments():
	db = pg.Database( database = 'france2012' )
	table = 'departement'
	#level = '4096'
	level = None
	if level is not None:
		addLevel( db, table, level )
	#mergeGeometries( db, table, level )
	#writeEachDepartment( db, table, level )
	writeAllDepartments( db, table, level )
	db.connection.commit()
	db.connection.close()


def makeCommunes():
	db = pg.Database( database = 'france2012' )
	table = 'commune'
	#level = '512'
	level = None
	if level is not None:
		addLevel( db, table, level )
	mergeGeometries( db, table, 'code_dept', 'departement', 'code_dept', level )
	writeEachDepartment( db, table, level )
	writeAllDepartments( db, table, level )
	db.connection.commit()
	db.connection.close()


def addLevel( db, table, level ):
	shpfile = '%(path)s/us2012-%(table)s-500k-%(level)s/us2012-%(table)s-500k-%(level)s.shp' %({
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
	db.addGeometryColumn( fulltable, simplegeom, 3857, True )
	db.execute( '''
		UPDATE
			%(fulltable)s
		SET
			%(simplegeom)s =
				ST_MakeValid(
					%(temptable)s.%(simplegeom)s
				)
		FROM %(temptable)s
		WHERE %(fulltable)s.geo_id = %(temptable)s.geo_id
		;
	''' %({
		'fulltable': fulltable,
		'temptable': temptable,
		'simplegeom': simplegeom,
	}) )
	#db.dropTable( temptable )
	pass


def mergeGeometries( db, sourceTable, sourceIdCol, targetTable, targetIdCol, level ):
	geom = simpleGeom( level )
	db.mergeGeometry(
		schema+'.'+sourceTable, sourceIdCol, geom,
		schema+'.'+targetTable, targetIdCol, geom
	)


def writeEachDepartment( db, table, level ):
	db.execute( 'SELECT code_dept, nom_dept FROM %s.departement ORDER BY code_dept;' %( schema ) )
	for code_dept, nom_dept in db.cursor.fetchall():
		writeDepartment( db, table, level, code_dept, nom_dept )


def writeDepartment( db, table, level, code_dept, nom_dept ):
	geom = simpleGeom( level )
	where = "( code_dept = '%s' )" %( code_dept )
	
	geoDepartment = db.makeFeatureCollection(
		schema+'.departement',
		boxGeom, boxGeomLL, geom, 'FR', 'France',
		'code_dept', 'nom_dept', 'code_reg', where
	)
	geoCommune = db.makeFeatureCollection(
		schema+'.'+table,
		boxGeom, boxGeomLL, geom, code_dept, nom_dept,
		'code_comm', 'nom_comm', 'code_dept', where
	)
	
	geo = {
		'departement': geoDepartment,
		'commune': geoCommune,
	}
	
	writeGeoJSON( db, code_dept, geom, geo )


def writeAllDepartments( db, table, level ):
	geom = simpleGeom( level )
	where = 'true'
	geoid = 'FR'  # TODO
	geoDepartment = db.makeFeatureCollection(
		schema + '.departement',
		boxGeom, boxGeomLL, geom, geoid, 'France',
		'code_dept', 'nom_dept', 'code_reg', where
	)
	geo = {
		'departement': geoDepartment,
	}
	writeGeoJSON( db, geoid, geom, geo )


def writeGeoJSON( db, fips, geom, geo ):
	filename = '%s/%s-%s-%s.js' %(
		private.GEOJSON_PATH, schema, fips, geom
	)
	db.writeGeoJSON( filename, geo, 'loadGeoJSON' )


def main():
	makeDepartments()
	makeCommunes()


if __name__ == "__main__":
	main()
	#cProfile.run( 'main()' )
