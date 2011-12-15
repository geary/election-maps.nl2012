#!/usr/bin/env python

import errno, os

import private


def mkdirp( path ):
	try:
		os.makedirs( path )
	except OSError as ex:
		if ex.errno != errno.EEXIST:
			raise


def chdirp( path ):
	mkdirp( path )
	os.chdir( path )


if __name__ == "__main__":
	pass