#!/usr/bin/python

#   modified by Laurent Pierre on March 18, 2008 : modif in index creation
#   modified by Laurent Pierre on March 28, 2006 : clean up the code.
# Map Simplification Program - createVertex.py
# -> Last Modification : June 30, 2005 - 09:58:08 AM 

# Copyright (c) 2005 PIERRE Laurent <laurent.pierre@edf.fr>, GARZILLI Damien <garzilld@esiee.fr>

# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Library General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.


import getopt, sys, os
from string import *
import math
import re

import psycopg2

import polyYacc

import tracer

##############################################################################################
def vertex(schemaVertex,tableGeo,colGeo,colId,minDistance) :
	
	# table name which will be create
	tableVertex = "vertex" + str(minDistance)
	sequence = '%s_%s_id_seq'%(schemaVertex,tableVertex)

	vertex = createVertex(schemaVertex,tableVertex,sequence)

	# Populate the vertex table
	if isinstance( tableGeo, basestring ):
		tableGeo = [ tableGeo ]
	for t in tableGeo:
		populateVertex(vertex,sequence,colId,colGeo,t,minDistance)



def createVertex(schemaVertex,tableVertex,sequence) :
	vertex = schemaVertex + '.' + tableVertex
	# drop this table if it already exists
	com = ''
	com = com + 'DROP TABLE  %s CASCADE'%vertex
	# catch the exception if the table does not exist
	try:
		cur.execute(com)
		connexion.commit()
	except psycopg2.DatabaseError:
		pass
	connexion.commit()

	# drop the sequence vertex_id_seq
	com = 'DROP SEQUENCE %s'%sequence
	# catch the exception if the sequence does not exist
	try:
		cur.execute(com)
	except psycopg2.DatabaseError:
		pass
	connexion.commit()

	# create the sequence vertex_id_seq
	com = 'create sequence %s'%sequence
	cur.execute(com)
	
	
	# create the table 
	# -> column : id (int), x(int), y(int), nref(int), simplif(boolean)
	com = ' create table ' + vertex + '( '
	com = com + " id integer  primary key,"
	com = com + " x  integer, y integer, nref integer, simplif boolean default 'true');"
	# create indexes on this table on x and y coordinates
	com = com + " create index idx_%s_%s_x on %s(x);"%(schemaVertex,tableVertex,vertex)
	com = com + " create index idx_%s_%s_y on %s(y);"%(schemaVertex,tableVertex,vertex)
	#print com
	cur.execute(com)
		
	# SQL var : vertex_id_seq = 1
	com = ''
	com = com + "SELECT setval('%s',1)"%sequence
	cur.execute(com)
	
	return vertex  
	

def populateVertex(vertex,sequence,colId,colGeo,tableGeo,minDistance):
	print tableGeo
	# the geometrytype must be MULTIPOLYGON
	(schema,table) = split(tableGeo)
	com = 'select type from geometry_columns\n'
	com = com + "where f_table_schema    = '%s' and\n"%(schema)
	com = com + "      f_table_name      = '%s' and\n"%(table) 
	com = com + "      f_geometry_column = '%s'\n"%(colGeo) 
	cur.execute(com)
	s = cur.fetchall()
	geometryType= s[0][0]
	
	# SQL request :
	# -> get from the table passed as argument the id, the SRID and the geometry data as text
	#geometry data <-> polygon coordinates
	com = ''   
	com = com + 'SELECT %s,ST_SRID(%s),ST_AsText(%s) '%(colId,colGeo,colGeo)
	com = com + 'FROM %s  ORDER BY %s'%(tableGeo,colId)
	cur.execute(com)
	
	# map simplification algorithm  
	for lid,srid,lgeom in cur.fetchall():
		print lid
		#sys.stdout.write('.')
		# convert the polygon coordinates into a list of vertex
		poly = polyYacc.polyScan(lgeom)
		# add all those vertex into the vertex table created before (all vertex are marked as simplifiable)
		res = addPoints(poly, vertex,sequence)
		# map simplification algorithm, search for all points which are not simplifiable
		polySimplif(res,minDistance,vertex)
		# add few points located on the border of the map as not simplifiable (see documentation for further information)
		addBorder(res,vertex)

	
def split(name) :
	rec = name.split('.')
	if len(rec) == 2 :
		return rec
	else :
		return ['',rec[0]]

##############################################################################################
# function polySimplif
# @param : the list of triplet (x,y,id), minimal distance value, name of the table where the vertex are stored
def polySimplif(poly,minDistance,tableVertex):
	print 'Simplify ...'
	# for each ring in a polygon
	for po in poly:
		for ring in po:
			# map simplification algorithm
			simplif(ring,minDistance*minDistance,tableVertex)


##############################################################################################
# function addPoints
# @param : list of polygons, name of the table where the vertex will be stored
def addPoints(poly,vertex,sequence):
	#print 'Adding vertex ...'
	res = []
	for po in poly:
		resPoly = []
		for ring in po:
			resRing = []
			for p in ring:  
				# function plpgsql 'vertex'
				# -> add an entry in the vertex table 
				com = "SELECT vertex('%s','%s',%f,%f)"%(vertex,sequence,round(p[0]),round(p[1]))
				cur.execute(com)
				#
				for id in cur.fetchall() :
					resRing.append( (round(p[0]), round(p[1]), id[0]) )
			
			resPoly.append(resRing)
		res.append(resPoly)
	return res

##############################################################################################
# function addBorder
# @param : list of polygons, name of the table where the vertex will be stored
def addBorder(poly,vertex):
	#print 'Adding border vertex ...'
	nref_prev = 0
	id_prev   = 0
	# 3 depth levels in order to get the coordinate of each vertex
	for po in poly:
		for bo in po:
			for p in bo:
				# get the number of reference of the vertex and its id
				com = "SELECT nref,id from " + vertex + " where id = " + str(p[2])
				cur.execute(com)
				
				for s in cur.fetchall() :
					nref = s[0]
					id_ = s[1]
					# if the previous vertex belongs to an unique polygon (vertex on a border)
					# and the next belongs to more than 1
					if nref_prev == 1 and nref >= 2 :
						# we set the present point as non simplifiable
						com = "UPDATE " + vertex + " SET simplif = false where id = " + str(id_)
						cur.execute(com)
						
						# same case in the other direction
						if nref_prev >= 2 and nref == 1 :
							com = "UPDATE " + vertex + " SET simplif = false where id = " + str(id_prev)
							cur.execute(com)
							nref_prev = nref
							id_prev = id_

##############################################################################################
# function simplif
# @param : list of vertex in a ring of a polygon, minimal distance value
def simplif(tab,d2,vertex):
	# to count how many points will stay non-simplifiable
	# -> a polygon must have at least 3 points
	nbPoint = 1
	
	# initialization of the algorithm : first point found non simplifiable
	com = 'UPDATE %s SET simplif=false WHERE id=%i'%(vertex,tab[0][2])
	cur.execute(com)
	
	# two indexes necessary to our algorithm
	lap = 0
	pin = 2
	#print 'len(tab)=',len(tab)
	#for p in tab :
	#	print p
	while pin < len(tab)-1 :
		# verify if the point indexes by (pin-1) in tab is simplifiable or not
		if not okPoint(lap,pin,tab,d2):
			# if not, we move the index lap
			lap = pin - 1
			# set the point non-simplifiable in the vertex table
			com = 'UPDATE %s SET simplif=false WHERE id=%i'%(vertex,tab[lap][2])
			cur.execute(com)
			# number of point non-simplifiable ++
			nbPoint = nbPoint + 1
		pin = pin + 1
	
	# the following is a little tricky
	# if there is not at least 3 points non simplifiable, we will re-traverse the ring and
	# set as non-simplifiable the i-first points found
	i = 1   
	while nbPoint < 3 and i < len(tab)-1 :
		com = 'SELECT simplif from %s WHERE id=%i'%(vertex,tab[i][2])
		cur.execute(com)
		for res in cur.fetchall() :
			if res :
				com = 'UPDATE %s SET simplif=false WHERE id=%i'%(vertex,tab[i][2])
				cur.execute(com)
				nbPoint = nbPoint+1
		i = i + 1
	
	# the last point should also be non simplifiable (normally, first point == last point)
	com = 'UPDATE %s SET simplif=false WHERE id=%i'%(vertex,tab[len(tab)-1][2])
	cur.execute(com)


##############################################################################################
# function okPoint
# @param : two indexes from the algorithm, array of vertex and the minimal distance value
def okPoint(lap,pin,tab,d2):
	#print lap,pin
	ok = 1
	# for all vertex in tab[lap+1] and tab[pin-1]
	for i in range(lap+1 ,pin):
		# if the vertex tab[i] is located outside of the band created by tab[lap], tab[pin] and
		# the minimal distance value of the algorithm
		#print i,lap,pin
		if distMin2(tab[i],tab[lap],tab[pin]) > d2:
			ok = 0 # tab[pin-1] is not simplifiable
			break
	# else, vertex simplifiable
	return ok

	
##############################################################################################
# function distMin2
# @param : 3 vertex p, p1 et p2 (.p1 ------ .p ------ .p2)
# @return : return the minimal distance of p with the p1p2 vector
def distMin2(p,p1,p2):
	#print p,p1,p2
	eps = 0.001
	# distance between p1 and p
	p1p_2 = len2(p1,p)
	# distance between p1 and p2
	p1p2_2 = len2(p1,p2)   
	if  p1p2_2 < eps:
		return 0;
	# scalar product of pp1 and p1p2
	dp = dotProd(vect(p,p1),vect(p1,p2)) 

	if dp >= 0 : # ie p is located after the vertex p1 (direction by p1p2)
		if p1p_2 > p1p2_2: # if pp1 > p1p2, then return pp2
			return len2(p,p2)
		else: # else
			# H projected point of p on p1p2 vector
			p1a_2  = dp*dp/p1p2_2 # p1H (squared)
			pa_2   = p1p_2 - p1a_2 # pH = pp1 - p1h (all squared)
			return pa_2
	else: # p is located before p1
		return len2(p1,p)


##############################################################################################
# function len2
# @param : two vertex (x,y)
# @return : squared magnitude of the vector generated by these two points
def len2(p1,p2):
	p1p2   = vect(p1,p2)
	return  dotProd(p1p2,p1p2) 


##############################################################################################
# function dotProd
# @param : two vectors
# @return : scalar product of these two vectors
def dotProd(v1,v2):
	return v1[0]*v2[0] + v1[1]*v2[1]


##############################################################################################
# function vect
# @param : two vertex (x,y)
# @return : coordinates of the vector generated by these two points
def vect(o,e):
	return (e[0]-o[0] , e[1]-o[1])


##############################################################################################
# function main 
# -> get the arguments from the command line and call the simplification function
def main() :
	# check the arguments from the command line
	try:
		opts, args = getopt.getopt(sys.argv[1:], 't:v:i:g:m:d:u:p:H:h',['help'])
	except getopt.GetoptError:
		# print help information and exit:
		usage()
		sys.exit(2)
		
	# parse the command line
	for o, a in opts:
		if o in ("-h", "--help"):
			usage()
			sys.exit()
		if o == '-t':
			tableGeo= a
		if o == '-v' :
			schemaVertex = a
		if o == '-i':
			colId = a
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
		tableGeo, colGeo, schemaVertex, colId, minDistance
	)

def run(
	username, password, hostname, database,
	tableGeo, colGeo, schemaVertex, colId, minDistance
):
	print 'Vertex Table Generation %s %s %d' %( tableGeo, colGeo, minDistance )
	global connexion,cur
	# connect to the database
	connexion = psycopg2.connect("user = '%s' password = '%s' host = '%s' dbname = '%s'"%(username,password,hostname,database))
	cur = tracer.Cursor( connexion.cursor() )
	# simplification function
	vertex(schemaVertex,tableGeo,colGeo,colId,minDistance)
	connexion.commit()
	connexion.close()

##############################################################################################
# Usage function
def usage() :
	print "usage : vertex.py  -H <hostname> -u <username> -p <password> -d <base name> -t <table> -v <vertex schema>-i <id column name> -g <geometry column name> -m <minimal distance value>"

	
##############################################################################################
# Starting point
if __name__ == "__main__":
	main()
