const { execSync } = require('./utils')
const path = require('path')
const { isMainThread, parentPort } = require('worker_threads')


const icons = {
  link: ['\ue017', '\ue0b8'],
  mqtt: ['\ue0b1', '\ue03f'],
  ping: ['\ue0d8', '\ue0ae'],
  card: ['\ue039', '\ue04b']
}

const systemStatus = {
  link: 0,
  mqtt: 0,
  ping: 0,
  card: 0,
  temperature: 0,
}

let displayIteration = 0

function createImage() {
  const iconFontPath = path.resolve(__dirname, 'open-iconic.otf')

  const topLeftText = [
    icons.link[systemStatus.link],
    icons.mqtt[systemStatus.mqtt],
    icons.ping[systemStatus.ping],
    icons.card[systemStatus.card],
  ].join('')

  let topRightText = ''
  if (displayIteration++ % 6 < 3 && systemStatus.temperature) {
    topRightText = `${systemStatus.temperature.toFixed(1)}C`
  }
  else {
    const dt = new Date()
    const time = dt.toISOString().slice(11, -8)
    topRightText = time
  }

  const mainText = 'TODO XXX'

  const args = [
    '-size', '128x64', 'pattern:gray100',
    '-fill', 'black',
    '-font', iconFontPath,
    '-pointsize', '16',
    '-kerning', '4',
    '-draw', `gravity NorthWest text 0,0 '${topLeftText}'`,
    '-font', 'DejaVu-Sans-Mono',
    '-pointsize', '16',
    '-kerning', '-2',
    '-draw', `gravity NorthEast text 0,0 '${topRightText}'`,
    '-draw', `gravity NorthWest text 0,16 '${mainText}'`,
    '-rotate', '-90',
    '-flip',
    'xbm:-',
  ]
  const xbm = execSync('convert', args)
  if (xbm) {
    const pixels = xbm.match(/(0x[0-9a-f]+)/gi)
    return pixels
  }
}

function displaySetup() {
  const configBytes = [
    0xAE, // Entire Display OFF
    0xD5, // Set Display Clock Divide Ratio and Oscillator Frequency
    0x80, // Default Setting for Display Clock Divide Ratio and Oscillator Frequency that is recommended
    0xA8, // Set Multiplex Ratio
    0x3F, // 64 COM lines
    0xD3, // Set display offset
    0x00, // 0 offset
    0x40, // Set first line as the start line of the display
    0x8D, // Charge pump
    0x14, // Enable charge dump during display on
    0x20, // Set memory addressing mode
    0x01, // Vertical addressing mode
    0xA1, // Set segment remap with column address 127 mapped to segment 0
    0xC8, // Set com output scan direction, scan from com63 to com 0
    0xDA, // Set com pins hardware configuration
    0x12, // Alternative com pin configuration, disable com left/right remap
    0x81, // Set contrast control
    0x80, // Set Contrast to 128
    0xD9, // Set pre-charge period
    0xF1, // Phase 1 period of 15 DCLK, Phase 2 period of 1 DCLK
    0xDB, // Set Vcomh deselect level
    0x20, // Vcomh deselect level ~ 0.77 Vcc
    0xA4, // Entire display ON, resume to RAM content display
    0xA6, // Set Display in Normal Mode, 1 = ON, 0 = OFF
    0x2E, // Deactivate scroll
    0xAF, // Display ON in normal mode
  ]
  execSync('i2cset', ['-y', '0', '0x3C', '0x00', ...configBytes, 'i'])
}

function displayUpdate() {
  const pixels = createImage()
  if (pixels) {
    execSync('i2ctransfer', ['-y', '0', 'w1025@0x3c', '0x40', ...pixels])
  }
  else {
    console.log(`display.js error: no image returned by createImage()`)
  }
}

function main() {
  console.log('display worker hello')

  displaySetup()

  setInterval(displayUpdate, 1000)

  parentPort.on('message', message => {
    if (message.topic == 'temperature') {
      systemStatus.temperature = message.temperature
    }
  })
}

if (isMainThread) {
  console.log("display.js debug")
  displayUpdate()
}
else {
  main()
}
