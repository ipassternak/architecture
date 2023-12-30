({
  expires: config.cache.expires / 1000, // convert miliseconds to seconds

  calcExp() {
    return Math.floor(Date.now() / 1000) + this.expires;
  },

  async set(id, ...messages) {
    if (!messages.length) return;
    const cached = messages.map((message) => JSON.stringify(message));
    await cache
      .multi()
      .rpush(id, ...cached)
      .expire(id, this.calcExp())
      .exec();
  },

  async get(id) {
    const cached = await cache.lrange(id, 0, -1);
    if (cached.length === 0 && !await cache.exists(id)) return null;
    return cached.map((message) => JSON.parse(message));
  },

  async delete(id, count) {
    const length = await cache.llen(id);
    const keepUntil = length - count - 1;
    await cache.ltrim(id, 0, keepUntil);
  },

  async clear(id) {
    await cache.del(id);
  },
})