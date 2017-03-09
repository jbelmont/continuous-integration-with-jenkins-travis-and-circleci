'use strict';

const { spawn } = require('child_process');
const rimraf = require('rimraf');

const getPortOffset = pid => {
  const maxOffset = 65535 - 28015;
  return pid - (Math.floor(pid / maxOffset) * maxOffset);
};

let rethink;

module.exports.init = initialData => () => new Promise((resolve, reject) => {
  const offset = getPortOffset(process.pid);
  const port = 28015;
  const r = require('rethinkdb');

  r.net.Connection.prototype.DEFAULT_PORT = port;
  rethink = spawn('rethinkdb', ['-o', `${port}`, '-d', `${process.cwd()}`]);

  if (process.env.AVA_RETHINKDB_DEBUG) {
    console.error(`==> Process ${process.pid} spawning RethinkDB server on port ${port}...`);
  }

  rethink.stdout.on('data', chunk => {
    if (chunk.toString('utf8').startsWith('Listening for client driver connections')) {
      if (initialData) {
        importData().then(() => resolve(port));
      } else {
        resolve(port);
      }

      if (process.env.AVA_RETHINKDB_DEBUG) {
        console.error(`==> Process ${process.pid} RethinkDB server booted!`);
      }
    }

    if (process.env.AVA_RETHINKDB_DEBUG) {
      console.error(chunk.toString());
    }
  });

  if (process.env.AVA_RETHINKDB_DEBUG) {
    rethink.stderr.on('data', chunk => console.error(chunk.toString()));
  }

  rethink.on('error', reject);

  function importData () {
    let conn;
    return r.connect({}).then(_ => { conn = _; })
      .then(() => Promise.all(
        Object.keys(initialData).map(db => db !== 'test' && r.dbCreate(db).run(conn))
      ))
      .then(() => Promise.all(
        collectTables(initialData).map(([db, table]) => r.db(db).tableCreate(table).run(conn))
      ))
      .then(() => Promise.all(
        collectDocuments(initialData).map(([db, table, doc]) => r.db(db).table(table).insert(doc).run(conn))
      ));
  }
});

module.exports.cleanup = () => {
  if (process.env.AVA_RETHINKDB_DEBUG) {
    console.error(`==> Process ${process.pid} killing RethinkDB server...`);
  }

  rethink.kill();

  if (process.env.AVA_RETHINKDB_DEBUG) {
    console.error(`==> Process ${process.pid} killed RethinkDB server!`);
  }

  rimraf.sync(`${process.cwd()}`);
};

function collectTables (data) {
  return Object.keys(data)
               .map(db => Object.keys(data[db]).map(table => [db, table]))
               .reduce((a, b) => a.concat(b));
}

function collectDocuments (data) {
  return Object.keys(data)
               .map(db => Object.keys(data[db]).map(table => data[db][table].map(doc => [db, table, doc])))
               .reduce((a, b) => a.concat(b))
               .reduce((a, b) => a.concat(b));
}

module.exports.getPortOffset = getPortOffset;
