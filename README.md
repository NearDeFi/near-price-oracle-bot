# Near Price Oracle bot

### Hot to run a Near Price Oracle bot as a service (Linux)

- Update `/service/near-oracle.service` to specify user and path (ExecStart)
- Install service: `./install.sh`
- Check logs: `sudo journalctl -u near-oracle.service -f`
- Stop Service `sudo systemctl stop near-oracle.service`
- Start service `sudo systemctl start near-oracle.service`



