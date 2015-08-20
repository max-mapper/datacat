var peek = require('peek-stream')
var detectJSON = require('detect-json-style')
var detectCSV = require('detect-csv')
var JSONStream = require('JSONStream')
var csv = require('csv-parser')
var concat = require('concat-stream')
var pumpify = require('pumpify')
var through = require('through2')
var Table = require('cli-table')
var debug = require('debug')('datacat')

module.exports = function (opts) {
  if (!opts) opts = {}
  var peeker = peekStream(opts)
  peeker.pipe(concat(function (rows) {
    var headers = []
    for (var i = 0; i < rows.length; i++) {
      for (var v in rows[i]) if (headers.indexOf(v) === -1) headers.push(v)
    }
    renderTable(headers, rows)
  }))
  return peeker
}

function renderTable (headers, rows) {
  var table = new Table({
    head: headers
  })

  for (var i = 0; i < rows.length; i++) {
    var row = []
    for (var v in rows[i]) row.push(rows[i][v])
    table.push(row)
  }
  
  console.log(table.toString())
}

function peekStream (opts) {
  return peek({newline: false, maxBuffer: opts.detectMax || 8000}, function (data, swap) {
    if (!Buffer.isBuffer(data)) return swap(null, parseObjects())
    var jsonStyle = detectJSON(data)
    if (jsonStyle) {
      jsonStyle.format = 'json'
      return swap(null, parseJSON(jsonStyle.selector))
    }
    var isCSV = detectCSV(data)
    if (isCSV) {
      return swap(null, parseCSV(isCSV.delimiter, opts))
    }
    swap(new Error('Could not auto detect input type. Please specify --format=csv,json'))
  })
}

function parseCSV (separator, opts) {
  debug('parsing csv')
  return combine([
    csv({
      headers: opts.headerRow === false && opts.columns,
      separator: separator
    })
  ])
}

function parseJSON (selector) {
  debug('parsing json')
  return combine([
    JSONStream.parse(selector),
    parseObjects()
  ])
}

function parseObjects () {
  debug('parsing objects')
  return through.obj() // empty through obj stream
}

function combine (streams) {
  if (streams.length === 1) return streams[0]
  return pumpify.obj(streams)
}
