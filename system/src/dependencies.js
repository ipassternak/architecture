'use strict';

const node = {};
const tools = ['util', 'path', 'buffer', 'os', 'v8', 'vm'];
const multi = ['child_process', 'worker_threads'];
const streams = ['stream', 'fs', 'crypto', 'zlib', 'readline'];
const async = ['async_hooks', 'timers', 'timers/promises', 'events'];
const network = ['dns', 'net', 'tls', 'http', 'https', 'http2', 'dgram'];
const internals = [...tools, ...multi, ...streams, ...async, ...network];

for (const name of internals) node[name] = require(`node:${name}`);
node.process = process;
node.fsp = node.fs.promises;
node.timers.promises = node['timers/promises'];
node.cwd = process.cwd();
node.env = process.env.NODE_ENV || 'development';
Object.freeze(node);

const npm = {};
const APP_PATH = node.path.join(node.cwd, process.env['APP_PATH']);
const PACKAGE_PATH = node.path.join(APP_PATH, './package.json');
const MODULES_PATH = node.path.join(APP_PATH, './node_modules');

for (const name of Object.keys(require(PACKAGE_PATH).dependencies)) {
  try {
    npm[name] = require(node.path.join(MODULES_PATH, name));
  } catch (err) {
    /* Ignore */
  }
}

module.exports = {
  node,
  npm,
};
