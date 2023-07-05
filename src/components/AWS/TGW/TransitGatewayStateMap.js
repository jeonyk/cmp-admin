// pending : 생성중
// available : 사용 가능
// modifying : 수정중
// deleting : 삭제중
// deleted : 삭제
import Vue from 'vue'

export default Vue.extend({
  methods: {
    tgwStateMap (state) {
      return {
        pending: '생성중',
        available: '사용 가능',
        modifying: '수정중',
        deleting: '삭제중',
        deleted: '삭제'
      }[state]
    }
  }
})
