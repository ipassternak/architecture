({
  async fetchHistory(chatId, { limit, offset } = {}) {
    const history = await db.message.findMany({
      where: { chatId },
      orderBy: { id: 'asc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        content: true,
        role: true,
      },
    });
    if (history.length === 0) {
      const chat = await db.chat.findUnique({ where: { id: chatId } });
      if (!chat) throw new Error('Chat not found', 404);
    };
    return history;
  },

  excludeId(messages) {
    return messages.map(({ content, role }) => ({
      content,
      role,
    }));
  },

  async history(id, { excludeId = false, ...opts } = {}) {
    const cached = await lib.cache.chat.get(id);
    if (cached) return excludeId ? this.excludeId(cached) : cached;
    const messages = await this.fetchHistory(id, opts);
    await lib.cache.chat.set(id, ...messages);
    return excludeId ? this.excludeId(messages) : messages;
  },
})