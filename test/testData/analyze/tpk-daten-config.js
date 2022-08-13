const tpkDatenConfig = {
    worksheet: 'Table',
    type: 'list',
    rowOffset: 15,
    columns: [
        { index: 7, key: 'internal-build-up', header: 'Mantelzeit ab' },
        { index: 8, key: 'external-build-up', header: 'Aufbau ab' },
        { index: 9, key: 'event-from', header: 'VA ab' },
        { index: 10, key: 'event-to', header: 'VA bis' },
        { index: 11, key: 'external-dismantling', header: 'Abbau bis' },
        { index: 12, key: 'internal-dismantling', header: 'Mantelzeit bis' },
        { index: 13, key: 'matchcode', header: 'Veranstaltung' },
        { index: 14, key: 'title', header: 'Titel' },
        { index: 15, key: 'comment', header: 'Änderungstext' },
        { index: 16, key: 'account', header: 'Kont.' },
        { index: 17, key: 'type', header: 'Typ Veranstaltung' },
        { index: 18, key: 'status', header: 'Status VR' },
        { index: 19, key: 'location', header: 'ORT' },
        { index: 20, key: 'manager', header: 'PL' },
        { index: 21, key: 'technician', header: 'ESPK' },
        { index: 22, key: 'tpl', header: 'TVM' },
        { index: 23, key: 'plm', header: 'PLM' },
        { index: 24, key: 'security', header: 'Sicherheit' },
        { index: 25, key: '2nd-manager', header: 'HVL_PL' },
        { index: 26, key: '2nd-tpl', header: 'HVL_ESPK' },
        { index: 27, key: '2nd-technician', header: 'HVL_TVM' },
        { index: 28, key: '2nd-plm', header: 'HVL_PLM' },
        { index: 29, key: '2nd-security', header: 'HVL_SI' }
    ],
    columnHeaders: [
        ['Mantelzeit ab', 'Aufbau ab', 'VA ab', 'VA bis', 'Abbau bis', 'Mantelzeit bis', 'Veranstaltung', 'Titel', 'Änderungstext', 'Kont.', 'Typ Veranstaltung', 'Status VR', 'ORT', 'PL', 'ESPK', 'TVM', 'PLM', 'Sicherheit', 'HVL_PL', 'HVL_ESPK', 'HVL_TVM', 'HVL_PLM', 'HVL_SI']
    ]
}

module.exports = tpkDatenConfig
























