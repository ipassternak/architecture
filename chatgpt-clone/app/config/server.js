({
  host: '127.0.0.1',
  ports: [8000],
  static: './public',
  prefix: '/api',
  timeouts: {
    shutdown: 5 * 1000, // 5 seconds
  },
  cors: {
    origin: '*',
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  },
})