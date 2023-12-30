async () => {
  await context.session.destroy();
  return { status: 'logged out' };
}