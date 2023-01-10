const { parentPort } = require('worker_threads')
const { shell, sendMessageFactory } = require('../utils')
const sendMessage = sendMessageFactory('check-ping', parentPort)
sendMessage('loading', {})

var oldStatus = null

setInterval(()=>{
    const newStatus = (shell('ping -nfc3 -W1 ip.at.lt | grep -o " [0-9]* received" | cut -d" " -f2')>1)?1:0
    if ( oldStatus != newStatus ) {
        oldStatus = newStatus
        sendMessage('ping-status', {value:newStatus})
    }
}, 2000)

