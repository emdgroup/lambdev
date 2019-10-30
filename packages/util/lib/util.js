const http = require('http');
const https = require('https');
const crypto = require('crypto');
const querystring = require('querystring');

const error = require('./error');

const {
  errors: {
    DockerUnavailable,
  },
} = error;

function UUIDv4() {
  const guid = crypto.randomBytes(16);
  guid[6] = (guid[6] & 0x0f) | 0x40;
  guid[8] = (guid[8] & 0x3f) | 0x80;
  const str = guid.toString('hex').split('');
  return [
    str.splice(0, 8),
    str.splice(0, 4),
    str.splice(0, 4),
    str.splice(0, 4),
    str.splice(0, 12),
  ].map((s) => s.join('')).join('-');
}

function fetch(opts, reqBody, cb) {
  return new Promise((resolve, reject) => {
    const client = opts.protocol === 'http:' ? http : https;
    const req = client.request(opts, (res) => {
      const isJson = res.headers['content-type'] === 'application/json';
      let chunks = [];
      res.on('data', (chunk) => {
        if (!cb) return chunks.push(chunk);
        let newline = chunk.indexOf('\n');
        if (newline === -1) return chunks.push(chunk);
        let currentChunk = chunk;
        while (newline > -1) {
          const body = Buffer.concat([Buffer.concat(chunks), currentChunk.slice(0, newline + 1)]);
          cb(isJson ? JSON.parse(body) : body);
          chunks = [];
          currentChunk = currentChunk.slice(newline + 1);
          newline = currentChunk.indexOf('\n');
        }
      });
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString().trim();
        res.ok = res.statusCode > 199 && res.statusCode < 400;
        if (cb) {
          if (body.length) cb(isJson ? JSON.parse(body) : body);
          return resolve([res, null]);
        }
        return resolve([res, body.length === 0 ? null : isJson ? JSON.parse(body) : body]);
      });
      res.on('error', reject);
    });
    req.on('error', (err) => reject(err.code === 'ENOENT' ? DockerUnavailable : err));
    req.end(reqBody ? JSON.stringify(reqBody) : null);
  });
}

function fetchDocker(method, path, qs, reqBody, cb) {
  return fetch({
    protocol: 'http:',
    socketPath: '/var/run/docker.sock',
    path: qs ? `/v1.40${path}?${querystring.encode(qs)}` : `/v1.40${path}`,
    method,
    headers: {
      'content-type': 'application/json',
    },
  }, reqBody, cb);
}

function waitForService(host, port, timeout, error) {
  return new Promise((resolve, reject) => {
    if (timeout < 0) return reject(error);

    const start = new Date().getTime();

    const s = http.request({ port, host, protocol: 'http:' }, (res) => {
      clearTimeout(i);
      resolve();
    });

    const i = setTimeout(() => {
      s.destroy();
      reject("timeout");
    }, timeout);

    s.on('error', async (err) => {
      clearTimeout(i);
      await new Promise((rsv) => setTimeout(rsv, 1000));
      const end = new Date().getTime();
      waitForService(host, port, timeout - end + start, err)
        .then(resolve)
        .catch(reject);
    });
    s.end();
  });
}

module.exports = {
  fetch,
  fetchDocker,
  UUIDv4,
  waitForService,
  ...error,
};
