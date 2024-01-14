main() {
  if [[ ! -f "$HOME/.nvm/nvm.sh" ]]
  then
  	echo "File $HOME/.nvm/nvm.sh does NOT exists. Setup NVM refer to https://github.com/nvm-sh/nvm"
  	exit 1
  fi

  # Source nvm script - adjust the path if it's different on your machine
  #
  # -s check if file exists and has a size greater than zero
  [ -s "$HOME/.nvm/nvm.sh" ] && {
    source "$HOME/.nvm/nvm.sh"
    echo "Sourced $HOME/.nvm/nvm.sh"
  }
}

main "${@}" || exit 1
