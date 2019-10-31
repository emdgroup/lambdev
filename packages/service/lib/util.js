const crypto = require('crypto');
const os = require('os');
const aws4 = require('aws4');
const http = require('http');
const https = require('https');
const querystring = require('querystring');

const util = require('@lambdev/util');

const {
  CredentialsInvalid,
} = util.errors;

const GUID_REGEX = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

const NAME_REGEX = '([a-zA-Z0-9-_.]+)(:($LATEST|[a-zA-Z0-9-_]+))?';

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

module.exports = {
  getLocalAddress,
  getCallerIdentity,
  GUID_REGEX,
  NAME_REGEX,
  ...util,
};
