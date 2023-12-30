'use strict';

const { node, npm } = require('./src/dependencies.js');
const { path, vm, cwd, env } = node;
const common = require('./src/common.js');
const loader = require('./src/loader.js');
const server = require('./src/server.js');

const sandbox = vm.createContext({ node, npm, common });

const APP = path.join(cwd, common.env('APP_PATH'), './app');
const LOG = path.join(cwd, './log');
const API = path.join(APP, './api');
const LIB = path.join(APP, './lib');
const DB = path.join(APP, './db/client');
const DOMAIN = path.join(APP, './domain');
const CONFIG = path.join(APP, './config');

const { PrismaClient } = require(DB);

(async () => {
  // Load config
  const config = await loader.loadDir(CONFIG, sandbox);

  // Prepare DI container
  const db = new PrismaClient();
  const cache = require('./src/cache.js')(config.cache);
  const console = require('./src/logger.js')({
    dir: LOG,
    ...config.logger,
    env,
  });
  Object.assign(sandbox, {
    db,
    cache,
    console,
    config,
    path: APP,
  });

  // Load application
  const lib = await loader.loadDir(LIB, sandbox);
  Object.assign(sandbox, { lib });
  const api = await loader.loadInterface(API, sandbox);
  const domain = await loader.loadDir(DOMAIN, sandbox);
  Object.assign(sandbox, { domain });

  // Create and start server
  await server(sandbox, api);
})();
