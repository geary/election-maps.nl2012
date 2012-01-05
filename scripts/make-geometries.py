# -*- coding: utf-8 -*-

import pg


def process():
	#db.indexGeometryColumn( sourceTable, sourceGeom )
	for level in '90 80 70 60 50 00'.split(' '):
		geom = 'geom_' + level
		db.mergeGeometry(
			't2011.districts', 'parent', geom,
			't2011.provinces', 'id', geom
		)
		
	#db.addGoogleGeometry( sourceTable, sourceGeom, sourceGoogGeom )
	#db.addGoogleGeometry( targetTable, targetGeom, targetGoogGeom )


def main():
	global db
	db = pg.Database( database='usageo' )
	process()
	db.connection.close()
	print 'Done!'
	

if __name__ == "__main__":
	main()
