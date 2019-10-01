# LambDev

A local Lambda development environment that supports warm containers and concurreny.

*Work in Progress*

## Motivation



## Supported Runtimes

Only runtimes that have been updated by AWS to implement the [Lambda Runtime Interface](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-api.html) are supported.

* nodejs8.10
* nodejs10.x
* python3.6
* python3.7
* ruby2.5
* provided (any [custom runtime](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-custom.html) implementation)

## Run Local Lambda Service

```bash
# Launch the service
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock:ro -p 9001:9001 lambdev/service:latest

# Create a mock lambda function
mkdir lambda && echo 'exports.handler = async (event) => ({ body: "Hello World!" })' > lambda/index.js

# Create a Lambda function with the AWS CLI
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



## Develop

```
# install dev dependencies
docker-compose run rapid yarn

# start service
docker-compose up
```
