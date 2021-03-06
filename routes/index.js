var crypto = require('crypto'); //用于生成散列值来加密密码
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comment.js');
var express = require('express');
var router = express.Router();//生成一个路由实例
var multer = require('multer');//实现文件上传功能

//捕获访问主页的GET请求
/* GET home page. */
function rou(app) {
    app.get('/', function(req, res) {
        //判断是否是第一页，并把请求的页数转换成number类型
        var page = parseInt(req.query.p) || 1;  // ?p=2
        var num = 3; //每页显示数量
        Post.getPaging(null, page, num, function(err, posts, total) {
            if(err) {
                posts = [];
            }
            res.render('index', {
                title: '主页',
                user: req.session.user,
                posts: posts,
                success: req.flash('success').toString(),
                error: req.flash('error').toString(),
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * num + posts.length) == total
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
                req.session.user = user;
                req.flash('success', '注册成功!');
                res.redirect('/'); //注册成功后返回主页
            });
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


    //提交文章
    app.get('/post', checkLogin);
    app.get('/post', function(req, res) {
        res.render('post', {
            title: '发表',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/post', checkLogin);
    app.post('/post', function(req, res) {
        var currentUser = req.session.user;
        var tags = [req.body.tag1, req.body.tag2, req.body.tag3];
        var post = new Post(currentUser.name, currentUser.head, req.body.title,
                            req.body.post, tags);
        post.save(function(err) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success','发布成功！');
            res.redirect('/');
        });
    });


    //注销
    app.get('/logout', checkLogin);
    app.get('/logout', function(req, res) {
        req.session.user = null; //去掉session中的用户信息
        req.flash('success', '注销成功！');
        res.redirect('/'); //跳转到主页
    });

    //存档
    app.get('/archive',function(req, res) {
        Post.getArchive(function(err, posts) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('archive', {
                title: '存档',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    //标签页
    app.get('/tags', function(req, res) {
        Post.getTags(function(err, posts) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tags', {
                title: '标签',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    //通过标签获取相应的文章
    app.get('/tags/:tag', function(req, res) {
        Post.getTag(req.params.tag, function(err, posts) {
            if(err) {
                req.flash(err);
                return res.redirect('/');
            }
            res.render('tag', {
                title: 'TAG:' + req.params.tag,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    //搜索
    app.get('/search', function(req, res) {
        Post.search(req.query.keyword, function(err, posts) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('search', {
                title: 'SEARCH:' + req.query.keyword,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    //友情链接
    app.get('/links', function(req, res) {
        res.render('links', {
            title: '友情链接',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    //设置文件上传的地址，以及存储的文件名
    var storage = multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, './public/images');
        },
        filename: function(req, file, cb) {
            cb(null, file.originalname);
        }
    });
    //调用中间件
    var upload = multer({
        storage: storage
    });
    //文件上传
    app.get('/upload', checkLogin);
    app.get('/upload',function(req, res) {
        res.render('upload',{
            title: '文件上传',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/upload', checkLogin);
    //array表示可同时上传多个文件，5表示最多上传5个文件
    app.post('/upload', upload.array('field1', 5), function(req, res) {
        req.flash('success', '文件上传成功！');
        res.redirect('/upload');
    });

    //单独用户页面
    app.get('/u/:name', function(req, res) {
        //检查用户是否存在
        User.get(req.params.name, function(err, user) {
            if(!user) {
                req.flash('error', '用户不存在！');
                return res.redirect('/'); //用户不存在则跳转到主页
            }
            var page = parseInt(req.query.p) || 1;
            var num = 1;
            //查询并返回该用户的所有文章
            Post.getPaging(user.name, page, num, function(err, posts, total) {
                if(err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    posts: posts,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString(),
                    page: page,
                    isFirstPage: (page - 1) * num == 0,
                    isLastPage: ((page - 1) * num + posts.length) == total
                });
            });
        });
    });

    //单独文章页面
    app.get('/u/:name/:day/:title', function(req, res) {
        Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('article', {
                title: req.params.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    //评论
    app.post('/u/:name/:day/:title', function(req, res) {
        var date = new Date();
        var time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' '
            + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var md5 = crypto.createHash('md5');
        var email_md5 = md5.update(req.body.email.toLowerCase()).digest('hex');
        var head = "http://www.gravatar.com/avatar/" + email_md5 + "?s=48";
        var comment = {
            name: req.body.name,
            head: head,
            email: req.body.email,
            website: req.body.website,
            time: time,
            content: req.body.content
        };
        var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
        newComment.save(function(err) {
            if(err) {
                req.flsh('error', error);
                return res.redirect('back'); //失败也返回到文章页
            }
            req.flash('success','留言成功');
            res.redirect('back'); //留言成功，返回到文章页
        });
    });

    //编辑文章页面
    app.get('/edit/:name/:day/:title', checkLogin);
    app.get('/edit/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user;
        Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post) {
            if(err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            res.render('edit', {
                title: '编辑',
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.post('/edit/:name/:day/:title', checkLogin);
    app.post('/edit/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user;
        var tags = [req.body.tag1, req.body.tag2, req.body.tag3];
        Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, tags, function(err) {
            var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' +req.params.title);
            if(err) {
                req.flash('error', err);
                return res.redirect(url); //出错！返回文章页
            }
            req.flash('success', '修改成功！');
            res.redirect(url); //成功，返回文章页
        });
    });

    //删除文章
    app.get('/remove/:name/:day/:title', checkLogin);
    app.get('/remove/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user;
        Post.remove(currentUser.name, req.params.day, req.params.title, function(err) {
            if(err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '删除成功！');
            res.redirect('/');
        });
    });

    //转载文章
    app.get('/reprint/:name/:day/:title', checkLogin);
    app.get('/reprint/:name/:day/:title', function(req, res) {
        //修改被转载文章的转载信息
        Post.edit(req.params.name, req.params.day, req.params.title, function(err, post) {
            if(err) {
                req.flash("error", err);
                return res.redirect('back');
            }
            var currentUser = req.session.user;
            var reprint_from = {
                name : post.name,
                day  : post.time.day,
                title: post.title
            };
            var reprint_to = {
                name: currentUser.name,
                head: currentUser.head
            };
            Post.reprint(reprint_from, reprint_to, function(err, post) {
                if(err) {
                    req.flash("error", err);
                    return res.redirect('back');
                }
                req.flash('success', "转载成功！");
                var url = encodeURI('/u/' + post.name + '/' + post.time.day + '/' + post.title);
                //跳转到转载后的文章页面
                res.redirect(url);
            });
        });
    });

    //路径错误，跳转404
    app.use(function(req, res) {
        res.render('404');
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
