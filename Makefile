build: | node_modules
	npm run make

clean:
	rm -rf out

.PHONY: build clean

node_modules: package.json
	npm install
	touch $@

