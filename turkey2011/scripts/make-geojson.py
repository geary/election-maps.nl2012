# -*- coding: utf-8 -*-

import pg, private

def process():
	schema = 't2011'
	level = ''
	#for tbl in ( 'provinces', 'districts', ):
	for tbl in ( 'provinces', ):
		table = '%s.%s' %( schema, tbl )
		boxGeom = 'full_geom'
		targetGeom = 'full_geom'
		#db.addGoogleGeometry( table, geom, googGeom )
		#for level in ( '', '10', '100', '1000', '10000' ):
		#	db.makeGeoJSON( opt.table, level )
		#filename = '../web/test/%s-%s.json' %( table, targetGeom )
		filename = '%s/turkey-%s-%s.json' %(
			private.GEOJSON_PATH, tbl, targetGeom
		)
		db.makeGeoJSON( filename, table, boxGeom, targetGeom )


def main():
	global db
	db = pg.Database( database = 'turkey' )
	process()
	db.connection.close()


if __name__ == "__main__":
	main()
