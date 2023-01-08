const fs = require('fs')
const { sendMessageFactory } = require('./utils')
const { parentPort } = require('worker_threads')

const sendMessage = sendMessageFactory('rfid', parentPort)

const ACCESS_DB_FILE = '/etc/space-db/db.json'

const HID_TABLE = {
  30: 1,
  31: 2,
  32: 3,
  33: 4,
  34: 5,
  35: 6,
  36: 7,
  37: 8,
  38: 9,
  39: 0,
  40: '\n',
}

let bufferUpdateAt = 0
let keyBuffer = []

function sendAccessGranted(cardkey, fullname) {
    sendMessage('accessGranted', {cardkey, fullname})
}

function sendAccessDenied(cardkey, fullname, error = '') {
    sendMessage('accessDenied', {cardkey, fullname, error})
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

async function checkAccess(cardkey) {
    const jsonData = await fs.promises.readFile(ACCESS_DB_FILE)
    const spaceDB = JSON.parse(jsonData)
    // {
    //   "users": {
    //     "Name_Lastname": {
    //   }
    // }
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

async function parseHIDData(data) {
  const now = Date.now()
  if (now - bufferUpdateAt > 500) {
      keyBuffer.length = 0
  }
  bufferUpdateAt = now
  const keyChars = [...data].filter(x => x).map(x => HID_TABLE[x])
  // console.log({keyChars})
  const enterIndex = keyChars.indexOf('\n')
  if (enterIndex == -1) {
    keyBuffer.push(...keyChars)
  }
  else {
    keyBuffer.push(...keyChars.slice(0, enterIndex))
    const cardkey = keyBuffer.join('')
    keyBuffer.length = 0
    try {
        await checkAccess(cardkey)
    }
    catch (error) {
        console.error('rfid.js: checkAccess() exception: ', error)
    }
  }
}

console.log('rfid worker hello')

// parentPort.on('message', message => {
// })

const stream = fs.createReadStream('/dev/hidraw0', {highWaterMark: 16})
stream.on('data', parseHIDData)
