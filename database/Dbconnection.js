var mysql = require('mysql');

var connection = mysql.createPool({
    host: '172.105.120.33',
    user: 'user_licham',
    password: 'la@2022',
    database: 'db_licham'
});
module.exports = connection;
