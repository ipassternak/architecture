'use strict';

const { events } = require('./dependencies.js').node;
const { EventEmitter, setMaxListeners } = events;

const MAX_QUEUE = 30;
const UNLOCK = 'unlock';
const LOCK = 'lock';

class StreamError {
  constructor(reason, name, stream) {
    this.reason = reason;
    this.name = name;
    this.stream = stream;
  }
}

class MultiStream extends EventEmitter {
  #buffer;
  #streams;
  #encoding;
  #offset = 0;
  #locking = false;
  #closed = false;

  constructor({
    streams = { stdout: process.stdout },
    writeBuffer,
    encoding = 'utf8',
  }) {
    super();
    this.#encoding = encoding;
    this.#buffer = Buffer.allocUnsafe(writeBuffer);
    this.#streams = new Map();
    for (const [name, stream] of Object.entries(streams))
      this.#prepare(name, stream);
    setMaxListeners(MAX_QUEUE, this);
  }

  #prepare(name, stream) {
    this.#streams.set(name, {
      view: [],
      stream,
    });
  }

  write(data, name = 'stdout') {
    if (this.#closed) throw new Error('Stream is closed');
    const item = this.#streams.get(name);
    if (!item) throw new Error(`Stream ${name} not found`);
    const offset = this.#offset;
    const length = offset + data.length;
    if (length > this.#buffer.length)
      return void this.once(LOCK, () => this.write(data, name));
    const chunk = this.#buffer.subarray(offset, length);
    const save = () => {
      chunk.write(data, this.#encoding);
      item.view.push(chunk);
    };
    if (this.#locking) this.once(UNLOCK, save);
    else save();
    this.#offset = length;
  }

  #lock() {
    this.#locking = true;
    this.emit(LOCK);
  }

  #unlock(cb) {
    this.#locking = false;
    this.emit(UNLOCK);
    cb?.(null);
  }

  flush(cb) {
    if (this.#offset === 0) {
      cb?.(null);
      return;
    }
    if (this.#locking) return void this.once(UNLOCK, () => this.flush(cb));
    let finished = 0;
    const enries = this.#streams.entries();
    for (const [name, { view, stream }] of enries) {
      if (view.length === 0) {
        finished++;
        continue;
      }
      const write = (err = null) => {
        if (err) {
          finished++;
          const error = new StreamError(err, name, stream);
          if (cb) cb(error);
          else this.emit('error', error);
        } else {
          const chunk = view.shift();
          if (chunk) {
            stream.write(chunk, this.#encoding, write);
            return;
          }
        }
        if (++finished === this.#streams.size) this.#unlock(cb);
      };
      if (stream.pending) stream.once('ready', write);
      else write();
    }
    this.#offset = 0;
    this.#lock();
  }

  close(cb) {
    this.#closed = true;
    const onClose = (err) => {
      const streams = Object.fromEntries(this.#streams.entries());
      this.#streams.clear();
      cb?.(err, streams);
    };
    this.flush(onClose);
  }

  end(name) {
    const item = this.#streams.get(name);
    if (!item) throw new Error(`Stream ${name} not found`);
    const { stream } = item;
    const endStream = () => stream.end();
    if (this.#locking) this.prependOnceListener(UNLOCK, endStream);
    else endStream();
    this.#streams.delete(name);
  }

  reopen(name, stream) {
    this.end(name);
    this.#prepare(name, stream);
  }

  error(cb) {
    this.on('error', cb);
  }
}

module.exports = MultiStream;
