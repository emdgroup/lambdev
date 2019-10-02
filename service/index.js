const http = require('http');

const {
  UUIDv4, getCallerIdentity,
} = require('./util');

const IncomingMessage = require('./http/request');
const Response = require('./http/response');
const routes = require('./http/routes');

const pool = require('./pool');

class Request extends IncomingMessage {
  getNextInvocation(res) {
    const fn = pool.getFunctionByAddress(this.socket.remoteAddress);
    const { invocations, handlers, timeout } = fn;
    const handler = (invocation) => {
      invocations.queued.delete(invocation.id);
      invocations.waiting.set(invocation.id, invocation);
      invocation.start = process.hrtime();
      console.log(`START RequestId: ${invocation.id} Version: $LATEST`);
      // TODO: ensure container is unpaused
      // TODO: start timer and terminate container after $TIMEOUT seconds
      res.setHeaders([
        ['Lambda-Runtime-Deadline-Ms', Date.now() + timeout * 1000],
        ['Lambda-Runtime-Invoked-Function-Arn', 'some-arn'],
        ['Lambda-Runtime-Aws-Request-Id', invocation.id],
      ]);
      invocation.req.pipe(res);
    };
    if (invocations.queued.size) {
      // A Map object iterates its elements in insertion order (FIFO)
      // so we ensure that invocations are worked on in the order they arrived
      for (const [, invocation] of invocations.queued) {
        handler(invocation);
        break;
      }
    } else {
      handlers.add(handler);
      this.on('close', () => handlers.delete(handler));
      // TODO: pause container
    }
  }

  postInvocationResponse(res) {
    const invocationId = this.url.split('/')[4];
    const fn = pool.getFunctionByAddress(this.socket.remoteAddress);
    const { invocations, memory } = fn;
    const invocation = invocations.waiting.get(invocationId);
    if (invocations.waiting.delete(invocationId)) {
      const [durationS, durationNs] = process.hrtime(invocation.start);
      const duration = durationS * 1000 + durationNs / 1e6;
      const billed = Math.ceil(duration / 100) * 100;
      setTimeout(() => {
        console.log(`END RequestId: ${invocation.id}`);
        console.log([
          `REPORT RequestId: ${invocation.id}`,
          `Duration: ${duration.toFixed(2)} ms`,
          `Billed Duration: ${billed.toFixed(0)} ms`,
          `Memory Size: ${memory} MB`,
          'Max Memory Used: unknown', // TODO
        ].join('\t'));
      }, 100);
      // if the request was aborted in the meantime, we will not
      // pipe the response to the response.
      if (invocation.req.aborted) {
        invocation.res.end();
        return res.ok();
      }
      this.pipe(invocation.res);
      this.on('end', () => res.ok());
    } else {
      res.ok();
    }
  }

  postInvocationError(res) {
    return this.postInvocationResponse(res);
  }

  async postInitError(res) {
    const body = await this.json();
    console.log('Unknown application error occurred');
    console.log(this.headers['lambda-runtime-function-error-type']);
    const fn = pool.getFunctionByAddress(this.socket.remoteAddress);
    const { invocations } = fn;
    for (const [id, invocation] of invocations.queued) {
      invocations.queued.delete(id);
      invocation.res.setHeader('X-Amz-Function-Error', 'Unhandled');
      invocation.res.json(body, 200);
    }
    res.ok();
  }

  async postInvocation(res) {
    const functionName = this.url.split('/')[3];
    const id = UUIDv4();
    const invocation = { id, req: this, res };
    const fn = pool.getFunctionByName(functionName);
    if (!fn) return res.nok();
    pool.ensureCapacity(functionName).catch((err) => res.nok(err));
    const { invocations, handlers } = fn;
    invocations.queued.set(id, invocation);
    if (handlers.size) {
      for (const handler of handlers) {
        handlers.delete(handler);
        handler(invocation);
        break;
      }
    }
  }

  async createFunction(res, body) {
    res.json(body);
    pool.createFunction({
      name: body.FunctionName,
      handler: body.Handler,
      runtime: body.Runtime,
      code: body.Code,
      memory: body.MemorySize || 128,
      timeout: body.Timeout || 3,
    });
  }
}

function createServer() {
  const server = http.createServer({
    IncomingMessage: Request,
    ServerResponse: Response,
  });
  server.setTimeout(0);
  server.on('request', (req, res) => req.handle(routes, res));
  return server;
}

Promise.all([
  pool.cleanUp(),
  getCallerIdentity(),
]).then(() => createServer().listen(9001, '0.0.0.0', () => {
  console.log('Listening on 0.0.0.0:9001');
}), (err) => {
  console.error(err.toString());
  process.exit(1);
});

module.exports = {
  createServer,
};

async function handle(signal) {
  console.log(`Received ${signal}`);
  await pool.cleanUp();
  process.exit(0);
}

process.on('SIGINT', handle);
process.on('SIGTERM', handle);
