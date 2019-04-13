const express = require('express');
//const userdb = require('./userdb');
const { requireLogin, requireAdmin, createToken } = require('./auth');

const {
  listQuestions,
  insertNewQuestion,
  getQuestion,
  voteForQuestion,
  getUserVotesForQuestion,
  getVotesForQuestion,
  updateQuestion
} = require('../db/queries');

const userrouter = express.Router();
