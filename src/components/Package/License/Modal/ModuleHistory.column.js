export default function columns (root) {
  return [
    { field: 'no', header: 'No', binding: 'no', width: 70, customHtml: true },
    { field: 'cmpVersion', header: root.$t('common.TERMS.version'), binding: 'cmpVersion', width: 100 },
    { field: 'moduleCount', header: root.$t('license.TEXT.moduleList'), binding: 'moduleCount', width: 100, customHtml: true },
    { field: 'comment', header: root.$t('common.GRID.explain'), binding: 'comment', width: '*', customHtml: true, align: 'left' },
    { field: 'updateTime', header: root.$t('license.TEXT.rawTextDate'), binding: 'updateTime', width: 130, customHtml: true },
    { field: 'adminName', header: root.$t('admin.ROLE.contactSimple'), binding: 'adminName', width: 135, customHtml: true }
  ]
}
