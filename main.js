const path = require('path')
const { Worker } = require('worker_threads')

const scripts = [
  'display.js',
  'gpio.js',
  'mqtt.js',
  'rfid.js',
  'access.js',
  'thermometer.js',
]

const workers = []

for (const script of scripts) {
    const worker = new Worker(path.resolve(`workers/${script}`), {
        trackUnmanagedFds: true,
    })
    worker.once('error', (error) => {
      console.error(`Error from ${script}:`, error)
      process.exit(1)
    })
    workers.push(worker)
}

for (const worker of workers) {
    worker.on('message', message => {
        const dtFmt = new Date().toJSON()
        process.stdout.write(`[${dtFmt}] ${JSON.stringify(message)}\n`)
        for (const w of workers) {
            w.postMessage(message)
        }
    })
}

