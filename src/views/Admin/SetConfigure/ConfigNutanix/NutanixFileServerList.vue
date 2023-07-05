<!--
  * 파일명 : NutanixCentralImageList.vue
  * 파일 기능 : Nutanix 설정 > Central 이미지 추가/수정/삭제
  * 작성자 : 정재은
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 Update : 파일 is-ready 상태일 경우 css 버그 수정
 -->

<template>
  <div class="file-server-list">
    <h3 class="mid-title">
      파일 서버 리스트
    </h3>
    <template>
      <div class="table-area">
        <!-- :header-checkbox="true" -->
        <cmp-grid
          v-loading="gridLoading"
          :item-source.sync="fsList"
          :columns="fsColumns"
          :header-merge="headerMergeColumns"
          :init-custom-action="init"
          :changing-page-reset="false"
          page-keeping
          @changingPage="changingPage"
          @checkedRowsData="setCheckedRows"
          selectable
          @selectedRow="selectRow(...arguments)"
        >
          <template #fsSizeByte="props">
            <span>{{ props.row.fsSizeByte | onlyGB }}</span>
          </template>
          <template #fsFreeSpaceByte="props">
            <span>{{ props.row.fsFreeSpaceByte | onlyGB }}</span>
          </template>
          <template #fsUsedSpaceByte="props">
            <span>{{ props.row.fsUsedSpaceByte | onlyGB }}</span>
          </template>
          <template #manageIndicator="props">
            <span>{{ props.row.manageIndicator }}</span>
          </template>
          <template #firstThresholdPer="props">
            <span>{{ props.row.firstThresholdPer }}</span>
          </template>
          <template #secondThresholdPer="props">
            <span>{{ props.row.secondThresholdPer }}</span>
          </template>
          <template #networkNameList="props">
            <span v-if="props.row.networkNameList.length === 1">
              {{ props.row.networkNameList[0] }}
            </span>
            <el-tooltip
              v-else-if="props.row.networkNameList.length > 1"
              effect="light"
              popper-class="shade-popper"
            >
              <span>
                {{ props.row.networkNameList[0] + ' 외 ' + (props.row.networkNameList.length - 1) }}
              </span>
              <div slot="content">
                <p
                  v-for="(item, index) in props.row.networkNameList"
                  :key="index"
                >
                  {{ item }}
                </p>
              </div>
            </el-tooltip>
            <span v-else>
              {{ '-' }}
            </span>
          </template>
          <template #companyNameList="props">
            <span v-if="props.row.companyNameList.length === 1">
              {{ props.row.companyNameList[0] }}
            </span>
            <el-tooltip
              v-else-if="props.row.companyNameList.length > 1"
              effect="light"
              popper-class="shade-popper"
            >
              <span>
                {{ props.row.companyNameList[0] + ' 외 ' + (props.row.companyNameList.length - 1) }}
              </span>
              <div slot="content">
                <p
                  v-for="(item, index) in props.row.companyNameList"
                  :key="index"
                >
                  {{ item }}
                </p>
              </div>
            </el-tooltip>
            <span v-else>
              {{ '-' }}
            </span>
          </template>
          <template #isPub="props">
            <span>{{ props.row.isPub === undefined ? '-' : props.row.isPub ? $v('노출') : $v('미노출') }}</span>
          </template>
          <template #isRegistered="props">
            <span v-if="props.row.isRegistered">
              {{ $v('등록됨') }}
            </span>
            <button
              v-else
              class="button"
              type="is-primary"
              @click="e => {
                e.preventDefault()
                e.stopPropagation()
                openRegisterModal(props.row)
              }"
            >
              <!-- 등록 -->
              {{ $t('common.BTN.enroll') }}
            </button>
          </template>
        </cmp-grid>
      </div>
    </template>

    <!-- 등록 모달 -->
    <el-dialog
      :title="$v('파일 서버 등록')"
      :visible.sync="registerModal"
      class="file-server-register-modal"
      width="840px"
      top="10vh"
      :before-close="closeRegisterModal"
    >
      <section>
        <article class="modal-body">
          <div
            class="edit-list"
          >
            <register-contents
              :title="$v('네트워크 카테고리')"
              class="network-org-contents"
              required
            >
              <network-category-tree-selection-btn
                :init-data="fileServerInfo.selectedCateList"
                @save="saveCateList"
              />
            </register-contents>
            <!-- 네트워크 카테고리 -->

            <register-contents
              required
              :title="$v('관계사')"
            >
              <div class="register-wrap">
                <button
                  class="button select-btn"
                  :class="{'-margin': fileServerInfo.selectedCompanyList.length > 0}"
                  type="is-primary"
                  @click="activeCompanySelectModal = true"
                >
                  {{ $v('관계사 선택') }}
                </button>
                <div
                  v-if="fileServerInfo.selectedCompanyList.length"
                  class="tag-lists"
                >
                  <div
                    v-for="tag in fileServerInfo.selectedCompanyList"
                    :key="tag.groupIdx"
                  >
                    <clearable-tag
                      :content="tag.companyName"
                      :unique-key="tag.groupIdx"
                      @clear="clearTag"
                    />
                  </div>
                </div>
              </div>
            </register-contents>
            <!-- 관계사 -->

            <register-contents
              required
              :title="`${$v(fileServerInfo.thresholdObj.title)} (%)`"
            >
              <div
                v-for="item in fileServerInfo.thresholdObj.children"
                class="input-form -threshold"
                :class="{'--one-option': fileServerInfo.thresholdObj.children.length <= 1}"
                :key="item.key"
              >
                <div>
                  {{ $v(item.label) }} :
                  <el-input-number
                    v-model="item.value"
                    :min="0"
                    :max="100"
                  />
                  <span style="margin-left: 5px">%</span>
                </div>
              </div>
            </register-contents>
            <!-- 임계치 설정 -->

            <register-contents
              required
              :title="$v('노출 여부')"
            >
              <div class="input-form">
                <el-radio-group
                  v-model="fileServerInfo.isPub"
                >
                  <el-radio :label="true">
                    {{ $v('노출') }}
                  </el-radio>
                  <el-radio
                    style="margin-left: 10px"
                    :label="false"
                  >
                    {{ $v('미노출') }}
                  </el-radio>
                </el-radio-group>
              </div>
            </register-contents>
            <!-- 노출 여부 -->
          </div>
        </article>

        <div class="modal-footer modal-button-area">
          <button
            class="button -modal-button"
            type="is-anti"
            @click="closeRegisterModal"
          >
            <!-- 취소 -->
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button -modal-button"
            @click="registerFileServer(fileServerInfo)"
            type="is-primary"
          >
            <!-- 확인 -->
            {{ $t('common.BTN.confirm') }}
          </button>
        </div>
      </section>
    </el-dialog>

    <!-- 네트워크 카테고리 선택 모달 -->
    <!-- <network-category-tree-selection
      :visible="networkCategoryModal"
      @close="networkCategoryModal = false"
    /> -->

    <!-- 관계사 선택 모달 -->
    <company-select-modal
      :active.sync="activeCompanySelectModal"
      :selected-aff="selectedOneDepthAff"
      :aff-list="affList"
      @accept="acceptAffModal"
      @close="activeCompanySelectModal = false"
    />
    <!-- :active-project="activeProject" -->
  </div>
</template>
<script>
import API, {
  // NetworkCategoryTreeSelection,
  NetworkCategoryTreeSelectionBtn
} from '@sd-fe/cmp-core'
import {
  cloneDeep
// isEmpty
} from 'lodash'
import CompanySelectModal from './CompanySelectModal.vue'

export default {
  name: 'NutanixCentralImageList',
  components: {
    // 'network-category-tree-selection': NetworkCategoryTreeSelection,
    NetworkCategoryTreeSelectionBtn,
    CompanySelectModal
  },
  computed: {
  },
  async created () {
    await this.getClusters()
    await this.getNetworkCategoryList()
    await this.getCompanyList()
    await this.getAllAff()
    this.getFileServerList()
  },
  watch: {
    registerModal (val) {
      if (val) {
        this.thresholdObj = cloneDeep(this.convertThresholdsToObject(this.checkedRow))
      } else {
        this.thresholdObj = {}
        this.registerTargetFileServer = {}
        this.selectedOneDepthAff = []
      }
      this.fileServerInfo = {
        selectedCateList: [],
        selectedCompanyList: [],
        thresholdObj: this.thresholdObj,
        isPub: undefined
      }
    }
  },
  methods: {
    clearTag (groupIdx) {
      this.selectedOneDepthAff = this.fileServerInfo.selectedCompanyList = this.fileServerInfo.selectedCompanyList.filter(select => select.groupIdx !== groupIdx)
    },
    async getAllAff () {
      try {
        const res = await API.iam.getGroupList({ groupUpper: 0 })
        this.affList = res
      } catch (error) {
        this.$alert(this.$t('common.ALERT.BILL.061'))
      }
    },
    closeTag (arr, tag, id) {
      let removeIdx
      arr.forEach((item, idx) => {
        if ((tag[id] && item[id] === tag[id])) {
          removeIdx = idx
        }
      })
      arr.splice(removeIdx, 1)

      // // 권한 태그 클릭시 권한 모달 데이터 바인딩 재귀 돌면서 취소
      // if (id === 'id') {
      //   const array = []
      //   this.authList.forEach(tag => array.push(tag.routeTo))
      //   this.roleItem.rolePermTree.forEach(auth => {
      //     if (array.includes(auth.routeTo)) auth.read = true
      //     else this.uncheckTree(auth)
      //   })
      // }
    },
    acceptAffModal (companyList) {
      console.log(companyList)
      this.fileServerInfo.selectedCompanyList = companyList
      this.selectedOneDepthAff = companyList
      this.activeCompanySelectModal = false
    },
    saveCateList (list) {
      this.fileServerInfo.selectedCateList = list
    },
    // close (list) {
    //   console.log('@close', list)
    // },
    convertThresholdsToObject (checkedRow) {
      return {
        title: '할당량 임계치',
        children: [
          { label: '관리 지표', key: 'manageIndicator', value: checkedRow.manageIndicator || 0 },
          { label: '1차 임계치', key: 'firstThresholdPer', value: checkedRow.firstThresholdPer || 0 },
          { label: '2차 임계치', key: 'secondThresholdPer', value: checkedRow.secondThresholdPer || 0 }
        ]
      }
    },
    openRegisterModal (row) {
      console.log('@openRegisterModal: registerTargetFileServer', row)
      this.registerTargetFileServer = row
      this.registerModal = true
    },
    closeRegisterModal (done, mode) {
      console.log(this.fileServerInfo, mode)
      if (this.fileServerInfo.selectedCateList.length > 0 || this.fileServerInfo.selectedCompanyList.length > 0 || this.fileServerInfo.isPub !== undefined) {
        this.$confirm(this.$v('등록이 완료되지 않았습니다. 창을 닫겠습니까?'), { dangerouslyUseHTMLString: true })
          .then(() => {
            if (typeof done === 'function') {
              done()
            } else {
              this.registerModal = false
            }
          })
          .catch(() => false)
      } else {
        this.registerModal = false
      }
    },
    validateInfo () {
      // this.fileServerInfo.thresholdObj.children?.length && this.fileServerInfo.thresholdObj.children[0].value !== 0
      if (!this.fileServerInfo.selectedCateList.length) {
        return {
          result: false,
          message: this.$v('네트워크 카테고리를 선택해주세요.')
        }
      }
      if (!this.fileServerInfo.selectedCompanyList.length) {
        return {
          result: false,
          message: this.$v('관계사를 선택해주세요.')
        }
      }
      const manageIndicatorVal = this.fileServerInfo.thresholdObj.children[0].value
      const firstThresholdPerVal = this.fileServerInfo.thresholdObj.children[1].value
      const secondThresholdPerVal = this.fileServerInfo.thresholdObj.children[2].value
      if (manageIndicatorVal === 0 || firstThresholdPerVal === 0 || secondThresholdPerVal === 0) {
        return {
          result: false,
          message: this.$v('관리 지표 및 임계치는 0 보다 커야 합니다.')
        }
      }
      if (!(manageIndicatorVal > secondThresholdPerVal && secondThresholdPerVal > firstThresholdPerVal)) {
        return {
          result: false,
          message: this.$v('임계치 크기는 관리지표 > 2차 임계치 > 1차 임계치 순서가 되어야 합니다.')
        }
      }
      if (this.fileServerInfo.isPub === undefined) {
        return {
          result: false,
          message: this.$v('노출 여부를 선택해주세요.')
        }
      }
      return { result: true }
    },
    /**
     * 파일 서버 등록
     */
    async registerFileServer (info) {
      console.log(info, this.registerTargetFileServer)
      const validate = this.validateInfo()
      if (!validate.result) {
        this.$alert(validate.message, () => false)
      } else {
        try {
          this.registerLoading = true
          // 임계치 가공
          const threshold = this.thresholdObj.children.reduce((acc, item) => {
            acc[item.key] = item.value
            return acc
          }, {})
          // 네트워크 카테고리 가공
          const networkList = info.selectedCateList.reduce((acc, item) => {
            acc.push({ cateIdx: item.cateIdx })
            return acc
          }, [])
          // 관계사 가공
          const companyList = info.selectedCompanyList.reduce((acc, item) => {
            acc.push({ companyIdx: item.groupIdx })
            return acc
          }, [])
          const targetFs = this.registerTargetFileServer
          const payload = {
            clusterUuid: targetFs.clusterUuid,
            companyList: companyList,
            dnsDomainName: targetFs.dnsDomainName,
            fileServerName: targetFs.fileServerName,
            fileServerUuid: targetFs.fileServerUuid,
            firstThresholdPercent: threshold.firstThresholdPer,
            fsManageIndicator: threshold.manageIndicator,
            isPub: info.isPub,
            networkList: networkList,
            protectionDomainName: targetFs.protectionDomainName,
            protocolType: targetFs.protocolType,
            secondThresholdPercent: threshold.secondThresholdPer
          }
          const res = await API.compute.registFileServer(targetFs.fileServerUuid, payload)
          if (res.isSuccess) {
            this.$alert(this.$v('파일 서버가 등록되었습니다.'), {
              callback: async () => {
                this.registerLoading = false
                await this.getFileServerList()
                this.closeRegisterModal(...arguments, true)
              }
            })
          }
        } catch (error) {
          this.$alert('등록 실패했습니다.', {
            callback: () => {
              console.error(error)
              this.registerLoading = false
            }
          })
        }
      }
    },
    async getCompanyList () {
      await this.$store.dispatch('common/getSimpleCompanyList')
      this.companyList = this.$store.state.common.company
      console.log('@getCompanyList', this.companyList)
    },
    async getNetworkCategoryList () {
      await this.$store.dispatch('network/getNetworkCategoryList', { isAdmin: true, isDeleted: false })
      this.networkCategoryList = this.$store.state.network.networkCategoryList
      console.log('@getNetworkCategoryList', this.networkCategoryList)
    },
    async getClusters () {
      await this.$store.dispatch('cluster/getClusters', ['clusterUuid', 'clusterName'])
      this.clusters = this.$store.state.cluster.clusterList
      console.log('@getClusters', this.clusters)
    },
    getClusterName (data) {
      return this.clusters.find(item => item.clusterUuid === data.clusterUuid)
    },
    getNetworkCateName (data) {
      return this.networkCategoryList.find(item => item.ipCategoryIdx === data.cateIdx)
    },
    getCompanyName (data) {
      return this.companyList.find(item => item.field === data.companyIdx)
    },
    /**
     * File Server List 조회
     */
    async getFileServerList () {
      try {
        const fileServers = await API.compute.getAllFileServerList()
        if (fileServers.length > 0) {
          const fsListData = fileServers.map(fs => {
            // 클러스터 정보
            const clusterInfo = this.getClusterName(fs)
            fs.clusterName = clusterInfo ? clusterInfo.clusterName : '-'

            // 네트워크 카테고리 정보
            fs.networkNameList = fs.networkList ? fs.networkList.map(network => {
              const item = this.getNetworkCateName(network)
              console.log(item)
              return item?.cateKey || '-'
            }) : []

            // 관계사 정보
            fs.companyNameList = fs.companyList ? fs.companyList.map(company => {
              const item = this.getCompanyName(company)
              console.log(item)
              return item?.label || '-'
            }) : []

            if (typeof fs.isPub === 'object' && !fs.isPub) {
              fs.isPub = undefined
            }

            // 등록 여부 정보
            fs.isRegistered = !!fs.userFsIdx
            // fs.isRegistered = false // 개발용 임시 코드 🅾️🅾️🅾️🅾️🅾️🅾️

            return fs
          })
          this.fsList = fsListData
          console.log('@getFileServerList', this.fsList)
          this.gridLoading = false
        }
      } catch (error) {
        console.error(error)
        console.log(error.response.data)
      }
    },
    routeTo (to) {
      this.$router.push(to)
    },
    setCheckedRows (checkedRows) {
      // 단일 선택시 [변경] 활성화
      this.selectedImage = checkedRows.length === 1 ? checkedRows[0] : null

      // 다중 선택시
      this.checkedRows = checkedRows
    },
    changingPage (page) {
      this.currPage = page - 1
    },
    init (grid) {
      this.grid = grid
    },
    /**
     * 그리드 row 클릭 시 실행
     */
    selectRow (selectedRow) {
      console.log('@selectRow', selectedRow.dataItem)
      this.routeTo({
        name: 'file-server-detail',
        params: {
          fileServerUuid: selectedRow.dataItem.fileServerUuid,
          fileServerInfo: selectedRow.dataItem
        }
      })
    }
  },
  data: (root) => ({
    currPage: 0,
    fsList: [],
    fsColumns: [
      { binding: 'fileServerName', header: root.$v('파일 서버명'), customHtml: true },
      { binding: 'clusterName', header: root.$v('클러스터명'), customHtml: true },
      { binding: 'dnsDomainName', header: root.$v('도메인명'), customHtml: true },
      { binding: 'protocolType', header: root.$v('프로토콜 타입'), customHtml: true },
      { binding: 'fsSizeByte', header: root.$v('총 용량'), customHtml: true },
      { binding: 'fsFreeSpaceByte', header: root.$v('총 할당량'), customHtml: true },
      { binding: 'fsUsedSpaceByte', header: root.$v('현재 사용량'), customHtml: true },
      { binding: 'fsManageIndicator', header: root.$v('관리 지표'), customHtml: true },
      { binding: 'firstThresholdPercent', header: root.$v('1차 임계치'), customHtml: true },
      { binding: 'secondThresholdPercent', header: root.$v('2차 임계치'), customHtml: true },
      { binding: 'networkNameList', header: root.$v('네트워크 카테고리'), customHtml: true },
      { binding: 'companyNameList', header: root.$v('관계사'), customHtml: true },
      { binding: 'isPub', header: root.$v('노출 여부'), customHtml: true },
      { binding: 'isRegistered', header: root.$v('등록 여부'), customHtml: true }
    ],
    headerMergeColumns: {
      colSpan: [
        { startIdx: 7, endIdx: 9, header: root.$v('할당량 임계치') }
      ],
      rowSpan: ['fileServerName', 'clusterName', 'dnsDomainName', 'protocolType', 'fsSizeByte', 'fsFreeSpaceByte', 'fsUsedSpaceByte', 'networkNameList', 'companyNameList', 'isPub', 'isRegistered']
    },
    registerModal: false,
    networkCategoryModal: false,
    companyList: [],
    networkCategoryList: [],
    clusters: [],
    registerLoading: false,
    gridLoading: true,
    thresholdObj: {},
    checkedRow: {},
    fileServerInfo: {
      selectedCateList: [],
      selectedCompanyList: [],
      thresholdObj: {},
      isPub: undefined
    },
    activeCompanySelectModal: false,
    affList: [],
    selectedOneDepthAff: [],
    registerTargetFileServer: {}
  })

}
</script>
<style lang="scss">
  .file-server-list {
    // 모달
    .file-server-register-modal {
      .modal-body {
        overflow-y: auto;
        max-height: 75vh;
        .edit-list {
          border-top: 1px solid $border-color;
          position: relative;
          & + .edit-list { margin-top: $gap-m; }

          .block-before-test {
            background: rgba(0, 0, 0, 0.8);
            position: absolute;
            top: 0; left: 0; bottom: 0; right: 0;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            color: $light-gray;
            transition: background 0.2s ease-in-out;
            &.is-connecting {
              background: rgba(0, 0, 0, 0.2);
            }
          }

          .register-contents {
            .contents-title {
              min-width: 200px;
            }
          }

          .input-form {
            display: flex;
            align-items: center;
            position: relative;
            > .button {
              width: 100%;
            }
            & + .input-form {
              margin-top: 5px;
            }

            &.-threshold {
              // border: 1px solid red;
              justify-content: flex-start;
              align-items: flex-start;
              flex-direction: column;
              > div:first-child { margin-bottom: $gap-s; }
            }

            &.-network-org {
              position: relative;
              padding-right: 60px;
              .add-item {
                position: absolute;
                top: 50%;
                right: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 45px;
                transform: translateY(-50%);
                > .icon-button {
                  color: $primary;
                }
              }
            }
          }
        }

        .register-wrap {
          .select-btn {
            &.-margin {
              margin-bottom: 10px;
            }
          }
          .tag-lists > div {
            display: inline-block;
            .clearable-tag {
              height: 29px;
              padding: 0 15px;
            }
          }
        }
      }
    }

  }
</style>
