const { ServerResponse } = require('http');

class Response extends ServerResponse {
  setHeaders(headers) {
    headers.forEach((h) => this.setHeader(h[0], h[1]));
  }

  json(body, code) {
    this.statusCode = code || 200;
    this.setHeader('Content-Type', 'application/json');
    this.end(`${JSON.stringify(body)}\n`);
  }

  ok() {
    this.json({ status: 'OK' }, 202);
  }

  nok(err) {
    this.json({ status: 'not OK', message: err ? err.message : null }, err ? err.statusCode : 500);
  }
}

module.exports = Response;
