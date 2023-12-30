({
  type: 'object',
  properties: {
    login: {
      type: 'string',
      minLength: 4,
      maxLength: 16,
    },
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 32,
    },
  },
  required: ['login', 'password'],
})