const { parentPort } = require('worker_threads')

console.log('mqtt worker hello')

parentPort.on('message', message => {
})
