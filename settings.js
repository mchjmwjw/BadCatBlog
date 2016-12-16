var dburi = process.env.MONGOLAB_URI;

module.exports = {
  cookieSecret: 'myblog',
  db: dburi.substring(dburi.lastindexof("/") + 1),
  host: dburi.substring(dburi.indexOf("@") + 1, dburi.lastindexOf(":")),
  port: dburi.substring(dburi.lastindexOf(":") + 1, dburi.lastindexOf("/"))
};
