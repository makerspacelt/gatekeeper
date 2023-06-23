const { parentPort } = require('worker_threads')
const mqtt = require("mqtt")
const { shell, sendMessageFactory } = require('../utils')
const sendMessage = sendMessageFactory('mqtt', parentPort)
const config = require('../config')
sendMessage('loading', {})

const hostname = shell("dig +short -x $(hostname -I)").trim().split('.')[0]
const topicPrefix = `${config.mqtt.topicPrefix}/${hostname}`

const url = `${config.mqtt.proto}://${config.mqtt.host}:${config.mqtt.port}`
const client = mqtt.connect(url, {
    username: config.mqtt.user,
    password: config.mqtt.pass,
    will: {
        topic: `${topicPrefix}/system/online/get`,
        payload: "0",
    },
})

client.subscribe(`${topicPrefix}/gpio/buzzer/set`)
client.subscribe(`${topicPrefix}/display/message/set`)

client.on('connect', ()=>{
    sendMessage('status', {value:1})
    client.publish(`${topicPrefix}/gpio/buzzer/set`, '0')
    client.publish(`${topicPrefix}/display/message/set`, '    MQTT\n Connected')
    client.publish(`${topicPrefix}/system/online/get`, '1')
})

client.on('offline', ()=>{
    sendMessage('status', {value:0})
})

client.on('message', (topic, message) => {
    message=message.toString()
    if (topic == `${topicPrefix}/gpio/buzzer/set`) {
        sendMessage('pinSet', {role:'buzzer', value:message})
        return
    }
    if (topic == `${topicPrefix}/display/message/set`) {
        sendMessage('displayMessage', {value:message})
        return
    }
    sendMessage('ERROR', {type:'unknownSubscription', fromTopic:topic, message})
})

parentPort.on('message', message => {
     if (message.module == 'gpio' &&  message.topic == 'pinChange') {
        client.publish(`${topicPrefix}/gpio/${message.role}/get`, message.value.toString())
     }
     if (message.module == 'thermometer' &&  message.topic == 'temperature') {
        client.publish(`${topicPrefix}/ds18b20/temp/get`, message.value.toString())
     }
     if (message.module == 'display' &&  message.topic == 'message') {
        client.publish(`${topicPrefix}/display/message/get`, message.value.toString())
     }
     if (message.module == 'access') {
        if (message.topic == 'accessDenied') {
            client.publish(`${topicPrefix}/access/denied/get`, message.fullname)
        }
        if (message.topic == 'accessGranted') {
            client.publish(`${topicPrefix}/access/granted/get`, message.fullname)
        }
        if (message.topic == 'exitGranted') {
            client.publish(`${topicPrefix}/access/exit/get`, "1")
        }
     }
})

