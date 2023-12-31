#!/bin/bash

cd "$(dirname "$0")" || true
node main.js &
echo $! > /run/gatekeeper.pid

goReboot()
{
	checkHealth
	echo "ERROR: checkHealth return $?"

	for i in {1..20}; do
		echo 1 >/sys/class/gpio/gpio6/value
		sleep 0.2
		echo 0 >/sys/class/gpio/gpio6/value
		sleep 0.2
	done
	reboot
}

checkHealth()
{
	! ps "$(cat /run/gatekeeper.pid)" >/dev/null && echo "healthCheck failed: main process not found" && return 10

	dmesg | grep -q "U[S]B disconnect"           && echo "healthCheck failed: USB disconnect" && return 20

	dmesg | grep -q "disabled by hub (EMI[?])"   && echo "healthCheck failed: USB EMI" && return 30

	dmesg | grep -q "Out of m[e]mory[:] Kill"    && echo "healthCheck failed: Out Of memory" && return 40

	return 0
}

sleep 120 # wait before healthCheck

while true; do
	sleep 5
	checkHealth || break
done

goReboot

