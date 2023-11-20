const { parentPort } = require('worker_threads')
const fs = require('fs')
const { shell, sendMessageFactory, writeFileSilent } = require('../utils')
const sendMessage = sendMessageFactory('gpio', parentPort)
const config = require('../config')
sendMessage('loading', {})

function getPinBy(field, value) {
    return config.pins.find(p => p[field] == value)
}
function invert(value) {
    return (value==1)?0:1
}
function ioGet(pin) {
    const value = parseInt(fs.readFileSync(`/sys/class/gpio/gpio${pin.number}/value`).toString())
    return (pin.invert)?invert(value):value
}
function ioSet(pin, value) {
    value = (pin.invert) ? invert(value) : value
    value = (value == 1) ? 1 : 0
    fs.writeFileSync(`/sys/class/gpio/gpio${pin.number}/value`, `${value}`)
}

function setup() {
    for (const pin of config.pins) {
        writeFileSilent(`/sys/class/gpio/unexport`,                    `${pin.number}`)
        writeFileSilent(`/sys/class/gpio/export`,                      `${pin.number}`)
        writeFileSilent(`/sys/class/gpio/gpio${pin.number}/direction`, `${pin.direction}`)
        writeFileSilent(`/sys/class/gpio/gpio${pin.number}/value`,     `${pin.value}`)
        writeFileSilent(`/sys/class/gpio/gpio${pin.number}/edge`,      'both')

        fs.watch(`/sys/class/gpio/gpio${pin.number}/value`, () => onPinStateChange(pin))

        onPinStateChange(pin)
    }
}

function onPinStateChange(pin) {
    pin.value = ioGet(pin)
    sendMessage('pinChange', {role:pin.role, direction:pin.direction, value:pin.value})
}

function unlockDoor() {
    ioSet(getPinBy('role', 'doorMagnet'), 1);
    setTimeout( ()=>{
        ioSet(getPinBy('role', 'doorMagnet'), 0)
    }, 3000);
}

function beep(ms) {
    ioSet(getPinBy('role', 'buzzer'), 1);
    setTimeout( ()=>{
        ioSet(getPinBy('role', 'buzzer'), 0)
    }, ms);
}
function beepGood() { beep( 150); }
function beepBad()  { beep( 800); }



parentPort.on('message', message => {
    if (message.topic == 'pinChange') {
        if (message.role == "b")          ioSet(getPinBy('role', 'g'), message.value)
        if (message.role == "c")          ioSet(getPinBy('role', 'h'), message.value)
        if (message.role == 'spacePower') ioSet(getPinBy('role', 'buzzer'), message.value)
    }
    if (message.module == 'mqtt' && message.topic == 'pinSet') {
        if (message.role == 'buzzer' && message.value == 1) {
            beepGood();
        } else {
            beepBad();
        }
    }
    if (message.module == 'access') {
        if (message.topic == 'accessGranted' || message.topic == 'exitGranted') {
            unlockDoor();
            beepGood();
        }
        if (message.topic == 'accessDenied') {
            beepBad();
        }
    }


})

setup();

