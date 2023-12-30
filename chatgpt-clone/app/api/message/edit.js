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
      content: {
        type: 'string',
        maxLength: 1000,
      },
    },
    required: ['id', 'chatId', 'content'],
  },
  async method({ id, chatId, content }) {
    const [prompt, answer] = await domain.message.update(
      id,
      chatId,
      { role: lib.openai.userRole, content },
    );
    return {
      status: 'success',
      prompt,
      answer,
    };
  },
})