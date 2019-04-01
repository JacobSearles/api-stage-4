//@ts-check
const nconf = require('nconf');
const mysql = require('mysql');
const { promisify } = require('util');
const pool = mysql.createPool(nconf.get('dbinfo'));

/* Create a connection pool and return promisified 
 * versions of 'query', 'getConnection', and 'end' 
 */
module.exports = {
  query: promisify(pool.query).bind(pool),
  getConnection: promisify(pool.getConnection).bind(pool),
  end: promisify(pool.end).bind(pool)
};
