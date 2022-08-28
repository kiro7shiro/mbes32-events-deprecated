const { isFilled } = require('xlsx-import/lib/mappers')

const billConfig = {
    costs: {
        worksheet: 'Kostenzusammenstellung',
        type: 'object',
        fields: [
            { row: 1, col: 1, key: 'event', mapper: isFilled },
            { row: 7, col: 2, key: 'halls', pattern: [['Hallen', { formula: 'blabla' }]] },
            { row: 8, col: 2, key: 'traffics' },
            { row: 9, col: 2, key: 'sanitary' },
            { row: 10, col: 2, key: 'toiletService' },
            { row: 11, col: 2, key: 'outdoor' },
            { row: 12, col: 2, key: 'additionalService' },
            { row: 13, col: 2, key: 'adjoining-rooms' },
            { row: 14, col: 2, key: 'ideal-areas' },
            { row: 15, col: 2, key: 'drk-station' },
            { row: 16, col: 2, key: 'cash-desk' },
            { row: 17, col: 2, key: 'additionally' }
        ]
    },
    halls: {
        worksheet: 'Hallen',
        type: 'list',
        rowOffset: 13,
        columns: [
            { index: 1, key: 'name', header: 'Halle', mapper: isFilled },
            { index: 2, key: 'area', header: 'Fläche' },
            { index: 3, key: 'areaRate', header: 'Flächen-anteil' },
            { index: 4, key: 'setupCleaning', header: 'VR Aufbau' },
            { index: 5, key: 'preCleaning', header: 'Vor- reinig.' },
            { index: 6, key: 'nightlyCleaning40%', header: 'lfd. VR Nacht' },
            { index: 7, key: 'nightlyCleaning', header: 'lfd. VR Nacht' },
            { index: 8, key: 'dailyCleaning40%', header: 'lfd. Tag' },
            { index: 9, key: 'dailyCleaning', header: 'lfd. Tag' },
            { index: 10, key: 'postCleaning', header: 'Nach-reinig.' }
        ],
        columnHeaders: [
            ['', '', '', '', 'finale', '0.4', '1', '0.4', '1', ''],
            ['Halle', 'Fläche', 'Flächen-anteil', 'VR Aufbau', 'Vor- reinig.', 'lfd. VR Nacht', 'lfd. VR Nacht', 'lfd. Tag', 'lfd. Tag', 'Nach-reinig.']
        ]
    }
}

module.exports = billConfig