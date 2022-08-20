clean:
	echo "Cleaning project"
	./bootstrap/scripts/cleanup.sh

install: 
	echo "Installing yarn dependencies..."
	yarn
	echo "Installing package dependencies..."
	yarn setup

watch: 
	echo "Watching for changes..."
	./bootstrap/scripts/watch.sh

cleanBuild:
	echo "Clean building..."
	make clean
	make install

db-gen:
	cd packages/engine-server && yarn prisma generate 
	cd packages/engine-server && rm -rf lib/generated-prisma-client
	cd packages/engine-server && cp -R src/generated-prisma-client lib/generated-prisma-client

start-local-registry:
	yarn config set registry http://localhost:4873
	npm set registry http://localhost:4873/
	npx verdaccio -c ./bootstrap/data/verdaccio/config.yaml &

build-plugin:
	lerna publish from-package --ignore-scripts
	dendron dev prep_plugin && rm package.json
	dendron dev package_plugin


