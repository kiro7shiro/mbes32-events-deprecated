const assert = require('assert')
const { isEventFolder, eventFolderName, searchEvent } = require('../src/events.js')

describe('events', function () {

    const testData = [
        {
            valid: 'BAUTEC 20',
            value: '/home/kiro/Development/es32/testdata/2020/Eigenveranstaltung/BAUTEC 20/Kalkulation/Abrechnung/ALBA/Projektabrechnung Bautec 2020.xlsx'
        },
        {
            valid: 'BUS2BUS21',
            value: '/home/kiro/Development/es32/testdata/2021/Eigenveranstaltung/BUS2BUS21/Kalkulation/Abrechnung/ALBA/Projektabrechnung  Bus2Bus 2021.xlsx'
        },
        {
            valid: 'DRV20',
            value: '/home/kiro/Development/es32/testdata/2020/Eigenveranstaltung/DRV20/Kalkulation/Abrechnung/ALBA/Projektabrechnung ITB 2021 DRV.xlsx'
        },
        {
            valid: 'FRUIT 2020',
            value: '/home/kiro/Development/es32/testdata/2020/Eigenveranstaltung/FRUIT 2020/Kalkulation/Abrechnung/ALBA/Projektabrechnung Fruit 2020.xlsx'
        }
    ]

    it('should validate event folders', function () {

        for (let tCnt = 0; tCnt < testData.length; tCnt++) {
            const test = testData[tCnt]
            const result = isEventFolder(test.value)
            assert.ok(result)
        }

    })

    it('should return an event folder name', function () {

        for (let tCnt = 0; tCnt < testData.length; tCnt++) {
            const test = testData[tCnt]
            const resultName = eventFolderName(test.value)
            assert.equal(resultName, test.valid)
        }

    })

    it('should find an event', async function () {

        const result = await searchEvent('igw')
        const [first] = result
        
        console.log(first)
        
    })

})