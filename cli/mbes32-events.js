const { Command } = require('commander')

const program = new Command

program
    .version('0.0.1')
    .description('MBES32 event managing tool')

module.exports = { cli: args => {
    args[1] = __filename // workaround for subcommands
    program.parse(args)
}}