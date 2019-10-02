const { IncomingMessage } = require('http');


class Request extends IncomingMessage {
  async json() {
    return new Promise((resolve, reject) => {
      const chunks = [];
      this.on('data', (chunk) => chunks.push(chunk));
      this.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        try {
          resolve(body.trim().length === 0 ? {} : JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  validate({ bodyParameters }, body) {
    const validated = {};
    const errors = [];
    Object.keys(bodyParameters).forEach((name) => {
      const {
        required,
        pattern,
        allowedValues,
        type = 'string',
      } = bodyParameters[name];
      if (required && !(name in body)) errors.push(name);
      if (name in body) {
        if (typeof body[name] !== type) errors.push(name);
        if (allowedValues && !allowedValues.includes(body[name])) errors.push(name);
        if (pattern && !pattern.exec(body[name])) errors.push(name);
        if (!errors.includes(name)) validated[name] = body[name];
      }
    });
    return [errors, validated];
  }

  async handle(routes, res) {
    const { method, url } = this;
    console.log(`${method} ${url}`);
    try {
      const handler = routes[method].find(
        (h) => h.url === url || (h.url instanceof RegExp && h.url.exec(url)),
      );
      if (handler && handler.bodyParameters) {
        const body = await this.json();
        const [errors, validated] = this.validate(handler, body);
        if (errors.length) {
          console.log(errors);
          res.nok();
        } else {
          this[handler.handler](res, validated);
        }
      } else {
        this[handler.handler](res);
      }
    } catch (e) {
      console.log('Unhandled request:', method, url);
      console.log(e);
      res.end();
    }
  }
}

module.exports = Request;
