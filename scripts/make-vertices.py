# -*- coding: utf-8 -*-

import time
from map_simplification_program import vertex
import pg, private


def process():
	t1 = time.clock()
	#for tolerance in ( 10, 100, 1000, 10000, 100000, ):
	for tolerance in ( 10, ):
		vertex.run(
			username = private.POSTGRES_USERNAME,
			password = private.POSTGRES_PASSWORD,
			hostname = 'localhost',
			database = 'census',
			tableGeo = 'c2010.county',
			colGeo = 'goog_geom',
			colId = 'gid',
			schemaVertex = 'v2010',
			minDistance = tolerance,
		)
	t2 = time.clock()
	print 'make-vertices.py %.1f seconds' %( t2 - t1 )


def main():
	#global db
	#db = pg.Database( database='census' )
	process()
	#db.connection.close()
	print 'Done!'
	

if __name__ == "__main__":
	main()
