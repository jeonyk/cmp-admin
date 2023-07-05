const gridHeader = root => ({

  // 하드웨어
  hardware: [
    {
      header: 'No',
      field: 'index',
      binding: 'index',
      width: 70,
      customHtml: true
    },
    {
      header: root.$v('타입'),
      field: 'billingModelCategory.name',
      binding: 'billingModelCategory.name',
      width: 170,
      customHtml: true
    },
    {
      // header: root.$t('bill.kinds'), // 종류
      header: root.$v('항목'), // 종류
      field: 'billingModelCategory.serviceId',
      binding: 'billingModelCategory.serviceId',
      width: 130,
      cellMerge: false,
      customHtml: true
    },
    {
      header: root.$v('종류'), // 종류
      field: 'billingModelCategory.serviceType',
      binding: 'billingModelCategory.serviceType',
      width: 120,
      cellMerge: false,
      customHtml: true
    },
    {
      header: root.$t('bill.MODEL.unit'), // 과금 단위
      field: 'chargeUnit',
      binding: 'chargeUnit',
      width: 120,
      customHtml: true
    },
    // { header: '할당량', binding: 'allocate', width: '*' },
    {
      header: root.$t('bill.MODEL.range'), // 기준 범위
      field: 'scope.standard',
      binding: 'scope.standard',
      width: 300,
      cssClass: 'no-padding-cell',
      customHtml: true,
      filtable: false,
      multiLine: true,
      wordWrap: true
    },
    {
      header: root.$t('bill.MODEL.price'), // 과금 단가
      field: 'fares[0].cost',
      binding: 'fares[0].cost',
      width: '*',
      cssClass: 'no-padding-cell',
      customHtml: true,
      filtable: false,
      multiLine: true,
      wordWrap: true
    },
    {
      header: root.$t('common.PLACEHOLDER.remark'), // 비고
      field: 'note',
      binding: 'note',
      width: 70,
      customHtml: true,
      sorting: false
    }
  ],
  // 소프트웨어
  software: [
    { header: 'No', field: 'index', binding: 'index', width: 70, customHtml: true },
    {
      header: root.$t('bill.MODEL.nameAndOS'), // 이름 / 운영체제
      field: 'billingModelCategory.name',
      binding: 'billingModelCategory.name',
      width: 150,
      customHtml: true
    },
    {
      header: root.$t('common.TERMS.version'),
      field: 'billingModelCategory.version',
      binding: 'billingModelCategory.version',
      width: 70,
      customHtml: true
    }, // 버전
    {
      header: root.$t('bill.kinds'),
      field: 'billingModelCategory.serviceType',
      binding: 'billingModelCategory.serviceType',
      width: 130,
      customHtml: true
    }, // 종류
    {
      header: root.$t('bill.MODEL.unit'), // 과금 단위
      field: 'chargeUnit',
      binding: 'chargeUnit',
      width: 120,
      customHtml: true
    },
    {
      header: root.$t('bill.MODEL.range'),
      field: 'scope.standard',
      binding: 'scope.standard',
      width: '*',
      cssClass: 'no-padding-cell',
      customHtml: true,
      filtable: false
    }, // 기준 범위
    {
      header: root.$t('bill.MODEL.price'), // 과금 단가
      field: 'fares[0].cost',
      binding: 'fares[0].cost',
      cssClass: 'no-padding-cell',
      width: 270,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('common.PLACEHOLDER.remark'),
      field: 'note',
      binding: 'note',
      width: 70,
      sorting: false,
      customHtml: true
    }
  ],
  // L4
  l4: [
    {
      header: 'No',
      field: 'index',
      binding: 'index',
      width: 70,
      customHtml: true
    },
    {
      header: root.$v('이름'), // 이름
      field: 'billingModelCategory.name',
      binding: 'billingModelCategory.name',
      width: 150,
      customHtml: true,
      cellMerge: true
    },
    {
      header: root.$v('스위치 장비'),
      field: 'billingModelCategory.equipmentList',
      binding: 'billingModelCategory.equipmentList',
      width: 150,
      customHtml: true,
      cellMerge: true,
      filtable: false
    },
    {
      header: root.$t('bill.kinds'), // 종류
      field: 'billingModelCategory.serviceType',
      binding: 'billingModelCategory.serviceType',
      width: 150,
      cellMerge: false,
      customHtml: true
    },
    {
      header: root.$t('bill.MODEL.unit'), // 과금 단위
      field: 'chargeUnit',
      binding: 'chargeUnit',
      width: 150,
      customHtml: true
    },
    // {
    //   header: root.$t('bill.MODEL.system'),
    //   field: 'chargeType',
    //   binding: 'chargeType',
    //   width: 100,
    //   customHtml: true
    // },
    // { header: '할당량', binding: 'allocate', width: '*' },
    {
      header: root.$t('bill.MODEL.range'), // 기준 범위
      field: 'scope.standard',
      binding: 'scope.standard',
      width: '*',
      cssClass: 'no-padding-cell',
      sorting: false,
      customHtml: true,
      filltable: false
    },
    {
      header: root.$t('bill.MODEL.price'), // 과금 단가
      field: 'fares[0].cost',
      binding: 'fares[0].cost',
      width: '*',
      cssClass: 'no-padding-cell',
      // sorting: false,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('common.PLACEHOLDER.remark'),
      field: 'note',
      binding: 'note',
      width: 70,
      customHtml: true,
      sorting: false
    }
  ],
  // L7
  l7: [
    {
      header: 'No',
      field: 'index',
      binding: 'index',
      width: 70,
      customHtml: true
    },
    {
      header: root.$v('이름'), // 이름
      field: 'billingModelCategory.name',
      binding: 'billingModelCategory.name',
      width: 150,
      customHtml: true
    },
    {
      header: root.$v('스위치 장비'),
      field: 'billingModelCategory.equipmentList',
      binding: 'billingModelCategory.equipmentList',
      width: 150,
      customHtml: true,
      cellMerge: true,
      filtable: false
    },
    {
      header: root.$t('bill.kinds'), // 종류,
      field: 'billingModelCategory.serviceType',
      binding: 'billingModelCategory.serviceType',
      width: 150,
      cellMerge: false,
      customHtml: true
    },
    {
      header: root.$t('bill.MODEL.unit'), // 과금 단위,
      field: 'chargeUnit',
      binding: 'chargeUnit',
      width: 150,
      customHtml: true
    },
    // {
    //   header: root.$t('bill.MODEL.system'),
    //   field: 'chargeType',
    //   binding: 'chargeType',
    //   width: 100,
    //   customHtml: true
    // },
    // { header: '할당량', binding: 'allocate', width: '*' },
    {
      header: root.$t('bill.MODEL.range'), // 기준 범위,
      field: 'scope.standard',
      binding: 'scope.standard',
      width: '*',
      cssClass: 'no-padding-cell',
      sorting: false,
      customHtml: true,
      filltable: false
    },
    {
      header: root.$t('bill.MODEL.price'), // 과금 단가,
      field: 'fares[0].cost',
      binding: 'fares[0].cost',
      width: '*',
      cssClass: 'no-padding-cell',
      // sorting: false,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('common.PLACEHOLDER.remark'), // 비고
      field: 'note',
      binding: 'note',
      width: 70,
      customHtml: true,
      sorting: false
    }
  ],
  // Firewall
  firewall: [
    {
      header: 'No',
      field: 'index',
      binding: 'index',
      width: 70,
      customHtml: true
    },
    {
      header: root.$v('항목'), // 항목
      field: 'billingModelCategory.name',
      binding: 'billingModelCategory.name',
      width: 150,
      customHtml: true
    },
    {
      header: root.$v('방화벽 장비'),
      field: 'billingModelCategory.equipmentList',
      binding: 'billingModelCategory.equipmentList',
      width: 150,
      customHtml: true,
      cellMerge: true,
      filtable: false
    },
    {
      header: root.$t('bill.kinds'), // 종류,
      field: 'billingModelCategory.serviceType',
      binding: 'billingModelCategory.serviceType',
      width: 150,
      cellMerge: false,
      customHtml: true
    },
    {
      header: root.$t('bill.MODEL.unit'), // 과금 단위,
      field: 'chargeUnit',
      binding: 'chargeUnit',
      width: 150,
      customHtml: true
    },
    // {
    //   header: root.$t('bill.MODEL.system'),
    //   field: 'chargeType',
    //   binding: 'chargeType',
    //   width: 100,
    //   customHtml: true
    // },
    // { header: '할당량', binding: 'allocate', width: '*' },
    {
      header: root.$t('bill.MODEL.range'), // 기준 범위,
      field: 'scope.standard',
      binding: 'scope.standard',
      width: '*',
      cssClass: 'no-padding-cell',
      sorting: false,
      customHtml: true,
      filltable: false
    },
    {
      header: root.$t('bill.MODEL.price'), // 과금 단가,
      field: 'fares[0].cost',
      binding: 'fares[0].cost',
      width: '*',
      cssClass: 'no-padding-cell',
      // sorting: false,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('common.PLACEHOLDER.remark'), // 비고
      field: 'note',
      binding: 'note',
      width: 70,
      customHtml: true,
      sorting: false,
      filtable: false
    }
  ],
  // 커스텀 요금
  custom: [
    {
      header: 'No',
      field: 'index',
      binding: 'index',
      width: 70,
      customHtml: true
    },
    {
      header: root.$t('common.TERMS.item'), // 항목
      field: 'billingModelCategory.name',
      binding: 'billingModelCategory.name',
      width: 200,
      customHtml: true
    },
    {
      header: root.$t('bill.MODEL.unit'), // 과금 단위
      field: 'chargeUnit',
      binding: 'chargeUnit',
      width: 120,
      customHtml: true
    },
    // { header: '할당량', binding: 'allocate', width: '*' },
    {
      header: root.$t('bill.MODEL.range'), // 기준 범위
      field: 'scope.standard',
      binding: 'scope.standard',
      width: 300,
      cssClass: 'no-padding-cell',
      customHtml: true,
      filtable: false,
      multiLine: true,
      wordWrap: true
    },
    {
      header: root.$t('bill.MODEL.price'), // 과금 단가
      field: 'fares[0].cost',
      binding: 'fares[0].cost',
      width: '*',
      cssClass: 'no-padding-cell',
      customHtml: true,
      filtable: false,
      multiLine: true,
      wordWrap: true
    },
    {
      header: root.$t('common.PLACEHOLDER.remark'), // 비고
      field: 'note',
      binding: 'note',
      width: 70,
      customHtml: true,
      sorting: false
    }
  ],
  // NX Files 요금
  nas: [
    {
      header: 'No',
      field: 'index',
      binding: 'index',
      width: 70,
      customHtml: true
    },
    {
      header: root.$t('common.TERMS.item'), // 항목
      field: 'billingModelCategory.name',
      binding: 'billingModelCategory.name',
      width: 200,
      customHtml: true
    },
    {
      header: root.$t('bill.kinds'), // 종류
      field: 'billingModelCategory.serviceType',
      binding: 'billingModelCategory.serviceType',
      width: 200,
      customHtml: true
    },
    {
      header: root.$t('bill.MODEL.unit'), // 과금 단위
      field: 'chargeUnit',
      binding: 'chargeUnit',
      width: 120,
      customHtml: true
    },
    {
      header: root.$t('bill.MODEL.range'), // 기준 범위
      field: 'scope.standard',
      binding: 'scope.standard',
      width: 300,
      cssClass: 'no-padding-cell',
      customHtml: true,
      filtable: false,
      multiLine: true,
      wordWrap: true
    },
    {
      header: root.$t('bill.MODEL.price'), // 과금 단가
      field: 'fares[0].cost',
      binding: 'fares[0].cost',
      width: '*',
      cssClass: 'no-padding-cell',
      customHtml: true,
      filtable: false,
      multiLine: true,
      wordWrap: true
    },
    {
      header: root.$t('common.PLACEHOLDER.remark'), // 비고
      field: 'note',
      binding: 'note',
      width: 70,
      customHtml: true,
      sorting: false
    }
  ]
})

const gridHeaderDetail = root => ({
  // 하드웨어
  hardware: [
    {
      header: 'No',
      field: 'serviceIdx',
      binding: 'serviceIdx',
      width: 70,
      customHtml: true,
      filtable: false
    },
    {
      // header: root.$t('common.TERMS.item'), // 항목
      header: root.$v('타입'),
      field: 'billingModelCategory.name',
      binding: 'billingModelCategory.name',
      width: 130,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$v('항목'), // 종류
      field: 'billingModelCategory.serviceId',
      binding: 'billingModelCategory.serviceId',
      width: 130,
      cellMerge: false,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$v('종류'), // 종류
      field: 'billingModelCategory.serviceType',
      binding: 'billingModelCategory.serviceType',
      width: '0.75*',
      cellMerge: false,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('bill.MODEL.unit'), // 과금 단위
      field: 'chargeUnit',
      binding: 'chargeUnit',
      width: 120,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('bill.MODEL.system'),
      field: 'chargeType',
      binding: 'chargeType',
      width: 100,
      customHtml: true,
      filtable: false
    },
    // { header: '할당량', binding: 'allocate', width: '*' },
    {
      header: root.$t('bill.MODEL.range'), // 기준 범위
      field: 'scope.standard',
      binding: 'scope.standard',
      width: '1.75*',
      cssClass: 'no-padding-cell',
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('bill.MODEL.price'), // 과금 단가
      field: 'scope.cost',
      binding: 'scope.cost',
      width: '2*',
      cssClass: 'no-padding-cell',
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('common.PLACEHOLDER.remark'), // 비고
      field: 'comment',
      binding: 'comment',
      width: 70,
      customHtml: true,
      sorting: false
    }
  ],
  // 소프트웨어
  software: [
    { header: 'No', field: 'serviceIdx', binding: 'serviceIdx', width: 70, customHtml: true },
    {
      header: root.$t('bill.MODEL.nameAndOS'), // 이름 / 운영체제
      field: 'billingModelCategory.name',
      binding: 'billingModelCategory.name',
      width: 170,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('common.TERMS.version'),
      field: 'billingModelCategory.version',
      binding: 'billingModelCategory.version',
      width: 70,
      customHtml: true,
      filtable: false
    }, // 버전
    {
      header: root.$t('bill.kinds'),
      field: 'serviceType',
      binding: 'serviceType',
      width: 130,
      customHtml: true,
      filtable: false
    }, // 종류
    {
      header: root.$t('bill.MODEL.unit'), // 과금 단위
      field: 'chargeUnit',
      binding: 'chargeUnit',
      width: 120,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('bill.MODEL.system'), // 과금 체계
      field: 'chargeType',
      binding: 'chargeType',
      width: 90,
      customHtml: true,
      sorting: false,
      filtable: false
    },
    {
      header: root.$t('bill.MODEL.range'),
      field: 'scope.standard',
      binding: 'scope.standard',
      width: '*',
      cssClass: 'no-padding-cell',
      customHtml: true,
      filtable: false
    }, // 기준 범위
    {
      header: root.$t('bill.MODEL.price'), // 과금 단가
      field: 'scope.cost',
      binding: 'scope.cost',
      cssClass: 'no-padding-cell',
      width: 270,
      customHtml: true
    },
    {
      header: root.$t('common.PLACEHOLDER.remark'),
      field: 'comment',
      binding: 'comment',
      width: 70,
      sorting: false,
      customHtml: true
    }
  ],
  // L4
  l4: [
    {
      header: 'No',
      field: 'serviceIdx',
      binding: 'serviceIdx',
      width: 70,
      customHtml: true
    },
    {
      header: root.$v('이름'), // 이름
      field: 'billingModelCategory.name',
      binding: 'billingModelCategory.name',
      width: 150,
      customHtml: true,
      cellMerge: true,
      filtable: false
    },
    {
      header: root.$v('스위치 장비'), // 이름
      field: 'billingModelCategory.equipmentList',
      binding: 'billingModelCategory.equipmentList',
      width: 150,
      customHtml: true,
      cellMerge: true,
      filtable: false
    },
    {
      header: root.$t('bill.kinds'), // 종류
      field: 'billingModelCategory.serviceType',
      binding: 'billingModelCategory.serviceType',
      width: 150,
      cellMerge: false,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('bill.MODEL.unit'), // 과금 단위
      field: 'chargeUnit',
      binding: 'chargeUnit',
      width: 150,
      customHtml: true,
      filtable: false
    },
    // { header: '할당량', binding: 'allocate', width: '*' },
    {
      header: root.$t('bill.MODEL.range'), // 기준 범위
      field: 'scope.standard',
      binding: 'scope.standard',
      width: '*',
      cssClass: 'no-padding-cell',
      sorting: false,
      customHtml: true,
      filltable: false
    },
    {
      header: root.$t('bill.MODEL.price'), // 과금 단가
      field: 'scope.cost',
      binding: 'scope.cost',
      width: '*',
      cssClass: 'no-padding-cell',
      sorting: false,
      customHtml: true,
      filltable: false
    },
    {
      header: root.$t('common.PLACEHOLDER.remark'),
      field: 'comment',
      binding: 'comment',
      width: 70,
      customHtml: true,
      sorting: false
    }
  ],
  // L7
  l7: [
    {
      header: 'No',
      field: 'serviceIdx',
      binding: 'serviceIdx',
      width: 70,
      customHtml: true
    },
    {
      header: root.$v('이름'), // 이름
      field: 'billingModelCategory.name',
      binding: 'billingModelCategory.name',
      width: 150,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$v('스위치 장비'),
      field: 'billingModelCategory.equipmentList',
      binding: 'billingModelCategory.equipmentList',
      width: 150,
      customHtml: true,
      cellMerge: true,
      filtable: false
    },
    {
      header: root.$t('bill.kinds'), // 종류,
      field: 'billingModelCategory.serviceType',
      binding: 'billingModelCategory.serviceType',
      width: 150,
      cellMerge: false,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('bill.MODEL.unit'), // 과금 단위,
      field: 'chargeUnit',
      binding: 'chargeUnit',
      width: 150,
      customHtml: true,
      filtable: false
    },
    // {
    //   header: root.$t('bill.MODEL.system'),
    //   field: 'chargeType',
    //   binding: 'chargeType',
    //   width: 100,
    //   customHtml: true
    // },
    // { header: '할당량', binding: 'allocate', width: '*' },
    {
      header: root.$t('bill.MODEL.range'), // 기준 범위,
      field: 'scope.standard',
      binding: 'scope.standard',
      width: '*',
      cssClass: 'no-padding-cell',
      sorting: false,
      customHtml: true,
      filltable: false
    },
    {
      header: root.$t('bill.MODEL.price'), // 과금 단가,
      field: 'scope.cost',
      binding: 'scope.cost',
      width: '*',
      cssClass: 'no-padding-cell',
      sorting: false,
      customHtml: true
    },
    {
      header: root.$t('common.PLACEHOLDER.remark'), // 비고
      field: 'comment',
      binding: 'comment',
      width: 70,
      customHtml: true,
      sorting: false
    }
  ],
  // Firewall
  firewall: [
    {
      header: 'No',
      field: 'serviceIdx',
      binding: 'serviceIdx',
      width: 70,
      customHtml: true
    },
    {
      header: root.$v('항목'), // 항목
      field: 'billingModelCategory.name',
      binding: 'billingModelCategory.name',
      width: 150,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$v('스위치 장비'),
      field: 'billingModelCategory.equipmentList',
      binding: 'billingModelCategory.equipmentList',
      width: 150,
      customHtml: true,
      cellMerge: true,
      filtable: false
    },
    {
      header: root.$t('bill.kinds'), // 종류,
      field: 'billingModelCategory.serviceType',
      binding: 'billingModelCategory.serviceType',
      width: 150,
      cellMerge: false,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('bill.MODEL.unit'), // 과금 단위,
      field: 'chargeUnit',
      binding: 'chargeUnit',
      width: 150,
      customHtml: true,
      filtable: false
    },
    // {
    //   header: root.$t('bill.MODEL.system'),
    //   field: 'chargeType',
    //   binding: 'chargeType',
    //   width: 100,
    //   customHtml: true
    // },
    // { header: '할당량', binding: 'allocate', width: '*' },
    {
      header: root.$t('bill.MODEL.range'), // 기준 범위,
      field: 'scope.standard',
      binding: 'scope.standard',
      width: '*',
      cssClass: 'no-padding-cell',
      sorting: false,
      customHtml: true,
      filltable: false
    },
    {
      header: root.$t('bill.MODEL.price'), // 과금 단가,
      field: 'scope.cost',
      binding: 'scope.cost',
      width: '*',
      cssClass: 'no-padding-cell',
      sorting: false,
      customHtml: true
    },
    {
      header: root.$t('common.PLACEHOLDER.remark'), // 비고
      field: 'comment',
      binding: 'comment',
      width: 70,
      customHtml: true,
      sorting: false
    }
  ],
  // AWS
  EC2: [
    {
      header: 'No',
      field: 'index',
      binding: 'index',
      width: 70,
      customHtml: true
    },
    {
      header: root.$t('common.TERMS.item'), // 항목
      field: 'category.name',
      binding: 'category.name',
      width: 200,
      customHtml: true
    },
    {
      header: root.$t('bill.kinds'), // 종류
      field: 'category.serviceType',
      binding: 'category.serviceType',
      width: 100,
      cellMerge: false,
      customHtml: true
    },
    {
      header: root.$t('bill.MODEL.unit'), // 과금 단위
      field: 'chargeUnit',
      binding: 'chargeUnit',
      width: 120,
      customHtml: true
    },
    // { header: '할당량', binding: 'allocate', width: '*' },
    {
      header: root.$t('bill.MODEL.range'), // 기준 범위
      field: 'scope.standard',
      binding: 'scope.standard',
      width: 300,
      cssClass: 'no-padding-cell',
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('bill.MODEL.price'), // 과금 단가
      field: 'scope.cost',
      binding: 'scope.cost',
      width: '*',
      cssClass: 'no-padding-cell',
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('common.PLACEHOLDER.remark'), // 비고
      field: 'note',
      binding: 'note',
      width: 70,
      customHtml: true,
      sorting: false
    }
  ],
  custom: [
    {
      header: 'No',
      field: 'serviceIdx',
      binding: 'serviceIdx',
      width: 70,
      customHtml: true
    },
    {
      header: root.$t('common.TERMS.item'), // 항목
      field: 'billingModelCategory.name',
      binding: 'billingModelCategory.name',
      width: 200,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('bill.MODEL.unit'), // 과금 단위
      field: 'chargeUnit',
      binding: 'chargeUnit',
      width: 120,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('bill.MODEL.system'),
      field: 'chargeType',
      binding: 'chargeType',
      width: 100,
      customHtml: true,
      filtable: false
    },
    // { header: '할당량', binding: 'allocate', width: '*' },
    {
      header: root.$t('bill.MODEL.range'), // 기준 범위
      field: 'scope.standard',
      binding: 'scope.standard',
      width: 300,
      cssClass: 'no-padding-cell',
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('bill.MODEL.price'), // 과금 단가
      field: 'scope.cost',
      binding: 'scope.cost',
      width: '*',
      cssClass: 'no-padding-cell',
      customHtml: true
    },
    {
      header: root.$t('common.PLACEHOLDER.remark'), // 비고
      field: 'comment',
      binding: 'comment',
      width: 70,
      customHtml: true,
      sorting: false
    }
  ],
  // NX Files 요금
  nas: [
    {
      header: 'No',
      field: 'serviceIdx',
      binding: 'serviceIdx',
      width: 70,
      customHtml: true
    },
    {
      header: root.$t('common.TERMS.item'), // 항목
      field: 'billingModelCategory.name',
      binding: 'billingModelCategory.name',
      width: 200,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('bill.kinds'), // 종류
      field: 'billingModelCategory.serviceType',
      binding: 'billingModelCategory.serviceType',
      width: 200,
      customHtml: true
    },
    {
      header: root.$t('bill.MODEL.unit'), // 과금 단위
      field: 'chargeUnit',
      binding: 'chargeUnit',
      width: 120,
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('bill.MODEL.system'),
      field: 'chargeType',
      binding: 'chargeType',
      width: 100,
      customHtml: true,
      filtable: false
    },
    // { header: '할당량', binding: 'allocate', width: '*' },
    {
      header: root.$t('bill.MODEL.range'), // 기준 범위
      field: 'scope.standard',
      binding: 'scope.standard',
      width: 300,
      cssClass: 'no-padding-cell',
      customHtml: true,
      filtable: false
    },
    {
      header: root.$t('bill.MODEL.price'), // 과금 단가
      field: 'scope.cost',
      binding: 'scope.cost',
      width: '*',
      cssClass: 'no-padding-cell',
      customHtml: true
    },
    {
      header: root.$t('common.PLACEHOLDER.remark'), // 비고
      field: 'comment',
      binding: 'comment',
      width: 70,
      customHtml: true,
      sorting: false
    }
  ]
})

export { gridHeader, gridHeaderDetail }
