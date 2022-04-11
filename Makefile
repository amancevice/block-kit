APP := Block\ Kit

build: | node_modules
	npm run make

start:
	npm start

install: build
	rm -rf /Applications/$(APP).app
	cp -r out/$(APP)-darwin-x64/$(APP).app /Applications/$(APP).app
	open /Applications/$(APP).app

clean:
	rm -rf out

clobber: clean
	rm -rf /Applications/$(APP).app
	rm -rf ~/Library/Application\ Support/$(APP)

.PHONY: build clean clobber install

node_modules: package.json
	npm install
	touch $@

