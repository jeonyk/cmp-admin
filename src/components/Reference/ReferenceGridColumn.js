export default function columns (root) {
  return [
    { binding: 'index', header: '번호', width: 100, customHtml: true, keyPath: 'common.TERMS.number' },
    { binding: 'referenceRoomTitle', header: '제목', keyPath: 'common.TERMS.title', width: '*', align: 'left' },
    { binding: 'isView', header: '게시 여부', keyPath: 'common.TERMS.isPost', customHtml: true, width: 150 },
    { binding: 'createTime', header: root.$v('등록일'), customHtml: true, width: 200 }
  ]
}
