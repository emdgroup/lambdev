const path = require('path');
const {
  errors: {
    InvalidParameterValue,
    ResourceNotFound,
  },
  fetchDocker: fetch, UUIDv4, getLocalAddress,
} = require('./util');

const functionsByName = new Map();
const functionsByAddress = new Map();

async function startContainer(fn) {
  const {
    name, runtime, handler, code, memory,
  } = fn;
  const localPath = path.join(code.S3Bucket, code.S3Key);
  if (!path.isAbsolute(localPath)) throw InvalidParameterValue.description('Path to task must be absolute.');
  const image = `lambdev/runtime:${runtime}`;
  // Add container Id as soon as possible to increase size by one
  const guid = UUIDv4();
  const now = new Date();
  fn.containers.set(guid, {});
  const [res, container] = await fetch('POST', '/containers/create', {
    name: `lambda-${guid}`,
  }, {
    Image: image,
    Env: [
      `AWS_LAMBDA_RUNTIME_API=${getLocalAddress()}:9001`,
      `AWS_LAMBDA_FUNCTION_HANDLER=${handler}`,
      `_HANDLER=${handler}`,
      `AWS_LAMBDA_FUNCTION_NAME=${name}`,
      `AWS_LAMBDA_LOG_GROUP_NAME=/aws/lambda/${name}`,
      `AWS_LAMBDA_LOG_STREAM_NAME=${now.toISOString().substring(0, 10).replace(/-/g, '/')}/[$LATEST]${guid.replace(/-/g, '')}`,
      'AWS_LAMBDA_FUNCTION_VERSION=$LATEST',
      `AWS_LAMBDA_FUNCTION_MEMORY_SIZE=${memory}`,
      `AWS_REGION=${process.env.AWS_DEFAULT_REGION}`,
    ].concat([
      'AWS_DEFAULT_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_SESSION_TOKEN',
    ].map((k) => `${k}=${process.env[k] || ''}`)),
    Entrypoint: ['/var/runtime/bootstrap'],
    Labels: {
      'com.genesis.version': '1.0.0',
      'com.genesis.lambda.name': name,
    },
    HostConfig: {
      Init: true,
      NetworkMode: 'bridge', // TODO: support custom networks
      Binds: [`${localPath}:/var/task`],
      // Allocate a little more memory than requested
      Memory: memory * (2 ** 20) + 61416,
      MemorySwappiness: 0,
      CpuCount: 1,
      AutoRemove: true,
    },
  });
  if (res.ok) {
    await fetch('POST', `/containers/${container.Id}/start`);
    const [, info] = await fetch('GET', `/containers/${container.Id}/json`);

    const network = Object.keys(info.NetworkSettings.Networks)[0];
    const { IPAddress } = info.NetworkSettings.Networks[network];
    functionsByAddress.set(IPAddress, fn);

    // replace temporary placeholder with real container ID
    fn.containers.set(container.Id, { Id: info.Id });
    fn.containers.delete(guid);

    return fetch('GET', `/containers/${container.Id}/logs`, {
      follow: true,
      stdout: true,
      stderr: true,
    }, null, (log) => {
      // remove docker message header from log stream
      console.log(log.slice(8).toString().trim());
    }).catch(() => {
      console.log('Looks like container terminated unexpectedly.');
    }).finally(() => {
      // if the container is killed or exists the log stream is closed
      fn.containers.delete(container.Id);
      functionsByAddress.delete(IPAddress);
    });
  }
  if (res.statusCode === 404) {
    console.log(`Unable to find image '${image}' locally, pulling...`);
    const [{ ok }] = await fetch('POST', '/images/create', {
      fromImage: image,
    }, null, () => {});
    if (!ok) {
      return Promise.reject(InvalidParameterValue.description(`Failed to download image ${image}.`));
    }
    return startContainer(fn);
  } if (res.statusCode === 400) {
    return Promise.reject(InvalidParameterValue.description(container.message));
  }
  return Promise.reject();
}

async function cleanUp() {
  const [, running] = await fetch('GET', '/containers/json', {
    filters: JSON.stringify({ label: ['com.genesis.version=1.0.0'] }),
    all: true,
  });
  if (running.length) {
    console.log(`found ${running.length} running container${running.length > 1 ? 's' : ''}, cleaning up...`);
    await Promise.all(running.map((c) => fetch('DELETE', `/containers/${c.Id}`, { force: true })));
  }
}

async function ensureCapacity(name) {
  const fn = functionsByName.get(name);
  if (!fn) return null;
  // TODO: scale up to concurrency defined in function configuration
  if (fn.handlers.size === 0 && fn.containers.size < fn.concurrency) return startContainer(fn);
  return fn;
}

function createFunction(args) {
  const lambda = {
    ...args,
    concurrency: 3,
    containers: new Map(),
    invocations: {
      queued: new Map(),
      waiting: new Map(),
    },
    handlers: new Set(),
  };
  return functionsByName.set(args.name, lambda);
}

function getFunctionByName(name) {
  return functionsByName.get(name);
}

function getFunctionByAddress(address) {
  return functionsByAddress.get(address);
}

async function updateFunctionCode(args) {
  const fn = getFunctionByName();
  if (!fn) throw ResourceNotFound;
  fn.code = args.code;
  const stopping = [];
  for (const [containerId] of fn.containers) {
    fn.containers.delete(containerId);
    stopping.push(fetch('POST', `/containers/${containerId}/stop`));
  }
  return Promise.all(stopping);
}

async function putFunctionConcurrency(concurrency) {
  const fn = getFunctionByName();
  if (!fn) throw ResourceNotFound;
  fn.concurrency = concurrency;
  return concurrency;
}

module.exports = {
  cleanUp,
  createFunction,
  ensureCapacity,
  getFunctionByAddress,
  getFunctionByName,
  updateFunctionCode,
  putFunctionConcurrency,
};
