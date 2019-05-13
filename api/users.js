const express = require('express');
//const userdb = require('./userdb');
const { requireLogin, requireAdmin, createToken } = require('./auth');
const nconf = require('nconf');
const {
  rebuildDatabase,
  getUserById,
  addUser,
  getUserByName,
  deleteUserById,
  getUsers,
  setAdminState,
  listUsers,
  updateUser,
  userCount
} = require('../db/queries');

const bcrypt = require('bcrypt');
const userrouter = express.Router();

// implement your endpoints here

//add user
userrouter.route('/').post(async (req, res) => {
  try {
    if (
      typeof req.body.username !== 'undefined' &&
      typeof req.body.password !== 'undefined' &&
      typeof req.body.firstname !== 'undefined' &&
      typeof req.body.lastname !== 'undefined' &&
      req.body.password !== ''
    ) {
      if ((await getUserByName(req.body.username)).length == 0) {
        let user = {
          username: req.body.username,
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          email: req.body.email,
          admin: true,
          password: await bcrypt.hash(req.body.password, 1)
        };
        if (req.body.admin === undefined) {
          user.admin = false;
        }
        let id = await addUser(user);
        delete user.password;
        user.id = id;
        return res.status(200).json({
          message: 'user created',
          token: createToken(user),
          user: user
        });
      } else {
        return res
          .status(409)
          .json({ message: 'cannot create user with same name' });
      }
    } else {
      return res.status(400).json({ message: 'missing field' });
    }
  } catch (err) {
    return res.status(400).json({ message: err });
  }
});

//retrieve a user
userrouter.get('/:id', requireLogin, async (req, res) => {
  try {
    let user = await getUserById(Number(req.params.id));
    //if (req.user.admin || id === Number(req.params.id)) {
    if (user.length > 0) {
      let currUser = user[0];
      delete currUser.password;

      return res.status(200).json({ ...currUser });
      //console.log('id: ' + userFile.getById(req.params.id));
    }
    //}
  } catch (err) {
    return res.status(404).json(err);
  }
});

//Update users
userrouter.route('/:id').put(requireLogin, async (req, res) => {
  try {
    if (!req.user.admin && req.params.id != req.user.id) {
      return res.status(403).json({ message: 'unauthorized' });
    }
    let dbuser = await getUserById(Number(req.params.id));
    if (dbuser.length > 0) {
      let user = dbuser[0];
      user.firstname = req.body.firstname ? req.body.firstname : user.firstname;
      user.lastname = req.body.lastname ? req.body.lastname : user.lastname;
      user.email = req.body.email ? req.body.email : user.email;
      user.password = req.body.password
        ? await bcrypt.hash(req.body.password, 1)
        : user.password;
      await updateUser(user.id, user);
      return res.status(200).json({ message: 'user updated' });
    } else {
      return res.status(404).json({ message: 'user not found' });
    }
  } catch (err) {
    return res.status(403).json(err);
  }
});

//delete user
userrouter.route('/:id').delete(requireLogin, async (req, res) => {
  try {
    let user = await getUserById(Number(req.params.id));

    if (user.length == 0) {
      return res.status(404).json({ message: 'user does not exist' });
    }
    if (req.user.admin || req.user.id == Number(req.params.id)) {
      await deleteUserById(Number(req.params.id));
      return res.status(200).json({ message: 'user deleted' });
    } else {
      return res.status(403).json({ message: 'not admin or user' });
    }
  } catch (err) {
    return res.status(404).json(err);
  }
});

//delete database
/*userrouter.route('/').delete(requireAdmin, async (req, res) => {
  try {
    if (req.user.admin) {
      let userList = await userdb;
      userList.clear();
      res.status(200).json({ message: 'entire user database deleted' });
    } else {
      res.status(401).json({ message: 'unauthorized' });
    }
  } catch (err) {
    res.status(404).json(err);
  }
});*/

//list users
userrouter.get('/', requireAdmin, async (req, res) => {
  try {
    if (req.query.page) {
      let list = await listUsers(req.query.page, 10);
      return res.status(200).json({ list });
    } else {
      let list = await listUsers(0, 10);
      return res.status(200).json({ list });
    }
  } catch (err) {
    return res.status(500).json({ message: 'error listing questions' });
  }
});
/*userrouter.get('/', requireAdmin, async (req, res) => {
  try {
    let dbusers = [];
    let users = [];
    let has_more = false;

    if (req.query.page) {
      dbusers = await getUsers(req.query.page);
      has_more = (Number(req.query.page) + 1) * 10 < (await userCount());
    } else {
      //has_more = false;
      dbusers = await getUsers();
    }
    for (const user of dbusers) {
      users.push({
        id: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        admin: user.admin,
        email: user.email
      });
    }
    return res.status(200).json({ users, has_more });
  } catch (err) {
    return res.status(500).json(err);
  }
});*/

class user {
  constructor() {}
}

module.exports = userrouter;
