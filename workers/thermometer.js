const { shell, sendMessageFactory } = require('../utils')
const { parentPort } = require('worker_threads')
const sendMessage = sendMessageFactory('thermometer', parentPort)
sendMessage('loading', {})


function getTemperature() {
  const temperatureRaw = shell('cat /sys/bus/w1/devices/28-*/temperature')
  const temperature = (temperatureRaw / 1000)
  return temperature
}

setInterval(() => {
  sendMessage('temperature', {value: getTemperature()})
}, 1000)

