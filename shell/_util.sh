# --------------------------------------------------------------------------------
# ANSI escape code for green color
export COLOR_GREEN="\033[0;32m"
# ANSI escape code to reset color back to default
export COLOR_RESET="\033[0m" # No Color
# ANSI escape code for red color
export COLOR_RED="\033[0;31m"

echo_green(){
  echo -e "${COLOR_GREEN:?}${*}${COLOR_RESET:?}"
}

# Check if the file exists and source it.
source_robust(){
  local file="${1:?}"

  if [ ! -f "${file:?}" ]; then
    echo -e "${COLOR_RED:?}File not found: ${file:?}${COLOR_RESET:?}"
    exit 1
  fi

  # shellcheck disable=SC1090
  source "${file:?}"
}

# Announces command (prints out the command that is going to be executed).
# Executes the command.
# If the command fails, prints out error and exits.
#
# Note this function will use 'source' with a temporary file, to allow
# the functions that are executed to modify environment variables.
eae(){
  local execution_file=/tmp/execution_file_dendron_setup.sh
  echo "${@:?}" > "${execution_file:?}"

  echo ""
  echo -e "Executing: ${COLOR_GREEN}$(cat "${execution_file:?}")${COLOR_RESET:?}"

  # We use source_robust instead of 'eval' to be able to modify environment variables
  # from the commands that we are running with eae.
  #
  # shellcheck disable=SC1090
  if ! source "${execution_file:?}"; then
    echo -e "${COLOR_RED:?}Error executing: $(cat "${execution_file:?}")${COLOR_RESET:?}"
    exit 1
  fi
}
