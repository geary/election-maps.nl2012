# -*- coding: utf-8 -*-

import pg, private

#import cProfile

database = 'nl2012'
schema = 'nl'
geom = 'geom'
boxGeom = geom


def createDatabase( database ):
	print 'Creating database %s' % database
	db = pg.Database( database='postgres' )
	db.createGeoDatabase( database )
	db.connection.close()


def createSchema( db, schema ):
	print 'Creating schema %s' % schema
	db.createSchema( schema )
	db.connection.commit()


def makeMunis():
	db = pg.Database( database = database )
	createSchema( db, schema )
	for level in (
		#'full',
		'512',
		'1024',
	):
		munitable = schema + '.muni' + level
		provtable = schema + '.prov' + level
		nltable = schema + '.nl' + level
		
		db.dropTable( munitable )
		db.dropTable( provtable )
		db.dropTable( nltable )
		
		srcfile = 'nl2012-%s' % level
		filename = '../shapes/shp/%s/%s.shp' %( srcfile, srcfile )
		print 'Loading %s' % filename
		db.loadShapefile(
			filename, private.TEMP_PATH, munitable,
			geom, '3857', 'LATIN1', True
		)
		mergeGeometries( db, munitable, provtable,
			'prov',
			'''
				prov varchar(2)
			''', '''
				WHERE
					%(munitable)s.prov IS NOT NULL
				GROUP BY
					%(munitable)s.prov
			''' % {
				'munitable': munitable,
		})
		mergeGeometries( db, munitable, nltable,
			"'NL'",
			'''
				nation varchar(2)
			''', '''
				WHERE
					%(munitable)s.prov IS NOT NULL
			''' % {
				'munitable': munitable,
		})
		writeAllMunis( db, munitable, level )
	db.connection.commit()
	db.connection.close()


def mergeGeometries( db, sourceTable, targetTable, cols, columns, whereGroupBy ):
	db.createMergedGeometryTable(
		sourceTable, geom, targetTable, geom,
		cols, columns, whereGroupBy
	)


def writeAllMunis( db, munitable, level ):
	where = 'true'
	geoid = 'NL'  # TODO
	geoMuni = db.makeFeatureCollection(
		schema + '.muni' + level,
		boxGeom, geom, geoid, 'Nederland',
		'muni', 'name', 'prov', where #, fixGeoID
	)
	geoProvince = db.makeFeatureCollection(
		schema + '.prov' + level,
		boxGeom, geom, geoid, 'Nederland',
		'prov', 'prov', 'prov', where #, fixGeoID
	)
	geoNation = db.makeFeatureCollection(
		schema + '.nl' + level,
		boxGeom, geom, geoid, 'Nederland',
		'nation', 'nation', 'nation', where #, fixGeoID
	)
	geo = {
		#'nation': geoNation,
		'province': geoProvince,
		'muni': geoMuni,
	}
	writeGeoJSON( db, geoid, level, geo )


def writeGeoJSON( db, geoid, level, geo ):
	filename = '%s/%s-%s-%s' %(
		private.GEOJSON_PATH, schema, geoid, level
	)
	db.writeGeoJSON( filename + '.js', geo, 'loadGeoJSON' )
	db.writeGeoJSON( filename + '.geojson', geo )


def main():
	createDatabase( database )
	makeMunis()


if __name__ == "__main__":
	main()
	#cProfile.run( 'main()' )
