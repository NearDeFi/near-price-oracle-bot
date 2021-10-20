#! /bin/sh

# Other deployment actions here. Want to install (or bounce) service last.

if [ -f /etc/systemd/system/near-oracle.service ]; then
    sudo systemctl stop near-oracle.service
    sudo systemctl disable near-oracle.service
fi

sudo cp -f ./service/near-oracle.service /etc/systemd/system/near-oracle.service

sudo systemctl daemon-reload
sudo systemctl enable near-oracle.service
sudo systemctl start near-oracle.service
