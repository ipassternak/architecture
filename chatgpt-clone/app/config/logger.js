({
  writeBuffer: 1024 * 4, // 4kb
  writeInterval: 1000 * 3, // 3 seconds
  toStdout: ['info', 'dir', 'log', 'warn', 'error', 'fatal'],
  toFile: ['info', 'dir', 'log', 'warn', 'error', 'fatal'],
})