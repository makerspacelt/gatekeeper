const { parentPort } = require('worker_threads')

console.log('display worker hello')

parentPort.on('message', message => {
})
