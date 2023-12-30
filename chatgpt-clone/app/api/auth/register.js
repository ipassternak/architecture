({
  access: 'public',
  schema: lib.validation.schemas.auth,
  method: async ({ login, password }) => {
    const account = await db.account.findUnique({ where: { login } });
    if (account) throw new Error('Account with this login already exists', 400);
    const hash = await common.hashPassword(password);
    await db.account.create({ data: { login, password: hash } });
    return { status: 'registered' };
  },
})