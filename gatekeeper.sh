#!/bin/bash

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

io()
{
	if [ -z "$2" ]
	then
		cat /sys/class/gpio/gpio$1/value
	else
		echo -n $2 > /sys/class/gpio/gpio$1/value
	fi
}

open_door()
{

	io $GPIO_BUZ 1

	io $GPIO_MAG 1
	io $GPIO_LED_GREEN 1

	sleep .1
	io $GPIO_BUZ 0
	
	sleep $DOOR_DELAY

	io $GPIO_MAG 0
	io $GPIO_LED_GREEN 0
}

open_exit()
{
	while true
	do
		state=$(io $GPIO_BTN)
		if [ $state -eq 1 ]
		then
			echo "OpenDoor: button_press"
			open_door
		fi
		sleep 0.001
	done
}

access()
{
	mkdir -p $CARD_PATH
	mkdir -p $USER_PATH
	io $GPIO_MAG 0
	while true
	do
		if read CID
		then
			echo "CardSwipe: $CID"

			if msg=$(./dbreader.lua "$CID")
			then
				echo "OpenDoor: card($CID) user($msg)"
				open_door
			else
				access_denied "$msg"
			fi
		fi
	done < $FIFO_FILE
}

access_denied()
{
	echo "NoAccess: $1"
	io $GPIO_LED_RED 1
	io $GPIO_BUZ 1
	sleep 1
	io $GPIO_LED_RED 0
	io $GPIO_BUZ 0
}

heartbeat()
{
	while true
	do
		if ping -nc1 -w1 ip.at.lt &>/dev/null
		then
			io $GPIO_LED_BLUE 1 ; sleep .01 ; io $GPIO_LED_BLUE 0 ; sleep .2
			io $GPIO_LED_BLUE 1 ; sleep .01 ; io $GPIO_LED_BLUE 0 ; sleep .2
		else
			io $GPIO_LED_BLUE 1 ; sleep 2 ; io $GPIO_LED_BLUE 0
		fi
		sleep 1
	done
}

echo 'Starting data processor'
translate_data &
sleep 1

echo 'Starting access process'
access &
sleep 1

echo 'Starting exit process'                                  
open_exit &                                                        
sleep 1

echo 'Starting heartbeat process'
heartbeat &
sleep 1

echo 'Starting watchdog'
while true
do
	sleep 1
	if [ ! -c $READ_DEVICE ]
	then
		echo "ERROR: HID device gone missing"
		for i in {1..15}
		do
			io $GPIO_LED_RED 1 ; io $GPIO_LED_GREEN 1 ; io $GPIO_LED_BLUE 1 ; io $GPIO_BUZ 1
			sleep .7
			io $GPIO_LED_RED 0 ; io $GPIO_LED_GREEN 0 ; io $GPIO_LED_BLUE 0 ; io $GPIO_BUZ 0
			sleep .3
		done
		reboot
	fi
done

