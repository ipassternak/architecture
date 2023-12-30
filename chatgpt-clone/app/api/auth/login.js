({
  access: 'public',
  schema: lib.validation.schemas.auth,
  async method({ login, password }) {
    const account = await db.account.findUnique({ where: { login } });
    if (!account) throw new Error('Incorrect login or password', 400);
    const valid = await common.validatePassword(password, account.password);
    if (!valid) throw new Error('Incorrect login or password', 400);
    context.session.set('account', account);
    const { token } = context.routeOptions.config;
    return { status: 'logged in', token };
  },
})