'use strict';
//@ts-check
const nconf = require('nconf');

/* Make sure that config/test.json has access credentials for a database
 * you'll use for testing.  The tests will wipe this database. */
nconf
  .argv()
  .env()
  .file({ file: 'config/test.json' });

/*
 * The functions your database layer must implement.
 * We assume that these functions are kept simple - they'll just run one or
 * more queries against the database and they in most cases
 * return the promise returned from db.query.
 *
 * See getUserById as an example.
 */
const {
  rebuildDatabase,
  addUser /* { ... user } */,
  getUserById /* id */,
  getUserByName /* name */,
  setAdminState /* userid, 0/1 */,
  listUsers /* firstPage, pgSize */,
  updateUser /* id, { ...user } */,
  insertNewQuestion /* { question, description, choices, type } */,
  listQuestions /* firstPage, pgSize = Default */,
  getQuestion /* questionid */,
  deleteQuestion /* questionid */,
  updateQuestion /* questionid, { question, descr, choices, type } */,
  voteForQuestion /* userid, questionid, answerchoiceid, deleteoldvote = true */,
  getUserVotesForQuestion /* userid, questionid */,
  getVotesForQuestion /* questionid */
} = require('./queries');

beforeAll(async () => {
  /* We are wiping and recreating the database here before running the tests. */
  return rebuildDatabase();
});

function makeUser(i) {
  return {
    email: `email-${i}@example.com`,
    username: `username-${i}`,
    password: `$2$....`,
    lastname: `lastname-${i}`,
    firstname: `firstname-${i}`,
    admin: 0
  };
}

describe('Test User Management', function() {
  for (let i = 1; i <= 35; i++) {
    it(`tests that user #${i} can be added`, async () => {
      const userAdd = async i => {
        let id = await addUser(makeUser(i)); // expect AUTO_INCREMENT
        return id === i;
      };
      return expect(userAdd(i)).resolves.toBe(true);
    });
  }

  it(`tests that usernames are unique`, async () => {
    const userAdd = () =>
      addUser({ ...makeUser(1), email: `email-unique@example.com` });
    // here, and in the following tests, we assume that the error
    // object obtained from mysql is thrown by addUser.
    return expect(userAdd()).rejects.toHaveProperty('code', 'ER_DUP_ENTRY');
  });

  it(`tests that emails are unique`, async () => {
    const userAdd = () =>
      addUser({
        ...makeUser(1),
        username: `username-unique`
      });
    return expect(userAdd()).rejects.toHaveProperty('code', 'ER_DUP_ENTRY');
  });

  for (let i = 1; i <= 35; i++) {
    it(`tests that user ${i} can be retrieved by id`, async () => {
      const shouldBe = { ...makeUser(i), id: i };
      const users = await getUserById(i);
      expect(users.length).toBe(1);
      const [user] = users;
      return expect(user).toEqual(shouldBe);
    });
  }

  for (let i = 1; i <= 35; i++) {
    it(`tests that user ${i} can be retrieved by name`, async () => {
      const shouldBe = { ...makeUser(i), id: i };
      const users = await getUserByName(shouldBe.username);
      expect(users).toHaveLength(1);
      const [user] = users;
      return expect(user).toEqual(shouldBe);
    });
  }

  it(`tests that existing users can be appointed admins`, async () => {
    const res = await setAdminState(1, 1);
    expect(res).toHaveProperty('affectedRows', 1);
    expect(res).toHaveProperty('changedRows', 1);
    const user = await getUserById(1);
    expect(user).toHaveLength(1);
    expect(user[0]).toHaveProperty('admin', 1);
  });

  it(`tests that users 1-10 can be listed `, async () => {
    // note: 0, 10 does not mean 0 to 10; it means the
    // first 10 entries, sorted by id
    let res = await listUsers(0, 10);
    expect(res).toHaveLength(10);
    expect(res).toMatchObject(
      [...Array(10).keys()].map(i => {
        let { password, admin, ...rest } = makeUser(i + 1);
        return { ...rest };
      })
    );
  });

  it(`tests that users 18-24 can be listed `, async () => {
    let res = await listUsers(3, 6);
    expect(res).toHaveLength(6);
    expect(res).toMatchObject(
      [...Array(6).keys()].map(i => {
        let { password, admin, ...rest } = makeUser(i + 19);
        return { ...rest };
      })
    );
  });

  /* We expect updateUser to be implemented such that it will
   * update exactly those fields that are given.
   * Hint. You can use a single SET ? in the SQL statement, as per
   * https://www.npmjs.com/package/mysql#escaping-query-values
   */
  let partialUpdate = {
    email: 'newemail1@example.com',
    firstname: 'newfirst',
    password: '#2...'
  };

  it(`tests that user information can be updated`, async () => {
    let res = await updateUser(1, partialUpdate);
    expect(res).toHaveProperty('affectedRows', 1);
    expect(res).toHaveProperty('changedRows', 1);

    res = updateUser(2, partialUpdate); // should trigger duplicate email
    expect(res).rejects.toHaveProperty('code', 'ER_DUP_ENTRY');

    res = await updateUser(3, { password: 'newpass' });
    expect(res).toHaveProperty('affectedRows', 1);
    expect(res).toHaveProperty('changedRows', 1);

    let users = await getUserById(3);
    expect(users.length).toBe(1);
    let [user] = users;
    return expect(user).toEqual({ ...makeUser(3), id: 3, password: 'newpass' });
  });
});

let qid1, qid2;

describe('Test Survey Question Management', function() {
  const exampleQuestion1 = {
    question: "What's your favorite color?",
    description: 'Choose one',
    type: 1
  };
  const question1Choices = ['Red', 'White', 'Blue', 'Green', 'Yellow'];

  const exampleQuestion2 = {
    question: "What's your favorite food?",
    description: 'Choose only one',
    type: 1
  };
  const question2Choices = ['Hamburger', 'Cheeseburger', 'Veggieburger'];

  let qid1choices, qid2choices;

  it(`tests that a new question can be added`, async () => {
    qid1 = await insertNewQuestion({
      ...exampleQuestion1,
      choices: question1Choices
    });
    expect(qid1).toBe(1);

    qid2 = await insertNewQuestion({
      ...exampleQuestion2,
      choices: question2Choices
    });
    expect(qid2).toBe(2);
  });

  it(`tests that added questions can be listed`, async () => {
    // listQuestions also expects pageNr, pgSize - use a suitable
    // default value of pgSize.
    let result = await listQuestions(0);
    expect(result).toHaveLength(2);
    expect(result).toMatchObject([exampleQuestion1, exampleQuestion2]);
    result = await listQuestions(0, 1); // first page with size 1
    expect(result).toHaveLength(1);
    expect(result).toMatchObject([exampleQuestion1]);
  });

  it(`tests that non-existing questions are handled`, async () => {
    expect(await getQuestion(444)).not.toBeTruthy();
  });

  it(`tests that questions and their options can be found`, async () => {
    /* An example results is shown here:
     * { id: 2,
     * question: "What's your favorite food?",
     * description: 'Choose only one',
     * type: 1,
     * choices:
     *  [ { id: 6, description: 'Hamburger' },
     *    { id: 7, description: 'Cheeseburger' },
     *    { id: 8, description: 'Veggieburger' } ] }
     *
     * Note that since mySql has no concept of an array, you will not
     * be able to implement this using a single SQL query.  Instead,
     * do 2 queries and then combine the results using JavaScript.
     *
     * Be sure to use Promise.all() for parallelism.
     *
     * Choices should be sorted by their position in the survey.
     */
    let result = await getQuestion(qid2);
    expect(result).toMatchObject(exampleQuestion2);
    expect(result).toHaveProperty('choices');
    expect(result.choices).toMatchObject(
      question2Choices.map(choice => ({
        description: choice
      }))
    );
    result.choices.forEach(choice => expect(choice).toHaveProperty('id'));
    qid2choices = result.choices;

    result = await getQuestion(qid1);
    expect(result).toMatchObject(exampleQuestion1);
    expect(result).toHaveProperty('choices');
    qid1choices = result.choices;
  });

  // Hint: To implement this, use a foreign key constraint
  it(`tests that votes are valid for a given question`, async () => {
    let res = voteForQuestion(1, qid2, qid1choices[0].id, true);
    return expect(res).rejects.toBeDefined();
  });

  it(`tests that users can vote`, async () => {
    let res = voteForQuestion(1, qid2, qid2choices[1].id, true);
    return expect(res).resolves.toHaveProperty('affectedRows', 1);
  });

  it(`tests that users can change their vote`, async () => {
    let res = await voteForQuestion(1, qid1, qid1choices[1].id, true);
    expect(res).toHaveProperty('affectedRows', 1);

    res = voteForQuestion(1, qid1, qid1choices[0].id, true);
    return expect(res).resolves.toHaveProperty('affectedRows', 1);
  });

  it(`tests that a users can see their votes`, async () => {
    let res = await getUserVotesForQuestion(1, qid1);
    expect(res).toEqual([qid1choices[0].id]);

    res = await getUserVotesForQuestion(1, qid2);
    expect(res).toEqual([qid2choices[1].id]);
  });

  it(`tests that votes can be totaled`, async () => {
    let votes = [];
    for (let user = 1; user <= 35; user++) {
      votes.push(
        voteForQuestion(
          user,
          qid1,
          qid1choices[user % qid1choices.length].id,
          true
        )
      );
    }
    let v = await Promise.all(votes);
    expect(v).toHaveLength(votes.length);

    return expect(getVotesForQuestion(qid1)).resolves.toEqual(
      qid1choices.map(q => ({
        choice: q.id,
        count: 7
      }))
    );
  });
});

describe('Test Survey Question Management, Part 2', function() {
  const exampleQuestion1 = {
    question: "What's your favorite color?",
    description: 'Choose new one.  Now with expanded choices.',
    type: 1
  };
  const question1Choices = ['Red', 'White', 'Blue', 'Green', 'Yellow', 'Pink'];

  it(`tests that questions can be updated`, async () => {
    let res = await updateQuestion(qid1, {
      ...exampleQuestion1,
      choices: question1Choices
    });
    expect(res).toBe(qid1);
    // when a question is updated, all votes for it should be cleared
    await expect(getVotesForQuestion(qid1)).resolves.toEqual([]);

    res = await getQuestion(qid1);
    expect(res).toMatchObject(exampleQuestion1);
    expect(res).toHaveProperty('choices');
    expect(res.choices).toMatchObject(
      question1Choices.map(choice => ({
        description: choice
      }))
    );
    res.choices.forEach(choice => expect(choice).toHaveProperty('id'));
  });
});

afterAll(async () => {
  const dbPool = require('./pool');
  return dbPool.end();
});
