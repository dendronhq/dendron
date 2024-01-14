main() {
  if command -v yarn > /dev/null 2>&1; then
      echo "Verified Yarn is installed."
  else
      echo "Yarn is not installed. Please install Yarn."
      exit 1
  fi
}

main "${@}" || exit 1
