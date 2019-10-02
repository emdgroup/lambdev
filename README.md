# LambDev

A local Lambda development environment that supports warm containers and concurreny.

*Work in Progress*

## Run Local Lambda Service

```bash
# Launch the service
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock:ro -p 9001:9001 lambdev/service:latest

# Create a mock lambda function
mkdir lambda
echo 'let i = 0; exports.handler = async (event) => ({ body: `Hello World ${i++}!` })' > lambda/index.js

# Create a Lambda function with the AWS CLI, the S3Bucket and S3Key parameters are joined
# to form an absolute path to the Lambda code
aws lambda create-function \
  --endpoint http://localhost:9001 --no-sign-request \
  --function-name MyFunction --runtime nodejs10.x --role SomeRole --handler index.handler \
  --code S3Bucket=`pwd`,S3Key=lambda

# Invoke the function
aws lambda invoke \
  --endpoint http://localhost:9001 --no-sign-request \
  --function-name MyFunction --payload '{}' output.json

# Print response
cat output.json
```

## Motivation

Serverless development always felt a little more painful than it should be. With the advent of the fabolous [docker-lambda](https://github.com/lambci/docker-lambda) project by LambCI (which powers [SAM local](https://github.com/awslabs/aws-sam-cli), the [Serverless Framework](https://serverless.com) and [localstack](https://github.com/localstack/localstack)) things got much better. However, the most requested feature is support for warm containers (aws-sam-cli#239) and shorter request times. This will model the production Lambda environment even more realsitically as you can execute code that is only run once per function instantiation instead of running them on every invocation (e.g. decrypt secrets, load modules, maintain a local cache).

This project set out to solve this problem while still heavily relying on the `docker-lambda` suite of runtimes. Instead of starting a new container for every request, this project implements the server side of the [Lambda Runtime Interface](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-api.html) (LRI). The containers will launch and remain warm while polling the LRI for new invocations. This dramatically reduces the overhead for each invocation and you can expect response times of less than 10ms on average.

## Supported Runtimes

Only runtimes that have been updated by AWS to implement the [Lambda Runtime Interface](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-api.html) are supported.

* nodejs8.10
* nodejs10.x
* python3.6
* python3.7
* ruby2.5
* provided (any [custom runtime](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-custom.html) implementation)

## Develop

The development server supports hot reloading, so any changes to `/service` will restart the process.

```bash
# install dev dependencies
docker-compose run rapid yarn

# start service
docker-compose up
```
