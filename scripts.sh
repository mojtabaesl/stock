#!/bin/bash

PRIMARY_DNS="185.51.200.2"
SECONDARY_DNS="178.22.122.100"
RESOLV_CONF="/etc/resolv.conf"
RESOLV_CONF_BACKUP="/etc/resolv.conf.backup"
script_error=false

############
_print_new_line() {
  echo ""
}

_title() {
  BLUE="\033[0;34m"
  RESET="\033[0m"
  _print_new_line
  echo -e "${BLUE}## $1${RESET}"
  _print_new_line
}

_info() {
  echo "$1"
}

_error() {
  echo -e "\033[31mError: $1\033[0m" >&2
}

_success() {
  _print_new_line
  printf "\r\e[32m✔ Success: %s\e[0m          \n" "$1"
}

_error_handler() {
  _error "$1"
  script_error=true
}

_error_handler() {
  echo -e "\033[31mError: $1\033[0m" >&2
  script_error=true
}

_set_shecan() {
  sudo bash -c "cat > $RESOLV_CONF" <<EOL
nameserver $PRIMARY_DNS
nameserver $SECONDARY_DNS
EOL
}

_backup_resolv_conf() {
  if [[ -f "$RESOLV_CONF" ]]; then
    sudo cp "$RESOLV_CONF" "$RESOLV_CONF_BACKUP" || _error_handler "Failed to create a backup of $RESOLV_CONF"
    _info "Backup of current nameservers saved to $RESOLV_CONF_BACKUP"
  else
    _error_handler "No $RESOLV_CONF file found to back up."
  fi
}

_restore_resolv_conf() {
  if [[ -f "$RESOLV_CONF_BACKUP" ]]; then
    sudo cp "$RESOLV_CONF_BACKUP" "$RESOLV_CONF"
    _info "Nameservers restored to initial values from backup."
  fi
}
############

_print_new_line
read -p "Do you want to use Shecan? (y/n, default: n) : " use_shecan
use_shecan="${use_shecan:-n}"

if [[ "$use_shecan" == "y" || "$use_shecan" == "Y" ]]; then
  _title "PREP - Updating $RESOLV_CONF..."
  _backup_resolv_conf
  _set_shecan
else
  _restore_resolv_conf
  echo "Shecan will not be used."
fi

_title "1 - Installing system packages"
if [ "$script_error" == false ]; then
  sudo apt update && sudo apt upgrade -y
  sudo apt install tmux curl -y || _error_handler "Failed to install required system packages"
else
  _info "Error occurred, skipping this step."
fi

_title "2 - Installing Volta"
if [ "$script_error" == false ]; then
  curl https://get.volta.sh | bash || _error_handler "Failed to install Volta"
  export VOLTA_HOME="$HOME/.volta"
  export PATH="$VOLTA_HOME/bin:$PATH"
else
  _info "Error occurred, skipping this step."
fi

_title "3 - Installing NodeJS"
if [ "$script_error" == false ]; then
  volta install node@20.18.1 || _error_handler "Failed to install NodeJS"
  node -v || _error_handler "Failed to verify NodeJS installation"
  npm -v || _error_handler "Failed to verify npm installation"
else
  _info "Error occurred, skipping this step."
fi

_title "4 - Installing NPM packages"
if [ "$script_error" == false ]; then
  npm i || _error_handler "Failed to install NPM packages"
else
  _info "Error occurred, skipping this step."
fi

_title "5 - Installing Playwright Chromium"
if [ "$script_error" == false ]; then
  npx playwright install chromium || _error_handler "Failed to install Playwright Chromium"
else
  _info "Error occurred, skipping this step."
fi

_title "6 - Installing Playwright deps"
if [ "$script_error" == false ]; then
  npx playwright install-deps || _error_handler "Failed to install Playwright dependencies"
else
  _info "Error occurred, skipping this step."
fi

_title "7 - Building App"
if [ "$script_error" == false ]; then
  npm run build || _error_handler "Failed to build the app"
else
  _info "Error occurred, skipping this step."
fi

if [ "$script_error" == false ]; then
  _success "Script completed successfully!"
fi
