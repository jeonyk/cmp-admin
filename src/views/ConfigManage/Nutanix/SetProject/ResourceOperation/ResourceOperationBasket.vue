<template>
  <div
    class="resource-operation-basket"
    v-loading="loading.runTransfer"
  >
    <back-before-page class="before-page-btn" />
    <section class="dest-info">
      <h6>
        <!-- 이관 목적지 -->
        {{ $t('config.TRANSFER.transferDest') }}
      </h6>
      <resource-filter-component
        cloud-type="private"
        module-type="NX"
        class="select-company-project"
        :is-replace-filtering-component="false"
        @search="changeGroupProject"
        ref="resourceComponents"
      />
      <!-- :init-company-idx="20"
        :init-group-idx="3768"
        :init-project-idx="2" -->

      <h6>
        <!-- 목적지 정보 -->
        {{ $t('common.GRID.NETWORK.destInfo') }}
      </h6>
      <vertical-table
        v-loading="loading.isGetProject"
        :columns="changeDataColumns"
        :data="changeData"
        :empty-content="destProjectInfo && destProjectInfo.project ? '-' : $t('admin.PREF.selectProject')"
        type="horizontal"
      >
        <template #appManageTeam>
          <div
            class="flex-wrap"
            style="height: 100%;"
            v-if="changeData && changeData.appManageTeamObj"
          >
            <span v-if="changeData.appManageTeamObj.companyName">{{ changeData.appManageTeamObj.companyName + ' > ' }}</span>
            <span v-if="changeData.appManageTeamObj.groupName">{{ changeData.appManageTeamObj.groupName }}</span>
            <button
              class="button"
              style="margin-left: 10px;"
              type="is-primary"
              @click="modal.appTeam = true"
              ref="opTeamTrigger"
            >
              {{ $t('common.BTN.ADMIN.selectAppTeam') }}
              <!-- 운영팀 선택 -->
            </button>
          </div>
          <small v-else>{{ destProjectInfo && destProjectInfo.project ? '-' : $t('admin.PREF.selectProject') }}</small>

          <div
            v-if="modal.appTeam"
            class="custom-popup -app-team"
          >
            <app-operating-team
              v-if="modal.appTeam = true"
              class="-body"
              :data="changeData.appManageTeamObj"
              @operate-team="saveOperateTeam"
              @close="modal.appTeam = false"
              :group-tree-data="groupTreeData"
              :loading="loading.isGetGroupTree"
              :user-group-idx="user.userGroup"
              :trigger-btn="$refs"
            />
          </div>
        </template>
        <!-- App 운영팀 -->

        <template #appTaskUser>
          <div
            class="flex-wrap"
            v-if="destProjectInfo && changeData && changeData.appTaskUser"
          >
            <span
              v-if="changeData.appTaskUser.length"
              style="margin-right: 10px;"
            >
              <el-tag
                v-for="(task,taskIdx) in changeData.appTaskUser"
                :key="taskIdx"
              >
                {{ task.appTaskUserName }}({{ task.appTaskUserId | maskingName }})
              </el-tag>
            </span>
            <button
              class="button"
              type="is-primary"
              @click="modal.appManager = true"
              style="min-width: 140px;"
              ref="taskManTrigger"
            >
              {{ $t('common.BTN.ADMIN.selectManager') }}
              <!-- 업무 담당자 선택 -->
            </button>
          </div>
          <small v-else>{{ destProjectInfo && destProjectInfo.project ? '-' : $t('admin.PREF.selectProject') }}</small>

          <div
            v-if="modal.appManager"
            class="custom-popup -app-manager"
          >
            <select-from-tree
              v-if="modal.appManager = true"
              class="-body"
              @close="modal.appManager = false"
              :data="changeData.appTaskUser"
              @task-managers="saveTaskManager"
              :group-tree-data="groupTreeData"
              :loading="loading.isGetGroupTree"
              :user-group-idx="user.userGroup"
              :trigger-btn="$refs"
            />
          </div>
        </template>
        <!-- APP 업무 담당자 -->
      </vertical-table>
    </section>

    <section
      class="resource-info"
      v-loading="loading.isGetTransResource || loading.deleteResource"
    >
      <h6 class="small-title">
        <!-- 이관 예정 작업 (총 {{totalCount}}건)-->
        {{ $t('config.TRANSFER.resourceTobeTransferred') }}
        &ensp;<small>({{ $t('common.TERMS.total') }} {{ totalCount }}{{ $t('main.DASHBOARD.count') }})</small>
      </h6>

      <div
        class="empty-data resource-wrapper"
        v-if="!computeData.length
          && !storageData.length
          && !networkData.length
          && !securityData.length
          && !databaseData.length"
      >
        {{ $v('이관 예정 자원이 없습니다.') }}
      </div>

      <resource-operation-compute
        v-if="computeData.length"
        class="resource-wrapper"
        :data="computeData"
        :init-auto-select-row="checkedResources.compute"
        deletable
        @checkedRowsData="items => saveCheckedResource(items, 'compute')"
        @delete-row="row => deleteResourceFromBasket([row])"
      />
      <resource-operation-storage
        v-if="storageData.length"
        class="resource-wrapper"
        :data="storageData"
        :init-auto-select-row="checkedResources.storage"
        deletable
        @checkedRowsData="items => saveCheckedResource(items, 'storage')"
        @delete-row="row => deleteResourceFromBasket([row])"
      />
      <resource-operation-network
        v-if="networkData.length"
        class="resource-wrapper"
        :data="networkData"
        :init-auto-select-row="checkedResources.network"
        :use-toggle-btn="false"
        deletable
        @delete-row="row => deleteResourceFromBasket([row])"
        @checkedRowsL4Data="items => saveCheckedResource(items, 'vrserver')"
        @checkedRowsL7Data="items => saveCheckedResource(items, 'csvrserver')"
      />
      <resource-operation-security
        v-if="securityData.length"
        class="resource-wrapper"
        :data="securityData"
        :init-auto-select-row="checkedResources.security"
        deletable
        @checkedRowsData="items => saveCheckedResource(items, 'security')"
        @delete-row="row => deleteResourceFromBasket([row])"
      />
      <resource-operation-database
        v-if="databaseData.length"
        class="resource-wrapper"
        :data="databaseData"
        :init-auto-select-row="checkedResources.database"
        deletable
        @checkedRowsData="items => saveCheckedResource(items, 'database')"
        @delete-row="row => deleteResourceFromBasket([row])"
      />
      <div
        class="button-area -center"
        v-if="totalCount"
      >
        <button
          class="button -delete-button"
          :disabled="!checkedResources.all.length"
          @click="deleteResourceFromBasket(checkedResources.all)"
        >
          <i class="delete-icon -not-hoverable" />
          <!-- ...건 자원 삭제 -->
          <b>{{ checkedResources.all.length }}</b>
          {{ $t('main.DASHBOARD.count') }}
          &nbsp;
          {{ $v('장바구니에서 삭제') }}
        </button>
        <button
          class="button -expand-button"
          type="is-primary"
          :disabled="!checkedResources.all.length"
          @click="confirmTransfer"
        >
          <!-- ...건 자원 이관 -->
          <b>{{ checkedResources.all.length }}</b>
          {{ $t('main.DASHBOARD.count') }}
          &nbsp;
          {{ $t('common.BTN.ADMIN.transRes') }}
        </button>
      </div>
    </section>
    <!-- 이관 예정 작업 -->
  </div>
</template>

<script>
import API, { ResourceFilterComponent, AppOperatingTeam, SelectFromTree } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import { isEmpty, mapValues, cloneDeep } from 'lodash'

import BackBeforePage from '@/components/BackBeforePage/BackBeforePage'

import ResourceOperationCompute from './ResourceOperationCompute.vue'
import ResourceOperationStorage from './ResourceOperationStorage.vue'
import ResourceOperationNetwork from './ResourceOperationNetwork.vue'
import ResourceOperationSecurity from './ResourceOperationSecurity.vue'
import ResourceOperationDatabase from './ResourceOperationDatabase.vue'

export default {
  name: 'ResourceOperationBasket',
  components: {
    ResourceFilterComponent,
    AppOperatingTeam,
    SelectFromTree,
    BackBeforePage,
    ResourceOperationCompute,
    ResourceOperationStorage,
    ResourceOperationNetwork,
    ResourceOperationSecurity,
    ResourceOperationDatabase
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    totalCount () {
      return this.computeData.length + this.storageData.length + this.networkData.length + this.securityData.length + this.databaseData.length
    }
  },
  async created () {
    await this.init()
  },
  methods: {
    async init () {
      await Promise.all([
        this.getManageTree(),
        this.getTransBasket() // 자원 이관바구니 자원 조회
      ]).then(async () => {
        // await this.resetCheckedItems()
      })
    },
    /**
     * 상단 [이관 목적지] 관-조-프 선택 시 발생 이벤트
     */
    async changeGroupProject (dest) {
      this.destProjectInfo = dest

      if (dest.projectIdx) await this.setDestInfo(dest.projectIdx)
      else this.destProjectInfo = null
    },
    /**
     * 목적지 정보를 세팅합니다.
     */
    async setDestInfo (projectIdx) {
      const projectInfo = await this.getProject({ projectIdx })
      console.log('@프로젝트 정보: ', projectInfo)
      if (projectInfo?.length) {
        const { projectOwner, companyCi, companyCode, companyName, companyIdx, groupName, createTime, groupIdx, projectName, projectIdx } = projectInfo[0]

        this.changeData = {
          projectOwnerInfo: projectOwner?.userName && projectOwner?.userId ? `${projectOwner?.userName}(${this.$options.filters.maskingName(projectOwner?.userId)})` : '',
          createDate: this.$options.filters.date(createTime),
          updateUserId: this.user.userId,
          updateUserName: this.user.userName,
          companyCode,
          companyCi,
          companyIdx,
          companyName,
          groupIdx,
          groupName,
          projectName,
          projectIdx,
          projectId: projectIdx,

          // APP 운영팀
          appManageTeam: groupIdx,
          appManageTeamName: groupName,
          appManageTeamObj: {
            companyIdx,
            companyName,
            groupIdx,
            groupName
          },

          appTaskUser: [] // APP 업무 담당자
        }
        console.log('DEST: ', this.changeData)
      }
    },
    // APP 운영팀 저장
    saveOperateTeam (team) {
      this.changeData.appManageTeam = team.groupIdx
      this.changeData.appManageTeamName = team.groupName

      this.changeData.appManageTeamObj = team

      this.modal.appTeam = false
      console.log(team, '---operating Team!!!!!!')
    },
    /**
     * App 업무 담당자 선택 이벤트
     */
    saveTaskManager (managers) {
      this.changeData.appTaskUser = managers.map(item => {
        const result = {
          appTaskUserId: item.userId,
          userId: item.userId,
          userName: item.userName,
          appTaskUserName: item.userName,
          userGroupName: item.userGroupName
        }
        return result
      })
    },

    /**
     * 이관 장바구니 자원을 workType 별로 분류합니다.
     * @param {Array} all 이관 장바구니에 있는 자원
     */
    setResourceData (all) {
      // console.log(all, '====== all')
      this.emptyAllResource() // 모든 자원 그리드 비워줌

      for (let i = 0; i < all.length; i++) {
        const allWorkType = all[i].resourceData.workType
        if (allWorkType) {
          const fieldUpper = allWorkType.includes('_') ? allWorkType.split('_')[0] : allWorkType // 네트워크 : 그 외 자원
          const field = fieldUpper?.toLowerCase()
          if (all[i].resourceData) {
            all[i].resourceData.checked = false
            this[field + 'Data'].push({
              ...all[i].resourceData,
              workType: allWorkType,
              resourceId: all[i].resourceId
            })
          }
        } else continue
      }
    },
    /**
     * 이관 장바구니에서 자원 제거
     * @param {Array} items 제거할 자원들 정보
     */
    deleteResourceFromBasket (items) {
      if (!items?.length) return
      this.$confirm(this.$v('해당 항목을 이관 장바구니에서<br>삭제하시겠습니까?'), { dangerouslyUseHTMLString: true })
        .then(async () => {
          const resourceIdxArr = []
          const serviceTypeArr = []
          items.forEach(row => {
            resourceIdxArr.push(row.userVmIdx || row.userDbIdx || row.userVgIdx || row.csVrserverIdx || row.vrserverIdx)
            if (!serviceTypeArr.includes(row.workType))serviceTypeArr.push(row.workType)
          })

          const resourceIdxList = resourceIdxArr?.join(',')
          const serviceList = serviceTypeArr?.join(',')
          const userId = this.user.userId

          const payload = { resourceIdxList, serviceList, userId }
          const result = await this.deleteTransBasket(payload)
          if (result) {
            this.$alert(this.$t('common.ALERT.BASE.013'), () => false) // 삭제되었습니다.
            await this.init()
            this.removeDeletedItemsFromChecked(items)
          } else this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }, () => false) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        }).catch(() => {
          return false
        })
    },
    /**
     * 이관 실행 후 장바구니에서 자원 제거
     * @param {Array} items 제거할 자원들 정보
     */
    runAfterDeleteResource (items) {
      try {
        if (!items?.length) return
        const resourceIdxArr = []
        const serviceTypeArr = []
        items.forEach(row => {
          resourceIdxArr.push(row.userVmIdx || row.userDbIdx || row.userVgIdx || row.userShareIdx || row.vrserverIdx)
          if (!serviceTypeArr.includes(row.workType))serviceTypeArr.push(row.workType)
        })

        const resourceIdxList = resourceIdxArr?.join(',')
        const serviceList = serviceTypeArr?.join(',')
        const userId = this.user.userId

        const payload = { resourceIdxList, serviceList, userId }
        const result = this.deleteTransBasket(payload)
        if (result) {
          console.log('삭제 성공')
          this.init()
          this.removeDeletedItemsFromChecked(items)
        } else {
          console.log('삭제 실패')
        }
      } catch (error) {
        console.error(error)
        this.loading.isGetWorkflow = false
        this.loadSuccess.isGetWorkflow = false
      } finally {
        this.loading.isGetWorkflow = false
      }
    },
    /**
     * 체크된 항목 중에서 삭제된 자원을 제거합니다.
     */
    removeDeletedItemsFromChecked (resources) {
      resources.forEach(row => {
        if (!row.workType) return
        const field = {
          COMPUTE: 'compute',
          STORAGE: 'storage',
          NETWORK_L4: 'vrserver',
          NETWORK_L7: 'csvrserver',
          SECURITY: 'security',
          DATABASE: 'database'
        }[row.workType]
        const arr = this.checkedResources[field]
        const afterArr = arr.filter(item => item.resourceIdx !== row.resourceIdx)
        this.saveCheckedResource(afterArr, field)
      })
    },
    /**
     * [자원 이관] 버튼 실행 이벤트
     */
    async confirmTransfer () {
      const checkValidItems = [
        { projectInfo: this.destProjectInfo?.projectIdx },
        // { appTeam: this.changeData?.appManageTeam },
        // { appTaskUser: !!this.changeData?.appTaskUser.length },
        { resourceNum: this.checkedResources.all }
      ]
      if (!this.noEmptyContents(checkValidItems)) return

      const payload = await this.setRunPayload()

      if (payload) {
        this.$confirm(this.$t('common.CONFIRM.TRANSFER.001', { count: this.checkedResources.all.length }) // {count}개 자원을 이관하시겠습니까?

        ).then(async () => { // 6개 자원을 이관하시겠습니까?
          const response = await this.runTransResource(payload)

          if (response) {
            const failItems = response.failRes

            const allCheckedLeng = this.checkedResources.all.length // 이관 장바구니에서 선택한 자원 갯수
            const successItmLeng = failItems?.length
              ? allCheckedLeng - failItems.length
              : allCheckedLeng // 성공한 자원 갯수

            const payData = payload.map(item => {
              return {
                resourceIdx: JSON.stringify(item.resourceIdx),
                service: item.service.toLowerCase()
              }
            })

            const failData = failItems.map(item => {
              return {
                resourceIdx: item.resourceIdx,
                service: item.service.toLowerCase()
              }
            })

            const payDataset = [...payData]
            const failDataset = [...failData]

            // 전체 다 성공했을 때
            const successMsg = this.$t('common.ALERT.TRANSFER.001', {
              dest: `${this.changeData.companyName} > ${this.changeData.groupName} > <br>${this.changeData.projectName}`,
              count: successItmLeng
            })
            // {dest}로<br>{count}개 자원이 성공적으로 이관되었습니다.

            let message = successMsg

            // 성공 자원 / 실패 자원 다 있을 때
            if (failItems?.length) {
              message += `<br>(${this.$t('common.fail')}: ${failItems.length} EA)`
            } // 실패: ...

            // 전체 다 실패했을 때
            if (!successItmLeng) {
              message = this.$t('common.ALERT.TRANSFER.002', {
                count: allCheckedLeng
              }) // `${allCheckedLeng}개 자원 이관을 실패했습니다.`
            }

            this.$alert(message, { dangerouslyUseHTMLString: true })

            await this.$refs.resourceComponents.resetAllFilter()

            if (failItems?.length || !successItmLeng) {
              for (let i = 0; i < payDataset.length; i++) {
                if (payDataset[i].resourceIdx !== failDataset[i].resourceIdx) {
                  this.runAfterDeleteResource(this.checkedResources[payDataset[i].service])
                  await this.init()
                  this.resetData()
                  this.resetCheckedItems()
                }
              }
            }

            if (!failItems?.length) {
              this.runAfterDeleteResource(this.checkedResources.all)
            }

            await this.init()
            await this.resetData()
            await this.resetCheckedItems()
          } else this.$alert(this.$t('common.ALERT.TRANSFER.003'), { dangerouslyUseHTMLString: true }) // '자원 이관 실행을 실패했습니다.<br>관리자에게 문의하세요.'
        }).catch(() => false)
      }
    },
    /**
     * 이관 할 자원 체크 시, 발생 이벤트
     * @param {Array} checkedItems 체크 한 자원
     * @param {field} field 자원 분류 ('compute', 'vrserver'(L4), 'csvrserver'(L7), 'security', 'database')
     */
    saveCheckedResource (checkedItems, field) {
      this.checkedResources[field] = [...checkedItems]
      this.checkedResources.all = []
      const allItems = Object.values(this.checkedResources).flat()
      this.checkedResources.all = [...allItems] // 자원에 상관 없이 한 배열에 넣어줌
    },
    /**
     * 자원 이관 requestBody 정보 세팅
     */
    setRunPayload (data = this.checkedResources.all) {
      const copyData = cloneDeep(data)
      const payload = copyData.map(item => {
        const originData = cloneDeep(item)
        const mapData = Object.assign(item, {
          ...this.changeData,
          createUserId: item.createUserId || this.user.userId,
          createUserName: item.createUserName || this.user.userName,
          updateUserId: item.updateUserId || this.user.userId,
          updateUserName: item.updateUserName || this.user.userName
        })
        // this.$set(item, 'mapData', {
        //   ...item,
        //   ...this.changeData
        // })

        delete mapData.appManageTeamObj

        const startPointName = originData.companyName && originData.groupName && originData.projectName
          ? `${originData.companyName} > ${originData.groupName} > ${originData.projectName}`
          : '-'
        const endPointName = this.changeData.companyName &&
            this.changeData.groupName &&
             this.changeData.projectName
          ? `${this.changeData.companyName} > ${this.changeData.groupName} > ${this.changeData.projectName}`
          : '-'

        // const endPointName = { // 출발지, 목적지 관계사-조직 정보도 추가
        //   startGroupName: originData.groupName,
        //   startCompanyName: originData.companyName,
        //   endGroupName: this.changeData.groupName,
        //   endCompanyName: this.changeData.companyName
        // }
        return {
          resourceData: mapData,
          endPointIdx: this.changeData.projectIdx,
          endPointName,
          createTime: item.createTime,
          updateTime: item.updateTime,
          // endPointIdx: 2,
          // endPointName: '123',
          startPointIdx: originData.projectIdx,
          startPointName,
          workType: item.workType,
          service: item.workType,
          resourceName: item.resourceName,
          userId: this.user.userId,
          resourceIdx: item.resourceIdx
          /** 자원별 resourceIdx
           * compute     : userVmIdx
           * database    : userDbIdx
           * storage     : userVgIdx
           * fileServer  : userShareIdx
           * L4          : userNetIdx
           * L7          : userNetIdx
           * Security    : userNetIdx
           **/
        }
      })
      return payload
    },
    /**
     * 전체 체크했던 row 리셋시킵니다.
     */
    resetCheckedItems () {
      this.checkedResources = mapValues(this.checkedResources, () => [])
    },
    resetData () {
      this.changeData = mapValues(this.changeData, () => null)
    },
    /**
     * 빈 항목이 있으면 alert 메세지 출력
     * @param {Array} checkItems 체크할 키 : 값 모음
     * @return {Boolean} 빈 항목이 유무 리턴, 빈 항목이 있으면 false 반환
     */
    noEmptyContents (checkItems) {
      if (!checkItems?.length) return
      const message = {
        resourceNum: 'admin.PREF.selectTransferRes', // 이관할 자원을 선택하세요.
        projectInfo: 'admin.PREF.selectProject', // 프로젝트를 선택해주세요.
        appTeam: 'common.ALERT.COMP.013', // App 운영팀을 선택해주세요.
        appTaskUser: 'common.ALERT.COMP.014' // App 업무담당자를 선택해주세요.
      }

      let pass = true

      for (let i = 0; i < checkItems.length; i++) {
        const key = Object.keys(checkItems[i])[0]
        const value = checkItems[i][key]
        const flag = value === '' ||
          value === false ||
          value === null ||
          value === undefined ||
          (value && typeof value === 'object' && isEmpty(value)) ||
          (Array.isArray(value) && !value.length)

        if (flag) { // value가 비어있을 때 alert창을 띄워줍니다. flag가 있을때.. flag 조건 추가
          this.$alert(this.$t(message[key]), { dangerouslyUseHTMLString: true })
          pass = false
          break
        }
      }
      return pass
    },

    emptyAllResource () {
      this.computeData = []
      this.storageData = []
      this.networkData = []
      this.securityData = []
      this.databaseData = []
    },

    /**
     * API : 이관 장바구니 자원 조회
     */
    async getTransBasket (csp = this.activeModule, userId = this.user.userId) {
      try {
        this.loading.isGetTransResource = true
        let response = []
        response = await API.work_v3.getTransBasket({ csp, userId })
        await this.setResourceData(response) // 각 자원 별 테이블 데이터 세팅
      } catch (error) {
        console.error(error)
      } finally { this.loading.isGetTransResource = false }
    },
    /**
     * API : 프로젝트 정보 조회
     */
    async getProject (params) {
      try {
        this.loading.isGetProject = false
        const response = await API.iam.getProject(params)
        if (response) return response
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.$alert(message)
      } finally {
        this.loading.isGetProject = false
      }
    },
    /**
     * API : 관계사-그룹 트리 데이터 조회
     */
    async getManageTree () {
      try {
        this.loading.isGetGroupTree = true
        const response = await API.iam.getGroupManageTree()
        if (!response) return
        this.groupTreeData = [...response]
      } catch (error) {
        this.groupTreeData = []
        console.error(error)
      } finally {
        this.loading.isGetGroupTree = false
      }
    },
    /**
     * API : 이관 장바구니에서 자원 삭제
     */
    async deleteTransBasket (params) {
      try {
        this.loading.deleteResource = true

        const result = await API.work_v3.deleteTransBasket(params)
        return result
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.$alert(message)
      } finally {
        this.loading.deleteResource = false
      }
    },
    /**
     * API : 이관 실행
     */
    async runTransResource (payload) {
      try {
        this.loading.runTransfer = false

        if (payload) {
          console.log('@PAYLOAD: ', payload)
          const response = await API.work_v3.runTransResource(this.user.userId, [...payload])
          if (response) return response
        }
      } catch (error) {
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        console.error(message)
      } finally {
        this.loading.runTransfer = false
      }
    }
  },
  data () {
    return {
      groupTreeData: [],
      // 이관 목적지 정보
      destProjectInfo: null,
      changeData: {
        appManageTeam: null, // APP 운영팀
        appTaskUser: [] // APP 업무 담당자
      }, // 목적지 정보
      changeDataColumns: [
        { binding: 'projectOwnerInfo', header: '프로젝트 소유자', keyPath: 'common.REGCON.projectOwner' },
        { header: '프로젝트 생성일', binding: 'createDate', keyPath: 'config.TRANSFER.projectCreateDate' }
        // { header: 'App 운영팀', binding: 'appManageTeam', keyPath: 'common.GRID.NETWORK.appTeam' },
        // { header: 'APP 업무담당자', binding: 'appTaskUser', keyPath: 'common.REGCON.appManager' }
      ],
      activeModule: 'NUTANIX',
      computeData: [],
      storageData: [],
      networkData: [],
      securityData: [],
      databaseData: [],

      // 체크한 자원
      checkedResources: {
        all: [], // 전체(타입에 상관 없이)..
        compute: [],
        storage: [],
        vrserver: [], // L4
        csvrserver: [], // L7
        network: [],
        security: [],
        database: []
      },

      // 로딩
      loading: {
        isGetTransResource: false, // 이관 장바구니 조회
        isGetProject: false, // 프로젝트 정보 조회
        isGetGroupTree: false, // 그룹 트리 조회
        deleteResource: false, // 이관 장바구니에서 자원 삭제
        runTransfer: false // 이관
      },
      modal: {
        appManager: false,
        appTeam: false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .resource-operation-basket {
    position: relative;
    .before-page-btn {
      position: absolute;
      top: -58px;
      left: 0;
    }
    small { font-size: 13px; color: $input-placeholder; font-weight: normal; }

    > .dest-info { // 목적지 정보
      // position: sticky;
      // top: 100px;
      // background-color: $background-color;
      // z-index: 1;
      h6 { margin-bottom: 15px; font-size: 14px; font-weight: normal;}
      .select-company-project {
        margin-bottom: $gap-m;
        .filter-form {
          .searchable-select .selected-item-input.el-input.is-disabled .el-input__inner {
            border: none !important;
            border-bottom: 1px solid $input-stroke;
          }
        }
      }
    }

    > .resource-info { // 이관 예정 작업
      // overflow-y: scroll;
      // overscroll-behavior-y: contain;
      // max-height: 100vh;
      min-height: 100px;
      margin-top: 70px;
      .small-title { margin-bottom: 0; }
      .resource-wrapper { margin-top: $gap-m; }
      .button-area { // 자원 이관 버튼 영역
        position: sticky;
        bottom: 0;
        padding: 45px 0;
        background-color: rgba(31, 30, 50, 0.7);
        .-delete-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 25%;
          height: 60px;
          .delete-icon {
            margin-right: $gap-s;
          }
        }
        .-expand-button {
          width: 75%;
          height: 60px;
        }
      }
    }

  }
</style>

<style lang="scss">
 .resource-operation-basket {
    > .dest-info { // 목적지 정보
      .select-company-project {
        .filter-form {
          .searchable-select .selected-item-input.el-input.is-disabled .el-input__inner {
            border: none;
            border-bottom: 1px solid $input-stroke;
          }
        }
      }
    }
    .hostname-name-wrap {
      display: flex;
      align-items: center;
      gap: 5px;
    }
 }
</style>
