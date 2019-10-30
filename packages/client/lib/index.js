const { Readable } = require('stream');

const { getPortPromise } = require('portfinder');

const {
  errors: { InvalidParameterValue },
  fetchDocker: fetch,
  fetch: fetchApi,
  UUIDv4,
  waitForService,
} = require('@lambdev/util');

class LambDevClient extends Readable {
  constructor(args = {}) {
    super(args);
    this.image = args.image || 'lambdev/service:latest';
    this.created = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  async getEndpoint() {
    await this.created;
    return `http://127.0.0.1:${this.port}`;
  }

  async checkForRunningContainer() {
    const [, running] = await fetch('GET', '/containers/json', {
      filters: JSON.stringify({ label: [`com.lambdev.cwd=${process.cwd()}`] }),
    });
    if (!running.length) return false;
    const container = running[0];
    this.port = container.Ports[0].PublicPort;
    this.id = container.Id;
    return true;
  }

  async startContainer(name) {
    const [res, container] = await fetch(
      'POST',
      '/containers/create',
      { name },
      {
        Image: this.image,
        Env: [
          'AWS_DEFAULT_REGION',
          'AWS_ACCESS_KEY_ID',
          'AWS_SECRET_ACCESS_KEY',
          'AWS_SESSION_TOKEN',
          'DOCKER_HOST',
        ].map((k) => `${k}=${process.env[k] || ''}`),
        Labels: {
          'com.lambdev.version': '1.0.0',
          'com.lambdev.cwd': process.cwd(),
        },
        HostConfig: {
          NetworkMode: 'bridge',
          MemorySwappiness: 0,
          CpuCount: 1,
          AutoRemove: true,
          Binds: ['/var/run/docker.sock:/var/run/docker.sock:ro'],
          PortBindings: {
            '9001/tcp': [
              { HostIp: '127.0.0.1', HostPort: this.port.toString() },
            ],
          },
        },
      },
    );
    if (res.ok) {
      this.id = container.Id;
      return fetch('POST', `/containers/${this.id}/start`);
    }
    if (res.statusCode === 404) {
      console.log(`Unable to find image '${this.image}' locally, pulling...`);
      const [{ ok }] = await fetch(
        'POST',
        '/images/create',
        {
          fromImage: this.image,
        },
        null,
        () => {},
      );
      if (!ok) {
        return Promise.reject(
          InvalidParameterValue.description(
            `Failed to download image ${this.image}.`,
          ),
        );
      }
      return this.startContainer();
    }
    if (res.statusCode === 400 || res.statusCode === 500) {
      return Promise.reject(
        InvalidParameterValue.description(container.message),
      );
    }
    return Promise.reject();
  }

  async start() {
    const running = await this.checkForRunningContainer();
    if (!running) {
      this.port = await getPortPromise({ port: 9001 });
      await this.startContainer(`lambdev-${UUIDv4()}`);
    }
    fetch(
      'GET',
      `/containers/${this.id}/logs`,
      {
        follow: true,
        stdout: true,
        stderr: true,
        tail: 0,
      },
      null,
      (log) => {
        // remove docker message header from log stream
        console.log(
          log
            .slice(8)
            .toString()
            .trim(),
        );
      },
    )
      .then(() => {
        console.log('Log stream closed.');
      })
      .catch(() => {
        console.log('Looks like container terminated unexpectedly.');
      });
    return waitForService('127.0.0.1', this.port, 10000).then(
      this._resolve,
      this._reject,
    );
  }

  async stop() {
    return fetch('POST', `/containers/${this.id}/stop`);
  }

  async lambdaRequest(path, reqBody, cb) {
    await this.created;
    return fetchApi(
      {
        hostname: '127.0.0.1',
        port: this.port,
        path,
        method: reqBody ? 'POST' : 'GET',
        protocol: 'http:',
      },
      reqBody,
      cb,
    );
  }

  createFunction({ name, runtime, code }) {
    return this.lambdaRequest('/2015-03-31/functions', {
      FunctionName: name,
      Runtime: runtime,
      Code: code,
      Handler: 'index.handler',
    });
  }

  invoke(name, event) {
    return this.lambdaRequest(
      `/2015-03-31/functions/${name}/invocations`,
      event,
    );
  }
}

module.exports = LambDevClient;
