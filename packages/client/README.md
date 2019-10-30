# `@lambdev/client`

> TODO: description

## Usage

```js
const Client = require('@lambdev/client');

const client = new Client();

(async () => {

  // launch container running the LambDev API
  client.start();

  // create a function
  await client.createFunction({
    runtime: 'nodejs10.x',
    name: 'foobar',
  }).catch(err => console.log(err));

  // Invoke a function
  const [res, body] = await client.invoke('foobar', { foo: 'bar' });
  console.log(res.statusCode, body);

  // Alternatively, use the aws-sdk to work with the API
  const AWS = require('aws-sdk');

  const endpoint = await client.getEndpoint();
  const lambda = new AWS.Lambda({
    endpoint,
    accessKeyId: 'ACCESS_KEY',
    secretAccessKey: 'SECRET_KEY',
  });
  lambda.createFunction(...).promise();
  lambda.invoke(...).promise();
  lambda.updateFunctionCode(...).promise();

})();

```
