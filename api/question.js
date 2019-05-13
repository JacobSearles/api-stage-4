const express = require('express');
//const userdb = require('./userdb');
const { requireLogin, requireAdmin } = require('./auth');

const {
  insertNewQuestion,
  getQuestion,
  voteForQuestion,
  getUserVotesForQuestion,
  getVotesForQuestion,
  updateQuestion,
  deleteQuestion,
  listQuestions
} = require('../db/queries');

const userrouter = express.Router();

//create a new question
userrouter.post('/', requireAdmin, async (req, res) => {
  if (!req.body.question || !req.body.description || !req.body.choices) {
    return res.status(400).json({ message: 'missing field(s)' });
  }
  try {
    let question = {
      question: req.body.question,
      description: req.body.description,
      type: req.body.type
    };
    let id = await insertNewQuestion({
      ...question,
      choices: req.body.choices
    });
    return res.status(200).json({ id, message: 'question created' });
  } catch (err) {
    return res.status(500).json({ message: 'error creating question' });
  }
});

userrouter.get('/', requireLogin, async (req, res) => {
  try {
    if (req.query.page) {
      let list = await listQuestions(req.query.page, 10);
      return res.status(200).json({ list });
    } else {
      let list = await listQuestions(0, 10);
      return res.status(200).json({ list });
    }
  } catch (err) {
    return res.status(500).json({ message: 'error listing questions' });
  }
});

// update existing question
userrouter.put('/:id', requireAdmin, async (req, res) => {
  if (
    !req.body.question &&
    !req.body.description &&
    !req.body.type &&
    !req.body.choices
  ) {
    return res.status(400).json({ message: 'missing field' });
  }
  try {
    let question = await getQuestion(req.params.id);
    question.question = req.body.question
      ? req.body.question
      : question.question;
    question.description = req.body.description
      ? req.body.description
      : question.description;
    question.type = req.body.type ? req.body.type : question.type;
    if (req.body.choices) {
      let id = await updateQuestion(req.params.id, {
        ...question,
        choices: req.body.choices
      });
      return res.status(200).json({ id, message: 'question updated' });
    } else {
      let id = await updateQuestion(req.params.id, {
        ...question,
        choices: null
      });
      return res.status(200).json({ id, message: 'question updated' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'error updating question' });
  }
});

//retrieve questions content
userrouter.get('/:id', requireLogin, async (req, res) => {
  try {
    let question = await getQuestion(Number(req.params.id));
    if (!question) {
      return res.status(404).json({ message: 'question not found' });
    }
    let choiceArr = [];
    for (const choice of question.choices) {
      choiceArr.push({ description: choice.description, id: choice.id });
    }
    let ret = {
      id: question.id,
      question: question.question,
      description: question.description,
      type: question.type,
      choices: choiceArr
    };
    return res.status(200).json({ ...ret });
  } catch (err) {
    return res.status(500).json({ message: 'error retrieving question' });
  }
});

//vote on a question
userrouter.post('/:id/vote', requireLogin, async (req, res) => {
  console.log('log: ' + req.body.choice);
  try {
    if (req.body.choice) {
      await voteForQuestion(req.user.id, req.params.id, req.body.choice, true);
      return res.status(200).json({ message: 'voted' });
    } else {
      return res.status(401).json({ message: 'no choice' });
    }
  } catch (err) {
    return res.status(500).json(err);
  }
});

//get vote totals
userrouter.get('/:id/vote', requireLogin, async (req, res) => {
  if (!req.query.user) {
    //return res.status(403).json({ message: 'user not logged in' });
    try {
      let total = await getVotesForQuestion(req.params.id);
      return res.status(200).json({ totals: total });
    } catch (err) {
      return res.status(500).json(err);
    }
  }
  if (req.query.user != req.user.id && !req.user.admin) {
    return res.status(403).json({ message: 'access denied' });
  }
  try {
    let total = await getUserVotesForQuestion(req.query.user, req.params.id);
    return res.status(200).json({ votes: total });
  } catch (err) {
    return res.status(500).json(err);
  }
});

//deletes a question
userrouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    console.log('reached');
    let q = await getQuestion(Number(req.params.id));

    if (!q) {
      return res.status(404).json({ message: 'could not find question' });
    }

    await deleteQuestion(Number(req.params.id));
    return res.status(200).json({ message: 'Question Deleted' });
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = userrouter;
