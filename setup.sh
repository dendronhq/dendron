# Description: Setup the environment for Dendron development.
#
# For further documentation refer to [Dendron Plugin Quickstart]:
# https://docs.dendron.so/notes/64f0e2d5-2c83-43df-9144-40f2c68935aa/
main() {
  export DENDRON_MONOREPO="${PWD:?}"

  "${DENDRON_MONOREPO:?}"/shell/setup.sh
}

main "${@}" || exit 1
