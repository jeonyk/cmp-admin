
import API from '@sd-fe/cmp-core'
import { mapState } from 'vuex'

export default {

  computed: {
    ...mapState({
      roles: state => state.task.roles
    })
  },
  mounted () {
    this.getRoleList()
  },
  methods: {
    /**
     * [역할] 관련 데이터 전역 저장 (주문함, 결재함 전체 사용)
    */
    async getRoleList () {
      try {
        const roles = await API.iam.getTaskRole()
        this.$store.dispatch('task/setRoles', roles)
      } catch (error) {
        console.error('@@ App > getRoleList', error)
      }
    }

  },
  data () {
    return {
    }
  }
}
