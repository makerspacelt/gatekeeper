const config = require('../config')
const fetch = require('node-fetch')
const { parentPort } = require('worker_threads')

if (!config.slack.webhookURL) {
  console.log('slack.js disabled: missing webhookURL in config')
  return
}

async function sendSlackMessage(fullname) {
  try {
    const data = { text: fullname }
    const response = await fetch(config.slack.webhookURL, {
      method: 'post',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    })
    const rjson = await response.json()
    if (!rjson.ok) {
      console.log(`slack.js: error response from webhook: ${JSON.stringify(rjson)}`)
    }
  }
  catch (error) {
    console.log(`slack.js: exception from ${fullname}: ` + error.message)
  }
}

parentPort.on('message', (message) => {
  switch (message.topic) {
    case 'accessGranted':
      sendSlackMessage(message.fullname)
      break
  }
})
