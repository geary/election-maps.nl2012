# -*- coding: utf-8 -*-

# Copyright 2012 Google Inc.  All Rights Reserved
# Author: jmwaura@google.com (Jesse Mwaura)
# See UNLICENSE or http://unlicense.org/ for public domain notice.

from urlparse import urlparse

DOMAIN_ONLY = object()
class RefererCheck(object):
	"""Check current referer url against a supplied whitelist.
	
	The whitelist must contain elements that can be parsed by urlparse and that
	contain a hostname. The "*" wildcard is acceptable at the beginning of the
	hostname, and a base path may be added, e.g "//*.example.com/base/path"
	Note that "//*.example.com" will match "http://www.example.com/", but not
	"http://example.com".
	For improved performance, avoid wildcards and base paths wherever possible.
	"""
	def __init__(self, whitelist):
		self.exactDomainMap = {}
		self.wildcardDomainMap = {}
		self.preprocessRefererWhitelist(whitelist)

	def check(self, referer, required = True):
		ref = referer and urlparse(referer)	or None	
		if not ref or not ref.hostname:
			return not required
		domainEntry = None
		if ref.hostname in self.exactDomainMap:
			domainEntry = self.exactDomainMap[ref.hostname]
		else:
			hostParts = ref.hostname.split(".")
			for i in xrange(len(hostParts)-1):
				tmphost = ".".join(hostParts[i+1:])
				if tmphost in self.wildcardDomainMap:
					domainEntry = self.wildcardDomainMap[tmphost]
					break

		if not domainEntry:
			return False
		# If nothing other than the host is specified, return.			
		if domainEntry is DOMAIN_ONLY:
			return True
		# Otherwise check that the remainder of the url is valid.
		for url in domainEntry:
			if self.checkRemainder(url, ref):
				return True
		return False

	def checkRemainder(self, allowed, ref):
		return (
			(not allowed.scheme or ref.scheme == allowed.scheme)
			and (not allowed.port or ref.port == allowed.port)
			and (not allowed.path or ref.path.startswith(allowed.path))
			)

	def preprocessRefererWhitelist( self, whitelist ):
		for urlString in whitelist:
			url = urlparse(urlString)
			if not url.hostname:
				continue
			containsWildcard = url.hostname.startswith('*.')
			urlKey = containsWildcard and url.hostname[2:] or url.hostname
			urlValue = (url.scheme or url.port or url.path) and url or DOMAIN_ONLY

			# If this whitelist entry does not require a check for scheme, port,
			# or path, override any existing entry.
			if urlValue is DOMAIN_ONLY:
				if not containsWildcard:			
					self.exactDomainMap[urlKey] = urlValue
				else:
					self.wildcardDomainMap[urlKey] = urlValue
				continue

			# Otherwise append to valid URLs for given domain.
			if not containsWildcard:
				if urlKey in self.exactDomainMap and self.exactDomainMap[urlKey] is not DOMAIN_ONLY:
					self.exactDomainMap[urlKey].append(urlValue)
				elif urlKey not in self.exactDomainMap:
					self.exactDomainMap[urlKey] = [urlValue]
			else:
				if urlKey in self.wildcardDomainMap and self.wildcardDomainMap[urlKey] is not DOMAIN_ONLY:
					self.wildcardDomainMap[urlKey].append(urlValue)
				elif urlKey not in self.wildcardDomainMap:
					self.wildcardDomainMap[urlKey] = [urlValue]

def test():
	whitelist = [
		"//*.example.com/path",
		"//www.example.com",
		"//example2.com",
		"//example2.com/path"
	]
	refCheck = RefererCheck(whitelist)
	assert len(refCheck.wildcardDomainMap) == 1
	assert len(refCheck.wildcardDomainMap["example.com"]) == 1
	assert len(refCheck.exactDomainMap) == 2
	assert refCheck.exactDomainMap["example2.com"] is DOMAIN_ONLY
	assert refCheck.check("http://www.example.com/path")
	assert refCheck.check("http://test.example.com/path")
	assert not refCheck.check("http://test.example.com")
	assert not refCheck.check("http://example.com/path")
	assert not refCheck.check("http://www.example.com/otherpath")
	assert not refCheck.check("http://www.example2.com")
	assert refCheck.check("http://example2.com/path")
	assert refCheck.check("http://example2.com/otherpath")
	assert refCheck.check("http://example2.com/")
	assert refCheck.check("http://www.example.com/")
	assert refCheck.check("http://www.example.com")
	assert not refCheck.check("http://www.badexample.com")

if __name__ == "__main__":
	test()
