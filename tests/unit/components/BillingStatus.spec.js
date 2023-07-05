import { shallowMount, config, createLocalVue } from '@vue/test-utils'
import BillingStatus from '@/views/Billing/Integrated/Status/BillingStatus.vue'
import Dayjs from 'dayjs'

config.stubs['cmp-grid'] = '<div />'

const localVue = createLocalVue()

localVue.filter('date', function (source, format = 'YYYY.MM.DD HH:mm:ss', dateTransform = false) {
  if (!source) return ''
  if (dateTransform) {
    const arrSource = source.split(' ')
    arrSource[0] = arrSource[0].replace(/\./g, '-')
    source = arrSource.join(' ')
  }
  return Dayjs(source).format(format)
})

let wrapper

describe('BillingStatus.vue 메서드', () => {
  beforeAll(() => {
    wrapper = shallowMount(BillingStatus, {
      methods: {
        $t: jest.fn()
      },
      directives: {
        loading: jest.fn()
      },
      localVue
    })
  })

  test('getPreviousDate 매개변수로 받은 달을 기준으로 직전 달을 반환', () => {
    const { getPreviousDate } = wrapper.vm
    expect(getPreviousDate('2021-04')).toBe('2021-03')
    expect(getPreviousDate('2021-03')).toBe('2021-02')
    expect(getPreviousDate('2021-01')).toBe('2020-12')
    expect(getPreviousDate('2020-11')).toBe('2020-10')
    expect(getPreviousDate('2020-07')).toBe('2020-06')
    expect(getPreviousDate('2020-05')).toBe('2020-04')
    expect(getPreviousDate('2020-02')).toBe('2020-01')
  })

  test('processDistribute 전 달 공통배분 값과 현재 공통배분 값을 처리', () => {
    /**
     * @type {(before: number | null, after: number | null) => (number | null)}
     */
    const processDistribute = wrapper.vm.processDistribute
    expect(processDistribute(1000, 2000)).toBe(1000) // (2000 - 1000) === 1000
    expect(processDistribute(3000, null)).toBe(-3000) // null - 3000 === -3000
    expect(processDistribute(0, 0)).toBe(0) // 0 - 0 === 0
    expect(processDistribute(null, 3000)).toBe(3000) // 3000 - 0 === 3000
    expect(processDistribute(2000, 1000)).toBe(-1000) // 1000 - 2000 === -1000
    expect(processDistribute(4000, undefined)).toBe(-4000) // 0 - 4000 = -4000
  })
})
