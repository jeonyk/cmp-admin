<!--
  * 파일명 : ConfigManage.vue
  * 파일 기능 : 구성관리 Wrapper
  * 작성자 : 김예담
  * 최종 작성일 : 2020-08-14
  * License By Shinsegae I&C
  * 2020-08-14 fix: [자원관리] 어드민 관리 -> 구성 관리로 이관
 -->

<template>
  <div class="config-manage">
    <router-view />
  </div>
</template>
<script>
import { mapState } from 'vuex'
export default {
  name: 'ConfigManage',
  async created () {
    await this.setServiceMetadataForm()
  },
  computed: {
    ...mapState({
      moduleType: state => state.cloud.cloud
    })
  },
  watch: {

    '$route' (to, from) {
      this.setServiceMetadataForm()
    }
  },
  methods: {
    /**
     * 활성화 서비스에 해당하는 메타데이터 폼을 조회합니다.
     */
    setServiceMetadataForm (to = this.$router.history.current.path) {
      const moduleType = this.moduleType
      if (!moduleType || !to) return
      const pathArr = to.split('/')
      const service = this.serviceList.find(service => pathArr.includes(service.serviceName))?.serviceKey
      if (!service) return
      const csp =
      ['NETWORK_L4', 'NETWORK_L7', 'SECURITY'].includes(service)
        ? 'NETWORK'
        : moduleType.toUpperCase()

      this.$store.dispatch('metadata/getMetaDataForm', {
        csp,
        service: service
      })
      if (csp === 'NUTANIX' && service === 'COMPUTE') {
        this.$store.dispatch('metadata/getMetaDataForm', {
          csp: 'NUTANIX',
          service: 'MARKET'
        })
      }
    }
  },
  data () {
    return {
      serviceList: [
        { serviceName: 'server', serviceKey: 'COMPUTE' },
        { serviceName: 'l4', serviceKey: 'NETWORK_L4' },
        { serviceName: 'l7', serviceKey: 'NETWORK_L7' },
        { serviceName: 'security', serviceKey: 'SECURITY' },
        { serviceName: 'database', serviceKey: 'DATABASE' },
        { serviceName: 'storage', serviceKey: 'STORAGE' },
        { serviceName: 'files', serviceKey: 'FILE_SERVER' },
        { serviceName: 'vm', serviceKey: 'VM' },
        { serviceName: 'vsan', serviceKey: 'VSAN_ISCSI' }
      ]
    }
  }
}
</script>
<style lang="scss">
  .config-manage {
    .align-center-wrap {
      display: flex !important;
      align-items: center;
      height: 100%;
    }
    .join-comma-list {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      > span {
        &:not(:last-child) {
          &::after { content: ',' }
        }
      }
    }
    .account-name {
      max-width: 560px;
      word-wrap: break-word;
      word-break: keep-all;
    }
  }
</style>
