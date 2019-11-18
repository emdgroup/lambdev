FROM lambci/lambda-base

ENV AWS_EXECUTION_ENV=AWS_Lambda_go1.x

RUN rm -rf /var/runtime /var/lang && \
  curl -sL https://lambci.s3.amazonaws.com/fs/go1.x.tgz | tar -zx -C /
