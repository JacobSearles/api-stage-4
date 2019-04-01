// This file contains your database layer
//
//@ts-check
const dbPool = require('./pool');
const fs = require('fs');

async function rebuildDatabase() {
  const createDbScript = `${__dirname}/createdb.sql`;

  const sql = fs.readFileSync(createDbScript, 'utf8');
  return dbPool.query(sql);
}

async function getUserById(userid) {
  return dbPool.query(`SELECT * FROM users WHERE id = ?`, [userid]);
}

module.exports = {
  rebuildDatabase,
  getUserById
  /* add the other functions expected by db.test.js */
};
