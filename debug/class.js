class ValidationError extends Error {
    constructor(type, message) {
        super(message)
        this.type = type
    }
}

class ValidationErrorNoSheet extends ValidationError {
    constructor(worksheet) {
        super('noSheet', `${worksheet} is missing`)
        this.worksheet = worksheet
    }
}

let test = new ValidationError('test', 'test2')
let test2 = new ValidationErrorNoSheet('theSheet')

console.error(test)
console.error(test2)