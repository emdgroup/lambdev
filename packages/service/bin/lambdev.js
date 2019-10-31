
const { createServer, pool } = require('../lib');
const { getCallerIdentity } = require('../lib/util');

const { LAMBDEV_PORT = 9001, LAMBDEV_HOST = '0.0.0.0' } = process.env;

Promise.all([
  pool.cleanUp(),
  getCallerIdentity(),
]).then(() => createServer().listen(LAMBDEV_PORT, LAMBDEV_HOST, () => {
  console.log(`Listening on ${LAMBDEV_HOST}:${LAMBDEV_PORT}`);
}), (err) => {
  console.error(err.toString());
  process.exit(1);
});

async function handle(signal) {
  console.log(`Received ${signal}`);
  await pool.cleanUp();
  process.exit(0);
}

process.on('SIGINT', handle);
process.on('SIGTERM', handle);
