FROM lambci/lambda-base

RUN rm -rf /var/runtime /var/lang /var/rapid && \
  curl -s https://lambci.s3.amazonaws.com/fs/python3.8.tgz | tar -zx -C /opt

FROM lambci/lambda-base-2

ENV PATH=/usr/local/bin:/usr/bin/:/bin:/opt/bin \
    LD_LIBRARY_PATH=/var/lang/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib:/opt/lib \
    AWS_EXECUTION_ENV=AWS_Lambda_python3.8 \
    LAMBDA_TASK_ROOT=/var/task \
    LAMBDA_RUNTIME_DIR=/var/runtime \
    PYTHONPATH=/var/runtime

COPY --from=0 /opt/* /var/

USER sbx_user1051

ENTRYPOINT ["/var/runtime/bootstrap"]
