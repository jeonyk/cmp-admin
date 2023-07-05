import Vue from 'vue'
import Vuex from 'vuex'
import Common from './Common.store'
import Auth from './Auth.store'
import Market from './Market.store'
import Network from './Network.store'
import Cluster from './Cluster.store'
import Cloud from './Cloud.store'
import MetadataForm from './MetadataForm.store'
import Task from './Task.store'
import createPersistedState from 'vuex-persistedstate'

import ProjectModule from './Project.store'

Vue.use(Vuex)

const cloudState = createPersistedState({
  paths: ['cloud.cloud', 'cloud.cloudType', 'cloud.shortlyCloud', 'cloud.cloudInfo'],
  storage: window.localStorage,
  key: 'vuex'
})

export default new Vuex.Store({
  state: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    common: Common,
    auth: Auth,
    market: Market,
    network: Network,
    cluster: Cluster,
    cloud: Cloud,
    metadata: MetadataForm,
    project: ProjectModule,
    task: Task
  },
  plugins: [cloudState]
})
