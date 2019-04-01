'use strict';
//@ts-check
/* Unit tests for API stage 4 */
/* Additional tests with shorter token expiration. */
const nconf = require('nconf');
nconf
  .overrides({
    jwtsecret: 'test sauce 2',
    jwtexpirationtime: '1s',
    bcryptsaltrounds: 6
  })
  .argv()
  .env()
  .file({ file: 'config/test.json' });

const bcrypt = require('bcrypt');

const {
  rebuildDatabase,
  addUser /* { ... user } */,
  setAdminState /* userid, 0/1 */
} = require('../db/queries');

// now that nconf defaults are set, we can require api which will use nconf defaults.
let api;

const request = require('supertest');

const adminData = {
  username: 'admin',
  firstname: 'The',
  lastname: 'Admin',
  email: 'admin@admin.co',
  admin: 1
};

describe('Test User Database Deletion', function() {
  it('tests that the user database file can be reset', async () => {
    await rebuildDatabase();
    const adminId = await addUser({
      ...adminData,
      password: await bcrypt.hash('adminpassword', 12)
    });
    await setAdminState(adminId, 1);

    api = require('../api'); // let api see the new user file
  });
});

describe('Test User Creation', function() {
  it(`tests that empty password is rejected`, async () => {
    const res = await request(api)
      .post('/api/users')
      .send({ username: 'bla', password: '' }) // should disallow empty password
      .expect(400);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message.length).toBeGreaterThan(8);
  });

  /* It's probably safer to reject requests with extra properties */
  it(`tests that extra stuff password is rejected`, async () => {
    const res = await request(api)
      .post('/api/users')
      .send({
        username: 'bla',
        extrastuff: 'xyz',
        password: '',
        lastname: 'Bueller',
        firstname: 'Ferris'
      })
      .expect(res => res.status - (res.status % 100) === 400);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message.length).toBeGreaterThan(8);
  });
});

describe('Test Token Expiration', function() {
  let admintoken;

  it('that I can log on as administrator', async () => {
    let res = await request(api)
      .post(`/api/login`)
      .send({ username: 'admin', password: 'adminpassword' })
      .expect(200);
    expect(res.body).toHaveProperty('token');
    admintoken = res.body.token;
  });

  it('tests that an admin can list users', async () => {
    let res = await request(api)
      .get(`/api/users`)
      .set('Authorization', `Bearer ${admintoken}`)
      .expect(200);
    const { users: rusers, has_more } = res.body;
    expect(has_more).not.toBeTruthy();
    expect(rusers).toContainEqual({ ...adminData, id: 1 });
  });

  it('tests that admin token has expired', done => {
    setTimeout(() => {
      request(api)
        .get(`/api/users`)
        .set('Authorization', `Bearer ${admintoken}`)
        .expect(401, done);
    }, 1000);
  });
});

afterAll(async () => {
  const dbPool = require('../db/pool');
  return dbPool.end();
});
