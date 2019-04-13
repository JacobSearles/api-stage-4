/* Read the active configuration and export a promise that refers to the
 * current user database. */
const nconf = require('nconf');
const udb = nconf.get('userdatabase');
const userdb = require('./csvuserdatabase')(udb);

module.exports = userdb;
