export default function column (root) {
  return [
    { binding: 'userId', header: root.$t('common.GRID.pressure'), width: 100, customHtml: true },
    { binding: 'userName', header: root.$t('common.REGCON.name'), width: 100 },
    // { binding: 'comment', header: root.$t('common.REGCON.content'), width: '*' },
    { binding: 'ip', header: 'IP', width: 150 },
    { binding: 'uri', header: 'URL', width: '*' },
    { binding: 'httpMethod', header: 'HTTP Method', width: 120 },
    { binding: 'createTime', header: root.$t('common.REGCON.dateInfo'), customHtml: true, width: 150 }
  ]
}
