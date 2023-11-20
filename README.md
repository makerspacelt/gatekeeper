Schematics and PCB: https://github.com/makerspacelt/maglock-hw

Dependencies: `apt install i2c-tools imagemagick nodejs bind9-dnsutils`.
Tested with Debian Bookworm.

Run:
* Create `config.js` based on `config-example.js`
* Run `node main.js` (for dev) or `./start.sh` (with supervision)

To make it run on startup:
* Add `/root/gatekeeper-node/start.sh | logger -t MAGLOCK &` to /etc/rc.local
* Make sure `rc-local.service` is enabled: `systemctl enable rc-local.service`
