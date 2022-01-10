const utils = require('util')
const { list, listAsync } = require('../src/list.js')
const term = require('terminal-kit').terminal

describe('list', function () {
    this.timeout(15000)
    it('should list files async', async function () {
        const start1 = 'C:\\Users\\tiedemann\\Development\\mbes32-events\\testData'
        const start2 = 'G:\\ES3\\Abteilung\\ES32\\Reinigung\\Veranstaltungen\\2022\\GE3 Gast\\FESPA22'
        const start3 = '/kiro/home'
        try {
            await term.spinner()
            const files = await listAsync(start2, {
                matchers: [
                    /\b.xlsx/i
                ],
                recurse: true,
                dirs: false
            })
            term('\n')
            console.log({ files })
        } catch (error) {
            console.error(error)
        }
        term.processExit(0)
    })
})