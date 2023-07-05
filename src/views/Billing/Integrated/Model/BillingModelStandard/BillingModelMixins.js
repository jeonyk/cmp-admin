import API from '@sd-fe/cmp-core'

export default {
  async created () {
    this.unitOptions = await API.billing.getBillUnits()
  },
  data () {
    return {
      unitOptions: []
    }
  }
}
