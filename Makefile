RUNTIMES = nodejs10.x nodejs8.10 python3.7 python3.6 ruby2.5

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
	docker build service -t lambdev/service:latest

push-service:
	docker push lambdev/service:latest


build-all: $(build-all)
push-all: $(push-all)
