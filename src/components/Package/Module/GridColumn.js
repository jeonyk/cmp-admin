export default function columns (root) {
  return [
    { field: 'no', binding: 'index', header: 'No', width: 70, customHtml: true },
    { field: 'moduleName', binding: 'moduleName', header: root.$t('license.TEXT.moduleName'), width: 460 },
    { field: 'packgeTypeList', binding: 'packageTypeList', header: root.$t('license.TEXT.packageType'), width: '*', customHtml: true, filtable: false },
    { field: 'currentVersion', binding: 'latestVersion', header: root.$t('license.TEXT.latestVersion'), width: 200 },
    { field: 'updateTime', binding: 'updateTime', header: root.$t('license.TEXT.lastModified'), width: 200 },
    { field: 'createTime', binding: 'createTime', header: root.$t('common.REGCON.regDate'), width: 200 }
  ]
}
