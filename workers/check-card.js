const { parentPort } = require('worker_threads')
const { shell, sendMessageFactory } = require('../utils')
const fs = require('fs')
const sendMessage = sendMessageFactory('check-card', parentPort)
sendMessage('loading', {})

var oldStatus = null

setInterval(()=>{
    const newStatus = fs.existsSync('/dev/hidraw0')
    if (newStatus != oldStatus) {
        sendMessage('card-status', {value:newStatus})
        oldStatus = newStatus
    }
}, 500)

