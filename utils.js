const child_process = require('child_process')


function execSync(file, args=[], {shell=false, timeout=5000} = {}) {
  const spawnOptions = {
    timeout,
    shell,
  }
  const ps = child_process.spawnSync(file, args, spawnOptions)
  if (ps.status === null) {
    console.log(`display.js: Error executing ${file}: ${ps.error}`)
    return ''
  }
  else if (ps.status !== 0) {
    console.log(`display.js: Bad exit code when executing ${file}:\n${ps.stdout}\n${ps.stderr}`)
    return ''
  }
  return ps.stdout.toString()
}

function shell(cmd, timeout=5000) {
  try {
    return child_process.execSync(cmd, {timeout}).toString()
  } catch(e) {}
}

function sendMessageFactory(moduleName, parentPort) {
  return function sendMessage(topic, msgObject) {
    parentPort.postMessage({module: moduleName, topic, ...msgObject})
  }
}

module.exports = {
  execSync,
  shell,
  sendMessageFactory,
}

