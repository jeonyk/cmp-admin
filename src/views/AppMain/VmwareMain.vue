<template>
  <router-view />
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters({
      cloud: 'cloud/getCloud',
      cloudType: 'cloud/getCloudType',
      packageType: 'packageType'
    })
  },
  created () {
    // if (this.packageType !== 'ENT') {
    //   this.$store.dispatch('cloud/initCloud')
    //   this.$router.push({ name: 'main' })
    //   return
    // }
    // if (this.cloud !== 'aws' || this.cloudType !== 'public') {
    //   this.$router.push({ name: 'main' })
    // } else if (!process.env.VUE_APP_SHOW_PUBLIC) {
    //   this.$store.dispatch('cloud/initCloud')
    //   this.$router.push({ name: 'main' })
    // }
  }
}
</script>
