const { parentPort } = require('worker_threads')
const { shell } = require('./utils')
const fs = require('fs')
const { sendMessageFactory } = require('./utils')
const sendMessage = sendMessageFactory('gpio', parentPort)

const pins = [
    {role: 'exitButton', name:  'sw1', number:   1, direction:  'in', value: 0, invert: true},
    {role:          'b', name:  'sw2', number:   0, direction:  'in', value: 0, invert: true},
    {role:          'c', name:  'sw3', number:   3, direction:  'in', value: 0, invert: true},
    {role: 'spacePower', name:  'sw4', number:   2, direction:  'in', value: 0, invert: true},
    {role:     'buzzer', name:  'buz', number:   6, direction: 'out', value: 0, invert: false},
    {role: 'doorMagnet', name: 'rel1', number:   7, direction: 'out', value: 0, invert: false},
    {role:          'g', name: 'rel2', number: 199, direction: 'out', value: 0, invert: false},
    {role:          'h', name: 'rel3', number: 198, direction: 'out', value: 0, invert: false},
]

function getPinBy(field, value) {
    return pins.find(p => p[field] == value)
}
function invert(value) {
    return (value==1)?0:1
}
function ioGet(pin) {
    const value = parseInt(fs.readFileSync(`/sys/class/gpio/gpio${pin.number}/value`).toString())
    return (pin.invert)?invert(value):value
}
function ioSet(pin, value) {
    value = (pin.invert)?invert(value):value
    fs.writeFileSync(`/sys/class/gpio/gpio${pin.number}/value`, value)
}

function setup() {
    for (const pin of pins) {
        shell(`echo ${pin.number}    2>/dev/null > /sys/class/gpio/unexport`)
        shell(`echo ${pin.number}    2>/dev/null > /sys/class/gpio/export`)
        shell(`echo ${pin.direction} 2>/dev/null > /sys/class/gpio/gpio${pin.number}/direction`)
        shell(`echo ${pin.value}     2>/dev/null > /sys/class/gpio/gpio${pin.number}/value`)
        shell(`echo both             2>/dev/null > /sys/class/gpio/gpio${pin.number}/edge`)
        fs.watch(`/sys/class/gpio/gpio${pin.number}/value`, () => onPinStateChange(pin))
        onPinStateChange(pin)
    }
}

function onPinStateChange(pin) {
    pin.value = ioGet(pin)
    sendMessage('pinChange', pin)
}

parentPort.on('message', message => {
    if (message.module == 'gpio' &&  message.topic == 'pinChange') {
        if (message.role == 'exitButton') ioSet(getPinBy('role', 'doorMagnet'), message.value)
        if (message.role == "b")          ioSet(getPinBy('role', 'g'), message.value)
        if (message.role == "c")          ioSet(getPinBy('role', 'h'), message.value)
        if (message.role == 'spacePower') ioSet(getPinBy('role', 'buzzer'), message.value)
    }
})

console.log('Loading gpio.js')
setup();

