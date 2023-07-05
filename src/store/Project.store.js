import dayjs from 'dayjs'
import API from '@sd-fe/cmp-core'

/** @type {import('vuex').Module} */
const projectModule = {
  namespaced: true,
  state: () => ({
    projects: null,
    allProjectList: []
  }),
  getters: {
    getIsProjectLoaded: (state) => !!state.projects,
    getProject: (state) => (idx) => state.projects[idx]
  },
  mutations: {
    setProjects: (state, payload) => {
      state.projects = payload
    },
    setAllProjectList: (state, payload) => {
      state.allProjectList = payload
    }
  },
  actions: {
    /**
     * 프로젝트 정보를 가져와
     * projectIdx 가 키 이름이 되고
     * 프로젝트 정보를 담은 데이터를 값으로 담는
     * 객체를 설정한다
     * 예제)
     * {
     *   1: { ... }.
     *   3: { ... }
     * }
     */
    async getProjectByCloudType ({ commit, rootGetters }) {
      // const cloudType = rootGetters['cloud/getShortlyCloud']

      const map = {}
      const res = await API.iam.getProject()

      res.filter(project => {
        // const moduleType = project.moduleType.toLowerCase()
        // *** projectCloudType 키 변경
        // if (
        //   moduleType === cloudType ||
        //   (moduleType === 'vmware' && cloudType === 'vmw')
        // ) {
        project.createDate = dayjs(project.createTime).format('YYYY-MM-DD')
        map[project.projectIdx] = project
        // }
      })

      commit('setProjects', map)
      commit('setAllProjectList', res)
    }
  }
}

export default projectModule

// AWS (95)
// map: 450.5068359375 ms
// map: 485.56005859375 ms
// map: 479.49609375 ms
// map: 467.180908203125 ms
// map: 475.1748046875 ms

// NX (1072)
// map: 568.55419921875 ms
// map: 576.627197265625 ms
// map: 555.698974609375 ms
// map: 564.493896484375 ms
// map: 595.755126953125 ms
// map: 610.85205078125 ms
// map: 635.322021484375 ms
// map: 611.126708984375 ms
