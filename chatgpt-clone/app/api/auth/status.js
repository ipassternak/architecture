({
  access: 'public',
  method() {
    const authorized = context.session.get(config.session.signKey);
    return {
      status: authorized ? 'logged in' : 'anonymous'
    };
  },
})