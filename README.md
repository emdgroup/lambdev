![Build Status](https://codebuild.us-east-2.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoidkJzWkFuQUVyYk15YWJnMFdhTFo1TktvY0dScm1LNzR6QklONVZTRWZyQ0x0V3ZMRWNuMnoxeXVNT250bXNvQ0lhMW1uWHIzSktuMjhkYVFjWXBWUDhBPSIsIml2UGFyYW1ldGVyU3BlYyI6ImZlRTF3Z1d6OU0zdHdLU3IiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master) 
[![Docker Pulls](https://img.shields.io/docker/pulls/lambdev/service)](https://hub.docker.com/r/lambdev/service)
![Apache License](https://img.shields.io/badge/license-Apache--2.0-yellow)
![Platforms](https://img.shields.io/badge/platform-macos%20%7C%20linux-lightgrey)

# LambDev

A local Lambda development environment that supports warm containers and concurreny.

## Run Local Lambda Service

```bash
# Launch the service
docker run --rm \
  -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_SESSION_TOKEN -e AWS_DEFAULT_REGION \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -p 9001:9001 lambdev/service:latest

# Create a mock lambda function
mkdir lambda
echo 'let i = 0; exports.handler = async () => ({ body: `Hello World ${i++}!` })' > lambda/index.js

# Create a Lambda function with the AWS CLI, the S3Bucket and S3Key parameters are joined
# to form the absolute path to the code
aws lambda create-function \
  --endpoint http://localhost:9001 --no-sign-request \
  --function-name MyFunction --runtime nodejs12.x --role SomeRole --handler index.handler \
  --code S3Bucket=`pwd`,S3Key=lambda

# Invoke the function multiple times to see the response change with each invocation
aws lambda invoke \
  --endpoint http://localhost:9001 --no-sign-request \
  --function-name MyFunction --payload '{}' output.json && cat output.json

# Or with curl
curl -X POST http://localhost:9001/2015-03-31/functions/MyFunction/invocations -d '{}'

# Changes to the lambda code will only be picked up after the function is updated.
# This will stop containers running the previous version of the code.
aws lambda update-function-code \
  --endpoint http://localhost:9001 --no-sign-request \
  --function-name MyFunction --s3-bucket `pwd` --s3-key=lambda

# Set concurreny to 10 (defaults to 2)
aws lambda put-function-concurrency \
  --endpoint http://localhost:9001 --no-sign-request \
  --function-name MyFunction --reserved-concurrent-executions 10
```

## Motivation

Serverless development always felt a little more painful than it should be. With the advent of the fabolous [docker-lambda](https://github.com/lambci/docker-lambda) project by LambCI (which powers [SAM local](https://github.com/awslabs/aws-sam-cli), the [Serverless Framework](https://serverless.com) and [localstack](https://github.com/localstack/localstack)) things got much better. However, the most requested feature is support for warm containers ([aws-sam-cli#239](https://github.com/awslabs/aws-sam-cli/issues/239)) and shorter request times. Warm containers and concurreny would model the production Lambda environment even more closely as you can execute code that is only run once per function instantiation instead of running them on every invocation (e.g. decrypt secrets, load modules, maintain a local cache).

This project set out to solve this problem while still heavily relying on the `docker-lambda` suite of runtimes. Instead of starting a new container for every request, this project implements the server side of the [Lambda Runtime Interface](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-api.html) (LRI). The containers will launch and remain warm while polling the LRI for new invocations. This dramatically reduces the overhead for each invocation and you can expect response times of less than 10ms on average.

<details><summary>Show Benchmark</summary>
<p>

This benchmark is using the example function from the section above. The `ab` command executes 500 requests with a concurrency of 50. The concurrency of the lambda containers is limited to 5, i.e. each container will receive 100 requests.

```
$ ab -l -p payload.json -c 50 -n 500 http://localhost:9001/2015-03-31/functions/MyFunction/invocations

This is ApacheBench, Version 2.3 <$Revision: 1826891 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Server Software:
Server Hostname:        localhost
Server Port:            9001

Document Path:          /2015-03-31/functions/MyFunction/invocations
Document Length:        Variable

Concurrency Level:      50
Time taken for tests:   3.996 seconds
Complete requests:      500
Failed requests:        0
Total transferred:      50596 bytes
Total body sent:        97500
HTML transferred:       13096 bytes
Requests per second:    125.11 [#/sec] (mean)
Time per request:       399.646 [ms] (mean)
Time per request:       7.993 [ms] (mean, across all concurrent requests)
Transfer rate:          12.36 [Kbytes/sec] received
                        23.82 kb/s sent
                        36.19 kb/s total

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    1   1.2      0       6
Processing:    54  382 110.7    373     635
Waiting:       51  372 108.8    363     616
Total:         57  382 110.4    373     636

Percentage of the requests served within a certain time (ms)
  50%    373
  66%    409
  75%    428
  80%    443
  90%    571
  95%    613
  98%    623
  99%    628
 100%    636 (longest request)
 ```

</p>
</details>

## Supported Runtimes

Only runtimes that have been updated by AWS to implement the [Lambda Runtime Interface](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-api.html) are supported.

* nodejs12.x
* nodejs10.x
* python3.8
* python3.7
* java11
* ruby2.5
* provided (any [custom runtime](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-custom.html) implementation)

*use with caution*

* nodejs8.10 (runtime backported from nodejs10.x)
* python3.6 (runtime backported from python3.7)

## Develop

The development server supports hot reloading, so any changes to `/service` will restart the process.

```bash
# install dev dependencies
docker-compose run rapid yarn

# start service
docker-compose up
```
