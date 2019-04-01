/**
 * Main module for API server
 */
const express = require('express');
const app = express();
const morgan = require('morgan');
if (typeof jest === 'undefined') app.use(morgan('combined'));

app.use(express.json()); // include JSON parsing middleware

// mount API routes under /api
app.use('/api', require('./api/index.js'));
module.exports = app;
