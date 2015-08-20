#!/usr/bin/env node

var fs = require('fs')
var datacat = require('./')

var dc = datacat()

var source = process.argv[2]
if (source === undefined) {
  console.error('Usage: datacat <source file or - for stdin>')
  process.exit(1)
}

if (source === '-') source = process.stdin
else source = fs.createReadStream(source)

source.pipe(dc)
