import { shallowMount, createLocalVue } from '@vue/test-utils'
import NewVersionModal from '@/components/Package/Version/Modal/NewVersion.vue'
import RegisterContents from '@sd-fe/cmp-core'
// import { RegisterContents } from '@sd-fe/cmp-core'
import ElementUI from 'element-ui'

let Component
const MockVue = createLocalVue()

MockVue.component('register-contents', RegisterContents)
MockVue.use(ElementUI, {})
MockVue.prototype.$v = jest.fn()

describe('NewVersionModal', () => {
  beforeAll(() => {
    Component = shallowMount(NewVersionModal, {
      localVue: MockVue,
      mocks: {
        $t: jest.fn()
      },
      propsData: {
        active: true,
        moduleList: []
      }
    })
  })

  it('렌더링 성공 여부', () => {
    expect(Component).toBeDefined()
  })

  it('기본 disabled 영역', () => {
    const regs = Component.findAll('register-contents-stub')
    const disabled = regs.wrappers.slice(2, 4)
    expect(disabled.length).toBe(2)
    expect(disabled[0].find('el-select-stub').attributes('disabled')).toBeTruthy()
  })

  it('모듈 선택시 disabled 해제', async () => {
    const regs = Component.findAll('register-contents-stub')
    const disabledReg = regs.wrappers[2]
    expect(disabledReg.find('el-select-stub').attributes('disabled')).toBeTruthy()
    await Component.setData({ isSelectModuleVersion: true })
    expect(disabledReg.find('el-select-stub').attributes('disabled')).toBeFalsy()
  })
})
