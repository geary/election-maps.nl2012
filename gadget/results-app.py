# -*- coding: utf-8 -*-

# results-map.py
# By Michael Geary - http://mg.to/
# See UNLICENSE or http://unlicense.org/ for public domain notice.

import logging, pprint
from urlparse import urlparse

from google.appengine.api import urlfetch
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

import private
#from referercheck import RefererCheck
#refcheck = RefererCheck( private.whitelist )

FT_URL = 'http://fusiontables.googleusercontent.com/fusiontables/api/query?'


def dumpRequest( req ):
	return pprint.pformat({
		'environ': req.environ,
		'url': req.url,
		'headers': req.headers,
	})


def checkReferer( req, required ):
	ver = req.environ['CURRENT_VERSION_ID'].split('.')[0]
	if ver == 'nv2012': return True
	if ver == 'fr2012': return True
	if ver == 'fr2012-test': return True
	return checkRefererURL( req.headers.get('Referer'), required )


#def checkRefererURL( referer, required ):
#	if referer is not None: referer = referer.lower()
#	return refcheck.check( referer, required )


def checkRefererURL( referer, required ):
	if not referer:
		return not required
	ref = urlparse( referer.lower() )
	if not ref:
		return False
	for goodURL in private.whitelist:
		good = urlparse( goodURL.lower() )
		if checkParsedURL( good, ref ):
			return True
	return False


def checkParsedURL( good, url ):
	return(
		( good.scheme == ''  or  url.scheme == good.scheme )
			and
		( good.hostname is None  or  url.hostname.endswith(good.hostname) )
			and
		( good.port is None  or  url.port == good.port )
			and
		( good.path is None  or  url.path.startswith(good.path) )
	)


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
		# Poor man's template
		content = content.replace( '{{acceptLanguageHeader}}', self.request.headers['Accept-Language'] )
		self.response.out.write( content )
		self.response.headers['Content-Type'] = 'text/html'


class EmbedHandler( HtmlHandler ):
	def get( self ):
		HtmlHandler.get( self, 'results-map.html' )


application = webapp.WSGIApplication([
	( r'/results/vote-data(.*)', VoteDataHandler ),
	( r'/results/embed', EmbedHandler ),
], debug = True )


def main():
	run_wsgi_app( application )


def test():
	logging.info( 'Testing good list' )
	for url in private.testlistgood:
		if not checkRefererURL( url, True ):
			logging.error( 'Good list fail: %s' % url )
	logging.info( 'Testing bad list' )
	for url in private.testlistbad:
		if checkRefererURL( url, True ):
			logging.error( 'Bad list fail: %s' % url )
	logging.info( 'Test done' )


if __name__ == '__main__':
	if private.runtest:
		test()
	main()
