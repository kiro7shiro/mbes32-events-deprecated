const { Command } = require('commander')

const program = new Command

program
    .command('list', 'list key value pair(s)', { isDefault: true })
    .command('set', 'set a key value pair')
    .command('del', 'delete a key value pair')

program.parse()