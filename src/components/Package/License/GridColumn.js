const columns = (root) => [
  { field: 'index', binding: 'index', width: 70, header: 'No', customHtml: true },
  { field: 'companyName', binding: 'companyName', width: 300, header: root.$t('license.TEXT.buyer') },
  { field: 'buyerCode', binding: 'companyCode', width: 150, header: root.$t('license.TEXT.buyerCode') },
  { field: 'licensePackageType', binding: 'licensePackageType', width: '*', header: root.$t('common.TERMS.version'), customHtml: true },
  { field: 'activeModule', binding: 'activeModule', width: '*', header: root.$t('license.TEXT.activeModuleCnt'), customHtml: true },
  { field: 'elicenseSubscriptionType', binding: 'licenseSubscriptionType', width: '*', header: root.$t('license.TEXT.type') },
  { field: 'purchaseDate', binding: 'purchaseDate', width: '*', header: root.$t('license.TEXT.purchaseDate') },
  { field: 'nodeCount', binding: 'nodeCount', width: '*', header: root.$t('license.TEXT.nodeCnt') },
  { field: 'createTime', binding: 'createTime', width: '*', header: root.$t('common.REGCON.regDate'), customHtml: true }
]

export default columns
