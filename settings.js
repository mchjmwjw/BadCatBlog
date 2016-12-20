var dburi = process.env.MONGOLAB_URI;

module.exports = {
  cookieSecret: 'myblog',
  db: dburi.dbname,//substring(dburi.lastindexof("/") + 1),
  host: dburi.host,//substring(dburi.indexOf("@") + 1, dburi.lastindexOf(":")),
  port: dburi.port//substring(dburi.lastindexOf(":") + 1, dburi.lastindexOf("/"))
};
