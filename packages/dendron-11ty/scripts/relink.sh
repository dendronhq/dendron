# ENGINE_SERVER_VERSION="0.23.1-alpha.0"
# COMMON_SERVER_VERSION="0.22.2-alpha.0"

ENGINE_VERSION=`cat ../dendron/meta.json | jq -r '.["@dendronhq/engine-server"]'`
COMMON_SERVER_VERSION=`cat ../dendron/meta.json | jq -r '.["@dendronhq/common-server"]'`
COMMON_ALL_VERSION=`cat ../dendron/meta.json | jq -r '.["@dendronhq/common-all"]'`

pkg1="@dendronhq/engine-server@$ENGINE_VERSION"
pkg2="@dendronhq/common-server@$COMMON_SERVER_VERSION"
pkg3="@dendronhq/common-all@$COMMON_ALL_VERSION"

yarn unlink @dendronhq/engine-server
yarn unlink @dendronhq/common-server
yarn unlink @dendronhq/common-all

echo "installing $pkg1"
yarn add --force $pkg1
echo "installing $pkg2"
yarn add --force $pkg2
echo "installing $pkg3"
yarn add --force $pkg3


# VERSION="0.22.2-alpha.0"

# ENGINE_VERSION=`cat ../../dendron/meta.json | jq -r '.["@dendronhq/engine-server"]'`
# COMMON_SERVER_VERSION=`cat ../../dendron/meta.json | jq -r '.["@dendronhq/common-server"]'`
# COMMON_TEST_UTILS_VERSION=`cat ../../dendron/meta.json | jq -r '.["@dendronhq/common-test-utils"]'`

# pkg1="@dendronhq/engine-server@$ENGINE_VERSION"
# pkg2="@dendronhq/common-all@$COMMON_ALL_VERSION"
# pkg3="@dendronhq/common-test-utils@$COMMON_TEST_UTILS_VERSION"
# npm unlink @dendronhq/engine-server
# npm unlink @dendronhq/common-all
# npm unlink @dendronhq/common-test-utils
# echo "installing $pkg"
# npm add --force $pkg1
# npm add --force $pkg2
# npm add --force $pkg3
