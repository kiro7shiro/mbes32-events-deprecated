const { cli } = require('../cli/events.js')

describe('cli events', async function () {

    it('should print the help string', async function () {
        process.argv.push('--help')
        cli(process.argv)
    })

})