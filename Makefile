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
	make setup-nextjs-public-assets

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
	env FAST=1 SKIP_SENTRY=1 LOG_LEVEL=info dendron dev package_plugin

docs-push:
	cd docs && zip -r generated-api-docs.zip generated-api-docs
	cd docs && env AWS_DEFAULT_PROFILE=aws-s3-bot aws s3 cp --acl public-read generated-api-docs.zip "s3://org-dendron-public-assets/publish/generated-api-docs.zip"

docs-pull:
	cd docs && curl https://d2q204iup008xl.cloudfront.net/publish/generated-api-docs.zip -O -J -L
	cd docs && unzip generated-api-docs.zip
	cd docs && rm generated-api-docs.zip

docs-build:
	yarn typedoc --plugin typedoc-plugin-markdown --out docs/generated-api-docs --entryPointStrategy packages "packages/{common-all,common-server}" 

setup-nextjs-test:
	cd test-workspace && npx dendron exportPod --podId dendron.nextjs --config "dest=../packages/nextjs-template/"

setup-nextjs-public-assets:
	cd packages/nextjs-template && curl -LO https://artifacts-prod-artifactb7980f61-19orqnnuurvwy.s3.us-west-2.amazonaws.com/artifacts/dendron-site.zip && unzip dendron-site.zip
	cd packages/nextjs-template && yarn copy:robotstxt
