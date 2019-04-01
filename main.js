const nconf = require('nconf');

nconf
  .argv()
  .env()
  .file({ file: 'config/default.json' });

// start the user REST API server
const api = require('./api');

const port = process.env.PORT || 3000;

api.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
