export default function columns (root) {
  return [
    { field: 'modulePath', binding: 'modulePath', header: root.$t('license.TEXT.location'), width: 400, customHtml: true },
    { field: 'moduleVersion', binding: 'moduleVersion', header: root.$t('common.TERMS.version'), width: 200 },
    { field: 'comment', binding: 'comment', header: root.$t('common.GRID.explain'), width: '*' },
    { field: 'regUser', binding: 'regUser', header: root.$t('license.TEXT.registrant'), width: 200, customHtml: true },
    { field: 'regDate', binding: 'regDate', header: root.$t('common.REGCON.regDate'), width: 200, customHtml: true }
  ]
}
