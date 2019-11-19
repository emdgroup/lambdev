
FROM lambci/lambda-base

ENV PATH=/var/lang/bin:/var/lang/bin:/usr/local/bin:/usr/bin/:/bin:/opt/bin \
    LD_LIBRARY_PATH=/var/lang/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib:/opt/lib \
    AWS_EXECUTION_ENV=AWS_Lambda_ruby2.5 \
    RUBYLIB=/var/task:/var/runtime/lib:/opt/ruby/lib \
    GEM_HOME=/var/runtime \
    GEM_PATH=/var/task/vendor/bundle/ruby/2.5.0:/opt/ruby/gems/2.5.0 \
    _=/var/runtime/lib/runtime.rb



RUN rm -rf /var/runtime /var/lang /var/rapid && \
  curl -s https://lambci.s3.amazonaws.com/fs/ruby2.5.tgz | tar -zx -C / && \
  sed -i 's/LAMBDA_SERVER_ADDRESS = .*/LAMBDA_SERVER_ADDRESS = "http:\/\/" + ENV["AWS_LAMBDA_RUNTIME_API"] + "\/2018-06-01"/' /var/runtime/lib/lambda_server.rb

USER sbx_user1051

ENTRYPOINT ["/var/runtime/bootstrap"]
