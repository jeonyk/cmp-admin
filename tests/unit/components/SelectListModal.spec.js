import { shallowMount, config } from '@vue/test-utils'
import SelectListModal from '@/components/Modal/SelectListModal/SelectListModal.vue'

config.stubs['el-dialog'] = true

const defaultComponentOption = {
  mocks: {
    $t: jest.fn(),
    $alert: jest.fn()
  }
}

describe('SelectListModal.vue', () => {
  test('requiredSelect props true 상태 테스트', async () => {
    const customOptions = {
      ...defaultComponentOption,
      propsData: {
        requiredSelect: true,
        active: true
      }
    }
    const wrapper = shallowMount(SelectListModal, customOptions)
    const confirmButton = wrapper.find('button[type="is-primary"]')
    // 초기값 확인
    expect(wrapper.vm.selectedItems.length).toBe(0)
    // 선택된 값 없이 확인 버튼 누름
    confirmButton.trigger('click')
    // this.$emit('close') 감지
    expect(wrapper.emitted().close).toBeFalsy()
    // 선택된 아이템 있음
    wrapper.vm.selectedItems.push(0)
    confirmButton.trigger('click')
    // expect(wrapper.emitted().close).toBeTruthy()
  })

  test('requiredSelect props false 상태 테스트', () => {
    const customOptions = {
      ...defaultComponentOption,
      propsData: {
        requiredSelect: false,
        active: true
      }
    }
    const wrapper = shallowMount(SelectListModal, customOptions)
    const confirmButton = wrapper.find('button[type="is-primary"]')
    confirmButton.trigger('click')
    // expect(wrapper.emitted().close).toBeTruthy()
  })
})
