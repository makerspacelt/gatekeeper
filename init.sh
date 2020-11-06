#!/bin/ash

source ./config.sh

echo "Setting up system settings"

uci set system.@system[0].hostname='gatekeeper'
uci set system.@system[0].zonename='Europe/Vilnius'
uci set system.@system[0].timezone='EET-2EEST,M3.5.0/3,M10.5.0/4'
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

echo -n "Waiting for network "
while ! ping -c 1 1.1.1.1 &> /dev/null; do
	echo -n "."
	sleep 1
done
echo

echo "Installing packages ...."
updated=0
packages="kmod-usb2 kmod-usb-uhci kmod-usb-ohci kmod-usb-hid usbutils \
	git bash coreutils-sleep procps-ng-pkill \
	lua luci-lib-jsonc \
	curl ca-certificates ca-bundle"

for package in $packages
do
	if opkg list-installed | grep "^$package "
	then
		continue
	fi
	if [ $updated -eq 0 ]
	then
		opkg update
		updated=1
	fi
	opkg install $package
done

echo "Checking ssh keys ...."
if [ -f "/root/.ssh/id_rsa" ]; then
		echo "Keys exist skip ..."
else
		mkdir -p /root/.ssh
		dropbearkey -t rsa -f /root/.ssh/id_rsa | grep ^ssh > /root/.ssh/id_rsa.pub
fi

mkdir -p $ETC

cat > /etc/rc.local << EOF
sleep 2
cd /root/gatekeeper
./setup.sh | logger -t MAGLOCK
./gatekeeper.sh | logger -t MAGLOCK &
exit 0
EOF

halt

