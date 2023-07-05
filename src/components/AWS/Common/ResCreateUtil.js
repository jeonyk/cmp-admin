import API from '@sd-fe/cmp-core'
import Vue from 'vue'

const resMethodUtils = Vue.extend({
  methods: {
    beforeClose (done) {
      // 팝업 문구
      const text = this.isEdit
        ? '수정을 취소하시겠습니까?'
        : '신청을 취소하시겠습니까?'

      this.$confirm(text)
        .then(() => done())
        .catch(() => false)
    },
    /**
     * 스텝 열고 닫기
     */
    expand (step, expanded) {
      step.expanded = !expanded
    },
    /**
     * 단계 이동
     */
    walkStep (index) {
      const methodName = ['moveToOneStep', 'moveToTwoStep', 'moveToThreeStep'][
        index - 1
      ]

      if (methodName) {
        this[methodName]()
      }
    },
    unActiveSteps () {
      this.steps.forEach(step => (step.active = false))
    },
    moveToOneStep () {
      this.unActiveSteps()
      this.steps[0].active = true
      this.currentStep = 1
    },
    moveToTwoStep () {
      this.unActiveSteps()
      this.steps[0].completed = true
      this.steps[0].visited = true
      this.steps[1].active = true
      this.steps[1].visited = true
      this.steps[1].expandable = true
      this.currentStep = 2
    },
    moveToThreeStep () {
      this.unActiveSteps()
      this.steps[0].clickable = true
      this.steps[1].clickable = true
      this.steps[1].completed = true
      this.steps[2].active = true
      this.steps[2].visited = true
      this.currentStep = 3
    }
  }
})

const billUtils = Vue.extend({
  methods: {
    async getRegion (projectIdx) {
      try {
        const { data } = await API.aws.getProjectFromAWS(
          projectIdx
        )
        return data.regionName
      } catch (error) {
        console.log(error)
        this.$alert('프로젝트 조회에 실패하였습니다.')
      }
    },
    async getBillingList (service = 'ec2', regionName = this.__regionName) {
      try {
        const { data } = await API.aws.getPriceList({ regionName, service })
        return data
      } catch (error) {
        console.log(error)
        this.$alert('과금 정보 조회를 실패하였습니다.')
      }
    }
  }
})

const provideUtils = Vue.extend({
  provide () {
    const shared = {}

    Object.defineProperty(shared, 'active', {
      get: () => this.active,
      enumerable: true
    })

    Object.defineProperty(shared, 'currentStep', {
      get: () => this.currentStep,
      enumerable: true
    })

    Object.defineProperty(shared, 'isEdit', {
      get: () => this.isEdit,
      enumerable: true
    })

    Object.defineProperty(shared, 'editData', {
      get: () => this.editData,
      enumerable: true
    })

    return {
      shared
    }
  }
})

const injectUtils = Vue.extend({
  inject: ['shared']
})

export { resMethodUtils, provideUtils, injectUtils, billUtils }
