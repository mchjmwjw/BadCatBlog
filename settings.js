

//var a = process;
//var b= process.env;
//var dburi = process.env.MONGOLAB_URI;

module.exports = {
  cookieSecret: 'myblog',
  db: 'heroku_m5701p6m',//substring(dburi.lastindexof("/") + 1),
  host: 'ds133348.mlab.com',//substring(dburi.indexOf("@") + 1, dburi.lastindexOf(":")),
  port: '33348'//substring(dburi.lastindexOf(":") + 1, dburi.lastindexOf("/"))
};
