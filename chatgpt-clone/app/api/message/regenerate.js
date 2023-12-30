({
  schema: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
      },
      chatId: {
        type: 'string',
        format: 'uuid',
      },
    },
    required: ['id', 'chatId'],
  },
  async method({ id, chatId }) {
    const res = await domain.message.update(
      id,
      chatId,
      { role: lib.openai.assistantRole },
    );
    const [prompt, answer] = res.length === 1 ?
      [undefined, res[0]] :
      res;
    return {
      status: 'success',
      prompt,
      answer,
    };
  },
})