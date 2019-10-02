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
          allowedValues: ['nodejs8.10', 'nodejs10.x', 'python3.6', 'python3.7', 'ruby2.5'],
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
};
