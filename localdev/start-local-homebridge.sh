#!/bin/bash
set -e

# the directory this script is in
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"

# the root directory of the git repo (project)
ROOT_DIR="$(realpath "$DIR/../")"

docker run \
  --rm \
  -it \
  --network "host" \
  -v "$DIR/.homebridge:/homebridge" \
  -v "$DIR/config.json:/homebridge/config.json" \
  -v "$ROOT_DIR/node_modules:/usr/local/lib/node_modules/homebridge-tradfri-gateway/node_modules" \
  -v "$ROOT_DIR/build:/usr/local/lib/node_modules/homebridge-tradfri-gateway/build" \
  -v "$ROOT_DIR/package.json:/usr/local/lib/node_modules/homebridge-tradfri-gateway/package.json" \
  -v "$ROOT_DIR/config.schema.json:/usr/local/lib/node_modules/homebridge-tradfri-gateway/config.schema.json" \
  -e "TZ=Australia/Sydney" \
  -e "PUID=$(id -u)" \
  -e "PGID=$(id -g)" \
  -e "DEBUG=TradfriGateway" \
  -e "HOMEBRIDGE_CONFIG_UI=1" \
  -e "HOMEBRIDGE_CONFIG_UI_PORT=8000" \
  oznu/homebridge:3.3.0
