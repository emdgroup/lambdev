RUNTIMES = nodejs10.x nodejs8.10 python3.7 python3.6 ruby2.5 provided

define BUILD_RUNTIME

build-$(runtime):
	docker build runtime/$(runtime) -t lambdev/runtime:$(runtime)

push-$(runtime):
	docker push lambdev/runtime:$(runtime)

build-all += build-$(runtime)
push-all += push-$(runtime)

endef

$(foreach runtime,$(RUNTIMES), \
    $(eval $(BUILD_RUNTIME)) \
)

build-service:
	docker build packages/service -t lambdev/service:latest

push-service:
	docker push lambdev/service:latest


build-all: $(build-all)
push-all: $(push-all)

install:
	yarn
	yarn lerna bootstrap

test: install
	yarn test

credentials:
	curl -s 169.254.170.2$(AWS_CONTAINER_CREDENTIALS_RELATIVE_URI)

build: build-service test

publish:
	yarn lerna publish