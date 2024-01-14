main() {
  # -z: returns true when value is empty.
  if [[ -z "${DENDRON_MONOREPO}" ]]; then
    echo "DENDRON_MONOREPO environment variable is not set."
    exit 1
  fi
}

main "${@}" || exit 1
