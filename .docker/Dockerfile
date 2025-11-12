FROM node:16-alpine
RUN apk add git patch jq && mkdir /oracle && cd /oracle
USER node
USER root
RUN chown node:node /oracle

USER node
WORKDIR /oracle
RUN cd /oracle && git clone https://github.com/NearDeFi/near-price-oracle-bot.git . 
COPY patch /oracle/patch
RUN cd /oracle && patch -p1 < /oracle/patch
RUN cd /oracle && npm install && npm ci --only=production

VOLUME /home/node

ENTRYPOINT [ "/oracle/run.sh" ]

# docker build -t local/near-price-oracle:latest -f Dockerfile .
# docker run --init -d --name near-price-oracle --rm -v /var/near/oracle:/home/node:rw local/near-price-oracle:latest
