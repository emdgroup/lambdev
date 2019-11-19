FROM lambci/lambda-base

ENV PATH=/var/lang/bin:/usr/local/bin:/usr/bin/:/bin:/opt/bin \
    LD_LIBRARY_PATH=/var/lang/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib:/opt/lib \
    AWS_EXECUTION_ENV=AWS_Lambda_python3.7 \
    LAMBDA_TASK_ROOT=/var/task \
    LAMBDA_RUNTIME_DIR=/var/runtime

RUN rm -rf /var/runtime /var/lang /var/rapid && \
  curl -s https://lambci.s3.amazonaws.com/fs/python3.7.tgz | tar -zx -C /

USER sbx_user1051

ENTRYPOINT ["/var/runtime/bootstrap"]
