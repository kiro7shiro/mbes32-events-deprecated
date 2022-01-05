const { Command } = require('commander')
const term = require('terminal-kit').terminal

const program = new Command

program
    .description('test a table')

program.parse()

function terminate() {
    term.grabInput(false);
    setTimeout(function () { term.processExit() }, 100);
}

async function table() {

    term.grabInput({ focus: true })

    const doc = term.createDocument()

    const table = await term.table(
        [
            ['header #1', 'header #2', 'header #3'],
            ['row #1', 'a much bigger cell, a much bigger cell, a much bigger cell... ', 'cell'],
            ['row #2', 'cell', 'a medium cell'],
            ['row #3', 'cell', 'cell'],
            ['row #4', 'cell\nwith\nnew\nlines', '^YThis ^Mis ^Ca ^Rcell ^Gwith ^Bmarkup^R^+!']
        ],
        {
            hasBorder: true,
            contentHasMarkup: true,
            borderChars: 'lightRounded',
            borderAttr: { color: 'blue' },
            textAttr: { bgColor: 'default' },
            firstCellTextAttr: { bgColor: 'blue' },
            firstRowTextAttr: { bgColor: 'yellow' },
            firstColumnTextAttr: { bgColor: 'red' },
            width: 60,
            fit: true // Activate all expand/shrink + wordWrap
        }
    )

    table.parent = doc

    doc.on('key', function (name, matches, data) {
        console.log("'key' event:", name);
        if (name === 'CTRL_C') { terminate(); }
    })

    doc.assignId(table, 'table')

    let focusAware = doc.giveFocusTo(doc)

    for (let bCnt = 0; bCnt < table.textBoxes.length; bCnt++) {
        const box = table.textBoxes[bCnt];
        console.log({ box })
    }

}

table()