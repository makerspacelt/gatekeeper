const { parentPort } = require('worker_threads')
const fs = require('fs')
const { sendMessageFactory } = require('../utils')
const sendMessage = sendMessageFactory('rfid', parentPort)
sendMessage('loading', {})

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

async function parseHIDData(data) {
  const now = Date.now()
  if (now - bufferUpdateAt > 500) {
      keyBuffer.length = 0
  }
  bufferUpdateAt = now
  const keyChars = [...data].filter(x => x).map(x => HID_TABLE[x])
  const enterIndex = keyChars.indexOf('\n')
  if (enterIndex == -1) {
    keyBuffer.push(...keyChars)
  }
  else {
    keyBuffer.push(...keyChars.slice(0, enterIndex))
    const card = keyBuffer.join('')
    keyBuffer.length = 0
    sendMessage('cardScan', {value:card})
  }
}

const stream = fs.createReadStream('/dev/hidraw0', {highWaterMark: 16})
stream.on('data', parseHIDData)

