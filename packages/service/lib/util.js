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
  getLocalAddress,
  getCallerIdentity,
  GUID_REGEX,
  NAME_REGEX,
  ...util,
};
