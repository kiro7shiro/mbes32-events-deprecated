const billConfig = {
    costs: {
        worksheet: 'Kostenzusammenstellung',
        type: 'object',
        fields: [
            { row: 1, col: 1, key: 'event' },
            { row: 7, col: 2, key: 'halls', mapper: value => Number(value) },
            { row: 8, col: 2, key: 'traffics', mapper: value => Number(value) },
            { row: 9, col: 2, key: 'sanitary', mapper: value => Number(value) },
            { row: 10, col: 2, key: 'toiletService', mapper: value => Number(value) },
            { row: 11, col: 2, key: 'outdoor', mapper: value => Number(value) },
            { row: 12, col: 2, key: 'additionalService', mapper: value => Number(value) },
            { row: 13, col: 2, key: 'adjoining-rooms', mapper: value => Number(value) },
            { row: 14, col: 2, key: 'ideal-areas', mapper: value => Number(value) },
            { row: 15, col: 2, key: 'drk-station', mapper: value => Number(value) },
            { row: 16, col: 2, key: 'cash-desk', mapper: value => Number(value) },
            { row: 17, col: 2, key: 'additionally', mapper: value => Number(value) }
        ]
    },
    halls: {
        worksheet: 'Hallen',
        type: 'list',
        rowOffset: 13,
        columns: [
            { index: 1, key: 'name', 'header': 'Halle' },
            { index: 2, key: 'area', 'mapper': value => Number(value) },
            { index: 3, key: 'areaRate', 'mapper': value => Number(value) },
            { index: 4, key: 'setupCleaning', 'mapper': value => Number(value) },
            { index: 5, key: 'preCleaning', 'mapper': value => Number(value) },
            { index: 6, key: 'nightlyCleaning40%', 'mapper': value => Number(value) },
            { index: 7, key: 'nightlyCleaning', 'mapper': value => Number(value) },
            { index: 8, key: 'dailyCleaning40%', 'mapper': value => Number(value) },
            { index: 9, key: 'dailyCleaning', 'mapper': value => Number(value) },
            { index: 10, key: 'postCleaning', 'mapper': value => Number(value) }
        ]
    },
    traffics: {
        worksheet: 'Verkehr',
        type: 'list',
        rowOffset: 11,
        columns: [
            { index: 1, key: 'name', 'header': 'Fläche' },
            { index: 2, key: 'details' },
            { index: 3, key: 'floor', },
            { index: 4, key: 'area', 'mapper': value => Number(value) },
            { index: 5, key: 'dayCount', 'mapper': value => Number(value) },
            { index: 6, key: 'setupCleaning', 'mapper': value => Number(value) },
            { index: 7, key: 'preCleaning', 'mapper': value => Number(value) },
            { index: 8, key: 'nightlyCleaning', 'mapper': value => Number(value) },
            { index: 9, key: 'dailyCleaning', 'mapper': value => Number(value) },
            { index: 10, key: 'postCleaning', 'mapper': value => Number(value) }
        ]
    },
    sanitary: {
        worksheet: 'Sanitär',
        type: 'list',
        rowOffset: 14,
        columns: [
            { index: 1, key: 'name', 'header': 'Foyer' },
            { index: 2, key: 'details' },
            { index: 3, key: 'floor', },
            { index: 4, key: 'area', 'mapper': value => Number(value) },
            { index: 5, key: 'ladycare', 'mapper': value => Number(value) },
            { index: 6, key: 'setupCleaning', 'mapper': value => Number(value) },
            { index: 7, key: 'preCleaning', 'mapper': value => Number(value) },
            { index: 8, key: 'nightlyCleaning', 'mapper': value => Number(value) },
            { index: 9, key: 'dismantling', 'mapper': value => Number(value) },
            { index: 10, key: 'postCleaning', 'mapper': value => Number(value) }
        ]
    },
    toiletService: {
        worksheet: 'WC Besetzung',
        type: 'list',
        rowOffset: 7,
        columns: [
            { index: 1, key: 'date'/* , 'header': 'Datum' */ },
            { index: 2, key: 'service' },
            { index: 3, key: 'workers', 'mapper': value => Number(value) },
            { index: 4, key: 'days', 'mapper': value => Number(value) },
            { index: 5, key: 'hours', 'mapper': value => Number(value) },
            { index: 6, key: 'price', 'mapper': value => Number(value) },
            { index: 7, key: 'sum', 'mapper': value => Number(value) }
        ]
    },
    outdoor: {
        worksheet: 'Außenrevier',
        type: 'list',
        rowOffset: 10,
        columns: [
            { index: 1, key: 'date'/* , 'header': 'Datum' */ },
            { index: 2, key: 'service' },
            { index: 3, key: 'area', 'mapper': value => Number(value) },
            { index: 4, key: 'days', 'mapper': value => Number(value) },
            { index: 5, key: 'hours', 'mapper': value => Number(value) },
            { index: 6, key: 'area2', 'mapper': value => Number(value) },
            { index: 8, key: 'sum', 'mapper': value => Number(value) }
        ]
    },
    additionalService: {
        worksheet: 'diverse Zusatzarbeiten',
        type: 'list',
        rowOffset: 8,
        columns: [
            { index: 1, key: 'date', 'header': 'Datum' },
            { index: 2, key: 'service' },
            { index: 3, key: 'workers', 'mapper': value => Number(value) },
            { index: 4, key: 'days', 'mapper': value => Number(value) },
            { index: 5, key: 'hours', 'mapper': value => Number(value) },
            { index: 6, key: 'price', 'mapper': value => Number(value) },
            { index: 7, key: 'sum', 'mapper': value => Number(value) }
        ]
    }
}

module.exports = billConfig