FROM lambci/lambda-base

RUN curl -s https://lambci.s3.amazonaws.com/fs/java11.tgz | tar -zx -C /opt

FROM lambci/lambda-base-2

ENV PATH=/var/lang/bin:$PATH \
    LD_LIBRARY_PATH=/var/lang/lib:$LD_LIBRARY_PATH \
    AWS_EXECUTION_ENV=AWS_Lambda_java11

COPY --from=0 /opt/* /var/

USER sbx_user1051

ENTRYPOINT ["/var/runtime/bootstrap", "--enable-msg-logs"]
