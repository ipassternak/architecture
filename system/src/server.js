'use strict';

const Ajv = require('ajv');
const ajv = new Ajv({
  coerceTypes: 'array',
  useDefaults: true,
  removeAdditional: true,
  uriResolver: require('fast-uri'),
  addUsedSchema: false,
  allErrors: false,
});

class RegularError extends Error {
  constructor(message, statusCode, { pass = false } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.pass = pass;
  }
}

module.exports = async (application, routing) => {
  const { console, config, node } = application;
  Object.assign(application, { Error: RegularError });

  const fastify = require('fastify')({ logger: console });
  await fastify.register(require('@fastify/cors'), {
    ...config.server.cors,
  });
  await fastify.register(require('@fastify/cookie'));
  await fastify.register(require('@fastify/session'), {
    ...config.session,
    rolling: false,
    saveUninitialized: false,
    store: require('./session.js')(application.db, config.session),
    idGenerator: (req) => {
      const token = application.common.generateToken();
      req.routeOptions.config.token = token;
      return token;
    },
  });

  // Error handling
  const formatError = (error) => {
    const { message, statusCode = 500 } = error;
    const packet = {
      status: node.http.STATUS_CODES[statusCode],
      statusCode,
    };
    if (error.pass || statusCode < 500 || statusCode > 599)
      packet.error = message;
    else console.error(error);
    return packet;
  };

  fastify.setErrorHandler((err, _, res) => {
    res
      .code(err.statusCode || 500)
      .type('application/json')
      .send(formatError(err));
  });

  // RPC serving
  const rpc = async (iface, req, args = req.body) => {
    const method = iface(req);
    const proc = typeof method === 'function' ? { method } : method;
    if (!req.session[config.session.signKey] && proc.access !== 'public')
      throw new RegularError('Method access restricted', 403);
    if (proc.schema && !ajv.validate(proc.schema, args))
      throw new RegularError(ajv.errorsText(), 400);
    const data = await proc.method(args);
    return { data };
  };

  // Register HTTP routing for the API
  await fastify.register(
    async (instance) => {
      for (const [url, iface] of routing.entries()) {
        instance.route({
          method: 'POST',
          url,
          handler: async (req) => await rpc(iface, req),
        });
      }
      instance.setNotFoundHandler((req, res) =>
        res
          .code(404)
          .type('application/json')
          .send({
            msg: `${req.method}:${req.url} not found`,
            error: 'Not Found',
            statusCode: res.statusCode,
          }),
      );
    },
    { prefix: config.server.prefix },
  );

  // Register route for HTTP upgrate to WebSocket
  await fastify.register(require('@fastify/websocket'));
  await fastify.register(async (instance) => {
    instance.get(
      '/ws',
      {
        websocket: true,
        binary: false,
      },
      (connection, req) => {
        connection.socket.on('message', async (message) => {
          try {
            const packet = JSON.parse(message);
            const { method, args } = packet;
            if (!method)
              throw new RegularError('Invalid packet structure', 400);
            const route = method.substring(config.server.prefix.length);
            const iface = routing.get(route);
            if (!iface)
              throw new RegularError(`Method ${method} not found`, 404);
            const data = await rpc(iface, req, args);
            connection.socket.send(JSON.stringify(data));
          } catch (err) {
            const packet = formatError(err);
            connection.socket.send(JSON.stringify(packet));
          }
        });
      },
    );
  });

  // Register static routing
  if (config.server.static) {
    await fastify.register(async (instance) => {
      instance.register(require('@fastify/static'), {
        root: node.path.join(application.path, config.server.static),
        wildcard: false,
      });
      instance.setNotFoundHandler((_, res) =>
        res.code(404).type('text/html').sendFile('404.html'),
      );
    });
  }

  // Start the server
  const { ports, host } = config.server;
  const [port] = ports;
  fastify.listen({ port, hostname: host });

  // Graceful shutdown
  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
      setTimeout(() => {
        console.error('Process took too long to exit. Exiting forcefully');
        process.exit(1);
      }, config.server.timeouts.shutdown);
      fastify.close(() => {
        console.log('Server closed. Exiting process');
        process.exit(0);
      });
    });
  });
};
