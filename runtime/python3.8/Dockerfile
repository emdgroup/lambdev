FROM lambci/lambda-base

ENV PATH=/var/lang/bin:$PATH \
    LD_LIBRARY_PATH=/var/lang/lib:$LD_LIBRARY_PATH \
    AWS_EXECUTION_ENV=AWS_Lambda_python3.8

RUN rm -rf /var/runtime /var/lang /var/rapid && \
  curl -s https://lambci.s3.amazonaws.com/fs/python3.8.tgz | tar -zx -C /opt

FROM lambci/lambda-base-2

COPY --from=0 /opt/* /var/

USER sbx_user1051

ENTRYPOINT ["/var/runtime/bootstrap"]
