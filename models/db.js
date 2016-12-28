// var settings = require('../settings'),
//     Db = require('mongodb').Db,
//     Connection = require('mongodb').Server;
// module.exports = new Db(settings.db,
//   new Connection(settings.host, settings.port),
//   {safe: true}
// );

var MongoClient = require('mongodb').MongoClient;
var uri = "mongodb://heroku_m570lp6m:g8835um42r6bmnvgbdr495ms75@ds133348.mlab.com:33348/heroku_m570lp6m";
var Db = new Object();
MongoClient.connect(uri, function(err, db){
  Db = db;
});
module.exports = uri;
