'use strict';

module.exports = (db, options) => {
  class SessionStore {
    constructor() {
      this.cache = new Map();
    }

    get(id, cb) {
      const cached = this.cache.get(id);
      if (cached) return void cb(null, cached.session);
      db.session
        .findUnique({
          where: { id },
        })
        .then((session) => {
          if (!session || session.expires < new Date())
            return void cb(null, null);
          const data = JSON.parse(session.data);
          cb(null, {
            ...data,
            [options.signKey]: true,
          });
        })
        .catch(() => {
          cb(new Error('Internal server error'));
        });
    }

    set(id, payload, cb) {
      const session = { ...payload, [options.signKey]: true };
      const { expires } = session.cookie;
      const data = JSON.stringify(session);
      const cache = this.cache.set(id);
      this.cache.set(id, {
        session,
        timer: setTimeout(() => {
          this.cache.delete(id);
        }, options.cache),
      });
      if (cache) clearTimeout(cache.timer);
      db.session
        .upsert({
          where: { id },
          update: { data, expires },
          create: { id, data, expires },
        })
        .then(() => {
          cb(null);
        })
        .catch(() => {
          cb(new Error('Internal server error'));
        });
    }

    destroy(id, cb) {
      const cache = this.cache.get(id);
      if (cache) clearTimeout(cache.timer);
      this.cache.delete(id);
      db.session
        .delete({
          where: { id },
        })
        .then(() => {
          cb(null);
        })
        .catch(() => {});
    }
  }

  return new SessionStore();
};
