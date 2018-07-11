#!/bin/ash

source config.sh

echo "Setting up system settings"

uci set system.@system[0].hostname='gatekeeper'
uci commit system

uci set network.wan=interface
uci set network.wan.proto='dhcp'
uci del network.lan.ipaddr
uci del network.lan.netmask
uci del network.lan.ip6assign
uci set network.lan.proto='dhcp'
uci commit network

uci del wireless.radio0.disabled
uci set wireless.radio0.channel='auto'
uci set wireless.default_radio0.network='wan'
uci set wireless.default_radio0.mode='sta'
uci set wireless.default_radio0.ssid="$SSID"
uci set wireless.default_radio0.encryption='psk2'
uci set wireless.default_radio0.key="$SSID_KEY"
uci commit wireless

uci set dhcp.lan.ignore='1'
uci commit dhcp

/etc/init.d/firewall disable
/etc/init.d/firewall stop

/etc/init.d/network restart

sleep 10

opkg update
opkg install git

echo "Creating ssh key"
mkdir -p /root/.ssh
dropbearkey -t rsa -f /root/.ssh/id_rsa

read -p "Add deploy key to gitlab and press any key..."

mkdir -p /etc/space-db
cd /etc/space-db
GIT_SSH_COMMAND='ssh -i /root/.ssh/id_rsa' git clone $DB_REPO .

cat > /etc/rc.local << EOF
sleep 2
cd /root/gatekeeper
./setup.sh | logger -t MAGLOCK
./gatekeeper.sh | logger -t MAGLOCK &
exit 0
EOF

read -p "Press any key to reboot ..."
halt

