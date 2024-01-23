main() {
  MIN_VERSION="14.0.0"

  # Get the current Node.js version
  CURRENT_VERSION=$(node -v | sed 's/v//') # Removes the 'v' prefix from version

  # Function to compare versions
  version_gt() { test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"; }

  # Check if the current version is greater than or equal to the minimum version
  if version_gt "$CURRENT_VERSION" "$MIN_VERSION"; then
      echo "Current Node.js version is $CURRENT_VERSION. Proceeding..."
  else
      echo "Error: Node.js version must be $MIN_VERSION or greater. Current version is $CURRENT_VERSION."
      exit 1
  fi
}

main "${@}" || exit 1
