FROM lambdev/runtime:nodejs10.x

USER root
RUN rm -rf /var/runtime/node_modules/aws-sdk

FROM lambci/lambda-base

ENV PATH=/var/lang/bin:/usr/local/bin:/usr/bin/:/bin:/opt/bin \
    LD_LIBRARY_PATH=/var/lang/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib:/opt/lib \
    AWS_EXECUTION_ENV=AWS_Lambda_nodejs8.10 \
    NODE_PATH=/opt/nodejs/node8/node_modules:/opt/nodejs/node_modules:/var/runtime/node_modules:/var/runtime:/var/task:/var/runtime/node_modules

RUN rm -rf /var/runtime /var/lang && \
  curl -s https://lambci.s3.amazonaws.com/fs/nodejs8.10.tgz | tar -zx -C /

COPY --from=0 /var/runtime /var/runtime
COPY ./bootstrap /var/runtime/

# assert.strict.ok is only available in NodeJS 10+
RUN sed -i 's/^const assert.*/const assert = require("assert");/' /var/runtime/InvokeContext.js

ENTRYPOINT ["/var/runtime/bootstrap"]
