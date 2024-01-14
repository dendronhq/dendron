main() {
  if command -v npm > /dev/null 2>&1; then
      echo "Verified npm is installed."
  else
      echo "npm is not installed. Please install Node.js and npm."
      exit 1
  fi
}

main "${@}" || exit 1
