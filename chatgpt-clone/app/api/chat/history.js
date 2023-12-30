({
  schema: lib.validation.schemas.chatId,
  async method({ id }) {
    const history = await domain.chat.history(id);
    return { status: 'success', history };
  },
})