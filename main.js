const path = require('path')
const { Worker } = require('worker_threads')
const { sendMessageFactory } = require('./utils')

// If one of these throws an error, we exit
const criticalScripts = [
  'access.js',
  'gpio.js',
  'rfid.js',
]

const scripts = [
  ...criticalScripts,
  'display.js',
  'mqtt.js',
  'slack.js',
  'thermometer.js',
  'check-link.js',
  'check-ping.js',
]

const workers = []

let deadWorkers = 0

function broadcastMessage(message) {
    const dtFmt = new Date().toJSON()
    console.error(`[${dtFmt}] ${JSON.stringify(message)}`)
    for (const w of workers) {
        w.postMessage(message)
    }
}

for (const script of scripts) {
    const worker = new Worker(path.resolve(`workers/${script}`), {
        trackUnmanagedFds: true,
    })
    workers.push(worker)

    worker.once('error', (error) => {
        console.error(`Error from ${script}:`, error)
        if (criticalScripts.includes(script)) {
            process.exit(1)
            return
        }
        deadWorkers++
        broadcastMessage({module: 'main', topic: 'dead-worker-count', value: deadWorkers})
    })
}

for (const worker of workers) {
    worker.on('message', broadcastMessage)
}

