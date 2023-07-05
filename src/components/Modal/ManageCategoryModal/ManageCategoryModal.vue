<!--
  * 파일명 : ManageCategoryModal.vue
  * 파일 기능 : 네트워크 카테고리 crud 할 수 있는 모달 입니다.
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-01-29
  * License By Shinsegae I&C
  * 2021-01-29 fix: 모달 오픈시, body 스크롤 제거 ... 공통 적용, 이에 따른 불필요 코드 제거
 -->

<template>
  <!-- 카테고리 관리 -->
  <el-dialog
    :title="$t('common.MODAL.manageCate')"
    :visible.sync="isActive"
    class="manage-category-modal"
    width="700px"
    top="5vh"
    @close="close"
    v-loading="isGetCateDetail"
  >
    <section class="modal-body">
      <div class="button-area -right">
        <button
          class="button"
          type="is-primary"
          @click="e => {
            updateCate(null, 0)
            this.setModalTitle(null, 'create')
          }"
        >
          <!-- 데이터센터 추가 -->
          {{ $t('config.IP.addDatacenter') }}
        </button>
        <!-- <template v-else>
          <button
            class="button"
            type="is-anti"
            @click="newInputForm = false"
          >
            취소
          </button>
          <button
            class="button"
            type="is-primary"
            @click="createDatacenter(newDatacenter)"
          >
            확인
          </button>
        </template> -->
      </div>

      <!-- <ul
        class="form-area"
        v-show="newInputForm"
      >
        <li class="form-item">
          <span class="form-title">데이터센터 이름: </span>
          <el-input
            v-model="newDatacenter.cateName"
            style="width: 250px;"
            @keyup.native.enter="e => createDatacenter(newDatacenter)"
            ref="datacenterInput"
          />
        </li>
      </ul> -->

      <div
        class="cate-tree tiny-scroll"
        style="margin-top: 10px"
      >
        <cmp-tree
          :item-source="copiedData"
          :columns="columns"
          :init-custom-action="init"
          class="network-category-tree"
          :all-row-selectable="true"
          height="65vh"
          ref="cateTreeRef"
        >
          <template #cateName="props">
            <section
              class="cell-contents"
              v-if="props.row.edit"
            >
              <div class="edit-form">
                <el-input
                  v-model="props.row.cateName"
                  class="form-input"
                  clearable
                  @keyup.native.enter="e => {
                    updateCate(null, 0)
                    saveCate(props.row)
                  }"
                />
              </div>
            </section>
            <section
              class="cell-contents cate-title"
              v-else
            >
              <el-tooltip
                v-if="props.row.cateName.length > 25"
                :content="props.row.cateName"
                placement="top"
                effect="light"
              >
                <span class="ellipsis-wrap">
                  {{ props.row.cateName }}
                </span>
              </el-tooltip>
              <span v-else>
                {{ props.row.cateName }}
              </span>
            </section>
            <div
              class="button-area"
              style="margin-left: 20px;"
            >
              <button
                class="button"
                v-if="!props.row.edit"
                type="is-primary"
                @click="e => {
                  updateCate(null, props.row.cateIdx)
                  setModalTitle(props.row, 'create')
                }"
              >
                {{ $t('common.BTN.addItem') }}
              </button>
              <!-- 항목 추가 -->

              <button
                class="button"
                v-if="!props.row.edit"
                @click.stop="setUpdateCateItem(props.row.cateIdx, props.groupRow)"
              >
                {{ $t('common.BTN.modify') }}
              </button>
              <!-- 수정 -->

              <template v-if="props.row.edit">
                <!-- <button
                  class="button"
                  type="is-anti"
                  @click="cancelUpdate(props.row)"
                >
                  {{ $t('common.BTN.cancel') }}
                </button> -->
                <!-- 취소 -->

                <!-- <button
                  class="button"
                  type="is-primary"
                  @click="saveCate(props.row)"
                >
                  {{ $t('common.BTN.confirm') }}
                </button> -->
                <!-- 확인 -->
              </template>

              <button
                class="button"
                type="is-icon"
                @click="props.row.crud !== 'create'? deleteCategory(props.row) : cancelUpdate(props.row)"
              >
                <i class="icon-button delete-icon" />
              </button>
            </div>
          </template>
        </cmp-tree>
      </div>
    </section>
    <!-- @selectedRow="saveSelectedRow" -->

    <section class="modal-footer modal-button-area">
      <button
        class="button -modal-button"
        @click="close"
      >
        <!-- 확인 -->
        {{ $t('common.BTN.confirm') }}
      </button>
    </section>
    <!-- </section> -->
    <el-dialog
      class="create-category-modal"
      :title="updateCateModalTitle"
      :visible.sync="addCateModal"
      width="600px"
      top="15vh"
      @close="() => addCateModal = false"
    >
      <section
        class="modal-body"
        style="border-top: 1px solid #3D435E"
      >
        <register-contents
          :title="$t('config.IP.codeValue')"
          required
        >
          <el-input
            v-model="newCate.codeValue"
            class="add-cate-input"
            :placeholder="$t('common.ALERT.NETWORK.034')"
            :disabled="isModify"
            maxlength="32"
            show-word-limit
          />
        </register-contents>
        <!-- 코드 값 -->

        <register-contents
          :title="$t('config.IP.codeName')"
          required
        >
          <el-input
            v-model="newCate.codeName"
            class="add-cate-input"
            :placeholder="$t('common.ALERT.NETWORK.035')"
            maxlength="32"
            :disabled="isModify && newCate.upperCategoryIdx === 0"
            show-word-limit
          />
        </register-contents>
        <!-- 코드 명 -->

        <register-contents
          :title="$t('common.GRID.NETWORK.categoryCodeValue')"
          required
        >
          <el-input
            v-model="newCate.cateCode"
            class="add-cate-input"
            :placeholder="$t('common.ALERT.NETWORK.037')"
            maxlength="1"
            show-word-limit
          />
        </register-contents>
        <!-- 카테고리 코드 -->

        <register-contents
          title="Salt master IP"
        >
          <el-input
            v-model="newCate.saltMasterIp"
            class="add-cate-input"
            :placeholder="$t('common.ALERT.NETWORK.048')"
          />
        </register-contents>
        <!-- salt master IP -->

        <register-contents
          title="Zabbix IP"
        >
          <el-input
            v-model="newCate.zabbixIp"
            class="add-cate-input"
            :placeholder="$t('common.ALERT.NETWORK.049')"
          />
        </register-contents>
        <!-- zabbix IP -->

        <register-contents
          title="Repo IP"
        >
          <el-input
            v-model="newCate.repoIp"
            class="add-cate-input"
            :placeholder="$t('common.ALERT.NETWORK.050')"
          />
        </register-contents>
        <!-- repo IP -->
      </section>

      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="cancelUpdateCate"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button -modal-button"
          @click="saveCate"
          type="is-primary"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
    </el-dialog>
  </el-dialog>
</template>
<script>
import API from '@sd-fe/cmp-core'
import { mapValues } from 'lodash'

export default {
  name: 'ManageCategoryModal',
  props: {
    active: {
      type: Boolean,
      default: false
    },
    data: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    active (newVal) {
      this.isActive = newVal
    },
    isActive (newVal) {
      this.active = newVal
      if (newVal) this.cloneTreeData(this.data)
    },
    data: {
      immediate: true,
      handler (newVal) {
        this.cloneTreeData(newVal)
      }
    }
  },
  computed: {
    isModify () {
      if (this.newCate.ipCategoryIdx === '') return false
      else return this.newCate?.ipCategoryIdx && !isNaN(this.newCate.ipCategoryIdx)
    }
  },
  methods: {
    init (grid) {
      this.grid = grid

      // this.cellTooltipHandler(grid)
    },
    cloneTreeData (origin) {
      this.copiedData = JSON.parse(JSON.stringify(origin))
    },
    /**
     * 네트워크 카테고리 상세를 조회합니다.
     */
    async getNetworkCategoryDetail (ipCategoryIdx) {
      try {
        this.isGetCateDetail = true
        const data = await API.network.getNetworkCategoryDetail(ipCategoryIdx)
        if (data) return data
      } catch (error) {
        console.error(error)
        return null
      } finally {
        this.isGetCateDetail = false
      }
    },
    /**
     * 카테고리 수정 시, 데이터를 세팅합니다.
     */
    async setUpdateCateItem (cateIdx, groupRow) {
      if (cateIdx === undefined) return
      this.newCate = await this.getNetworkCategoryDetail(cateIdx)
      this.updateCate(this.newCate, this.newCate.upperCategoryIdx)
    },
    /**
     * 카테고리 삭제
     */
    deleteCategory (row) {
      if (row.children?.length) {
        this.$alert(this.$t('common.ALERT.PROJECT.028'), { dangerouslyUseHTMLString: true }) // 하위에 항목이 존재하지 않아야<br>삭제할 수 있습니다.
        return false
      }

      const itemName = row.cateUpper === 0 ? this.$t('common.CONFIRM.PROJECT.019') : this.$t('common.CONFIRM.NOTICE.001')
      // 해당 데이터 센터를 삭제하시겠습니까? : 해당 카테고리를 삭제하시겠습니까?

      this.$confirm(itemName, '알림', {
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(async () => {
        const result = await API.network.deleteIpCategory(row.cateIdx)
        if (result && !result.errorCode) {
          this.$alert(this.$t('common.ALERT.BASE.017')) // 삭제되었습니다.
          this.refreshTree()
        } else if (result?.errorCode === 'NET5000') {
          this.$alert(this.$t('common.ALERT.PROJECT.028'), { dangerouslyUseHTMLString: true }) // 하위에 항목이 존재하지 않아야<br>삭제할 수 있습니다.
        } else this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
      }).catch(() => {
        this.cancelUpdateCate()
        // this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
      })
    },
    /**
     * 전체 데이터에서 item을 삭제합니다.
     * @param {Array} all 전체 데이터
     * @param {Object} itm 삭제 할 객체
     * @param {String} key 삭제 할 객체의 고유 key값..
     */
    removeItems (all = this.grid.collectionView, deleteItem, key) {
      all.find((item, index) => {
        if (item[key] === deleteItem[key]) {
          const beforeArr = [...all].splice(0, index)
          const afterArr = [...all].splice(index + 1)
          all = item.children.length > 0 ? beforeArr.concat(item.children, afterArr) : beforeArr.concat(afterArr)
          return all
        }
        if (item.children && item.children.length > 0) {
          item.children = this.removeItems(item.children, deleteItem, key)
        }
      })
      return all
    },

    // async createNetworkCategory (payload, newItem) {
    //   const response = await API.config.createNetworkCategory(payload)
    //   if (response) {
    //     newItem.cateIdx = response

    //     if (newItem.cateUpper === 0) this.addDatacenterRow(newItem)
    //     // this.newInputForm = false
    //   } else this.$alert(this.$t('common.ALERT.PROJECT.015'))
    // },

    // emptyDataAlert () {
    //   this.$alert(this.$t('common.ALERT.BASE.012'), '알림')
    //   return false
    // },

    /**
     * 카테고리 추가/수정 -> '저장' 합니다.
     */
    saveCate () {
      const checkValidItems = [
        { codeValue: this.newCate.codeValue?.trim() },
        { codeName: this.newCate.codeName?.trim() },
        { cateCode: this.newCate.cateCode?.trim() }
        // { saltMasterIp: this.newCate.saltMasterIp?.trim() },
        // { isIpSaltMasterIp: this.newCate.saltMasterIp?.trim() ? this.ipFormatPass(this.newCate.saltMasterIp) : true }, // 임시 validation 삭제 처리 🔴
        // { zabbixIp: this.newCate.zabbixIp?.trim() },
        // { isIpZabbixIp: this.newCate.zabbixIp?.trim() ? this.ipFormatPass(this.newCate.zabbixIp) : true },
        // { repoIp: this.newCate.repoIp?.trim() },
        // { isIpRepoIp: this.newCate.repoIp?.trim() ? this.ipFormatPass(this.newCate.repoIp, false) : true }
      ]
      if (this.isEmptyContents(checkValidItems)) return

      const message = this.isModify
        ? 'common.CONFIRM.BASE.024' // 해당 내용으로 수정하시겠습니까?
        : 'common.CONFIRM.BASE.022' // 해당 내용으로 등록하시겠습니까?

      this.$confirm(this.$t(message)).then(async () => {
        const payload = {
          codeValue: this.newCate.codeValue,
          codeName: this.newCate.codeName,
          cateCode: this.newCate.cateCode,
          upperCategoryIdx: this.newCate.upperCategoryIdx,
          saltMasterIp: this.newCate.saltMasterIp,
          zabbixIp: this.newCate.zabbixIp,
          repoIp: this.newCate.repoIp
        }
        if (!this.isModify) this.createCategory(payload) // 생성
        else this.modifyCategory(this.newCate.ipCategoryIdx, payload) // 변경
      })
    },
    /**
     * 빈 항목이 있으면 alert 메세지 출력
     * @param {Array} checkItems 체크할 키 : 값 모음
     * @return {Boolean} 빈 항목이 유무 리턴, 빈 항목이 있으면 true 반환
     */
    isEmptyContents (checkItems) {
      let pass = true
      if (!checkItems?.length) return
      const message = {
        codeValue: 'common.ALERT.NETWORK.034', // 코드 값을 입력해주세요.
        codeName: 'common.ALERT.NETWORK.035', // 코드 명을 입력해주세요.
        cateCode: 'common.ALERT.NETWORK.037', // 카테고리 코드를 입력해주세요.
        saltMasterIp: 'common.ALERT.NETWORK.048', // salt master IP를 입력해주세요.
        isIpSaltMasterIp: 'common.ALERT.NETWORK.051', // salt master IP 형식을 확인해주세요.
        zabbixIp: 'common.ALERT.NETWORK.049', // salt master IP를 입력해주세요.
        isIpZabbixIp: 'common.ALERT.NETWORK.052', // zabbix IP 형식을 확인해주세요.
        repoIp: 'common.ALERT.NETWORK.050', // repo IP를 입력해주세요.
        isIpRepoIp: 'common.ALERT.NETWORK.053' // repo IP 형식을 확인해주세요.
      }

      for (let i = 0; i < checkItems.length; i++) {
        const key = Object.keys(checkItems[i])[0]
        const value = checkItems[i][key]
        const flag = value !== false &&
                      value !== '' &&
                      value !== null &&
                      value !== undefined

        if (!flag) { // value가 비어있을 때 alert창을 띄워줍니다
          this.$alert(this.$t(message[key]))
          pass = false
          break
        }
      }
      return !pass
    },

    /**
     * 카테고리를 생성합니다.
     */
    async createCategory (payload) {
      try {
        const result = await API.network.createIpCategory(payload)

        if (result && !result.errorCode) {
          this.$alert(this.$t('common.ALERT.BASE.032')) // 등록 성공하였습니다.
          this.refreshTree()
        } else if (result?.errorCode === 'NET5002') {
          this.$alert(this.$t('common.ALERT.NETWORK.040')) // 중복된 데이터센터명을 사용할 수 없습니다.
        } else if (result?.errorCode === 'NET5004') {
          this.$alert(this.$t('common.ALERT.NETWORK.054')) // 중복된 코드명을 사용할 수 없습니다.
        } else this.$alert(this.$t('common.ALERT.LOGGING.004'), { dangerouslyUseHTMLString: true }) // 생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.
      } catch (error) {
        console.error(error)
        this.cancelUpdateCate()
        // this.$alert(this.$t('common.ALERT.LOGGING.004'), { dangerouslyUseHTMLString: true }) // 생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.
      }
    },
    /**
     * 카테고리를 수정합니다.
     * @param {number} ipCateIdx 수정하는 카테고리의 ipCategoryIdx
     */
    async modifyCategory (ipCateIdx, payload) {
      try {
        const result = await API.network.updateIpCategory(ipCateIdx, payload)
        if (result && !result.errorCode) {
          this.$alert(this.$t('common.ALERT.BASE.019')) // 성공적으로 변경되었습니다.
          this.refreshTree()
        } else if (result?.errorCode === 'NET5002') {
          this.$alert(this.$t('common.ALERT.NETWORK.040')) // 중복된 데이터센터명을 사용할 수 없습니다.
        } else if (result?.errorCode === 'NET5004') {
          this.$alert(this.$t('common.ALERT.NETWORK.054')) // 중복된 코드명을 사용할 수 없습니다.
        } else this.$alert(this.$t('common.ALERT.LOGGING.005'), { dangerouslyUseHTMLString: true }) // 수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.
      } catch (error) {
        // this.$alert(this.$t('common.ALERT.LOGGING.005'), { dangerouslyUseHTMLString: true }) // 수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        this.cancelUpdateCate()
      }
    },

    /**
     * 모달 [확안]
     */
    close () {
      this.$emit('close')
    },
    refreshTree () {
      this.$emit('refresh')
      this.gridRefresh()
      this.cancelUpdateCate()
    },
    gridRefresh () {
      const cv = this.grid.collectionView
      cv.refresh()
    },
    /**
     * 카테고리 항목 추가/수정 > [취소]버튼 클릭 시
     */
    cancelUpdateCate () {
      this.addCateModal = false
      this.newCate = mapValues(this.newCate, () => '')
    },
    /**
     * [하위 항목 추가]버튼을 눌렀을 때, 해당 항목에 자식 요소를 추가합니다.
     * @param {GroupRow} groupRow 위즈모 groupRow
     * @param {Object} rowItem 로우 아이템
     */
    // addChild (groupRow, rowItem) {
    //   groupRow.isCollapsed = false
    //   const isNewChildren = rowItem.children.filter(org => org.crud === 'create' && org.edit)
    //   if (isNewChildren.length) return false

    //   const newRow = new wjGrid.Row()
    //   const newObj = {
    //     id: Math.random().toString(36).substr(2),
    //     crud: 'create',
    //     cateKey: '',
    //     cateName: '',
    //     children: [],
    //     edit: true

    //   }
    //   newRow.dataItem = newObj

    //   newRow.level = rowItem.level + 1
    //   if (rowItem.children) rowItem.children.unshift(newObj)
    //   else {
    //     rowItem.children = []
    //     rowItem.children.push(newObj)
    //   }
    //   this.grid.rows.insert(rowItem._idx + 1, newRow)

    //   this.gridRefresh()
    // },
    // activeNewDatacenter () {
    //   this.newInputForm = true

    //   this.$nextTick(() => {
    //     this.$refs.datacenterInput.focus()
    //   })
    // },
    /**
     * 데이터 센터 추가
     */
    // createDatacenter (datacenter = this.newDatacenter) {
    //   if (!datacenter.cateName?.trim()) return this.emptyDataAlert()

    //   this.$confirm(this.$t('common.CONFIRM.PROJECT.009', { name: datacenter.cateName }), '알림', {
    //     cancelButtonText: this.$t('common.BTN.cancel')
    //   }).then(() => {
    //     datacenter.cateKey = datacenter.cateName

    //     const payload = {
    //       cateKey: datacenter.cateKey,
    //       cateName: datacenter.cateName,
    //       cateUpper: 0
    //     }

    //     this.createNetworkCategory(payload, datacenter)
    //   }).catch(() => {
    //     return false
    //   })
    // },
    /**
     * 데이터센터 로우 추가
     */
    // addDatacenterRow (datacenter) {
    //   const newData = {
    //     crud: '',
    //     cateIdx: datacenter.cateIdx,
    //     cateKey: datacenter.cateKey,
    //     cateName: datacenter.cateName,
    //     cateUpper: 0,
    //     children: [],
    //     edit: false
    //   }

    //   var cv = this.grid.collectionView
    //   cv.sourceCollection.push(newData)

    //   this.gridRefresh()
    // },
    // resetNewDatacenter () {
    //   this.newDatacenter = mapValues(this.newCompany, () => '')
    // },
    /**
     * 수정 할 데이터센터 || 카테고리 정보 세팅
     * @param {Object} update 업데이트 할 데이터
     * @param {Number} upperCategoryIdx 업데이트 할 데이터의 upperCategoryIdx
     */
    updateCate (updateItem, upperCategoryIdx) {
      // console.log('선택한 친구', this.newCate)

      this.addCateModal = true

      if (!updateItem) {
        this.newCate = mapValues(this.newCate, () => '')
      } else {
        this.newCate = updateItem
        this.setModalTitle(updateItem, 'modify')
      }
      this.newCate.upperCategoryIdx = upperCategoryIdx
    },
    /**
     * 모달 타이틀을 설정합니다.
     */
    setModalTitle (row, state) {
      let text
      if (row) {
        const cateNameKey = row.codeValue || row.cateName
        if (row?.upperCategoryIdx === 0) { // 데이터센터
          text = state === 'create'
            ? `${this.$t('main.DASHBOARD.dataCenter')} : ${cateNameKey} ${this.$t('common.TERMS.addSubItem')}` // 데이터센터 : ... 하위 항목 추가
            : `${this.$t('main.DASHBOARD.dataCenter')} : ${cateNameKey} ${this.$t('common.TERMS.infoUpdating')}` // 데이터센터 : ... 정보 수정
        } else {
          text = state === 'create'
            ? `${this.$t('common.GRID.category')} : ${cateNameKey} ${this.$t('common.TERMS.addSubItem')}` // 카테고리 : ... 하위 항목 추가
            : `${this.$t('common.GRID.category')} : ${cateNameKey} ${this.$t('common.TERMS.infoUpdating')}` // 카테고리 : ... 정보 수정
        }
      } else text = this.$t('config.IP.addDatacenter') // 데이터센터 추가

      this.updateCateModalTitle = text
    },

    /**
     * IP 형식을 점검합니다.
     * @return {boolean} IP 형식 통과 유무
     */
    ipFormatPass (text, onlyIp = true) {
      if (!text) return
      let regExp
      if (onlyIp) regExp = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      else regExp = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/

      if (regExp.test(text)) {
        return true
      } else {
        return false
      }
    }
  },
  data () {
    return {
      copiedData: [],
      isGetCateDetail: false, // 로딩: 카테고리 상세 조회
      // newInputForm: false, // 카테고리 추가 폼
      beforeEditItem: null, // 편집할 때, 편집 전 데이터 기억
      isActive: this.active || false,
      addCateModal: false, // 카테고리 추가, 수정 모달
      updateCateModalTitle: '', // 카테고리 업데이트 모달 타이틀
      newCate: {
        codeValue: '',
        codeName: '',
        cateName: '',
        cateCode: '',
        saltMasterIp: '',
        zabbixIp: '',
        repoIp: ''
      },
      newDatacenter: {
        crud: 'create',
        cateIdx: null,
        cateUpper: 0,
        cateName: '',
        cateKey: ''
      },

      columns: [
        { header: '코드 값', binding: 'cateName', keyPath: 'config.IP.codeValue', width: '*', isReadOnly: true, foldable: true }
      ]
    }
  }
}
</script>
<style lang="scss" scoped>
  .manage-category-modal {
    .cate-tree {
      max-height: 60vh;
      overflow: scroll;
    }
    .form-area {
      display: flex;
      justify-content: space-between;
      margin: $gap-s 0;
      padding: $gap-s $gap;
      background: $ticket-back-color;
      border-radius: $radius-m;
      > .form-item {
        flex: 1 1 70%;
        display: flex;
        align-items: center;
        &:not(:first-child) {margin-left: 50px;}
        > .form-title {min-width: 120px;}
        > .el-input {width: 100%;}
      }

    }
    .table-area {
      overflow-y: auto;
      max-height: 60vh;
      .network-category-tree {
        .cell-contents {
          display: flex;
          align-items: center;
          // flex-direction: column;
          > .edit-form {
            & + .edit-form {
              margin-left: $gap;
            }
            .form-title {
              margin-right: 5px;
            }
            .form-input {
              width: 250px;
            }
          }
        }

      }
    }
  }
</style>

<style lang="scss">
.create-category-modal { // 카테고리 추가시, 인풋박스
  .el-input.add-cate-input {
    > .el-input__inner {
      padding: 0 45px 0 15px;
    }
  }
}
</style>

<style lang="scss" scoped>
.manage-category-modal { // 카테고리 추가시, 인풋박스
  .cate-title {
    overflow: hidden;
    display: block;
    max-width: 300px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
