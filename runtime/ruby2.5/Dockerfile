
FROM lambci/lambda-base

ENV PATH=/var/lang/bin:$PATH \
    LD_LIBRARY_PATH=/var/lang/lib:$LD_LIBRARY_PATH \
    AWS_EXECUTION_ENV=AWS_Lambda_ruby2.5

RUN rm -rf /var/runtime /var/lang /var/rapid && \
  curl -s https://lambci.s3.amazonaws.com/fs/ruby2.5.tgz | tar -zx -C / && \
  sed -i 's/LAMBDA_SERVER_ADDRESS = .*/LAMBDA_SERVER_ADDRESS = "http:\/\/" + ENV["AWS_LAMBDA_RUNTIME_API"] + "\/2018-06-01"/' /var/runtime/lib/lambda_server.rb

USER sbx_user1051

ENTRYPOINT ["/var/runtime/bootstrap"]
