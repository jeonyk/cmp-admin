export default function columns (root) {
  return [
    { field: 'gIndex', binding: 'gIndex', header: 'No', width: 70, customHtml: true },
    { field: 'cmpVersion', binding: 'cmpVersion', header: root.$t('common.TERMS.version'), width: 200 },
    { field: 'packageTypeList', binding: 'packageTypeList', header: root.$t('license.TEXT.packageType'), width: '*', customHtml: true, filtable: false },
    { field: 'moduleCount', binding: 'moduleCount', header: root.$t('license.TEXT.moduleCount'), width: 200, customHtml: true },
    { field: 'manager', binding: 'manager', header: root.$t('admin.ROLE.contactSimple'), width: 200 },
    { field: 'createTime', binding: 'createTime', header: root.$t('common.REGCON.regDate'), width: 200, customHtml: true }
  ]
}
