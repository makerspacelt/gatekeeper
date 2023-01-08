const { execSync, sendMessageFactory } = require('./utils')

const { isMainThread, parentPort } = require('worker_threads')

const sendMessage = sendMessageFactory('get-temperature', parentPort)

function getTemperature() {
  const temperatureRaw = execSync('cat /sys/bus/w1/devices/28-*/temperature', [], {shell: true})
  const temperature = (temperatureRaw / 1000)
  return temperature
}

function main() {
  console.log('get-temperature worker hello')
  setInterval(() => {
    sendMessage('temperature', {temperature: getTemperature()})
  }, 1000)
}

if (isMainThread) {
  console.log(getTemperature(), '°C')
}
else {
  main()
}
