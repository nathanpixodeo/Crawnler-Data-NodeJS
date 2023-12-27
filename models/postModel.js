var db = require('../database/Dbconnection');
var mysql = require('mysql');

const checkExistRefPath = (ref_path, callback) => {
    return db.query("SELECT * FROM `news` WHERE `ref_path` LIKE " + mysql.escape(ref_path), callback);
}

const postModel = {
    addPost: function (data, callback) {
        checkExistRefPath(data.ref_path, (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(null, err);
                return;
            } else {
                if (res.length === 0) {
                    var sql_insert = 'INSERT INTO `news` (`title`, `category`, `intro`, `image`, `content`, `status`, `gender`, `year`, `use_date`, `publish_date`, `view`, `order`, `meta_keyword`, `meta_desciption`, `created_by`, `updated_by`, `created_at`, `updated_at`, `news_type_id`,`ref_path`) VALUES (' + mysql.escape(data.title) + ', ' + parseInt(data.category) + ', ' + mysql.escape(data.intro) + ', "' + data.image + '","' + mysql.escape(data.content) + '",' + parseInt(data.status) + ', null, null, null, NOW(), ' + parseInt(data.view) + ',' + parseInt(data.order) + ',"' + data.meta_keyword + '","' + data.meta_desciption + '",' + parseInt(data.created_by) + ',' + parseInt(data.updated_by) + ', NOW(),NOW(),' + parseInt(data.news_type_id) + ',' + mysql.escape(data.ref_path) + ')';
                    return db.query(sql_insert, callback(false, "Insert Successfully"));
                } else {
                    callback(true, "Record Exist");
                }
            }
        });
    },
    checkExistRefPath: checkExistRefPath
};

module.exports = postModel;
