'use strict';

const Redis = require('ioredis');

module.exports = (options) => {
  const client = new Redis(options);
  client.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      console.error(err);
      process.exit(1);
    }
  });
  return client;
};
