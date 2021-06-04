echo "update meta..."
VERSION=`cat lerna.json | jq -r ".version"`
PUBLISH_VERSION=`echo "$VERSION" | sed 's/^./1/'`;
sed  -ibak "s/$VERSION/independent/" lerna.json
sed  -ibak "s/\"$VERSION/\"$PUBLISH_VERSION/" packages/dendron-11ty/package.json

echo "create commit..."
git clean -f
git add . 
git commit -m "chore: update 11ty"

echo "publish..."
cd packages/dendron-11ty && npm publish

echo "reset..."
git reset --hard HEAD^