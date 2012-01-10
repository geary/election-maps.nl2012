# -*- coding: utf-8 -*-

# results-map.py
# By Michael Geary - http://mg.to/
# See UNLICENSE or http://unlicense.org/ for public domain notice.

import logging, pprint, re
from google.appengine.api import urlfetch
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

import private

FT_URL = 'http://fusiontables.googleusercontent.com/fusiontables/api/query?'


def dumpRequest( req ):
	return pprint.pformat({
		'environ': req.environ,
		'url': req.url,
		'headers': req.headers,
	})


class VoteDataHandler( webapp.RequestHandler ):
	def get( self, dump ):
		#logging.info( dumpRequest( self.request ) )
		query = self.request.environ['QUERY_STRING']
		logging.info( query )
		# TODO: parameterize
		tableid = private.tables['NH']['town']
		q = query.replace( '{{tableid}}', tableid )
		q = q.replace( '%7B%7Btableid%7D%7D', tableid )
		logging.info( 'VoteDataHandler.get: ' + q )
		url = FT_URL + q
		# TODO: parameterize
		content = 'loadCounties({"error":"500"})' 
		try:
			response = urlfetch.fetch( url )
			logging.info( 'FT error: %d' % response.status_code )
			if response.status_code != 200:
				# TODO: parameterize
				content = 'loadCounties({"error":%d})' % response.status_code
			else:
				content = response.content
		except urlfetch.DownloadError, e:
			logging.exception( 'FT DownloadError exception' )
		finally:
			self.response.out.write( content )
			self.response.headers['Content-Type'] = 'text/javascript'


application = webapp.WSGIApplication([
	( r'/vote-data(.*)', VoteDataHandler )
], debug = True )


def main():
	logging.info( 'main' )
	run_wsgi_app( application )


if __name__ == '__main__':
	main()
