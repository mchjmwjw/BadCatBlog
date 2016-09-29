var crypto = require('crypto'), //用于生成散列值来加密密码
    User = require('../models/user.js');
var express = require('express');
var router = express.Router();//生成一个路由实例

//捕获访问主页的GET请求
/* GET home page. */
function rou(app) {
    app.get('/', function(req, res, next) {
        res.render('index', { title: '主页' });
    });

    app.get('/reg', function(req, res) {
        res.render('reg', { title: '注册' });
    });

    app.post('/reg', function(req, res) {
        //res.send("你好");
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'],
            email = req.body.email;

        //检验用户两次输入的密码是否一致
        if(password_re != password) {
            req.flash('error', '两次输入的密码不一致!');
            return res.redirect('/reg'); //返回注册页
        }
        //生成密码的md5值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: name,
            password: password,
            email: email
        });
        //检查用户是否已经存在
        User.get(newUser.name, function(err, user) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            if(user) {          //已经存在
                req.flash("error", err);
                return res.redirect('/reg'); //注册失败返回注册页
            }
            req.session.user = newUser; //用户信息存入 session
            req.flash('success', '注册成功!');
            res.redirect('/'); //注册成功后返回主页
        });
    });

    app.get('/login', function(req, res) {
        res.render('login', { title: '登录' });
    });

    app.post('/login', function(req, res) {

    });

    app.get('/post', function(req, res) {
        res.render('post', { title: '发表' });
    });

    app.post('/post', function(req, res) {

    });

    app.get('/logout', function(req, res) {

    });
}

 module.exports = rou; //导出这个路由
