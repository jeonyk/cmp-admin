export default function columns (root) {
  return [
    { binding: 'number', header: '번호', width: 100, customHtml: true, keyPath: 'admin.NEWS.number' },
    { binding: 'newsTitle', header: '제목', width: '*', align: 'left', keyPath: 'admin.NEWS.title' },
    { binding: 'isView', header: '게시 여부', customHtml: true, width: 150, keyPath: 'admin.NEWS.post' },
    { binding: 'createTime', header: root.$v('등록일'), customHtml: true, width: 200 }
  ]
}
