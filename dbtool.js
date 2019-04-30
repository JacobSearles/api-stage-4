const nconf = require('nconf');

nconf
  .argv()
  .env()
  .file({ file: 'config/default.json' })
  .overrides({
    dbinfo: {
      multipleStatements: true
    }
  });

const db = require('./db/queries');
const path = require('path');
const bcrypt = require('bcrypt');
const argv = require('minimist')(process.argv.slice(2));
const { promisify } = require('util');
var sprintf = require('sprintf-js').sprintf;
const dbPool = require('./db/pool');
const axios = require('axios');
const fs = require('fs');

async function listUsers() {
  console.log(sprintf('%3s | %10s | %5s', 'id', 'username', 'admin'));
  console.log(sprintf('%3s-+-%10s-+-%5s', '---', '----------', '-----'));
  const pgSize = 10;
  for (let page = 0; ; page++) {
    const users = await db.listUsers(page, pgSize);
    for (let user of users) {
      console.log(
        sprintf('%3d | %10s | %5d', user.id, user.username, user.admin)
      );
    }
    if (users.length < pgSize) break;
  }
}

async function changeAdminStatus(who, how) {
  try {
    const [user] = await db.getUserByName(who);
    return db.setAdminState(user.id, how);
  } catch (err) {
    console.error(err);
  }
}

async function clearDatabase(adminPassword) {
  await db.rebuildDatabase();
  console.log(`setting admin password to ${adminPassword}`);
  return db.addUser({
    username: 'admin',
    password: bcrypt.hashSync(adminPassword, 12),
    firstname: 'The',
    lastname: 'Administrator',
    admin: 1,
    email: 'admin@gmail.com'
  });
}

async function populateDatabase(adminPassword) {
  const baseUrl = 'http://localhost:3001/api';
  let adminToken;

  try {
    let req = await axios.post(`${baseUrl}/login`, {
      username: 'admin',
      password: adminPassword
    });
    adminToken = req.data.token;
    // axios.defaults.headers.common['Authorization'] = `Bearer ${req.data.token}`;
  } catch (err) {
    console.error(err.response.data.message);
    return;
  }

  let users = await promisify(fs.readFile)('users.txt', 'utf8');
  users = users
    .trim()
    .split('\n')
    .map(fullname => {
      let [firstname, lastname] = fullname.trim().split(/\s+/);
      return {
        username: firstname.toLowerCase().charAt(0) + lastname.toLowerCase(),
        password: lastname
          .split('')
          .reverse()
          .join(''),
        firstname,
        lastname,
        email: `${firstname.toLowerCase()}@${firstname.toLowerCase()}.com`
      };
    });
  for (let user of users) {
    console.log(sprintf('%15s %15s', user.username, user.password));
  }

  let user2Token = {};
  allUsersSignUp = users.map(async user => {
    const res = await axios.post(`${baseUrl}/users`, { ...user });
    user2Token[user.username] = res.data.token;
  });

  const questions = [
    {
      question: "What's your favorite color?",
      choices: ['Red', 'White', 'Blue', 'Green', 'Yellow']
    },
    {
      question: "What's your favorite language?",
      choices: ['English', 'Spanish', 'French', 'Japanese', 'Vulcan']
    },
    {
      question: "What's your favorite programming language?",
      choices: ['JavaScript', 'Java', 'C++', 'Python', 'C', 'Ruby', 'R']
    },
    {
      question: "What's your favorite month?",
      choices: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ]
    },
    {
      question: "What's your favorite food?",
      choices: ['Hamburger', 'Cheeseburger', 'Pizza', 'French Fries', 'Salad']
    },
    {
      question: 'What types of movies do you like to watch?',
      choices: ['Adventure', 'Thriller', 'Drama', 'Comedy', 'RomComs']
    },
    {
      question: 'Who is your favorite Superhero?',
      choices: [
        'Superman',
        'Wonder Woman',
        'Asterix',
        'Black Panther',
        'Captain America',
        'Catwoman'
      ]
    },
    {
      question: 'What is your favorite maxflow algorithm?',
      choices: [
        'Dinic',
        'Ford-Fulkerson',
        'Edmonds-Karp',
        'Ahuja-Orlin ISAP',
        "Goldberg's Push-Relabel"
      ]
    },
    {
      question: 'What is your favorite greek letter?',
      choices: ['Alpha', 'Beta', 'Gamma', 'Theta', 'Omega']
    },
    {
      question: 'What is your favorite SQL query?',
      choices: ['SELECT', 'DELETE', 'UPDATE', 'INSERT']
    },
    {
      question: 'What is your favorite operation on sets?',
      choices: ['Union', 'Intersection', 'Difference', 'Symmetric Difference']
    },
    {
      question: 'What is your favorite complex number?',
      choices: ['0', '1', 'e', '\u03c0', 'i']
    },
    {
      question: 'What is your favorite shortest path algorithm?',
      choices: ['Dijkstra', 'Bellmann-Ford', 'Floyd-Warshall']
    },
    {
      question: 'What is your favorite season?',
      choices: ['Winter', 'Spring', 'Summer', 'Fall']
    },
    {
      question: 'What is your favorite continent?',
      choices: [
        'North America',
        'South America',
        'Europe',
        'Asia',
        'Africa',
        'Australia',
        'Antarctica'
      ]
    },
    {
      question: 'What is your favorite black hole?',
      choices: [
        'TON 618',
        'IC 1101',
        'S5 0014+81',
        'SDSS J102325.31+514251.0',
        'NGC 6166'
      ]
    },
    {
      question: "What's your favorite TV show?",
      choices: ['Game of Thrones', 'Silicon Valley', 'The Big Bang Theory']
    }
  ];

  const sampleQuestions = questions.map(q =>
    axios({
      method: 'POST',
      url: `${baseUrl}/question`,
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        question: q.question,
        choices: q.choices,
        description: 'Please choose one.',
        type: 1
      }
    })
  );

  let getQuestions = (await Promise.all(sampleQuestions)).map((r, i) => {
    let id = r.data.id;
    questions[i].id = id;
    return axios.get(`${baseUrl}/question/${id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  });

  // wait for all users to sign up
  await Promise.all(allUsersSignUp);

  let qid2Choices = {};
  // wait for all questions to have been created
  (await Promise.all(getQuestions)).forEach(q => {
    qid2Choices[q.data.id] = q.data.choices;
  });

  let rand = n => Math.floor(Math.random() * n);

  // console.log(qid2Choices);
  /* Now everybody votes in parallel! */
  const votes = [];
  for (let user of users) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qchoices = qid2Choices[q.id];
      votes.push(
        axios({
          method: 'POST',
          url: `${baseUrl}/question/${q.id}/vote`,
          headers: { Authorization: `Bearer ${user2Token[user.username]}` },
          data: {
            choice: qchoices[rand(qchoices.length)].id
          }
        })
      );
    }
  }
  return Promise.all(votes);
}

function usage() {
  console.log(`Usage: node ${path.basename(__filename)}
      [-l]                   list all users
      [-a <user>]            make <user> admin
      [-d <user>]            demote <user> to non-admin
      [-x <adminpassword>]   rebuild database and add admin user with password
      [-p <adminpassword>]   connect to existing server at http://localhost:3001/
                             and populate the database.
      `);
}

async function doIt(argv) {
  for (let k in argv) {
    switch (k) {
      case 'x':
        await clearDatabase(argv[k]);
        break;
      case 'p': // populate database
        await populateDatabase(argv[k]);
        break;
      case 'l':
        await listUsers();
        break;
      case 'a':
        await changeAdminStatus(argv.a, 1);
        break;
      case 'd':
        await changeAdminStatus(argv.d, 0);
        break;
      case 'h':
        usage();
        break;
    }
  }
  dbPool.end();
}

try {
  doIt(argv);
} catch (exc) {
  console.error(exc);
}
