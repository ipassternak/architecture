const transport = {};

transport.http = (url) => (structure) => {
  const api = {};
  const services = Object.keys(structure);
  for (const name of services) {
    api[name] = {};
    const service = structure[name];
    const methods = Object.keys(service);
    for (const method of methods) {
      const keys = service[method];
      api[name][method] = (...args) =>
        new Promise((resolve, reject) => {
          const req = { method: 'POST' };
          if (keys.length > 0) {
            const body = Object.fromEntries(
              keys.map((key, i) => [key, args[i]])
            );
            Object.assign(req, {
              body: JSON.stringify(body),
              headers: { 'Content-Type': 'application/json' },
            });
          }
          fetch(`${url}/api/${name}/${method}`, req).then((res) => {
            if (res.status === 200) resolve(res.json());
            else reject(new Error(`Status Code: ${res.status}`));
          });
        });
    }
  }
  return Promise.resolve(api);
};

transport.ws = (url) => (structure) => {
  const socket = new WebSocket(url);
  const api = {};
  const services = Object.keys(structure);
  for (const name of services) {
    api[name] = {};
    const service = structure[name];
    const methods = Object.keys(service);
    for (const method of methods) {
      const keys = service[method];
      api[name][method] = (...args) =>
        new Promise((resolve) => {
          const packet = {
            method: `/api/${name}/${method}`,
            args: Object.fromEntries(keys.map((key, i) => [key, args[i]])),
          };
          socket.send(JSON.stringify(packet));
          console.log(packet);
          socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            resolve(data);
          };
        });
    }
  }
  return new Promise((resolve) => {
    socket.addEventListener('open', () => resolve(api));
  });
};

const scaffold = (url) => {
  const protocol = url.startsWith('ws:') ? 'ws' : 'http';
  return transport[protocol](url);
};

(async () => {
  const api = {};
  const http = await scaffold('http://localhost:8000')({
    auth: {
      login: ['login', 'password'],
      logout: [],
      register: ['login', 'password'],
      status: [],
    },
  });
  const ws = await scaffold('ws://localhost:8000/ws')({
    chat: {
      create: ['label'],
      delete: ['id'],
      history: ['id'],
      list: [],
      rename: ['id', 'label'],
    },
    message: {
      edit: ['id', 'chatId', 'content'],
      prompt: ['chatId', 'content'],
      regenerate: ['id', 'chatId'],
    },
  });
  Object.assign(api, http, ws);
  window.api = api;
})();
