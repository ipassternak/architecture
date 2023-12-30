'use strict';

const { fs, path, env } = require('./dependencies.js').node;
const pino = require('pino');
const MultiStream = require('./multi-stream.js');

const CUSTOM_LEVELS = {
  trace: 0,
  access: 1,
  system: 2,
  debug: 3,
  info: 4,
  log: 5,
  dir: 6,
  warn: 7,
  error: 8,
  fatal: 9,
};

const LEVEL_OFFSET = 9;
const LOG_EXT = '.log';
const STDOUT_STREAM = 'stdout';
const FILE_STREAM = 'fileStream';

const createKey = () => new Date().toISOString().substring(0, 10);

class StreamAdapter {
  #interval;
  #filePath;
  #multiStream;
  #destenations;

  constructor({ dir, writeBuffer, writeInterval, toStdout, toFile }) {
    const key = createKey();
    const stream = this.#updateFileStream(key, dir);
    const multiStream = new MultiStream({
      streams: {
        [STDOUT_STREAM]: process.stdout,
        [FILE_STREAM]: stream,
      },
      writeBuffer,
    });
    multiStream.error((err) => {
      const { name } = err;
      multiStream.end(name);
    });
    this.#multiStream = multiStream;
    this.#prepare(toStdout, toFile);
    this.#interval = setInterval(() => {
      multiStream.flush();
    }, writeInterval);
  }

  #prepare(toStdout, toFile) {
    const names = [STDOUT_STREAM, FILE_STREAM];
    const dest = [toStdout, toFile].map((value) =>
      value.map((level) => CUSTOM_LEVELS[level].toString()),
    );
    const destinations = names.map((name, index) => [name, dest[index]]);
    this.#destenations = destinations;
  }

  #updateFileStream(key, dir = path.dirname(this.#filePath)) {
    const filePath = path.join(dir, `${key}${LOG_EXT}`);
    const stream = fs.createWriteStream(filePath, { flags: 'a' });
    this.#filePath = filePath;
    return stream;
  }

  write(data) {
    const newKey = createKey();
    const currKey = path.basename(this.#filePath, LOG_EXT);
    if (currKey !== newKey) {
      const stream = this.#updateFileStream(newKey);
      this.#multiStream.reopen(FILE_STREAM, stream);
    }
    const level = data.charAt(LEVEL_OFFSET);
    for (const [name, dest] of this.#destenations) {
      if (dest.includes(level)) this.#multiStream.write(data, name);
    }
  }

  close() {
    this.#multiStream.close((_, streams) => {
      const fileStream = streams[FILE_STREAM];
      fileStream.end();
    });
    clearInterval(this.#interval);
  }
}

module.exports = (options) =>
  pino(
    {
      level: env === 'test' ? 'silent' : 'trace',
      base: undefined,
      customLevels: CUSTOM_LEVELS,
      useOnlyCustomLevels: true,
    },
    env === 'production' ? new StreamAdapter(options) : process.stdout,
  );
