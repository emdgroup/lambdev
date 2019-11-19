const assert = require('assert');

const { Lambda } = require('aws-sdk');

const Client = require('../lib');

describe('client', () => {
  describe('constructor', () => {
    it('client can start', () => {
      const client = new Client();
      assert.ok(client.start);
    });
  });

  describe('aws-sdk', () => {
    let client;

    before(async () => {
      client = new Client();
      return client.start();
    });

    after(async () => client.stop());
    ['python3.7', 'python3.8', 'nodejs10.x', 'nodejs12.x', 'ruby2.5'].map((runtime) => {
      it(`runtime ${runtime}`, async () => {
        const endpoint = await client.getEndpoint();
        const lambda = new Lambda({
          region: 'us-east-1',
          endpoint,
          accessKeyId: 'ACCESS_KEY',
          secretAccessKey: 'SECRET_KEY',
        });
        await lambda.createFunction({
          FunctionName: 'test',
          Runtime: runtime,
          Role: 'norole',
          Handler: 'index.handler',
          Code: { S3Bucket: process.cwd(), S3Key: '../../test/task' },
        }).promise();
        const response = await lambda.invoke({
          FunctionName: 'test',
          Payload: JSON.stringify({}),
        }).promise();
        assert.ok(response.Payload, 'response has payload');
        assert.deepEqual(JSON.parse(response.Payload), { body: 'some response' });
        assert.strictEqual(response.StatusCode, 200);
      });
    })
  });
});
