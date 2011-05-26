# -*- coding: utf-8 -*-

import os.path
from zipfile import ZipFile

import pg
import private


# TODO:
'''
CREATE DATABASE turkey
  WITH ENCODING='UTF8'
       TEMPLATE=template_postgis
       CONNECTION LIMIT=-1;
'''


def process():
	#db = pg.Database( database='postgres' )
	#db.createGeoDatabase( 'turkey' )
	#db.connection.close()
	
	schema = 't2011'
	#level = ''
	level = '-70'
	
	db = pg.Database( database='turkey' )
	
	#db.createSchema( schema )
	
	db.loadShapefile(
		'../shapes/shp/provinces%s/provinces.shp' % level,
		private.TEMP_PATH,
		'%s.provinces' % schema, True
	)
	
	db.loadShapefile(
		'../shapes/shp/subprovinces%s/subprovinces.shp' % level,
		private.TEMP_PATH,
		'%s.subprovinces' % schema, True
	)
	
	db.loadShapefile(
		'../shapes/shp/districts%s/districts.shp' % level,
		private.TEMP_PATH,
		'%s.districts' % schema, True
	)
	
	db.connection.close()


def main():
	process()
	

if __name__ == "__main__":
	main()
