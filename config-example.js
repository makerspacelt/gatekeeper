module.exports = {
   access: {
      database_file: './example_db.json',
   },
   mqtt: {
      proto: 'mqtt',
      host: 'broker.lan',
      port: 1883,
      user: 'user',
      pass: 'pass',
      topicPrefix: 'tmp/device',
   },
   pins: [
      { role: 'exitButton', name:  'sw1', number:   1, direction:  'in', value: 0, invert: true },
      { role:          'b', name:  'sw2', number:   0, direction:  'in', value: 0, invert: true },
      { role:          'c', name:  'sw3', number:   3, direction:  'in', value: 0, invert: true },
      { role: 'spacePower', name:  'sw4', number:   2, direction:  'in', value: 0, invert: true },
      { role:     'buzzer', name:  'buz', number:   6, direction: 'out', value: 0, invert: false },
      { role: 'doorMagnet', name: 'rel1', number:   7, direction: 'out', value: 1, invert: true },
      { role:          'g', name: 'rel2', number: 199, direction: 'out', value: 0, invert: false },
      { role:          'h', name: 'rel3', number: 198, direction: 'out', value: 0, invert: false },
   ],
   slack: {
      // webhookURL: 'https://hooks.slack.com/triggers/...',
   },
}

