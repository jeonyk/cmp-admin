import { mapState } from 'vuex'

export const roleMixin = {
  created () {

  },
  computed: {
    ...mapState({
      userPermLevel: state => state.auth.user.userPermLevel,
      serviceList: state => state.auth.serviceList
    })
  },
  methods: {
    checkServiceAuth (serviceName, prop, userPermLevel = this.userPermLevel) {
      if (userPermLevel === 0) return true
      const isRead = prop === this.READ_PERMISSION
      const isExcute = prop === this.EXECUTE_PERMISSION
      const result = this.serviceList?.some(role => {
        const service = role.serviceList?.find(service => service.serviceName === serviceName)
        if (!service) return false
        if (isRead) return !!service.readPermission // 읽기 권한
        if (isExcute) return !!service.readPermission && !!service.executePermission // (읽기) && (실행 ) 권한 확인
        return false
      })
      return result
    }

  },
  data () {
    return {
      READ_PERMISSION: 'readPermission',
      EXECUTE_PERMISSION: 'executePermission'
    }
  }
}
