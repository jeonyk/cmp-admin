export const columns = (root) => ([
  {
    header: 'No',
    binding: 'index',
    field: 'index',
    width: 70,
    customHtml: true
  },
  {
    header: root.$t('bill.modelName'),
    binding: 'name',
    field: 'name',
    width: '*',
    customHtml: true
  },
  {
    header: root.$t('bill.MODEL.filterBilling'),
    binding: 'billing',
    field: 'billing',
    width: 100,
    customHtml: true
  },
  {
    header: root.$t('bill.MODEL.countAffModel'),
    binding: 'rawModelCount',
    field: 'rawModelCount',
    width: 130,
    customHtml: true
  },
  {
    header: root.$t('common.REGCON.regDate'),
    binding: 'createTime',
    field: 'createTime',
    width: 150,
    customHtml: true
  }
])

export const distColumns = (root) => ([
  {
    header: 'No',
    binding: 'index',
    width: 70,
    customHtml: true
  },
  {
    header: root.$t('bill.modelName'),
    binding: 'name',
    width: '*',
    customHtml: true
  },
  {
    header: root.$t('bill.MODEL.filterBilling'),
    binding: 'billing',
    width: 100
  },
  {
    header: '등록 프로젝트 수',
    binding: 'projectCount',
    width: 100
  },
  {
    header: root.$t('common.REGCON.regDate'),
    binding: 'createTime',
    width: 150,
    customHtml: true
  }
])
