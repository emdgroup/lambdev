const {
  GUID_REGEX, NAME_REGEX,
} = require('../util');

module.exports = {
  GET: [
    {
      url: '/2018-06-01/runtime/invocation/next',
      handler: 'getNextInvocation',
    },
  ],
  POST: [
    {
      url: '/2018-06-01/runtime/init/error',
      handler: 'postInitError',
    },
    {
      url: new RegExp(`^/2018-06-01/runtime/invocation/${GUID_REGEX}/response$`),
      handler: 'postInvocationResponse',
    },
    {
      url: new RegExp(`^/2018-06-01/runtime/invocation/${GUID_REGEX}/error$`),
      handler: 'postInvocationError',
    },
    {
      url: new RegExp(`^/2015-03-31/functions/${NAME_REGEX}/invocations$`),
      handler: 'postInvocation',
    },
    {
      url: '/2015-03-31/functions',
      handler: 'createFunction',
      bodyParameters: {
        Code: {
          required: true,
          type: 'object',
        },
        Environment: {
          type: 'object',
          properties: {
            Variables: {
              type: 'object',
            },
          },
        },
        FunctionName: {
          required: true,
          pattern: new RegExp('^[a-zA-Z0-9-_]+$'),
        },
        Handler: {
          required: true,
          pattern: new RegExp('^[^\s]+$'),
        },
        Runtime: {
          required: true,
          allowedValues: ['nodejs8.10', 'nodejs10.x', 'nodejs12.x', 'python3.6', 'python3.7', 'python3.8', 'ruby2.5', 'java11'],
        },
        MemorySize: {
          type: 'number',
          multipleOf: 128,
          maximum: 3008,
          minimum: 128,
        },
        Timeout: {
          type: 'number',
          minimum: 1,
          maximum: 900,
        },
      },
    },
  ],
  PUT: [{
    url: new RegExp(`^/2015-03-31/functions/${NAME_REGEX}/code$`),
    handler: 'updateFunctionCode',
    bodyParameters: {
      DryRun: {
        type: 'boolean',
      },
      Publish: {
        type: 'boolean',
      },
      RevisionId: {
      },
      S3Bucket: {
        required: true,
        pattern: new RegExp('^[0-9A-Za-z\.\-_]*(?<!\.)$'),
      },
      S3Key: {
        required: true,
        MaxLength: 1024,
      },
      S3ObjectVersion: {
        MaxLength: 1024,
      },
      ZipFile: {
      },
    },
  }, {
    url: new RegExp(`^/2015-03-31/functions/${NAME_REGEX}/concurrency$`),
    handler: 'updateFunctionCode',
    bodyParameters: {
      ReservedConcurrentExecutions: {
        type: 'number',
        minimum: 0,
      },
    },
  }],
};
