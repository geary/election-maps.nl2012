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


def checkReferer( req, required ):
	return checkRefererURL( req.headers.get('Referer'), required )


def checkRefererURL( referer, required ):
	if not referer: return not required
	for domain in private.whitelist:
		pattern = 'https?://([\w_-]+\.)*%s/' % domain.replace( '.', '\.' )
		if re.match( pattern, referer ):
			return True
	return False



class VoteDataHandler( webapp.RequestHandler ):
	def get( self, qq ):
		logging.info( 'VoteDataHandler GET' )
		#logging.info( dumpRequest( self.request ) )
		if not checkReferer( self.request, True ):
			self.response.clear()
			self.response.set_status( 403 )
			self.response.out.write( 'Access not allowed' )
			return
		query = self.request.environ['QUERY_STRING']
		# TODO: parameterize
		tableid = private.tables['NH']['town']
		q = query.replace( '{{tableid}}', tableid )
		q = q.replace( '%7B%7Btableid%7D%7D', tableid )
		logging.info( q )
		url = FT_URL + q
		# TODO: parameterize
		content = 'loadCounties({"error":"500"})' 
		try:
			response = urlfetch.fetch( url )
			logging.info( 'FT status: %d' % response.status_code )
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


class HtmlHandler( webapp.RequestHandler ):
	def get( self, name ):
		#logging.info( dumpRequest( self.request ) )
		if not checkReferer( self.request, False ):
			self.response.clear()
			self.response.set_status( 403 )
			self.response.out.write( 'Access not allowed' )
			return
		f = open( 'static/%s' % name, 'r' )
		content = f.read()
		f.close()
		self.response.out.write( content )
		self.response.headers['Content-Type'] = 'text/html'


application = webapp.WSGIApplication([
	( r'/vote-data(.*)', VoteDataHandler ),
	( r'/(.*\.html)', HtmlHandler ),
], debug = True )


def main():
	run_wsgi_app( application )


if __name__ == '__main__':
	main()
