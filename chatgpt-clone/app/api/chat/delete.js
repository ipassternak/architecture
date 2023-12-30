({
  schema: lib.validation.schemas.chatId,
  async method({ id }) {
    try {
      await db.chat.delete({
        where: {
          id,
          accountId: context.session.get('account').id,
        },
      });
      await lib.cache.chat.clear(id);
    } catch (err) {
      throw new Error('Chat does not exist or cannot be deleted', 400);
    }
    return { status: 'deleted' };
  },
})