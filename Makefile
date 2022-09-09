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

start-local-registry:
	yarn config set registry http://localhost:4873
	npm set registry http://localhost:4873/
	npx verdaccio -c ./bootstrap/data/verdaccio/config.yaml

publish-local:
	lerna publish from-package --ignore-scripts

build-plugin:
	dendron dev prep_plugin && rm package.json
	dendron dev package_plugin

setup-nextjs-test:
	cd test-workspace && npx dendron exportPod --podId dendron.nextjs --config "dest=../packages/nextjs-template/"
