function dateSerial(date) {
    const milsDay = 86400000
    const base = Math.abs(new Date(1900, 0, 1).getTime()) / milsDay
    const zoneOff = date.getTimezoneOffset() * 60 * 1000
    console.log({ zoneOff })
    return base + (date.getTime() - zoneOff) / milsDay
}

describe('dateSerial', function () {

    it('should convert a date into a serial number', function () {

        const today = new Date()
        const test = new Date(2021, 10, 1)

        console.log({ today: dateSerial(today) })
        console.log({ test: dateSerial(test) })

    })

})