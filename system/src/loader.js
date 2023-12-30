'use strict';

const { node } = require('./dependencies.js');

const JS_EXT = '.js';
const SCRIPT_OPTIONS = { lineOffset: -1 };
const RUN_OPTIONS = {
  timeout: 5000,
  displayErrors: false,
};

const trim = (str) => str.trim();

const readSrc = async (filePath) =>
  await node.fsp.readFile(filePath, 'utf8').then(trim);

const load = async (filePath, sandbox) => {
  if (!filePath.endsWith(JS_EXT)) return null;
  const src = await readSrc(filePath);
  if (!src) return null;
  const code = `'use strict';\n${src}`;
  const script = new node.vm.Script(code, SCRIPT_OPTIONS);
  const exported = script.runInContext(sandbox, RUN_OPTIONS);
  return exported;
};

const loadDir = async (dirPath, sandbox) => {
  const files = await node.fsp.readdir(dirPath, { withFileTypes: true });
  const container = {};
  for (const file of files) {
    const { name } = file;
    const location = node.path.join(dirPath, name);
    const loader = file.isFile() ? load : loadDir;
    const module = await loader(location, sandbox);
    if (module) {
      const key = node.path.basename(name, JS_EXT);
      container[key] = module;
    }
  }
  return container;
};

const loadInterface = async (
  dirPath,
  sandbox,
  prefix = '/',
  iface = new Map(),
) => {
  const files = await node.fsp.readdir(dirPath, { withFileTypes: true });
  for (const file of files) {
    const { name } = file;
    const location = node.path.join(prefix, name);
    const filePath = node.path.join(dirPath, name);
    if (file.isFile()) {
      if (!filePath.endsWith(JS_EXT)) continue;
      const src = await readSrc(filePath);
      if (!src) continue;
      const code = `'use strict';\n(context)=>${src}`;
      const script = new node.vm.Script(code, SCRIPT_OPTIONS);
      const module = script.runInContext(sandbox, RUN_OPTIONS);
      const key = location.substring(0, location.length - JS_EXT.length);
      iface.set(key, module);
    } else {
      await loadInterface(filePath, sandbox, location, iface);
    }
  }
  return iface;
};

module.exports = {
  load,
  loadDir,
  loadInterface,
};
