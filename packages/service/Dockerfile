FROM node:12-alpine AS build

COPY . /app

RUN cd /app && yarn --production

FROM node:12-alpine

COPY --from=build /app /app

WORKDIR /app

EXPOSE 9001

CMD ["node", "/app"]
