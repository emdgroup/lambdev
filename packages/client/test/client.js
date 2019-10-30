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
    it('use endpoint', async () => {
      const client = new Client();
      client.start();
      const endpoint = await client.getEndpoint();
      const lambda = new Lambda({
        region: 'us-east-1',
        endpoint,
        accessKeyId: 'ACCESS_KEY',
        secretAccessKey: 'SECRET_KEY',
      });
      await lambda.createFunction({
        FunctionName: 'test',
        Runtime: 'nodejs10.x',
        Role: 'norole',
        Handler: 'index.handler',
        Code: { S3Bucket: process.cwd(), S3Key: '../../task' },
      }).promise();
      console.log(await lambda.invoke({
        FunctionName: 'test',
        Payload: JSON.stringify({}),
      }).promise());
      return client.stop();
    });
  });

});
