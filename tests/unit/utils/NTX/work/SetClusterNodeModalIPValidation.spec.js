
// test 함수 - ip 형식 체크
function isCorrectIp (input) {
  const ipFormat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const checkFormat = ipFormat.test(input)
  if (!checkFormat) throw new Error('🤬 올바른 IP 형식이 아닙니다.')
  return checkFormat
}

// ip 형식 가공
const atoi = ip => {
  const pad = n => { return (n.length < 3) ? pad('0' + n) : n }
  return parseInt(ip.split('.').map((el) => pad(el)).join(''), 10)
}

// ip 범위
const ipRange = [
  { startAddress: '61.250.84.76', endAddress: '61.250.84.82' },
  { startAddress: '61.250.84.96', endAddress: '61.250.84.103' }
]

// test 함수 - 내부에 존재하는지 체크
function isInsideRage (ip) {
  const isTrue = ipRange.some(pool => {
    // console.log(atoi(ip), atoi(pool.startAddress), atoi(pool.endAddress))
    // console.log(atoi(ip) >= atoi(pool.startAddress) && atoi(ip) <= atoi(pool.endAddress))

    const result = (
      atoi(ip) >= atoi(pool.startAddress) &&
      atoi(ip) <= atoi(pool.endAddress)
    )
    return result
  })

  if (!isTrue) throw new Error('🤬 등록한 ip가 범위 밖에 있습니다.')
  return isTrue
}

// 테스트 동작
describe('클러스터 모달 > 네트워크 IP validation', () => {
  const sampleIP1 = '61.250.84.79' // 정상적인 ip
  const sampleIP2 = '61.250.84.99' // 정상적인 ip
  const sampleIP3 = '61.250.84.83' // 범위에 벗어난 ip

  describe('ip 형식이 맞는지 먼저 체크', () => {
    test('다양한 케이스', () => {
      expect(isCorrectIp(sampleIP1)).toBeTruthy() // true
      // expect(isCorrectIp('asdf153120.f')).toBeTruthy() // 🔴
      // expect(isCorrectIp('에에에에 엥 ㅁㄴ람 ㅗㅇㅎㅁㅇㄹㅁ')).toBeTruthy() // 🔴
      // expect(isCorrectIp('1111111111')).toBeTruthy() // 🔴
      // expect(isCorrectIp('23454647')).toBeTruthy() // 🔴
      // expect(isCorrectIp('!@#%^%')).toBeTruthy() // 🔴
      // expect(isCorrectIp('영문!#@')).toBeTruthy() // 🔴
      // expect(isCorrectIp('123#556.@#')).toBeTruthy() // 🔴
    })
  })

  describe('입력된 ip가 ip범위 내부 (startAddress ~ endAddress) 사이에 있는지 체크', () => {
    test('범위 내부에 있는 ip / 없는 ip 케이스', () => {
      expect(isInsideRage(sampleIP1)).toBeTruthy() // true
      expect(isInsideRage(sampleIP2)).toBeTruthy() // true
      // expect(isInsideRage(sampleIP3)).toBeTruthy() // false 🔴
    })
  })
})
