<template>
  <div>
    <detail-view v-if="detailData" />
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import DetailView from '@/components/Reference/DetailView.vue'

export default {
  name: 'SetRefDetail',
  components: {
    DetailView
  },
  provide () {
    const detail = {}

    Object.defineProperty(detail, 'data', {
      get: () => this.detailData,
      enumerable: true,
      configurable: true
    })

    return {
      detail
    }
  },
  computed: {
    isCreate () {
      return !!this.$route.query.create
    },
    isEdit () {
      return !!this.$route.query.edit
    }
  },
  created () {
    if (this.isEdit || (!this.isEdit && !this.isCreate)) {
      this.getRefDetailData()
    } else {
      this.detailData = {}
    }
  },
  methods: {
    async getRefDetailData () {
      try {
        const { data } = await API.config.getRefDetail(this.$route.params.id)
        this.detailData = data
        this.$store.commit('common/ADD_PARAMETERS', {
          label: data.referenceRoomTitle.length > 15 ? data.referenceRoomTitle.slice(0, 15) + '...' : data.referenceRoomTitle,
          name: 'set-ref-detail'
        })
      } catch (error) {
        console.log(error)
      }
    }
  },
  data: () => ({
    detailData: null
  })
}
</script>
