const { parentPort } = require('worker_threads')
const { shell, sendMessageFactory } = require('../utils')
const sendMessage = sendMessageFactory('check-card', parentPort)
sendMessage('loading', {})

var oldStatus = null

setInterval(()=>{
    const newStatus = (shell('test -c /dev/hidraw0 2>/dev/null && echo 1')==1)?1:0
    if ( oldStatus != newStatus ) {
        oldStatus = newStatus
        sendMessage('card-status', {value:newStatus})
    }
}, 500)

