var crypto = require('crypto'); //用于生成散列值来加密密码
var User = require('../models/user.js');
var Post = require('../models/post.js');
var express = require('express');
var router = express.Router();//生成一个路由实例

//捕获访问主页的GET请求
/* GET home page. */
function rou(app) {
    app.get('/', function(req, res) {
        Post.get(null, function(err, posts) {
            if(err) {
                posts = [];
            }
            res.render('index', {
                title: '主页',
                user: req.session.user,
                posts: posts,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/reg', checkNotLogin);
    app.get('/reg', function(req, res) {
        res.render('reg', {
            title: '注册',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/reg', checkNotLogin);
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
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
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
            //不存在，新增用户
            newUser.save(function(err, user) {
                if(err) {
                    req.flash('error', err);
                    return res.redirect('/reg');//失败返回注册页面
                }
            });
            req.session.user = newUser; //用户信息存入 session
            req.flash('success', '注册成功!');
            res.redirect('/'); //注册成功后返回主页
        });
    });

    app.get('/login', checkNotLogin);
    app.get('/login', function(req, res) {
        res.render('login', {
            title: '登录',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/login', checkNotLogin);
    app.post('/login', function(req, res) {
        //生成密码的md5值
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        //检查用户是否存在
        User.get(req.body.name, function(err, user) {
            if(!user) {
                req.flash('error', '用户不存在');
                return res.redirect('/login');//用户不存在则跳转到登录页
            }
            //检查密码是否一致
            if(user.password != password) {
                req.flash('error', '密码错误');
                return res.redirect('/login');//密码错误则跳转到登录页
            }
            //用户名和密码都匹配后，将用户信息存入session
            req.session.user = user;
            req.flash('success','登录成功！');
            res.redirect('/'); //登录成功后跳转到主页
        });
    });

    app.get('/post', checkLogin);
    app.get('/post', function(req, res) {
        res.render('post', {
            title: '发表',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    //提交文章
    app.post('/post', checkLogin);
    app.post('/post', function(req, res) {
        var currentUser = req.session.user;
        var post = new Post(currentUser.name, req.body.title,
                            req.body.post);
        post.save(function(err) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success','发布成功！');
            res.redirect('/');
        });
    });

    app.get('/logout', checkLogin);
    app.get('/logout', function(req, res) {
        req.session.user = null; //去掉session中的用户信息
        req.flash('success', '注销成功！');
        res.redirect('/'); //跳转到主页
    });
    //检查是否登录
    function checkLogin(req, res, next) {
        if(!req.session.user) {
            req.flash('error', '未登录！');
            res.redirect('/login');
        }
        next();
    }
    //检查是否未登录
    function checkNotLogin(req, res, next) {
        if(req.session.user) {
            req.flash('error', '已登录!');
            res.redirect('back'); //返回之前的页面
        }
        next();
    }
};

 module.exports = rou; //导出这个路由
