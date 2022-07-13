const assert = require('assert')
const path = require('path')
const { getFileInfos } = require('../src/analyze.js')

describe('analyze', async function () {
    it('should get file infos', async function () {
        const file = 'G:\\ES3\\Abteilung\\ES32\\Reinigung\\Veranstaltungen\\2021\\Eigenveranstaltung\\BAZAAR21\\Kalkulation\\Planung\\WISAG\\WISAG akt. Planung BAZAAR2021-10-27dg.xlsx'
        const infos = await getFileInfos(file)
        console.log(infos)
    })
})