export default function columns (root) {
  return [
    { binding: 'cost', header: 'Price', customHtml: true },
    { binding: 'projectName', header: '프로젝트' },
    { binding: 'projectInfo.userName', header: '프로젝트 소유자', customHtml: true },
    { binding: 'projectInfo.createDate', header: '프로젝트 생성일' }
  ]
}
