import Vue from 'vue'

export default Vue.extend({
  computed: {
    isSetFilter () {
      return !!this.groupIdx
    }
  }
})
