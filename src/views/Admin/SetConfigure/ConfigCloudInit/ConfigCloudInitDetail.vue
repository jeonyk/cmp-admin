<template>
  <cloud-init-detail :mode="detailMode" />
</template>

<script>
import CloudInitDetail from '@/components/CloudInit/CloudInitDetail.vue'

export default {
  components: {
    CloudInitDetail
  },
  computed: {
    detailMode () {
      if (!this.$route.query.mode && !this.$route.query.templateId) return 'create'
      else if (this.$route.query.mode && this.$route.query.mode === 'copy') return 'copy'
      else return 'edit'
    }
  }
}
</script>
