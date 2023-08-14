const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'mydatabase'
});

function getStartMySQL() {
  connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected to database!");
  });
};

function visitorsTableCreate() {
  connection.query("CREATE TABLE IF NOT EXISTS visits (id INT AUTO_INCREMENT PRIMARY KEY, ip VARCHAR(255), name VARCHAR(255), browser VARCHAR(255), os VARCHAR(255), channel VARCHAR(255), city VARCHAR(255), country VARCHAR(255), org VARCHAR(255), date TIMESTAMP DEFAULT CURRENT_TIMESTAMP)", function (err, result) {
    if (err) console.log(err);
  });
};

function insertVisitor(ip, browser, os, referer, url) {
  connection.query("SELECT ip FROM visitors WHERE ip = '" + ip + "'", function (err, result) {
    if (err) throw err;
    if (result.length > 0) {
      console.log("IP already exists");
    } else {
      connection.query("INSERT INTO visitors (ip, browser, os, referer, url) VALUES ('" + ip + "', '" + browser + "', '" + os + "', '" + referer + "', '" + url + "')", function (err, result) {
        if (err) console.log(err);
        console.log("1 record inserted");
      });
    }
  });
};
function insertVisits(ip, name, browser, os, channel, city, country, org) {
  let organization = org.startsWith(`"Uzbektelecom"`) ? `Uzbektelecom` : org;
  connection.query("INSERT INTO visits (ip, name, browser, os, channel, city, country, org) VALUES ('" + ip + "', '" + name + "', '" + browser + "', '" + os + "', '" + channel + "', '" + city + "', '" + country + "', '" + organization + "')", function (err, result) {
    if (err) throw err;
  });
};

module.exports = {
  getStartMySQL: getStartMySQL,
  visitorsTableCreate: visitorsTableCreate,
  insertVisitor: insertVisitor,
  insertVisits: insertVisits
};