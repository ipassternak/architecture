({
  secret: common.env('SESSION_SECRET'),
  signKey: 'authorized',
  cache: 1000 * 60 * 60 * 1, // 1 day
  cookie: {
    secure: false,
    domain: 'localhost',
    maxAge: 1000 * 60 * 60 * 24 * 30, // 1 month
  },
})