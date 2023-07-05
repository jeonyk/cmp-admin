const uncheckedColumns = (root) => ([
  { field: 'no', binding: 'no', width: 100, header: 'No', customHtml: true },
  { field: 'name', binding: 'name', width: 400, header: root.$t('bill.MODEL.nameAndOS'), customHtml: true },
  { field: 'version', binding: 'version', width: '*', header: root.$t('common.TERMS.version') },
  { field: 'serviceType', binding: 'serviceType', width: '*', header: root.$t('bill.kinds') }
])

const filterOptions = (root) => ({
  os: [
    { value: 'all', label: root.$t('main.DASHBOARD.all') },
    { value: 'windows', label: 'Windows' },
    { value: 'linux', label: 'Linux' }
  ],
  type: [
    { value: 'all', label: root.$t('main.DASHBOARD.all') },
    { value: 'image', label: '이미지' },
    { value: 'market', label: '마켓플레이스' },
    { value: 'installation', label: '설치프로그램' },
    { value: 'database', label: '데이터베이스' }
  ]
})

export { uncheckedColumns, filterOptions }
