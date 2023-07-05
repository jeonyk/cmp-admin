<template>
  <div class="site-managing">
    <router-view />
  </div>
</template>
<script>
export default {
  name: 'SiteManaging',
  methods: {
    routeTo (to) {
      this.$router.push(to)
    }
  },
  data () {
    return {
    }
  }
}
</script>
