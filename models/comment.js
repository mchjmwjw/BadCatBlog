var mongodb = require('mongodb').MongoClient;
var uri = require('./db');
var settings = require('../settings');

function Comment(name, day, title, comment) {
    this.name = name;
    this.day = day;
    this.title = title;
    this.comment = comment;
}

module.exports = Comment;

//存储一条留言信息
Comment.prototype.save = function(callback) {
    var name = this.name;
    var day = this.day;
    var title = this.title;
    var comment = this.comment;
    mongodb.connect(uri, function(err, db) {
        if(err) {
            return callback(err);
        }

          //读取posts集合
          db.collection('posts', function(err, collection) {
            if(err) {
                db.close();
                return callback(err);
            }
            //通过用户名、时间、标题查找文档，并把一条留言对象添加到该文档的comments数组里
            collection.update({
                'name': name,
                'time.day': day,
                'title': title
            }, {
                $push: {"comments": comment}
            }, function(err) {
                db.close();
                if(err) {
                    return callback(err);
                }
                callback(null);
            });
        });

    });
};
