({
  schema: {
    type: 'object',
    propeties: {
      chatId: {
        type: 'string',
        format: 'uuid',
      },
      content: {
        type: 'string',
        maxLength: 1000,
      },
    },
    required: ['chatId', 'content'],
  },
  async method({ chatId, content }) {
    const [prompt, answer] = await domain.message.create(chatId, content);
    return {
      status: 'success',
      prompt,
      answer,
    };
  },
})