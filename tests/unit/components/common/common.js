
/**
 * String 검사
 * 영문, 숫자, 특수문자, HTML 태그 한번씩 검사용
 */
const doc = document.createElement('div')

const cases = [
  'Hello World', // 1. 영문
  '안녕 세상아', // 2. 한글
  '💩💩💩', // 3. 특수문자 (이모지)
  'tlstprP1@#', // 4. 특수문자조합
  'HELLO_WORLD-?',
  '123~!@#$^&*()_+=.?',
  '<script>alert(1)</script>', // 5. HTML String
  '<p>p element</p>',
  true, // 6. Boolean
  { object: true }, // 7. Object
  [1, 2, 3, 4], // 7. Array
  doc // 8. HTML 요소
]

export { cases }
