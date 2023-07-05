/**
  * 파일명 : Task.store.js
  * 파일 기능 : [업무] 관련 데이터 store 저장
  * 작성자 : 정재은
  * 최종 작성일 : 2021-03-02
  * License By Shinsegae I&C
  * 2021-03-02 업무쪽 pagination 롤백
 **/

// 업무 내부 API 저장 > 2차개발에 사용 예정?
export default {
  namespaced: true,
  state: {
    roles: {} // 역할 정보 전역으로 저장
  },
  getters: {
  },
  mutations: {
    SET_ROLES (state, payload) {
      state.roles = payload
    }
  },
  actions: {
    /**
     * [역할] 에 관해 key/value 값으로 나눕니다.
     */
    setRoles ({ commit, state }, payload) {
      const result = {}

      payload.forEach(({ serviceList, roleIdx, roleName, ...role }) => {
        serviceList.forEach(({ moduleType, serviceName, readPermission, executePermission }) => { result[serviceName] = { roleIdx, roleName, readPermission, executePermission } })
      })

      console.log(result)
      commit('SET_ROLES', result)
    }
  }
}
