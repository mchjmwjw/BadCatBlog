var settings = require('../setting'),
    Db = require('mongodb').Db,
    Connection = require('mongodb').Server;
module.exports = new Db(settings.db,
  new Server(settings.host, settings.port),
  {safe: true}
);
