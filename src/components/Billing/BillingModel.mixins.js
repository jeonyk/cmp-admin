import Vue from 'vue'

export default Vue.extend({
  methods: {
    setActiveModelNameAll () {
      ;['mockUpModelData', 'mockUpModelDataNoApply'].forEach(modelDataKey => {
        if (Array.isArray(this[modelDataKey])) {
          this[modelDataKey].forEach(data => {
            if (!data.models) return
            this.setActiveModelName(data, Object.keys(data.models))
          })
        } else {
          this.setActiveModelName(this[modelDataKey], Object.keys(this[modelDataKey].models))
        }
      })
    },
    setActiveModelName (data, keys) {
      keys.forEach(key => {
        const model = data.models[key]

        if (model.expandable) {
          const active = model.children.find(child => child.active)
          if (active) {
            this.activeModelName = {
              ...active,
              isChild: true,
              name: '관계사별 과금모델',
              childName: active.name
            }
          }
        } else {
          if (model.active) {
            this.activeModelName = { ...model }
          }
        }
      })
    }
  },
  data: (root) => ({
    // activeModelName: null,
    modelTypeMap: {
      1: root.$t('bill.MODEL.standard'),
      2: root.$t('bill.MODEL.common'),
      3: root.$t('bill.MODEL.aff')
    }
  })
})

// import Vue from 'vue'

// export default Vue.extend({
//   data: () => ({
//     modelTypeMap: {
//       1: '표준 과금모델',
//       2: '공통자원 과금모델',
//       3: '관계사별 과금모델'
//     }
//   })
// })
