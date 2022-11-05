const { Command } = require('commander')
const term = require('terminal-kit').terminal
const Fuse = require('fuse.js')
const { getEventsData } = require('../src/database.js')

// workaround for esm style imports
let clipboard = undefined
async function clipboardy() {
    clipboard = (await import('clipboardy')).default
}
clipboardy()

const program = new Command

program
    .description('search an event')
    .argument('<keyword>', 'keyword to find')
    .option('-s --score [number]', 'max score of results', Number, 0.3)
    .option('-m --maxItems [number]', 'max items to return', Number, 0)
    .option('-h --hits', 'show hits in results', false)
    .action(async function (keyword) {

        const eventsData = await getEventsData()
        const options = {
            includeScore: true,
            includeMatches: true,
            keys: [
                "matchcode",
                "title"
            ]
        }
        const fuse = new Fuse(eventsData, options)
        const { score, maxItems, hits } = program.opts()

        //console.log({ score, maxItems, hits })

        let result = fuse.search(keyword).filter(function (curr) {
            return curr.score <= score
        })
        if (maxItems) result = result.slice(0, maxItems)

        // show search results
        term(`\n`)
        term.green.bold(' event-from\tevent-to\tmatchcode\ttitle')
        const colWidth = 25
        const menu = result.reduce(function (accu, curr) {
            const { item, score, matches } = curr
            let eventFrom = item['event-from'].toLocaleDateString()
            let eventTo = item['event-to'].toLocaleDateString()
            let matchcode = item['matchcode']
            let title = item['title']

            // format items to fit colWidth
            matchcode = matchcode.length <= 6 ? `${matchcode}\t` : matchcode
            title = title.length >= colWidth ? title.substr(0, colWidth - 3) + '...' : title

            const cellStr = `${eventFrom}\t${eventTo}\t${matchcode}\t${title}`
            accu.push(cellStr)
            return accu

        }, [])
        // wait for user selection
        const input = await term.singleColumnMenu(menu).promise
        const selection = input.selectedText.split('\t').filter(item => item !== '')[2]
        const eventData = result.filter(curr => curr.item['matchcode'] === selection)[0]?.item
        // prepare output data
        const {
            ['internal-build-up']: internalBuildUp,
            ['external-build-up']: externalBuildUp,
            ['event-from']: eventFrom,
            ['event-to']: eventTo,
            ['external-dismantling']: externalDismantling,
            ['internal-dismantling']: internalDismantling,
            matchcode,
            title,
            account,
            location,
            type,
            status,
            manager,
            technician,
            tpl,
            plm,
            security } = eventData

        term(`\n`)
        term.table(
            [
                [
                    'internal-build-up',
                    'external-build-up',
                    'event-from',
                    'event-to',
                    'external-dismantling',
                    'internal-dismantling',
                    'matchcode',
                    'title',
                    'account',
                    'location',
                    'type',
                    'status',
                    'manager',
                    'technician',
                    'tpl',
                    'plm',
                    'security'
                ],
                [
                    internalBuildUp.toLocaleDateString(),
                    externalBuildUp.toLocaleDateString(),
                    eventFrom.toLocaleDateString(),
                    eventTo.toLocaleDateString(),
                    externalDismantling.toLocaleDateString(),
                    internalDismantling.toLocaleDateString(),
                    matchcode,
                    title,
                    account,
                    location,
                    type,
                    status,
                    manager,
                    technician,
                    tpl,
                    plm,
                    security
                ]
            ],
            {
                hasBorder: true,
                contentHasMarkup: false,
                textAttr: { bgColor: 'default' },
                firstRowTextAttr: { color: 'green', bgColor: 'default', bold: true },
                width: term.width,
                fit: true,
                borderChars: 'empty'
            }
        )

        clipboard.writeSync(JSON.stringify(eventData))
        term.processExit()
        
    })

program.parse()