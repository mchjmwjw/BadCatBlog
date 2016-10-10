var mongodb = require('./db');

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
            //通过用户名、时间、标题查找文档，并把一条留言对象添加到该文档的comments数组里
            collection.update({
                'name': name,
                'time.day': day,
                'title': title
            }, {
                $push: {"comments": comment}
            }, function(err) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};
