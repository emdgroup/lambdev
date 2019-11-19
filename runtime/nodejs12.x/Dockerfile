FROM lambci/lambda-base

RUN curl -s https://lambci.s3.amazonaws.com/fs/nodejs12.x.tgz | tar -zx -C /opt

FROM lambci/lambda-base-2

ENV PATH=/var/lang/bin:/usr/local/bin:/usr/bin/:/bin:/opt/bin \
    LD_LIBRARY_PATH=/var/lang/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib:/opt/lib \
    AWS_EXECUTION_ENV=AWS_Lambda_nodejs12.x \
    NODE_PATH=/opt/nodejs/node12/node_modules:/opt/nodejs/node_modules:/var/runtime/node_modules \
    LAMBDA_TASK_ROOT=/var/task \
    LAMBDA_RUNTIME_DIR=/var/runtime

COPY --from=0 /opt/* /var/

USER sbx_user1051

ENTRYPOINT ["/var/runtime/bootstrap"]
