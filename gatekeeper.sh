#!/bin/sh

#
# this is simple script to open the door after RFID card swipe.
# it is intended to run on OpenWrt router with a RFID-USB adapter.
# NOTE: some values are hardcoded for A5-V11 router to controll
# door lock via blue system led.
#
# ## setup
#
# to prepare your router install required usb hid modules to get
# /dev/hidraw0 device then RFID adapter is pluged in.
#
# ## usage
#
# create your users in $USER_DIR simply with touch command, then
# add card to a user by creating symlink in $CARD_PATH named as
# card number and pointing to users file.


source ./config.sh

trap 'pkill -P $$' EXIT


translate_data()
{
	rm -fr $FIFO_FILE
	mkfifo $FIFO_FILE
	cat $READ_DEVICE | tr '\36\37\40\41\42\43\44\45\46\47\50' "1234567890\n" > $FIFO_FILE
}

led()
{
	echo -n $2 > /sys/class/gpio/gpio$1/value
}

open_door()
{

	led $GPIO_BUZ 1

	led $GPIO_MAG 1
	led $GPIO_LED_GREEN 1

	ping -qc1 localhost >/dev/null
	led $GPIO_BUZ 0
	
	sleep $DOOR_DELAY

	led $GPIO_MAG 0
	led $GPIO_LED_GREEN 0
}

access()
{
	mkdir -p $CARD_PATH
	mkdir -p $USER_PATH
	led 0
	while true
	do
		if read CID
		then
			echo "CardSwipe: $CID"
			if [ -L $CARD_PATH/$CID ]
			then
				NAME=$(basename $(readlink $CARD_PATH/$CID))
				echo "OpenDoor: card($CID) user($NAME)"
				open_door
			else
				echo "NoAccess: $CID"
				led $GPIO_LED_RED 1
				led $GPIO_BUZ 1
				sleep 1
				led $GPIO_LED_RED 0
				led $GPIO_BUZ 0
			fi
		fi
	done < $FIFO_FILE
}


echo 'Starting data processor'
translate_data &
P1=$!
sleep 1

echo 'Starting main process'
access &
P2=$!
sleep 1

echo 'Starting watchdog'
while true
do
	sleep 1
	if [ ! -c $READ_DEVICE ]
	then
		echo "ERROR: HID device gone missing"
		kill $P1 $P2
		exit 1
	fi
done
