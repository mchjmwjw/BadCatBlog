var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, head, title, post, tags) {
    this.name  = name;
    this.head  = head;
    this.title = title;
    this.post  = post;
    this.tags  = tags;
}

module.exports = Post;

//存储一篇文章及其相关信息
Post.prototype.save = function(callback) {
    var date = new Date();

    //存储各种时间格式，方便以后扩展
    var time = {
        date:   date,
        year:   date.getFullYear(),
        month:  date.getFullYear() + "-" + (date.getMonth() + 1),
        day:    date.getFullYear() + "-" + (date.getMonth() + 1) + '-' + date.getDate(),
        minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' '
            + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };

    //要存入数据库的文档
    var post = {
        name: this.name,
        head: this.head,
        time: time,
        title: this.title,
        post: this.post,
        comments: [],
        tags: this.tags,
        pv: 0,
        reprint_info: {}
    };

    //打开数据库
    mongodb.open(function(err, db) {
        if(err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            //将文档插入posts集合
            collection.insert(post, {
                safe: true
            }, function(err) {
                mongodb.close();
                if (err) {
                    return callback(err); //失败!返回err
                }
                callback(null); //插入成功,返回err为null
            });
        });
    });
};

//读取（指定用户的）所有文章及其相关信息
Post.get = function(name, callback) {
    //打开数据库
    mongodb.open(function(err, db) {
        if(err) {
            return callback(err);
        }
        //读取post集合
        db.collection('posts', function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if(name) {
                query.name = name;
            }
            //根据query对象查询文章
            collection.find(query).sort({
                time: -1
            }).toArray(function(err, docs) {
                mongodb.close();
                if(err) {
                    return callback(err);  //失败，返回err
                }
                //解析 markdown为 html
                docs.forEach(function(doc) {
                    doc.post = markdown.toHTML(doc.post);
                });

                callback(null, docs); //成功，以数组形式返回查询的结果
            });
        });
    });
}

//在Post.get基础上分页获取文章
Post.getPaging = function(name, page, num, callback) {
    mongodb.open(function(err, db) {
        if(err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if(name) {
                query.name = name;
            }
            //使用count返回特定查询的文档数 total
            collection.count(query, function(err, total) {
                //根据query对象查询，并跳出前(page-1)*num个结果，返回之后的结果
                collection.find(query, {
                    skip: (page - 1) * num,
                    limit: num
                }).sort({
                    time: -1 //时间逆序(后->前)
                }).toArray(function(err, docs) {
                    mongodb.close();
                    if(err) {
                        return callback(err);
                    }
                    //解析markdown为html
                    docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });
                    callback(null, docs, total);
                })
            });
        });
    });
}

//读取一篇文章
Post.getOne = function(name, day, title, callback) {
    //打开数据库
    mongodb.open(function(err, db) {
        if(err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            //根据用户名、发表日期及文章名进行查询
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function(err, doc) {
                if(err) {
                    mongodb.close();
                    return callback(err);
                }
                //解析 markdown 为 html(文章和评论)
                if(doc) {
                    collection.update({
                        "name": name,
                        "time.day": day,
                        "title": title
                    }, {
                        $inc: {"pv": 1}
                    }, function(err) {
                        mongodb.close();
                        if(err) {
                            return callback(err);
                        }
                    });
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function(comment) {
                        comment.content = markdown.toHTML(comment.content);
                    });
                }

                callback(null, doc); //返回查询的一篇文章
            });
        });
    });
};

//返回原始发表的内容（markdown格式）
Post.edit = function(name, day, title, callback) {
    mongodb.open(function(err, db) {
        if(err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            //根据用户名、发表日期及文章名进行查询
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function(err, doc) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null, doc);
            });
        });
    });
};

Post.update = function(name, day, title, post, tags, callback) {
    mongodb.open(function(err, db) {
        if(err) {
            return callback(err);
        }
        db.collection("posts", function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            collection.update({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                $set: {post: post, tags: tags}
            }, function(err) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
}

Post.remove = function(name, day, title, calllback) {
    mongodb.open(function(err, db) {
        if(err) {
            return calllback(err);
        }
        db.collection('posts', function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            //查询要删除的文章
            collection.findOne({
                name: name,
                'time.day': day,
                title: title
            }, function(err, doc) {
                if(err) {
                    mongodb.close();
                    return callback(err);
                }
                //该文章是转载来的
                var reprint_from = "";
                if(doc.reprint_info.reprint_from) {
                    reprint_from = doc.reprint_info.reprint_from;
                }
                if(reprint_from != '') {
                    //更新原文章所在文档的 转出记录--reprint_to, 把转出记录中的对应数据删掉
                    collection.update({
                        name: reprint_from.name,
                        'time.day': reprint_from.day,
                        title: reprint_from.title
                    }, {
                        $pull: {
                            'reprint_info.reprint_to': {
                                name: name,
                                day: day,
                                title: title
                            }
                        }
                    }, function(err) {
                        if(err) {
                            mongodb.close();
                            return calllback(err);
                        }
                    });
                }
            });
            //根据用户名、日期和标题查找并删除一篇文章
            collection.remove({
                name: name,
                'time.day': day,
                title: title
            }, {
                w: 1
            }, function(err) {
                mongodb.close();
                if(err) {
                    return calllback(err);
                }
                calllback(null);
            });
        });
    });
};

Post.getArchive = function(callback) {
    mongodb.open(function(err, db) {
        if(err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            //返回包含name、time、title属性的文档组成的存档数组
            collection.find({}, {
                'name': 1, //表示存在name属性（字段）
                'time': 1,
                'title': 1
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

//获取所有标签
Post.getTags = function(callback) {
    mongodb.open(function(err, db) {
        if(err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            //distinct 用来找出给定键的所有不同值
            collection.distinct("tags", function(err, docs) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

//通过标签获取相关文章
Post.getTag = function(tag, callback) {
    mongodb.open(function(err, db) {
        if(err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            //查询所有tags数组内包含tag的文档
            //并返回只含有name、time、title组成的数据
            collection.find({
                "tags": tag
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

Post.search = function(keyword, callback) {
    mongodb.open(function(err, db) {
        if(err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp(keyword, 'i'); //大小写不敏感的匹配
            collection.find({
                title: pattern
            }, {
                name: 1,
                time: 1,
                title: 1
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

Post.reprint = function(reprint_from, reprint_to, callback) {
    mongodb.open(function(err, db) {
        if(err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                name: reprint_from.name,
                'time.day': reprint_from.day,
                title: reprint_from.title
            }, function(err, doc) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                var date = new Date();
                var time = {
                    date: date,
                    year: date.getFullYear(),
                    month: date.getFullYear() + "-" + (date.getMonth() + 1),
                    day: date.getFullYear() + "-" + (date.getMonth() + 1) + '-' + date.getDate(),
                    minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' +
                        date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
                };
                //删除原来的_id
                delete doc._id;
                //将转载的文章添加到自己的文章中
                doc.name = reprint_to.name;
                doc.head = reprint_to.head;
                doc.time = time;
                doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title : "[转载]" + doc.title;
                doc.comments = [];
                doc.reprint_info = {
                    reprint_from: reprint_from
                };
                doc.pv = 0;
                //更新被转载的原文档的转载信息
                collection.update({
                    name: reprint_from.name,
                    'time.day': reprint_from.day,
                    title: reprint_from.title
                }, {
                    $push: {
                        'reprint_info.reprint_to': {
                            name: doc.name,
                            day: time.day,
                            title: doc.title
                        }
                    }
                }, function(err) {
                    if (err) {
                        mongodb.close();
                        return callback(err);
                    }
                });

                //将转载后生成的副本存入数据库中，并返回存储后的文档
                collection.insert(doc, {
                    safe: true
                }, function(err, post) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    callback(err, post.ops[0]);
                });
            });
        });
    });
};
