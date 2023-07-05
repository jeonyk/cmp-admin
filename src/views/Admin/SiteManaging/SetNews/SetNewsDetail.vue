<template>
  <div>
    <detail-view v-if="detailData" />
  </div>
</template>

<script>
import DetailView from '@/components/News/DetailView.vue'
import API from '@sd-fe/cmp-core'

export default {
  name: 'SetNewsDetail',
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
      this.getNewsDetailData()
    } else {
      this.detailData = {}
    }
  },
  methods: {
    async getNewsDetailData () {
      try {
        const { data } = await API.config.getNewsDetail(this.$route.params.id)
        this.detailData = data
        this.$store.commit('common/ADD_PARAMETERS', {
          label: data.newsTitle.length > 15 ? data.newsTitle.slice(0, 15) + '...' : data.newsTitle,
          name: 'set-news-detail'
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
