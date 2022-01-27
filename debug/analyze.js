const { validate } = require('../src/analyze.js')
const billConfig = require('../src/reports/year-summary/billConfig.js')

const file = 'G:\\ES3\\Abteilung\\ES32\\Reinigung\\Veranstaltungen\\2021\\GE3 Gast\\PURE&CRAFTED21\\Kalkulation\\Abrechnung\\NL\\NL_Abrechnung_Pure21_2021_09_23_ds.xlsx'

async function test() {
    const t = await validate(file, billConfig)
    console.log(t)
}

test()