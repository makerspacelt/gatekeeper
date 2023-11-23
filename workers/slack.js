const config = require('../config')
const fetch = require('node-fetch')
const { parentPort } = require('worker_threads')

if (!config.slack.webhookURL) {
  console.log('slack.js disabled: missing webhookURL in config')
  return
}

async function sendSlackMessage(fullname) {
  let responseStatus = 0
  try {
    const data = { text: fullname }
    const response = await fetch(config.slack.webhookURL, {
      method: 'post',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    })
    responseStatus = response.status
    const responseBody = await response.text()
    if (responseBody != 'ok') {
      console.log(`slack.js: error response from webhook (status ${responseStatus}): ${responseBody}`)
    }
  }
  catch (error) {
    console.log(`slack.js: exception from ${fullname}: ${error.message}. Slack response status: ${responseStatus}`)
  }
}

parentPort.on('message', (message) => {
  switch (message.topic) {
    case 'accessGranted':
      sendSlackMessage(message.fullname)
      break
  }
})
