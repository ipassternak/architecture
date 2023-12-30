({
  operations: {
    [lib.openai.userRole]: 'Editing',
    [lib.openai.assistantRole]: 'Regeneration',
  },

  async insert(chatId, record) {
    try {
      return await db.message.create({
        data: {
          chatId,
          ...record
        },
        select: {
          id: true,
          content: true,
          role: true,
        },
      });
    } catch (err) {
      throw new Error(
        'Prompt cannot be created because the chat does not exist',
        400
      );
    }
  },

  async create(chatId, content, insertRequest = true) {
    const conversation = await domain.chat.history(
      chatId,
      { excludeId: true },
    );
    const tuple = [];
    const [prompt, answer] = await lib.openai.prompt(content, conversation);
    if (insertRequest) {
      const req = await this.insert(chatId, prompt);
      tuple.push(req);
    }
    const res = await this.insert(chatId, answer);
    tuple.push(res);
    await lib.cache.chat.set(chatId, ...tuple);
    return tuple;
  },

  async read(id, chatId) {
    const message = await db.message.findUnique({
      where: { id, chatId },
    });
    if (!message) throw new Error('Message not found', 404);
    return message;
  },

  async update(id, chatId, { role, content }) {
    const message = await this.read(id, chatId);
    const operation = this.operations[role];
    if (message.role !== role)
      throw new Error(
        `${operation} cannot be performed on this message`,
        400
      );
    await this.delete(id, chatId);
    const editing = operation === this.operations[lib.openai.userRole];
    const action = editing ?
      this.create(chatId, content) :
      this.create(chatId, message.content, false);
    return await action;
  },

  async delete(id, chatId) {
    const res = await db.message.deleteMany({
      where: {
        chatId,
        id: { gte: id },
      },
    });
    const { count } = res;
    console.log(`Count: ${count}`);
    if (count) await lib.cache.chat.delete(chatId, count);
  },
})