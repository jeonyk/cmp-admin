// 상세 기본 컬럼
const columns = root => ({
  // root.$t('bill.......')
  hardware: [
    { field: 'billingModelCategory.name', binding: 'billingModelCategory.name', width: '*', header: root.$v('타입'), sorting: false },
    { field: 'billingModelCategory.serviceId', binding: 'billingModelCategory.serviceId', width: '*', header: root.$t('common.TERMS.item'), sorting: false },
    { field: 'billingModelCategory.serviceType', binding: 'billingModelCategory.serviceType', width: '*', header: root.$t('bill.kinds'), sorting: false }
  ],
  software: [
    { field: 'billingModelCategory.name', binding: 'billingModelCategory.name', width: '*', header: root.$t('common.TERMS.item'), sorting: false },
    { field: 'billingModelCategory.operatingSystem', binding: 'billingModelCategory.operatingSystem', width: '*', header: root.$t('bill.MODEL.os'), sorting: false },
    { field: 'billingModelCategory.version', binding: 'billingModelCategory.version', width: '*', header: root.$t('common.TERMS.version'), sorting: false },
    { field: 'billingModelCategory.serviceType', binding: 'billingModelCategory.serviceType', width: '*', header: root.$t('bill.kinds'), sorting: false }
  ],
  firewall: [
    { field: 'billingModelCategory.name', binding: 'billingModelCategory.name', width: '*', header: root.$v('항목'), sorting: false },
    { field: 'billingModelCategory.serviceType', binding: 'billingModelCategory.serviceType', width: '*', header: root.$t('bill.kinds'), sorting: false }
  ],
  l4: [
    { field: 'billingModelCategory.name', binding: 'billingModelCategory.name', width: '*', header: root.$v('이름'), sorting: false },
    { field: 'billingModelCategory.serviceType', binding: 'billingModelCategory.serviceType', width: '*', header: root.$t('bill.kinds'), sorting: false }
  ],
  l7: [
    { field: 'billingModelCategory.name', binding: 'billingModelCategory.name', width: '*', header: root.$v('이름'), sorting: false },
    { field: 'billingModelCategory.serviceType', binding: 'billingModelCategory.serviceType', width: '*', header: root.$t('bill.kinds'), sorting: false }
  ],
  custom: [
    { field: 'billingModelCategory.name', binding: 'billingModelCategory.name', width: '*', header: root.$t('common.TERMS.item'), sorting: false }
  ],
  nas: [
    { field: 'billingModelCategory.name', binding: 'billingModelCategory.name', width: '*', header: root.$t('common.TERMS.item'), sorting: false },
    { field: 'billingModelCategory.serviceType', binding: 'billingModelCategory.serviceType', width: '*', header: root.$v('종류'), sorting: false }
  ]
})

// 하단 상세 컬럼
const detailColumns = root => ([
  { field: 'chargeUnit', binding: 'chargeUnit', width: '*', header: root.$t('bill.MODEL.unit'), cellMerge: true, sorting: false, customHtml: true },
  { field: 'fares', binding: 'fares', width: '*', header: root.$t('bill.MODEL.range'), sorting: false, customHtml: true, cssClass: 'cell-scope' },
  { filed: 'billingPrice', binding: 'billingPrice', width: '*', header: root.$t('bill.MODEL.price'), customHtml: true, sorting: false, cssClass: 'cell-price' }
])

// 하단 수정 컬럼
const editColumns = root => ({
  // 컬럼이 4개
  four: [
    { field: 'system', binding: 'system', width: 120, header: root.$t('bill.MODEL.system'), cellMerge: true, sorting: false, customHtml: true },
    { field: 'unit', binding: 'unit', width: 120, header: root.$t('bill.MODEL.unit'), cellMerge: true, sorting: false, customHtml: true },
    { field: 'fares', binding: 'fares', width: 225, header: root.$t('bill.MODEL.range'), sorting: false, customHtml: true, cssClass: 'cell-scope' },
    { filed: 'price', binding: 'price', width: '*', header: root.$t('bill.MODEL.price'), customHtml: true, sorting: false, align: 'left', cssClass: 'cell-price' }
  ],
  // 컬럼이 3개
  three: [
    { field: 'unit', binding: 'unit', width: '*', header: root.$t('bill.MODEL.unit'), cellMerge: true, sorting: false, customHtml: true },
    { field: 'fares', binding: 'fares', width: '*', header: root.$t('bill.MODEL.range'), sorting: false, customHtml: true, cssClass: 'cell-scope' },
    { filed: 'price', binding: 'price', width: '*', header: root.$t('bill.MODEL.price'), customHtml: true, sorting: false, align: 'left', cssClass: 'cell-price' }
  ]
})

export { columns, detailColumns, editColumns }
