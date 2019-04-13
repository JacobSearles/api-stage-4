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

async function getUsers() {
  return dbPool.query(`SELECT * FROM users`);
}

async function addUser(user) {
  return (await dbPool.query(`INSERT INTO users SET ?`, user)).insertId;
}

async function getUserByName(name) {
  return dbPool.query(`SELECT * FROM users WHERE username = ?`, [name]);
}

async function setAdminState(id, state) {
  return dbPool.query(`UPDATE users SET admin = ? WHERE id = ?`, [state, id]);
}

async function listUsers(offset = 0, size = 10) {
  return dbPool.query(`SELECT * FROM users ORDER BY id ASC LIMIT ?, ?`, [
    offset * size,
    size
  ]);
}

async function updateUser(id, user) {
  return dbPool.query(`UPDATE users SET ? WHERE id = ?`, [user, id]);
}

async function deleteUserById(id) {
  return dbPool.query(`DELETE FROM users WHERE id = ?`, [id]);
}

async function userCount() {
  return (await dbPool.query(`SELECT COUNT(*) as count FROM users`))[0].count;
}

async function insertNewQuestion({ choices, ...question }) {
  let id = (await dbPool.query(`INSERT INTO questions SET ?`, [question]))
    .insertId;
  let answers = [];
  for (const [index, choice] of choices.entries()) {
    answers.push([choice, id, index]);
  }
  await dbPool.query(
    `INSERT INTO answers(description, questionid, position) VALUES ?`,
    [answers]
  );
  return id;
}

async function listQuestions(offset = 0, size = 10) {
  return dbPool.query(`SELECT * FROM questions ORDER BY id ASC LIMIT ?, ?`, [
    size * offset,
    size
  ]);
}

async function getQuestion(id) {
  let q = await dbPool.query(
    `SELECT id, question, description, type FROM questions WHERE id = ?`,
    [id]
  );
  if (q.length != 0) {
    let choices = await dbPool.query(
      `SELECT * FROM answers WHERE questionid = ?`,
      [id]
    );
    return { ...q[0], choices };
  } else {
    return false;
  }
}

async function voteForQuestion(
  userid,
  questionid,
  answerchoiceid,
  deleteoldvote
) {
  if (deleteoldvote) {
    await dbPool.query(
      `DELETE FROM votes WHERE questionid = ? AND userid = ?`,
      [questionid, userid]
    );
  }
  return dbPool.query(`INSERT INTO votes SET ?`, {
    userid,
    questionid,
    answerchoiceid
  });
}

async function getUserVotesForQuestion(userid, questionid) {
  let choices = await dbPool.query(
    `SELECT answerchoiceid FROM votes WHERE questionid = ? AND userid = ?`,
    [questionid, userid]
  );
  let answerchoiceids = [];
  for (const c of choices) {
    answerchoiceids.push(c.answerchoiceid);
  }
  return answerchoiceids;
}

async function getVotesForQuestion(questionid) {
  let count = await dbPool.query(
    `SELECT answerchoiceid as choice, COUNT(*) as count FROM votes WHERE questionid = ? GROUP BY answerchoiceid`,
    [questionid]
  );
  let ret = [];
  for (const c of count) {
    ret.push({ choice: c.choice, count: c.count });
  }
  return ret;
}

async function updateQuestion(questionid, { choices, ...question }) {
  if (choices) {
    await dbPool.query(`DELETE FROM answers WHERE questionid = ?`, [
      questionid
    ]);
  }
  await dbPool.query(`UPDATE questions SET ? WHERE id = ?`, [
    question,
    questionid
  ]);
  if (choices) {
    //questionid.insertId;
    let answers = [];
    for (const [index, choice] of choices.entries()) {
      answers.push([choice, questionid, index]);
    }
    await dbPool.query(
      `INSERT INTO answers(description, questionid, position) VALUES ?`,
      [answers]
    );
  }
  return questionid;
}

async function deleteQuestion(id) {
  return dbPool.query(`DELETE FROM questions WHERE id = ?`, [id]);
}

module.exports = {
  rebuildDatabase,
  getUserById,
  addUser,
  getUsers,
  getUserByName,
  setAdminState,
  listUsers,
  updateUser,
  userCount,
  deleteUserById,
  listQuestions,
  insertNewQuestion,
  getQuestion,
  voteForQuestion,
  getUserVotesForQuestion,
  getVotesForQuestion,
  updateQuestion,
  deleteQuestion
  /* add the other functions expected by db.test.js */
};
