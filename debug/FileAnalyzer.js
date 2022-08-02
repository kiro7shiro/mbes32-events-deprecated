const fs = require('fs')
const path = require('path')
const EventEmitter = require('events')
const Ajv = require("ajv")
const ExcelJS = require('exceljs')
const Fuse = require('fuse.js')

const sysSepMatcher = new RegExp(`\\${path.sep}`, 'i')
const pdfMatcher = /\.pdf$/i
const xlsxMatcher = /\.xlsx$|\.xlsm$/i

const yearFolderMatcher = new RegExp(`${sysSepMatcher.source}\\d{4}$`, 'i')
const eventFolderMatcher = new RegExp(
    `${sysSepMatcher.source}(eigenveranstaltung|ge2 kongresse|ge3 gast|interne vas|filmdreharbeiten|palais)${sysSepMatcher.source}`,
    'ig')

const albaMatcher = /alba/i
const cwsMatcher = /cws/i
const newlineMatcher = /nl|newline/i
const sasseMatcher = /sasse/i
const wisagMatcher = /wisag/i
const glassMatcher = /glas/i

const billMatcher = /(ab)rechnung/i
const orderMatcher = /\d{10}|bestellung/i
// plannings are a special case, we can't assume a pattern here
const planningMatcher = function (value) {
    // TODO: should return like a RegExp object
}

const matchers = {
    sysSep: sysSepMatcher,
    pdf: pdfMatcher,
    xlsx: xlsxMatcher,
    yearFolder: yearFolderMatcher,
    eventFolder: eventFolderMatcher,
    glass: glassMatcher,
    alba: albaMatcher,
    cws: cwsMatcher,
    newline: newlineMatcher,
    sasse: sasseMatcher,
    wisag: wisagMatcher,
    bill: billMatcher,
    order: orderMatcher,
    planning: planningMatcher
}

/**
 * Get the name of an es32 event folder
 * @param {String} filename 
 * @returns {String} event folder name
 */
matchers.eventFolder.getName = function getName(filename) {
    this.lastIndex = 0
    if (!this.test(filename)) return false
    this.lastIndex = 0
    const [match] = this.exec(filename)
    const parts = match.split(matchers.sysSep)
    const name = parts[parts.length - 1]
    this.lastIndex = 0
    return name
}

// .xlsx configuration schemas
const columnsSchema = {
    $id: 'columns',
    type: 'array',
    minItems: 1,
    items: {
        type: 'object',
        properties: {
            index: { type: 'integer' },
            key: { type: 'string' },
            /* mapper: { type: 'object' } */
        },
        required: ['index', 'key']
    }
}
const fieldsSchema = {
    $id: 'fields',
    type: 'array',
    minItems: 1,
    items: {
        type: 'object',
        properties: {
            row: { type: 'integer' },
            col: { type: 'integer' },
            key: { type: 'string' },
            /* mapper: { type: 'object' } */
        },
        required: ['row', 'col', 'key']
    }
}
const configSchema = {
    $id: 'config',
    type: 'object',
    properties: {
        type: { type: 'string', pattern: 'list\\b|object\\b' },
        worksheet: { type: 'string', minLength: 1 },
        rowOffset: { type: 'integer' },
        columns: { $ref: 'columns' },
        fields: { $ref: 'fields' }
    },
    required: ['type', 'worksheet'],
    if: { properties: { type: { type: 'string', pattern: 'list\\b' } } },
    then: { required: ['columns'] },
    else: {
        if: { properties: { type: { type: 'string', pattern: 'object\\b' } } },
        then: { required: ['fields'] }
    },
    additionalProperties: false
}
const multiConfigSchema = {
    $id: 'multiConfig',
    type: 'object',
    minProperties: 1,
    patternProperties: {
        '^[a-z]+': { $ref: 'config' }
    }
}

const ajv = new Ajv({
    schemas: [columnsSchema, fieldsSchema, configSchema, multiConfigSchema],
    allErrors: true
})
const validateColumns = ajv.getSchema('columns')
const validateFields = ajv.getSchema('fields')
const validateConfig = ajv.getSchema('config')
const validateMultiConfig = ajv.getSchema('multiConfig')

class FileAnalyzer extends EventEmitter {

    static errors = {
        
    }

    constructor() {
        super()
    }
}

module.exports = { FileAnalyzer }