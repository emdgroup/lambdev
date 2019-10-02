const crypto = require('crypto');
const os = require('os');
const aws4 = require('aws4');
const http = require('http');
const https = require('https');
const querystring = require('querystring');

const {
  errors: {
    DockerUnavailable,
    CredentialsInvalid,
  },
} = require('./error');

const GUID_REGEX = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

const NAME_REGEX = '([a-zA-Z0-9-_.]+)(:($LATEST|[a-zA-Z0-9-_]+))?';

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
        while (newline > -1) {
          const body = Buffer.concat([Buffer.concat(chunks), chunk.slice(0, newline + 1)]);
          cb(isJson ? JSON.parse(body) : body);
          chunks = [chunk.slice(newline + 1)];
          newline = chunks[0].indexOf('\n');
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

let LOCAL_ADDRESS;

function getLocalAddress() {
  if (LOCAL_ADDRESS) return LOCAL_ADDRESS;
  const ifs = os.networkInterfaces();
  LOCAL_ADDRESS = ifs.eth0.find((iface) => iface.family === 'IPv4').address;
  return LOCAL_ADDRESS;
}

function xmlExtract(xml, tag) {
  const matches = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`));
  if (matches) return matches[1];
  return null;
}

let CALLER_CREDENTIALS;

async function getCallerIdentity() {
  if (CALLER_CREDENTIALS) return CALLER_CREDENTIALS;
  const [res, body] = await fetch(aws4.sign({
    service: 'sts',
    path: '/?Action=GetCallerIdentity&Version=2011-06-15',
  }));
  if (!res.ok) throw CredentialsInvalid.description(xmlExtract(body, 'Message'));
  CALLER_CREDENTIALS = {
    accountId: xmlExtract(body, 'Account'),
    isAssumedRole: !!xmlExtract(body, 'Arn').match(/assumed-role/),
  };
  return CALLER_CREDENTIALS;
}

module.exports = {
  fetchDocker,
  UUIDv4,
  getLocalAddress,
  getCallerIdentity,
  GUID_REGEX,
  NAME_REGEX,
};
