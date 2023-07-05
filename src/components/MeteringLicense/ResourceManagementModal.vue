<template>
  <el-dialog
    :title="$v(`자원관리 S/W : ${software.name} (Ver. ${software.version})`)"
    :visible.sync="visible"
    width="1200px"
    :before-close="() => $emit('close')"
  >
    <section
      v-loading="loading"
      class="modal-body"
    >
      <div class="flex-wrap -space-between">
        <resource-filter-component
          ref="filter"
          :use-title="true"
          @search="values => searchFilter(values, keyword)"
        />
        <!-- /. 관조프 -->

        <search-component
          class="search-area"
          ref="search"
          :use-reset-btn="false"
          :placeholder="$t('common.PLACEHOLDER.search')"
          v-model="keyword"
          @input="searchFilter(filters, keyword)"
        />
      </div>

      <div class="grid-area">
        <article style="margin-bottom: 30px;">
          <h5 class="sub-title">
            {{ $v('추가한 Compute') }} ({{ checkedRegisterVms.length }})
          </h5>

          <div class="button-wrapper flex-wrap -space-between">
            <total-count :total-count="registerVmList.length" />
            <button
              class="button"
              type="is-primary"
              @click="deleteRow"
            >
              {{ $v('삭제') }}
            </button>
          </div>
          <cmp-grid
            :init-custom-action="grid => regGrid = grid"
            :item-source="registerVmList"
            :columns="registerColumns"
            :paging-size="5"
            header-checkbox
            :changing-page-reset="false"
            @checkedRowsData="checked => checkedRegisterVms = checked"
          >
            <template #isAssets="{ row }">
              <!-- @change="(bool) => onChangeUseSwitch(row, bool)" -->
              <span>
                <el-switch
                  v-model="row.isAssets"
                />
              </span>
            </template>
          </cmp-grid>
        </article>

        <article style="margin-bottom: 30px;">
          <h5 class="sub-title">
            {{ $v('추가 가능한 Compute') }} ({{ checkedUnRegisterVms.length }})
          </h5>

          <div class="button-wrapper flex-wrap -space-between">
            <total-count :total-count="unRegisterVmList.length" />
            <button
              class="button"
              type="is-primary"
              @click="addRow"
            >
              {{ $v('추가') }}
            </button>
          </div>

          <cmp-grid
            :init-custom-action="grid => unregGrid = grid"
            :item-source="unRegisterVmList"
            :columns="unregisterColumns"
            :paging-size="5"
            header-checkbox
            :changing-page-reset="false"
            @checkedRowsData="checked => checkedUnRegisterVms = checked"
          />
        </article>
      </div>
    </section>

    <div class="modal-footer modal-button-area">
      <button
        class="button -modal-button"
        @click="$emit('close')"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button -modal-button"
        type="is-primary"
        :disabled="loading"
        @click="save"
      >
        {{ $v('등록') }}
      </button>
    </div>
  </el-dialog>
</template>

<script>

import API from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import { cloneDeep } from 'lodash'

export default {
  name: 'ResourceManagementModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    data: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    ...mapState({
      project: state => state.project.projects,
      cloud: state => state.cloud.cloud.toUpperCase()
    })
  },
  watch: {
    visible (active) {
      if (active) {
        this.software = { ...this.data }
        this.init()
      } else {
        this.software = { name: '-', version: '-' }
      }
    }
  },
  methods: {
    async init () {
      this.apiName = this.getApiNames(this.cloud)
      this.setNTXVms()
      this.getLicenseVms()
    },

    getApiNames (cloud = this.cloud) {
      return {
        NUTANIX: {
          get: 'getNTXLicenseVms', // nutanix vm license 등록/미등록 조회 API
          set: 'setNTXLicenseVms' // nutanix vm license 등록 API
        },
        VMWARE: {
          get: 'getVMWLicenseVms', // vmware vm license 등록/미등록 조회 API
          set: 'setVMWLicenseVms' // vmware vm license 등록 API
        }
      }[cloud]
    },

    /**
     * 모든 VM 을 호출합니다.
     */
    async getLicenseVms () {
      try {
        this.loading = true
        const { swIdx: licenseIdx } = this.software
        const { get: apiName } = this.apiName
        const { registerVmList, unRegisterVmList } = await API.metering[apiName](licenseIdx)

        this.raw_registerVmList = this.setNTXVms(registerVmList)
        this.raw_unRegisterVmList = this.setNTXVms(unRegisterVmList)

        this.registerVmList = cloneDeep(this.raw_registerVmList)
        this.unRegisterVmList = cloneDeep(this.raw_unRegisterVmList)
      } catch (error) {
        console.error('@@ ResourceManagementModal > getLicenseVms', error)
        this.$alert(this.$v('자원관리 정보를 가져오는도중 문제가 발생하였습니다.'))
      } finally {
        this.loading = false
      }
    },

    /**
     * [NTX] 뉴타닉스의 경우 VM 세팅
     * @param { Array } data
     */
    setNTXVms (data = []) {
      return data.map(vm => {
        const item = {
          // 뉴타닉스
          NUTANIX: () => {
            const { vmUuid, projectIdx: idx, era, userVmIdx, hostname, ip, osName, osType, isAssets = false } = vm
            const payload = { userDbIdx: era?.userDbIdx, userVmIdx }

            if (!this.project[idx]) return { ...vm, payload }

            const { companyIdx, groupIdx, projectIdx, projectName } = this.project[idx]
            const data = { vmUuid, hostname, ip, osName, osType }

            // 아무거나 검색할 수 있다길래 ㅎ
            const searchableText = `${projectName}|${hostname}|${ip}|${osName}|${osType}`

            return { ...data, projectIdx, projectName, groupIdx, companyIdx, payload, isAssets, searchableText }
          },

          // vmware
          VMWARE: () => {
            const { vmUuid, userInfo, hostname, ipAddress, isAssets = false } = vm
            const idx = userInfo?.projectIdx
            const payload = { userVmIdx: userInfo?.userVmIdx }

            if (!this.project[idx]) return { ...vm, payload }

            const { companyIdx, groupIdx, projectIdx, projectName } = this.project[idx]
            const data = { vmUuid, hostname, ip: ipAddress, osName: userInfo.image?.osSystem, osType: userInfo.image?.osType }

            // 아무거나 검색할 수 있다길래 ㅎ
            const searchableText = `${projectName}|${hostname}|${ipAddress}|${item.osName}|${item.osType}`

            return { ...data, projectIdx, projectName, groupIdx, companyIdx, payload, isAssets, searchableText }
          }
        }[this.cloud]

        return item()
      })
    },

    // ================================================
    // ================================================
    // ================================================

    /**
     * [삭제]
     */
    deleteRow () {
      // console.log(this.checkedRegisterVms)

      this.unRegisterVmList = [ // 아래로 내리기
        ...this.checkedRegisterVms,
        ...this.unRegisterVmList
      ]

      const keys = new Set(this.checkedRegisterVms.map(({ vmUuid }) => vmUuid))

      const result = this.registerVmList.filter(({ vmUuid }) => !keys.has(vmUuid))

      this.registerVmList = result

      this.gridRefresh(this.regGrid)
      this.gridRefresh(this.unregGrid)
    },

    /**
     * [등록]
     */
    addRow () {
      // console.log(this.checkedUnRegisterVms)

      this.registerVmList = [ // 위로 올리기
        ...this.checkedUnRegisterVms,
        ...this.registerVmList
      ]

      const keys = new Set(this.checkedUnRegisterVms.map(({ vmUuid }) => vmUuid))

      const result = this.unRegisterVmList.filter(({ vmUuid }) => !keys.has(vmUuid))

      this.unRegisterVmList = result

      this.gridRefresh(this.regGrid)
      this.gridRefresh(this.unregGrid)
    },

    // ================================================
    // ================================================
    // ================================================

    /**
     * [등록] 저장할때 발생하는 이벤트를 다룹니다
     */
    async save () {
      try {
        const { swIdx: licenseIdx } = this.software

        const register = this.registerVmList.map(({ payload, isAssets, ...vm }) => ({ ...payload, isAssets }))
        const unregister = this.unRegisterVmList.map(({ payload, isAssets, ...vm }) => ({ ...payload, isAssets }))

        const { set: apiName } = this.apiName
        const idxs = { register, unregister }

        const { isSuccess } = await API.metering[apiName](licenseIdx, idxs)

        if (isSuccess) { return this.$alert(this.$v('자원관리 정보를 저장하였습니다.'), { callback: () => this.$emit('close') }) }
      } catch (error) {
        console.error('@@ ResourceManagementModal > save', error)
        this.$alert(this.$v('자원관리 정보를 저장하는도중 문제가 발생하였습니다.'))
      }
    },

    // =====
    // =====
    // =====
    // =====

    /**
     * 검색 필터링 설정
     */
    searchFilter (values, keyword = this.keyword) {
      this.filters = values

      this.registerVmList = this.filterAction(this.raw_registerVmList, { values, keyword })
      this.unRegisterVmList = this.filterAction(this.raw_unRegisterVmList, { values, keyword })
    },

    filterAction (data, { values, keyword }) {
      const { companyIdx, groupIdx, projectIdx } = values
      const regex = new RegExp(keyword, 'gi')
      // console.log(values, keyword)

      return data.filter(({
        companyIdx: company,
        groupIdx: group,
        projectIdx: project,
        searchableText
      }) => {
        // console.log(regex.test(searchableText))
        // console.log(searchableText, regex.test(searchableText))

        const condition1 = (companyIdx) ? companyIdx === company : true
        const condition2 = (groupIdx) ? groupIdx === group : true
        const condition3 = (projectIdx) ? projectIdx === project : true

        const condition4 = (keyword) ? regex.test(searchableText) : true

        return condition1 && condition2 && condition3 && condition4
      })
    },

    gridRefresh (grid) {
      if (!grid) return

      const cv = grid.collectionView
      if (!cv) return

      cv.refresh()
      cv.sourceCollection.forEach(item => (item.checked = false))

      this.checkedRegisterVms = []
      this.checkedUnRegisterVms = []
      this.$forceUpdate()
    }
  },
  data: root => ({
    loading: false,
    apiName: null,
    filters: {},
    keyword: undefined,
    software: { name: '-', version: '-' },
    registerColumns: [
      { header: '프로젝트명', binding: 'projectName' },
      { header: '호스트명', binding: 'hostname' },
      { header: 'IP', binding: 'ip' },
      { header: 'OS구분', binding: 'osName' },
      { header: 'OS유형', binding: 'osType' },
      { header: '자산여부', binding: 'isAssets', customHtml: true }
    ],
    unregisterColumns: [
      { header: '프로젝트명', binding: 'projectName' },
      { header: '호스트명', binding: 'hostname' },
      { header: 'IP', binding: 'ip' },
      { header: 'OS구분', binding: 'osName' },
      { header: 'OS유형', binding: 'osType' }

    ],
    raw_registerVmList: [],
    raw_unRegisterVmList: [],
    registerVmList: [],
    unRegisterVmList: [],
    checkedRegisterVms: [],
    checkedUnRegisterVms: [],
    regGrid: null,
    unregGrid: null
  })
}
</script>

<style lang="scss" scoped>
.modal-body {
  .grid-area {
    padding-right: 10px;
    height: 60vh;
    overflow-y: auto;
  }
  .button-wrapper {
    height: 35px;
    margin-bottom: $gap-s;
    > h5 { margin: 0; }
  }
}
</style>
