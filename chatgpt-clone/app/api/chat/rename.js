({
  schema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
      label: {
        type: 'string',
        maxLength: 50,
      },
    },
    required: ['id', 'label'],
  },
  async method({ id, label }) {
    try {
      const chat = await db.chat.update({
        where: {
          id,
          accountId: context.session.get('account').id,
        },
        data: { label },
        select: {
          id: true,
          label: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return { status: 'renamed', chat };
    } catch (err) {
      throw new Error('Chat does not exist or cannot be renamed', 400);
    }
  },
})