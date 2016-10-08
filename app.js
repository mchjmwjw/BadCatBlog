var express = require('express');
var path    = require('path');
var favicon = require('serve-favicon');
var logger  = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');

var routes   = require('./routes/index');       //加载访问主页的路由
var settings = require('./settings');
var flash    = require('connect-flash');        //flash是在session中用于存储信息的特定区域
var users    = require('./routes/users');

//会话信息存放需要的模块
var session    = require('express-session');
var MongoStore = require('connect-mongo')(session);

var app = express(); //生成一个express实例的app

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');                  //设置模板引擎
//_dirname为全局变量，存储当前正在执行的脚本所在目录
app.use(flash());

// uncomment after placing your favicon in /public, favicon图标
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));                              //加载日志中间件
app.use(bodyParser.json());                          //加载解析json的中间件
app.use(bodyParser.urlencoded({ extended: false })); //加载解析urlencode请求体的中间件
app.use(cookieParser());                             //加载解析cookie的中间件
app.use(express.static(path.join(__dirname, 'public')));
//设置public文件夹为存放静态文件的目录

//设置cookie，将会话信息存入mongodb
//可通过req.session获取当前用户的会话对象，获取用户的相关信息
app.use(session({
    secret: settings.cookieSecret,
    key: settings.db,        //cookie name
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 30}, //30天
    store: new MongoStore({
        db: settings.db,
        host: settings.host,
        port: settings.port
    }),
    resave: false,
    saveUninitialized: true
}));

//以下为 路由控制器
//app.use('/', routes);
routes(app);
app.use('/users', users);


//捕捉404错误，并转发到错误处理器
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {         //表示开发环境下
  app.use(function(err, req, res, next) {       //错误处理器
    res.status(err.status || 500);
    res.render('error', {          //将错误信息渲染error模板并显示到浏览器中
      message: err.message,
      error: err
    });
  });
}

//生产环境下的错误处理器，与上同，但不会把错误信息泄露给用户
// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});



//导出app实例供其他模块调用
module.exports = app;
