#!/usr/bin/python

class Cursor( object ):
	def __init__( self, cur ):
		self.cur = cur
	def execute( self, com ):
		print com
		return self.cur.execute( com )
	def fetchall( self ):
		return self.cur.fetchall()

