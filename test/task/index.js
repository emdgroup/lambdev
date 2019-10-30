console.log('lambda launched');

const AWS = require('aws-sdk/package.json');

let i = 0;

exports.handler = async (event, context) => {
  i += 1;
  console.log(`invocation ${i}`);
  console.log(AWS.version);
  // return {
  //   body: 'some response',
  // };
  console.log(context.getRemainingTimeInMillis());
  return new Promise(resolve => setTimeout(() => resolve({
    body: 'some response',
  }), 1000));
};
