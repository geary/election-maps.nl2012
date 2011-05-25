# -*- coding: utf-8 -*-

import os.path
from zipfile import ZipFile

import pg
import private
import states


# TODO:
'''
CREATE DATABASE census
  WITH ENCODING='UTF8'
       TEMPLATE=template_postgis
       CONNECTION LIMIT=-1;
'''


def censusFileName( kind, year, fips ):
	return os.path.join(
		private.SHAPEFILE_PATH, kind.upper(),
		year,
		'tl_2010_%s_%s%s' %( fips, kind, year[-2:] ) + '.zip'
	)


def process():
	#db = pg.Database( database='postgres' )
	#db.createGeoDatabase( 'census' )
	#db.connection.close()
	
	db = pg.Database( database='census' )
	#for year in '2000', '2010':
	for year in '2010',:
		schema = 'c' + year
		db.createSchema( schema )
		for kind in 'state', 'county', 'tract', 'bg':
			table = schema + '.' + kind
			create = True
			for state in states.array:
				fips = state['fips']
				print 'Loading', table, fips, state['name']
				zipfile = censusFileName( kind, year, fips )
				db.loadShapeZip(
					zipfile, private.TEMP_PATH,
					table, create
				)
				create = False
	db.connection.close()


def main():
	process()
	

if __name__ == "__main__":
	main()
