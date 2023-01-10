const { parentPort } = require('worker_threads')
const { shell, sendMessageFactory } = require('../utils')
const sendMessage = sendMessageFactory('check-link', parentPort)
sendMessage('loading', {})

var oldStatus = null

setInterval(()=>{
    const newStatus = (shell('cat /sys/class/net/eth0/speed 2>/dev/null')>2)?1:0
    if ( oldStatus != newStatus ) {
        oldStatus = newStatus
        sendMessage('link-status', {value:newStatus})
    }
}, 500)

