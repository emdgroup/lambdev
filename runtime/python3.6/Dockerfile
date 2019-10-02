FROM lambdev/runtime:python3.7

FROM lambci/lambda-base

ENV PATH=/var/lang/bin:$PATH \
    LD_LIBRARY_PATH=/var/lang/lib:$LD_LIBRARY_PATH \
    AWS_EXECUTION_ENV=AWS_Lambda_python3.6

RUN rm -rf /var/runtime /var/lang && \
  curl -s https://lambci.s3.amazonaws.com/fs/python3.6.tgz | tar -zx -C / && \
  rm -rf /var/runtime/awslambda

COPY ./bootstrap /var/runtime
COPY --from=0 \
  /var/runtime/bootstrap.py \
  /var/runtime/lambda_runtime_client.py \
  /var/runtime/lambda_runtime_exception.py \
  /var/runtime/lambda_runtime_marshaller.py \
  /var/runtime/runtime-release \
  /var/runtime/

USER sbx_user1051

ENTRYPOINT ["/var/runtime/bootstrap"]
