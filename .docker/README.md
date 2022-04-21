Build docker image with:

`docker build -t oracle-price-bot:latest -f Dockerfile .`

Create directory `/var/near/oracle` and copy near credentials file to `/var/near/oracle/key.json`

Start image with:

`docker run --init -d --name oracle-price-bot --restart always -v /var/near/oracle:/home/node:rw oracle-price-bot`

