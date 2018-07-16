#!/bin/bash

source ./config.sh

echo "Enabling STDIN on target"

echo > $DEVICE && sleep 2
echo > $DEVICE && sleep 2

echo "Compressing current folder ... "
tar -czf repo.tgz .

echo "Prepare target"
echo "mkdir -p $DIR && cd $DIR" > $DEVICE

echo "Send it ... "
echo "echo -n \"$(cat repo.tgz | xxd -i | tr -d ", " | sed 's/0x/\\x/g')\" > $DIR/transfer" > $DEVICE

echo "Convert to binary .."
echo "echo -ne \$(cat $DIR/transfer | tr -d \"\\n\") > $DIR/transfer.bin" > $DEVICE

echo "Extract .."
echo 'tar -xzf transfer.bin'> $DEVICE

echo "Cleanup .."
echo 'rm transfer transfer.bin' > $DEVICE
rm repo.tgz

echo "Run INIT"
echo "./init.sh" > $DEVICE

echo "Should be done, now wait ...."
echo "If it brakes you'll get to keep both pieces"

