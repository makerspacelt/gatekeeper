const { parentPort } = require('worker_threads')
const mqtt = require("mqtt")
const { shell, sendMessageFactory } = require('../utils')
const sendMessage = sendMessageFactory('mqtt', parentPort)
sendMessage('loading', {})

const hostname = shell("host $(hostname -I) | rev | cut -d' ' -f1 | rev | cut -d. -f1").trim();

const config = {mqtt:{
    proto: 'mqtt',
    host: 'broker.lan',
    port: 1883,
    user: 'user',
    pass: 'pass',
    topic: `tmp/device/${hostname}`,
}}

const url = `${config.mqtt.proto}://${config.mqtt.host}:${config.mqtt.port}`
const client = mqtt.connect(url, {username:config.mqtt.user, password:config.mqtt.pass})

client.subscribe(`${config.mqtt.topic}/buzzer/set`)
client.subscribe(`${config.mqtt.topic}/message/set`)

client.on('connect', ()=>{
    sendMessage('status', {value:1})
    client.publish(  `${config.mqtt.topic}/buzzer/set`, '0')
    client.publish(  `${config.mqtt.topic}/message/set`, '    MQTT\n CONNECTED')
})

client.on('offline', ()=>{
    sendMessage('status', {value:0})
})

client.on('message', (topic, message) => {
    message=message.toString()
    if (topic == `${config.mqtt.topic}/buzzer/set`) {
        sendMessage('pinSet', {role:'buzzer', value:message})
        return
    }
    if (topic == `${config.mqtt.topic}/message/set`) {
        sendMessage('displayMessage', {value:message})
        return
    }
    sendMessage('ERROR', {type:'unknownSubscription', fromTopic:topic, message})
})

parentPort.on('message', message => {
     if (message.module == 'gpio' &&  message.topic == 'pinChange') {
        client.publish(`${config.mqtt.topic}/${message.role}/get`, message.value.toString())
     }
     if (message.module == 'thermometer' &&  message.topic == 'temperature') {
        client.publish(`${config.mqtt.topic}/temperature/get`, message.value.toString())
     }
     if (message.module == 'display' &&  message.topic == 'message') {
        client.publish(`${config.mqtt.topic}/message/get`, message.value.toString())
     }
})

