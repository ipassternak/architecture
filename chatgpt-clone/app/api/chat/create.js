({
  schema: {
    type: 'object',
    properties: {
      label: {
        type: 'string',
        maxLength: 50,
      },
    },
    required: ['label'],
  },
  async method({ label }) {
    const chat = await db.chat.create({
      data: {
        id: node.crypto.randomUUID(),
        label,
        model: lib.openai.model,
        accountId: context.session.get('account').id,
      },
      select: {
        id: true,
        label: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { status: 'created', chat };
  },
})