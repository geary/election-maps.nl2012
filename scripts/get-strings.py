#!/usr/bin/env python

# get-strings.py
# By Michael Geary - http://mg.to/
# See UNLICENSE or http://unlicense.org/ for public domain notice.

# Reads the JSON feed for a Google Docs spreadsheet containing
# localized strings, then writes the strings for each language into
# a JSONP file for that language. The JSONP output has line breaks
# and alphabetized keys for better version control, e.g.:
#
# loadStrings({
# "areYouRegistered": "Are you registered to vote?", 
# "dateFormat": "{{monthName}} {{dayOfMonth}}", 
# "yourHome": "Your Home", 
# "yourVotingLocation": "Your Voting Location"
# })

import json, re, urllib2

sheet = '0AuiC0EUz_p_xdHRXd19ub0dYN2RtVTZGNC1WVGd2ZkE/1'
url = 'https://spreadsheets.google.com/feeds/list/%s/public/values?alt=json' % sheet

langs = {}

feed = json.load( urllib2.urlopen(url) )['feed']

for entry in feed['entry']:
	id = entry['gsx$id']['$t']
	for col in entry:
		match = re.match( 'gsx\$text-(.+)$', col )
		if match:
			lang = match.group( 1 )
			if lang not in langs: langs[lang] = {}
			langs[lang][id] = entry[col]['$t']

for lang in langs:
	j = json.dumps( langs[lang], indent=0, sort_keys=True )
	file = '../gadget/static/locale/lang-%s.js' % lang
	print 'Writing ' + file
	open( file, 'wb' ).write( 'loadStrings(%s)' % j )
