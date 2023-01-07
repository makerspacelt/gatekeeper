const { parentPort } = require('worker_threads')

console.log('gpio worker hello')

parentPort.on('message', message => {
})
