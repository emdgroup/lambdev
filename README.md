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

Serverless development always felt a little more painful than it should be. With the advent of the fabolous [docker-lambda](https://github.com/lambci/docker-lambda) project by LambCI (which powers [SAM local](https://github.com/awslabs/aws-sam-cli), the [Serverless Framework](https://serverless.com) and [localstack](https://github.com/localstack/localstack)) things got much better. However, the most requested feature is support for warm containers ([aws-sam-cli#239](https://github.com/awslabs/aws-sam-cli/issues/239)) and shorter request times. This will model the production Lambda environment even more realsitically as you can execute code that is only run once per function instantiation instead of running them on every invocation (e.g. decrypt secrets, load modules, maintain a local cache).

This project set out to solve this problem while still heavily relying on the `docker-lambda` suite of runtimes. Instead of starting a new container for every request, this project implements the server side of the [Lambda Runtime Interface](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-api.html) (LRI). The containers will launch and remain warm while polling the LRI for new invocations. This dramatically reduces the overhead for each invocation and you can expect response times of less than 10ms on average.

<details><summary>Benchmark</summary>
<p>

This benchmark is using the example function from the section above. The `ab` command executes 500 requests with a concurrency of 50. The concurrency of the lambda containers is limited to 5, i.e. each container will receive 100 requests.

```
$ ab -l -p payload.json -c 50 -n 500 http://localhost:9001/2015-03-31/functions/MyFunction/invocations

This is ApacheBench, Version 2.3 <$Revision: 1826891 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking localhost (be patient)
Completed 100 requests
Completed 200 requests
Completed 300 requests
Completed 400 requests
Completed 500 requests
Finished 500 requests


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
