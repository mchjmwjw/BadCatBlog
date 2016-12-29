// var settings = require('../settings'),
//     Db = require('mongodb').Db,
//     Connection = require('mongodb').Server;
// module.exports = new Db(settings.db,
//   new Connection(settings.host, settings.port),
//   {safe: true}
// );
var uri = "mongodb://heroku_m570lp6m:g8835um42r6bmnvgbdr495ms75@ds133348.mlab.com:33348/heroku_m570lp6m";
if(process.env.NODE_ENV === "production") {
    uri = "mongodb://heroku_m570lp6m:g8835um42r6bmnvgbdr495ms75@ds133348.mlab.com:33348/heroku_m570lp6m";
}
else if(process.env.NODE_ENV === "development") {
    uri = "mongodb://localhost:27017/blog";
}
module.exports = uri;
