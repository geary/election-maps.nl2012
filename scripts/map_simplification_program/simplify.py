#!/usr/bin/python

#       modified by Laurent Pierre on March 28, 2006 : clean up the code.
#       modified by Laurent Pierre on September 27, 2005 : we no longer use extra inherited tables but extra columns for simplified vertice.

#       Map Simplification Program - createTable.py
#                               -> Last Modification : July 04, 2005 - 11:55:36 AM

#       Copyright (c) 2005 PIERRE Laurent <laurent.pierre@edf.fr>, GARZILLI Damien <garzilld@esiee.fr>

#       This program is free software; you can redistribute it and/or modify
#       it under the terms of the GNU General Public License as published by
#       the Free Software Foundation; either version 2 of the License, or
#       (at your option) any later version.
#
#       This program is distributed in the hope that it will be useful,
#       but WITHOUT ANY WARRANTY; without even the implied warranty of
#       MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#       GNU Library General Public License for more details.
#
#       You should have received a copy of the GNU General Public License
#       along with this program; if not, write to the Free Software
#       Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.


import getopt, sys, os
from string import *
import math
import re

import psycopg2

import polyYacc

import tracer


##############################################################################################
# Fonction createTable
# @param : database name, schema name, table name, geometry column name, id column name, the
#                  minimal distance value and the username/password/host name
def simplify(database,tableVertex,tableGeo,colGeo,colId,minDistance,username,password,hostname):
	#schema and table name
	(schema,tableGeo) = split(tableGeo)
	
	# check if vertex table exists
	com = 'select id from %s limit 1'%tableVertex
	try:
		cur.execute(com)
	except psycopg2.DatabaseError: # if not
		print "an error occured with the data base. Maybe the vertex table does not exist ?"
		sys.exit()
	
	# name of the extra column generated
	xtraCol = colGeo + str(minDistance)
		
	# get the SRID from the entry table
	com = "SELECT find_srid('%s','%s','%s')"%(schema,tableGeo,colGeo)
	cur.execute(com)
	
	# srid = -1, by default
	s = cur.fetchall()
	srid = int(str(s[0][0]))
	
	# get the GEOMETRYTYPE from the entry table ... must be MULTIPOLYGON for now
	com = 'select type from geometry_columns\n'
	com = com + "where f_table_schema    = '%s' and\n"%(schema)
	com = com + "      f_table_name      = '%s' and\n"%(tableGeo)
	com = com + "      f_geometry_column = '%s'\n"%(colGeo)
	cur.execute(com)
	s = cur.fetchall()
	geometryType= s[0][0]
	#if geometryType <> 'MULTIPOLYGON':
	#    print 'geometry must be MULTIPOLYGON'
	#    sys.exit()
		
	
	# drop if the extra column already exists
	com = 'ALTER TABLE %s.%s DROP COLUMN %s CASCADE'%(schema,tableGeo,xtraCol)
		
	# exception if this table does not exist
	try:
		cur.execute(com)
	except psycopg2.DatabaseError:
		pass
	connexion.commit()

	# delete from the geometry_column table every data entry relative to the extra column
	com = 'DELETE FROM geometry_columns\n'
	com = com + "WHERE f_table_schema    = '%s'"%schema
	com = com + "  AND f_table_name      = '%s'"%tableGeo
	com = com + "  AND f_geometry_column = '%s'"%xtraCol
	try:
		cur.execute(com)
	except psycopg2.DatabaseError:
		pass
	connexion.commit()
	# create the onew column
	com = "SELECT AddGeometryColumn('%s','%s','%s',%i,'%s',2)"%(schema,tableGeo,xtraCol,srid,geometryType)
	cur.execute(com)

	
	# SQL request:
	# -> get from the table passed as argument the id and the geometry data as text
	#        geometry data <-> polygon coordinates
	com = 'SELECT %s,ST_AsText(%s) '%(colId,colGeo)
	com = com + 'FROM %s.%s  ORDER BY %s'%(schema,tableGeo,colId)
	cur.execute(com)

	for lid,lgeom in cur.fetchall():
		print lid
		updateCol(lid,lgeom,schema,tableGeo,xtraCol,tableVertex,srid,colId)
	
	
	
	
	# SQL request:
	# -> index creation on extra col
	com = 'CREATE INDEX idx_%s_%s_%s'%(schema,tableGeo,xtraCol)
	com = com + ' ON %s.%s '%(schema,tableGeo)
	com = com + 'USING gist(%s)'%xtraCol

	cur.execute(com)
	
	
def updateCol(lid,lgeom,schema,tableGeo,newcol,tableVertex,srid,colId):
	#print '-----------------------------------------------------'
	#print lgeom
	poly = polyYacc.polyScan(lgeom)
	#print poly
	polyS = []
	for po in poly:
		resPoly = []
		for ring in po:
			#print ring[0],ring[len(ring)-1]
			resRing = []
			for p in ring:
				x = round(p[0])
				y = round(p[1])

				# select if the vertex is simplifiable or not
				com = 'SELECT simplif,nref from %s WHERE x=%d AND y=%d'%(tableVertex,x,y)
				cur.execute(com)
				for res in cur.fetchall():
					if res[0] == False or res[1] >= 3: # if not simplifiable
						resRing.append((x,y))
						#print resRing
				
			if (len(resRing)< 3):
				resRing = ring
			if (resRing[0] <> resRing[len(resRing)-1]):
				resRing.append(resRing[0])
			resPoly.append(resRing)
			#print resPoly
		polyS.append(resPoly)
		#print polyS
	#print polyS
	polytext = multiPol2text(polyS)
	#print polytext
	#print '-----------------------------------------------------'

	com = 'UPDATE %s.%s'%(schema,tableGeo)
	com = com + " SET %s = ST_GeometryFromText('%s',%s)"%(newcol,polytext,srid)
	com = com + ' WHERE %s = %i'%(colId,lid)
	cur.execute(com)
		
	

def split(name):
	rec = name.split('.')
	if len(rec) == 2:
		return rec
	else:
		return ['',rec[0]]

def multiPol2text(poly):
	txt = 'MULTIPOLYGON'
	txt = txt + '('
	for ipo in range(0,len(poly)):
		if (ipo <> 0):
			txt  = txt + ','
		txt = txt + '('
		po = poly[ipo]
		for iring in range(0,len(po)):
			ring = po[iring]
			if (iring <> 0):
				txt  = txt + ','
			txt = txt + '('
			for ip in range(0,len(ring)):
				p = ring[ip]
				if (ip <> 0):
					txt  = txt + ','
				txt = txt + '%f %f'%(p[0],p[1])
			txt = txt + ')'
		txt = txt + ')'
	txt = txt + ')'
	return txt

##############################################################################################
# function main
# -> get the arguments from the command line and call the simplification function
def main():
	'Creation de la table de sortie par rapport au dmin'
	# check the arguments from the command line
	try:
		opts, args = getopt.getopt(sys.argv[1:], 'i:m:v:t:g:d:u:p:H:h',['help'])
	except getopt.GetoptError:
		# print help information and exit:
		usage()
		sys.exit(2)

	# parse the command line
	for o, a in opts:
		if o in ("-h", "--help"):
			usage()
			sys.exit()
		if o == '-v':
			tableVertex= a
		if o == '-t':
			tableGeo= a
		if o == '-i':
			colId= a
		if o == '-g':
			colGeo = a
		if o == '-m':
			minDistance = int(a)
		if o == '-d':
			database = a
		if o == '-u':
			username = a
		if o == '-p':
			password = a
		if o == '-H':
			hostname = a
	run(
		username, password, hostname, database,
		tableGeo, colGeo, tableVertex, colId, minDistance
	)


def run(
	username, password, hostname, database,
	tableGeo, colGeo, tableVertex, colId, minDistance
):
	global cur
	global connexion

	# connect to the database
	connexion = psycopg2.connect("user = '%s' password = '%s' host = '%s' dbname = '%s'"%(username,password,hostname,database))
	cur = tracer.Cursor( connexion.cursor() )
	# simplification function
	simplify(database,tableVertex,tableGeo,colGeo,colId,minDistance,username,password,hostname)
	connexion.commit()
	connexion.close()

##############################################################################################
# Usage function
def usage():
	print "usage: simplify.py  -H <hostname> -u <user name> -p <password> -d <base name> -v <vertex table> -t <table>  -i <id column> -g <geometry column> -m <minimal distance value>"

	
##############################################################################################
# Starting point
if __name__ == "__main__":
	main()
