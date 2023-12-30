async () => {
  const chats = await db.chat.findMany({
    where: {
      accountId: context.session.get('account').id,
    },
    select: {
      id: true,
      label: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return { status: 'success', chats };
}