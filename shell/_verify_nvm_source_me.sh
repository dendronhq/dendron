main() {
  if type nvm > /dev/null 2>&1; then
      echo "nvm is installed."
  else
      echo "nvm is not installed. Please install nvm. (https://github.com/nvm-sh/nvm)"
      exit 1
  fi
}

main "${@}" || exit 1
