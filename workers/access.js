const fs = require('fs')
const { sendMessageFactory } = require('../utils')
const { parentPort } = require('worker_threads')
const config = require('../config')
const sendMessage = sendMessageFactory('access', parentPort)
sendMessage('loading', {})


function sendAccessGranted(card, fullname) {
    sendMessage('accessGranted', {card, fullname})
}

function sendAccessDenied(card, fullname, error) {
    sendMessage('accessDenied', {card, fullname, error})
}

function getUserByCardkey(users, cardkey) {
    for (const fullname in users) {
        const userData = users[fullname]
        userData.fullname = fullname
        const card = userData.cards[cardkey]
        if (card) {
            return userData
        }
    }
}

function checkAccess(cardkey) {
    const jsonData = fs.readFileSync(config.access.database_file)
    const spaceDB = JSON.parse(jsonData)
    const user = getUserByCardkey(spaceDB.users, cardkey)
    if (user) {
        if (user.active === true) {
            if (user.cards[cardkey].active === true) {
                sendAccessGranted(cardkey, user.fullname)
            } else {
                sendAccessDenied(cardkey, user.fullname, 'card not active')
            }
        } else {
            sendAccessDenied(cardkey, user.fullname, 'user not active')
        }
    } else {
        sendAccessDenied(cardkey, '', 'card not found')
    }    
}

parentPort.on('message', message => {
     if (message.module == 'rfid' &&  message.topic == 'cardScan') {
        checkAccess(message.value);
     }
})


