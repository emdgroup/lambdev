FROM node:12-alpine

COPY . /app

RUN cd /app && yarn install --production --frozen-lockfile

WORKDIR /app

EXPOSE 9001

CMD ["node", "/app/packages/service/bin/lambdev"]
