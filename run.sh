#!/bin/bash
set -e

export NODE_ENV=mainnet
# TODO: Add your account ID
# export NEAR_ACCOUNT_ID=abc.near
export CONTRACT_NAME=priceoracle.near
export PRINT_DEBUG=true

cd $(dirname "$0")
mkdir -p logs

while :
do
  DATE=$(date "+%Y_%m_%d")
  date | tee -a logs/logs_$DATE.txt
  # TODO: Update your path to the node binary if necessary
  /usr/local/bin/node index.js 2>&1 | tee -a logs/logs_$DATE.txt
  sleep 5
done
