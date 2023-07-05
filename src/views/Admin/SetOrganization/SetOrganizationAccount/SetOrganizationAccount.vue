<!--
  * 파일명 : SetOrganizationAccount.vue
  * 파일 기능 : 관계사-조직 계정 다른 조직으로 이관 기능
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-02-22
  * License By Shinsegae I&C
  * 2021-02-22 add: 모든 조직도에 '신세계 그룹' rootParent' 설정
 -->

<template>
  <div class="set-organization-account">
    <div
      class="organ-contents"
      v-loading="loading"
    >
      <dashboard-panel
        class="body-panel -left"
        :title="$t('common.GRID.orgInfo')"
        :padding-top="0"
      >
        <template
          #header
        >
          <button
            v-if="connectJdbc"
            class="button"
            type="is-primary"
            @click="isOpenedExcelModal = true"
          >
            <!-- 미등록 자원 Excel 업로드 -->
            {{ $v('조직-계정 Excel 업로드') }}
          </button>
        </template>

        <div class="side-tree-area">
          <g-tree
            ref="startTree"
            :data="orgData"
            :view-line="true"
            @selected="selectOrg"
            use-deep-children
            :select-object.sync="selectedStartOrg"
            :root-parent="hasRootGroup"
            unique-key="groupIdx"
            :selectable-company="true"
          >
            <template #title="{ node }">
              <span v-if="node.groupUpper === 0">
                <span
                  v-if="node.isNew"
                  class="new-icon"
                />{{ node.groupName }}
              </span>
              <span v-else>
                {{ node.groupName }}&nbsp;
                ( {{ getDeepChildren(node.deepChildren, node) }} )

                <!-- {{ node.groupName }}&nbsp;
                ({{ node.groupUser ? node.groupUser.length : 0 }}) -->
              </span>
            </template>
          </g-tree>
        </div>
      </dashboard-panel>

      <div class="account-info-area">
        <dashboard-panel
          class="-mid"
          :title="selectedStartOrg? $t('admin.ORG.accInfo', { name: selectedStartOrg.groupName }) : $t('admin.ORG.selectAffOrg')"
        >
          <g-tab
            v-if="accTabData"
            class="info-tab"
            :data="accTabData"
            @click="closeInput"
          >
            <template #companyInfo>
              <div
                class="register-box"
                :class="{'__prefix-ci': isExistJustOnePrefixAndCI}"
              >
                <div
                  class="register-box-content__prefix-ci"
                  v-if="isExistJustOnePrefixAndCI"
                >
                  <span class="-is-prefix">
                    <span class="title">Prefix</span>
                    <span :class="{'input-warning': !selectedStartOrg.companyPrefix}">{{ companyPrefixDisplayValue }}</span>
                  </span>
                  <span class="-is-ci">
                    <span class="title">{{ $t('admin.ORG.onlyNameOfCI') }}</span>
                    <span :class="{'input-warning': !selectedStartOrg.companyCi}">{{ companyCiDisplayValue }}</span>
                  </span>
                </div>
                <div v-else>
                  {{ $t('admin.ORG.registPrefixAndCI') }}
                </div>
                <button
                  class="button"
                  type="is-primary"
                  @click="openPreCIMdl"
                  :disabled="!selectedStartOrg"
                >
                  Prefix,CI {{ $t( isExistJustOnePrefixAndCI? "common.BTN.modify": "common.BTN.enroll") }}
                </button>
              </div>
              <div
                v-if="selectedStartOrg.companyDomain && !domainInputMode"
                class="register-box -is-name"
              >
                <span class="title">
                  {{ $t('admin.ORG.domain') }}<span>{{ selectedStartOrg.companyDomain }}</span>
                </span>
                <i
                  class="mdi mdi-square-edit-outline"
                  @click="editDomain"
                />
              </div>
              <div
                v-else
              >
                <div
                  v-if="!domainInputMode"
                  class="register-box"
                >
                  <span>{{ $t('admin.ORG.PLACEHOLDER.regMail') }}</span>
                  <button
                    class="button"
                    type="is-primary"
                    @click="domainInputMode = true"
                    :disabled="!selectedStartOrg"
                  >
                    {{ $t('admin.ORG.regDomain') }}
                  </button>
                </div>
                <div
                  v-else
                  class="input-wrapper"
                >
                  <input
                    class="domain-input"
                    v-model="inputDomainName"
                    :placeholder="$t('admin.ORG.PLACEHOLDER.enterInclude', { item: '@' })"
                  >
                  <span
                    class="apply-btn"
                    :class="{ '-can-apply': inputDomainName !== '' }"
                    @click="applyDomain"
                  >
                    {{ $t('common.BTN.enroll') }}
                  </span>
                  <span
                    class="clear-icon"
                    @click="closeInput"
                  />
                </div>
              </div>
              <!-- ./ 도메인 -->

              <template
                v-if="packageType !== 'PL'"
              >
                <div
                  v-if="selectedStartOrg.middleManagerList"
                  class="mid-manager-grid"
                >
                  <div class="header">
                    <span>{{ $v('중간 관리자') }}</span>
                    <button
                      class="button"
                      type="is-primary"
                      @click="setMidManager"
                      :disabled="!selectedStartOrg"
                    >
                      {{ $v('중간 관리자 설정') }}
                    </button>
                  </div>
                  <cmp-grid
                    :item-source="selectedStartOrg.middleManagerList"
                    :columns="midMngrDataColumn"
                    :use-column-filter="false"
                  >
                    <template #managerType="props">
                      <span>{{ props.row.managerType === 0 ? $t('admin.ORG.main') : $t('admin.ORG.sub') }}</span>
                    </template>
                    <template #userId="props">
                      <span>{{ props.row.userId | maskingName }}</span>
                    </template>
                  </cmp-grid>
                </div>
                <div
                  v-else
                  class="register-box"
                >
                  <span>{{ $t('admin.ORG.PLACEHOLDER.regMiddleManager') }}</span>
                  <button
                    class="button"
                    type="is-primary"
                    @click="setMidManager"
                    :disabled="!selectedStartOrg"
                  >
                    {{ $v('중간 관리자 설정') }}
                  </button>
                </div>
              </template>
              <!-- ./ 중간 관리자 -->

              <div
                v-if="selectedStartOrg.operationManagerList"
                class="operator-grid"
              >
                <div class="header">
                  <span>{{ $v('운영 담당자') }}</span>
                  <button
                    class="button"
                    type="is-primary"
                    @click="openOperMdl"
                    :disabled="!selectedStartOrg"
                  >
                    {{ $v('운영 담당자 설정') }}
                  </button>
                </div>
                <cmp-grid
                  :item-source="selectedStartOrg.operationManagerList"
                  :columns="opratrDataColumn"
                  :use-column-filter="false"
                />
              </div>
              <div
                v-else
                class="register-box"
              >
                <span>{{ $t('admin.ORG.PLACEHOLDER.regOperManager') }}</span>
                <button
                  class="button"
                  type="is-primary"
                  @click="openOperMdl"
                  :disabled="!selectedStartOrg"
                >
                  {{ $t('운영 담당자 설정') }}
                </button>
              </div>
              <!-- ./ 운영 담당자 -->
            </template>

            <template #accountInfo>
              <total-count
                :total-count="totalResultCnt"
              />
              <cmp-grid
                :item-source="accountTableData"
                :columns="accountColumn"
                :init-custom-action="accountGridInit"
                :changing-page-reset="false"
                @checkedRowsData="checkedItems => checkedAccounts = checkedItems"
                header-checkbox
                @total-count="cnt => totalResultCnt = cnt"
              >
                <template #userId="props">
                  <span>{{ props.row.userId | maskingName }}</span>
                </template>
              </cmp-grid>
            </template>
          </g-tab>
        </dashboard-panel>
        <!-- <i class="db-arrow-icon" /> -->
      </div>

      <dashboard-panel
        class="body-panel -right"
        :title="$t('admin.ORG.transferOrg')"
        :padding-top="0"
      >
        <template #header>
          <button
            class="button"
            type="is-primary"
            @click="applyMove"
            :disabled="!selectedDestOrg"
          >
            <!-- v-if="checkedAccounts.length" -->
            {{ $t('common.BTN.ADMIN.transAcc') }}
          </button>
        </template>
        <div class="side-tree-area">
          <g-tree
            :data="destTreeData"
            :view-line="true"
            @selected="selectDestOrg"
            :select-object.sync="selectedDestOrg"
            :root-parent="hasRootGroup"
            unique-key="groupIdx"
            use-deep-children
          >
            <!-- v-if="checkedAccounts.length" -->
            <template #title="{ node }">
              <span :class="['org-name', {'is-delete': node.isDelete}]">
                {{ node.groupName }}
                <span v-if="node.groupUpper > 0">
                  &nbsp;
                  ({{ getDeepChildren(node.deepChildren, node) }})
                </span>
              </span>
            </template>
          </g-tree>
          <!-- <span
            class="empty-zone"
            v-else
          >{{ $t('admin.ORG.selectTransferProject') }}</span> -->
        </div>
      </dashboard-panel>

      <!-- 중간 관리자 등록 모달 -->
      <el-dialog
        v-loading="midModalLoading || midUpdateLoading"
        :visible.sync="isActiveMidMdl"
        :title="$v('중간 관리자 설정')"
        class="mid-manager-modal"
        width="670px"
        @close="closeMidMdl"
      >
        <section class="modal-body">
          <div class="top-area">
            <search-component
              class="top-area__left search-area"
              :placeholder="$t('common.PLACEHOLDER.searchEnter')"
              :clearable="false"
              @search="searchAccount"
            />
            <div class="top-area__left">
              <!-- <el-input
                class="search-input"
                :placeholder="$t('common.PLACEHOLDER.searchEnter')"
                v-model="searchText"
                @keypress.native.enter="searchAccount"
              />
              <div
                class="magnify-icon"
                @click="searchAccount"
              />
              <i
                class="mdi mdi-refresh reset-button"
                @click="clearSearchText"
              /> -->
            </div>
            <div class="top-area__right">
              <button
                class="button -modal-button"
                type="is-primary"
                :disabled="mainDisable"
                @click="setManager('main')"
              >
                {{ $t('common.PLACEHOLDER.selectName', { name: $t('admin.ORG.main') }) }}
              </button>
              <button
                class="button -modal-button"
                type="is-primary"
                @click="setManager('sub')"
                :disabled="!checkedMiddleManagerAccounts.length"
              >
                {{ $t('common.PLACEHOLDER.selectName', { name: $t('admin.ORG.sub') }) }}
              </button>
            </div>
          </div>
          <div
            v-if="selectedMidManagerList.length"
            class="tag-area"
          >
            <el-tag
              v-for="(tag, idx) in selectedMidManagerList"
              :key="idx"
              :closable="true"
              @close="deleteMidManager(tag.userId, tag.managerType)"
            >
              {{ tag.managerTypeKo }}<span class="divider" />{{ tag.userId | maskingName }} {{ ' ' + tag.userName }}
            </el-tag>
          </div>
          <div class="table-area">
            <cmp-grid
              ref="midMngrGrid"
              :columns="midMngrColumns"
              :item-source="account.list"
              @checkedRowsData="setCheckedRows"
              :header-checkbox="true"
              :use-column-filter="false"
            >
              <template #userId="props">
                <span>{{ props.row.userId | maskingName }}</span>
              </template>
            </cmp-grid>
          </div>
          <div
            class="pagination-wrap"
            v-if="account.list.length"
          >
            <el-pagination
              layout="prev, pager, next"
              :total="account.total"
              :current-page="account.current"
              :pager-count="accountsPagerCount"
              :page-size="accountsPerCount"
              @current-change="currentPageChange"
            />
          </div>
        </section>

        <section class="modal-footer">
          <div class="modal-button-area">
            <button
              class="button -modal-button"
              type="is-anti"
              @click="isActiveMidMdl = false"
            >
              {{ $t('common.BTN.cancel') }}
            </button>
            <button
              class="button -modal-button"
              @click="applyMidManager"
              type="is-primary"
              :disabled="!isChangedMidManager"
            >
              <!-- :disabled="isActiveBtn" -->
              {{ $t('common.BTN.save') }}
            </button>
          </div>
        </section>
      </el-dialog>
      <!-- /. 중간 관리자 등록 모달 -->

      <el-dialog
        :visible.sync="isActivePreCIMdl"
        :title="`Prefix, CI ${$t(isExistPrefixAndCI? 'common.BTN.modify': 'common.BTN.enroll')}`"
        width="400px"
        top="5vh"
        @close="isActivePreCIMdl = false"
        class="dialog-preci-container"
        v-loading="isUpdatePrefixCi"
      >
        <ul
          class="dialog-preci-list"
        >
          <li
            v-for="(col,index) in companySetColumn"
            :key="index"
            class="dialog-preci-list-item"
          >
            <span class="dialog-preci-list-item-label">
              {{ $t(col.keyPath) }}
            </span>
            <el-input
              v-model="col.value"
              @input="e=>inputSpaceNo(e,index)"
              :placeholder="$t(col.placehold)"
            />
          </li>
        </ul>
        <div class="horizontal-divider" />
        <section class="modal-footer">
          <div class="modal-button-area">
            <button
              class="button -modal-button"
              type="is-anti"
              @click="isActivePreCIMdl = false"
            >
              {{ $t('common.BTN.cancel') }}
            </button>
            <button
              :disabled="isEnableUpdateOfPrefixCI || !isNotUpdateOfPrefixCI"
              class="button -modal-button"
              @click="applyPrefixAndCI(companySetColumn[0].value, companySetColumn[1].value)"
              type="is-primary"
            >
              <!-- :disabled="isActiveBtn" -->
              {{ $t('common.BTN.confirm') }}
            </button>
          </div>
        </section>
      </el-dialog>
      <!-- prefix/ci 등록 및 수정 -->

      <!-- 운영 담당자 등록 모달 -->
      <el-dialog
        :title="$v('운영 담당자 설정')"
        :visible.sync="isActiveOperMdl"
        width="430px"
        top="30vh"
        class="opratr-rgstr-modal"
        @close="closeOperMdl"
      >
        <div class="title">
          <div>{{ $t('admin.ROLE.jobRole') }}</div>
          <div>{{ $t('admin.ROLE.chargeRole') }}</div>
        </div>
        <ul
          v-if="roleList.length"
          class="opratr-rgstr-list"
        >
          <li
            v-for="(role, idx) in roleList"
            :key="role.roleUpperIdx"
            class="opratr-rgstr-item"
          >
            <span class="opratr-rgstr-label">
              {{ `${role.roleUpperName} ${$t('admin.ORG.manager')}` }}
            </span>
            <el-select
              v-if="role.inner.length"
              class="dropdown-language"
              :popper-append-to-body="false"
              v-model="selectedOperator[idx]"
              :placeholder="$t('admin.ACCOUNT.selectRole')"
              @change="ifOpChanged(idx, role)"
            >
              <!-- @change="selectRole" -->
              <!-- :disabled="data.type!=='create' && data.inCommon" -->
              <el-option
                v-for="item in role.inner"
                :key="item.roleIdx"
                :label="item.roleName"
                :value="item.roleIdx"
              />
            </el-select>
            <el-select
              v-else
              v-model="noRoleMsg"
              :disabled="true"
            />
          </li>
        </ul>
        <div class="divider" />
        <div class="modal-button-area">
          <button
            class="button -modal-button"
            type="is-anti"
            @click.stop="isActiveOperMdl = false"
          >
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button -modal-button"
            type="is-primary"
            @click.stop="applyOperator"
            :disabled="!isConfirmValid"
          >
            {{ $t('common.BTN.complete') }}
          </button>
        </div>
      </el-dialog>
      <!-- /. 운영 담당자 등록 모달 -->

      <!-- 엑셀 업로드 모달 -->
      <el-dialog
        :visible.sync="isOpenedExcelModal"
        :title="$v('조직-계정 Excel 업로드')"
        @close="closeExcelModal"
        width="1000px"
      >
        <modal-excel-upload-organization-account
          ref="unregistExcelModal"
          @close="closeExcelModal"
        />
        <!--
          <unregister-resource-list
          ref="unregistExcelModal"
          @close="closeExcelModal"
          :other-trans-basket-data="otherTransBasketData"
        /> -->
      </el-dialog>
    </div>
  </div>
</template>

<script>
import API, { GTree, DashboardPanel, treeFindChild } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import { cloneDeep, clone, isEqual } from 'lodash'
import ModalExcelUploadOrganizationAccount from './ModalExcelUploadOrganizationAccount.vue'

export default {
  name: 'SetOrganizationAccount',
  watch: {
    treeData: {
      deep: true,
      handler (newVal) {
        this.setTreeData(newVal)
      }
    },
    selectedStartOrg () {
      this.closeInput()
    },
    isActiveOperMdl: {
      handler (newVal) {
        this.isOpChanged = false
        this.firstSelection = cloneDeep(this.selectedOperator)
      }
    }
  },
  async mounted () {
    try {
      this.loading = true
      // JDBC 연동 여부
      const hr = await API.config.getHrJdbc(0)
      if (!hr?.length) this.connectJdbc = true

      await this.getGroupTree()
      this.sortTreeData(this.treeData)

      // 자원 생성 시, prefix/ci 정보 없을 때 처리를 위함
      if (this.$route.query.companyIdx) {
        const findCompanyIdx = this.$route.query.companyIdx
        const company = this.orgData.find(company => company.groupIdx === findCompanyIdx)

        if (company) {
          this.selectOrg(company)
        }
      }
    } catch (error) {
      return error
    } finally {
      this.loading = false
    }
  },

  computed: {
    ...mapState({
      packageType: state => state.auth.packageType,
      rootGroup: state => state.common.rootGroup
    }),
    hasRootGroup () {
      return this.rootGroup ? { groupName: this.rootGroup, groupUpper: 0, isRootParent: true } : undefined
    },
    // isActiveBtn () {
    //   return !(this.selectedMidManagerList.length > 0)
    // },
    isEnableUpdateOfPrefixCI () {
      return !this.validateVal(this.companySetColumn[0].value) || !this.validateVal(this.companySetColumn[1].value)
    },
    isNotUpdateOfPrefixCI () {
      return this.selectedStartOrg.companyPrefix !== this.companySetColumn[0].value || this.selectedStartOrg.companyCi !== this.companySetColumn[1].value
    },
    // 둘 중 하나라도 존재한다면
    isExistJustOnePrefixAndCI () {
      if (this.validateVal(this.selectedStartOrg.companyPrefix) || this.validateVal(this.selectedStartOrg.companyCi)) {
        return true
      } else { return false }
    },
    // prefix와CI의 기존값 모두 존재하면 true 그렇지 않으면 false
    isExistPrefixAndCI () {
      if (this.validateVal(this.selectedStartOrg?.companyPrefix) && this.validateVal(this.selectedStartOrg?.companyCi)) {
        return true
      } else return false
    },
    companyPrefixDisplayValue () {
      if (this.selectedStartOrg.companyPrefix) return this.selectedStartOrg.companyPrefix
      else return this.$t('admin.ORG.registPrefix')
    },
    companyCiDisplayValue () {
      if (this.selectedStartOrg.companyCi) return this.selectedStartOrg.companyCi
      else return this.$t('admin.ORG.registCI')
    },
    mainDisable () {
      if (this.selectedMidManagerList.length) {
        return !!(this.selectedMidManagerList.find(mngr => mngr.managerType === 0))
      } else {
        // [정] 중간 관리자 1개 초과로 선택된 경우 "정 선택" 버튼 비활성화
        return this.checkedMiddleManagerAccounts.length > 1
      }
    },
    // 중간 관리자 변경 유무
    isChangedMidManager () {
      const beforeMngUserIdx = this.selectedStartOrg?.middleManagerList?.map(mnger => {
        return {
          managerType: mnger.managerType,
          userIdx: mnger.userIdx
        }
      }) || []
      const afterMngUserIdx = this.selectedMidManagerList.map(mnger => {
        return {
          managerType: mnger.managerType,
          userIdx: mnger.userIdx
        }
      }) || []

      return !isEqual(beforeMngUserIdx?.sort((a, b) => a.userIdx - b.userIdx),
       afterMngUserIdx?.sort((a, b) => a.userIdx - b.userIdx))
    },
    isConfirmValid () {
      const notNull = this.selectedOperator.length !== undefined
      const isDataChanged = this.isOpChanged
      console.log(notNull, isDataChanged)
      return (notNull && isDataChanged)
    }
  },
  components: {
    'g-tree': GTree,
    'dashboard-panel': DashboardPanel,
    ModalExcelUploadOrganizationAccount
  },
  methods: {
    ifOpChanged (combo, origin) {
      this.$nextTick(() => {
        // if (origin.inner[combo].roleIdx === this.selectedOperator[combo]) this.isOpChanged = false
        if (JSON.stringify(this.firstSelection) === JSON.stringify(this.selectedOperator)) this.isOpChanged = false
        else this.isOpChanged = true
      })
      this.$forceUpdate()
    },
    /**
     * 현재 값이 공백인지 검사합니다.
     * @param [val] 값
     **/
    validateVal (val) {
      if (val === undefined || val === null || val === '') {
        console.log('없어요 값이')
        return false
      } else return true
    },
    /**
     * Prefix / CI 의 첫 번째 인풋으로 들어오는 공백을 막습니다.
     * @param [e] event
     * @param [index] not require
     **/
    inputSpaceNo (e, index) {
      if (this.companySetColumn[index].value === ' ') {
        this.companySetColumn[index].value = this.companySetColumn[index].value.replace(' ', '')
        return false
      }
    },
    /**
     * 운영관리자 설정 버튼 클릭 시 실행
     */
    openOperMdl () {
      this.roleList.forEach(role => {
        if (role.inner.length) {
          let selectedManager = {}
          role.inner.forEach(item => {
            selectedManager = this.selectedStartOrg?.operationManagerList?.find(manager => {
              return manager.roleIdx === item.roleIdx
            })
            console.log(selectedManager)
            if (selectedManager) this.selectedOperator.push(selectedManager.roleIdx)
          })
        }
      })
      console.log('@openOperMdl', this.selectedOperator)
      this.isActiveOperMdl = true
    },
    /**
     * Prefix / CI 를 등록 수정하는 모달을 엽니다.
     **/
    openPreCIMdl () {
      this.companySetColumn[0].value = this.selectedStartOrg.companyPrefix
      this.companySetColumn[1].value = this.selectedStartOrg.companyCi

      console.log('@openPreCIMdl')
      this.isActivePreCIMdl = true
    },

    /**
     * 엑셀 업로드
     */
    async onChangeExcelUploadFile (file) {
      try {
        if (file.size > (1024 * 1024 * 100)) { // 100Mb 이하 파일만 업로드 가능
          return this.$alert(this.$t('common.ALERT.PROJECT.059', { size: '100Mb' }))
        }

        this.isLoadingUploadExcel = true

        const formData = new FormData()
        formData.append('file', file.raw)

        await API.iam.uploadExcelAccount(formData)
        this.$alert(this.$t('common.ALERT.BASE.069'))
        // 데이터 다시 가져오기
        this.loading = true
        await this.getGroupTree()
        this.sortTreeData(this.treeData)
        this.loading = false
      } catch (error) {
        console.log(error)
        this.$alert(this.$t('common.ALERT.BASE.070'))
      } finally {
        this.$refs.excelUploadRef.clearFiles()
        this.isLoadingUploadExcel = false
      }
    },
    /**
     * 트리 데이터 가져옴
     */
    async getGroupTree () {
      this.accountTableData = []
      this.checkedAccounts = []
      const response = await API.iam.getGroupManageTree({ user: true })
      if (response) {
        this.treeData = response.filter(tree => !['common', 'infra', 'unknown'].includes(tree.companyCode))
      }
    },
    /**
     * 관계사명에 따라 sorting
     */
    sortTreeData (treeData) {
      const sortList = (list) => {
        return list.sort((a, b) => {
          if (a.groupName > b.groupName) return 1
          else if (a.groupName < b.groupName) return -1
          else return 0
        })
      }
      var newArr = []
      var koArr = []
      var enArr = []
      var spcArr = []
      var checkKor = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/ // 한글
      var checkEng = /[a-zA-Z]/ // 영문
      var checkSpc = /[~!@#$%^&*()_+|<>?:{}]/ // 특수문자
      treeData.forEach(data => {
        const whetherIsNew = this.packageType === 'PL' ? (!data.companyPrefix || !data.companyCi || !data.companyDomain || !data.operationManagerList) : (!data.companyPrefix || !data.companyCi || !data.companyDomain || !data.middleManagerList || !data.operationManagerList)

        if (whetherIsNew) {
          newArr.push({
            ...data,
            isNew: true
          })
        } else {
          if (checkKor.test(data.groupName[0])) koArr.push(data)
          if (checkEng.test(data.groupName[0])) enArr.push(data)
          if (checkSpc.test(data.groupName[0])) spcArr.push(data)
        }
      })
      newArr = sortList(newArr)
      koArr = sortList(koArr)
      enArr = sortList(enArr)
      spcArr = sortList(spcArr)

      const sortedData = newArr.concat(koArr).concat(enArr).concat(spcArr)
      console.log('@sortTreeData: sortedData:', sortedData)
      this.setTreeData(sortedData)
    },
    /**
     * 트리 데이터 세팅
     */
    setTreeData (treeData) {
      this.orgData = cloneDeep(treeData)
      this.destTreeData = cloneDeep(treeData)

      this.$nextTick(() => {
        if (this.selectedStartOrg && this.selectedDestOrg) {
          this.selectOrg(this.selectedStartOrg, true)
          this.selectDestOrg(this.selectedDestOrg)
        }
      })
    },
    /**
     * @function - 선택된 row 저장
     */
    saveSelectedRow (selected) {
      this.selectedRow = selected
    },
    accountGridInit (grid) {
      this.accountGrid = grid
    },
    specialGridInit (grid) {
      this.specialGrid = grid
    },
    getDeepChildren (groups, group) {
      const groupsUsers = groups?.map(item => item.groupUser.length)
      const groupUsers = group?.groupUser?.length

      const teamCnt = groups?.length ? `${groups?.length} ${this.$t('main.DASHBOARD.count')} / ` : ''
      const childrenGrpUsr = groupsUsers.length ? groupsUsers.reduce((acc, crr) => acc + crr) : 0
      const grpUsrCnt = childrenGrpUsr + (groupUsers || 0)
      return `${teamCnt}${grpUsrCnt} ${this.$t('admin.ORG.countPerson')}`
    },
    /**
     * 관계사 및 조직을 선택했을 때 이벤트 입니다.
     * @param {GroupRow} param 선택된 조직의 정보
     * @param {boolean} autoSelect 자동으로 채워질 때 true
     */
    async selectOrg (param, autoSelect = false) {
      if (param.id === 'common') return

      console.log('@selectOrg: 선택 조직: ', param)
      this.selectedStartOrg = clone(param)
      if (this.selectedStartOrg.middleManagerList) {
        this.selectedStartOrg.middleManagerList
          .sort(this.sortByASCII) // 1.한, 2.영
          .sort(this.orderByRole) // 역할 순서 1.정 2.부
      }
      this.accountTableData = autoSelect ? treeFindChild(this.treeData, 'groupIdx', param.groupIdx).groupUser : param.groupUser

      if (param.groupUpper === 0) {
        this.accTabData = [
          { field: 'companyInfo', name: this.$t('admin.ORG.affInfo') }
        ]
        await this.getCompanyAccountList()
        this.getRoleList()
      } else {
        this.accTabData = [
          { field: 'accountInfo', name: this.$t('admin.ORG.accInfoRaw') }
        ]
      }
    },
    selectDestOrg (node) {
      if (node.groupUpper === 0) return
      this.selectedDestOrg = clone(node)
    },
    /**
     * 역할 리스트 세팅
     */
    async getRoleList () {
      const test = await API.iam.getRoleManageList({ roleIdx: 0 })
      console.log(test)
      const roleRes = await API.iam.getTaskRoleList()
      const companyRoleRes = await API.iam.getGroupRoleList({ companyIdx: this.selectedStartOrg.groupIdx })
      if (roleRes) {
        this.allRoleList = companyRoleRes
        const roleList = roleRes.reduce((acc, role) => {
          const findItem = acc.find(item => item.roleUpperIdx === role.roleIdx)
          const findComRoleItem = companyRoleRes.filter(item => item.roleUpperIdx === role.roleIdx)
          if (findItem) {
            if (!findItem.inner) {
              if (findComRoleItem.length) findItem.inner = [...findComRoleItem]
            } else {
              if (findComRoleItem.length) findItem.inner = [...findItem.inner, ...findComRoleItem]
            }
          } else {
            acc.push({
              roleUpperIdx: role.roleIdx,
              roleUpperName: role.roleName,
              inner: findComRoleItem.length ? findComRoleItem : []
            })
          }
          return acc
        }, [])
        console.log('@getRoleList: roleList:', roleList)
        this.roleList = roleList
      }
    },
    /**
     * 중간 관리자 모달: 계정 검색 시 실행
     */
    async searchAccount (text) {
      this.account.current = 1
      this.searchText = text
      await this.getCompanyAccountList()
    },
    /**
     * 중간 관리자 모달: 계정 검색 초기화
     */
    async clearSearchText () {
      this.searchText = ''
      this.account.current = 1
      await this.getCompanyAccountList()
    },
    /**
     * 관계사-조직에 등록되어 있는 계정 가져오기
     */
    async getCompanyAccountList () {
      // const foundedGroup = this.orgData.find(group => group.groupIdx === groupIdx)
      // console.log('@getCompanyAccountList', foundedGroup)

      // let result = []
      // const getDeepGroupUser = (group) => {
      //   if (group.groupUser.length > 0) {
      //     result = result.concat(group.groupUser)
      //   }
      //   if (group.children.length > 0) {
      //     group.children.forEach(item => {
      //       getDeepGroupUser(item)
      //     })
      //   }
      //   return result
      // }
      // let lists = getDeepGroupUser(foundedGroup)
      // lists = lists.sort((a, b) => {
      //   if (a.userId > b.userId) return 1
      //   else if (a.userId < b.userId) return -1
      //   else return 0
      // })
      // console.log('this.account.list:', lists)
      // this.account.list = lists

      try {
        if (this.midModalLoading) return
        this.midModalLoading = true

        const res = await API.iam.getUserPage({
          perPage: this.accountsPerCount,
          nowPage: this.account.current,
          userKeyword: this.searchText,
          groupIdx: this.selectedStartOrg.groupIdx
        })

        this.account.list = this.settingSelectedAccount(res.userList)
        this.account.total = res.totalCount
        console.log('@getCompanyAccountList: 중간관리자 선택 대상 계정 정보:', res)
      } catch (error) {
        this.midModalLoading = false
        console.error(error)
      } finally {
        this.midModalLoading = false
      }
    },
    /**
     * 중간관리자 선택된 계정 disable 처리 위해 한번 돌림.
     */
    settingSelectedAccount (userList) {
      const checkedAccountsUserId = this.checkedMiddleManagerAccounts.map(user => user.userId)

      for (let j = 0; j < userList.length; j++) {
        for (let i = 0; i < this.selectedMidManagerList.length; i++) {
          if (userList[j].userId === this.selectedMidManagerList[i].userId) { userList[j].disable = true }
          if (checkedAccountsUserId.includes(userList[j].userId)) userList[j].checked = true
        }
      }
      return userList
    },
    /**
     * [계정 이관]
     */
    applyMove () {
      // this.$confirm(`${this.selectedOrg.groupName}에서 ${this.selectedDest.groupName}으로 계정을 이관하시겠습니까?`, '알림', {
      if (this.selectedStartOrg?.groupIdx === this.selectedDestOrg?.groupIdx) {
        this.$alert(this.$t('common.ALERT.ORG.003'))
        return
      }
      if (!this.checkedAccounts?.length) return this.$alert(this.$t('admin.ACCOUNT.selectTransferUser'))
      this.$confirm(this.$t('common.CONFIRM.ACCOUNT.001', {
        A: this.selectedStartOrg.groupName,
        B: this.selectedDestOrg.groupName
      }), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        const param = {
          destGroupIdx: this.selectedDestOrg.groupIdx,
          userIdList: this.checkedAccounts.map(account => {
            return account.userId
          })
        }
        const response = await API.iam.userMove(param)
        if (response) {
          this.$alert(this.$t('common.ALERT.ACCOUNT.040'))
          await this.getGroupTree()
          this.sortTreeData(this.treeData)
        } else {
          this.$alert(this.$t('common.ALERT.ACCOUNT.041'))
        }
      }).catch(() => {
        return false
      })
    },
    /**
     * 도메인 입력 모드 해제
     */
    closeInput () {
      this.inputDomainName = ''
      this.domainInputMode = false
    },
    /**
     * 도메인 등록
     */
    applyDomain () {
      if (this.inputDomainName === '') return

      if (this.inputDomainName.indexOf('@') < 0) {
        this.$alert(this.$t('common.ALERT.ORG.024'), '', {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
        return false
      }
      this.applyData('domain', this.inputDomainName)
    },
    /**
     * 중간관리자 등록
     */
    applyMidManager () {
      console.log('@applyMidManager', this.selectedMidManagerList)
      // if (this.selectedMidManagerList.length) {
      this.applyData('midManager', this.selectedMidManagerList)
      // }
    },
    /**
     * 운영담당자 등록
     */
    applyOperator () {
      if (!this.selectedOperator.length) {
        this.$alert(this.$t('common.ALERT.ORG.025'))
        return
      }
      const operatorData = this.selectedOperator.reduce((acc, idx) => {
        const foundedRole = this.allRoleList.find(role => role.roleIdx === idx)
        acc.push({
          groupIdx: this.selectedStartOrg.groupIdx,
          roleIdx: foundedRole.roleIdx,
          roleName: foundedRole.roleName,
          upperRoleIdx: foundedRole.roleUpperIdx
        })
        return acc
      }, [])
      console.log('@applyOperator', operatorData)
      this.applyData('operator', operatorData)
      this.isActiveOperMdl = false
    },
    /** Prefix or CI 등록
     * @param [prefix]
     * @param [ciName]
     */
    async applyPrefixAndCI (prefix, ciName) {
      try {
        this.isUpdatePrefixCi = true

        const trimPrefix = prefix?.trim()
        const trimCi = ciName?.trim()

        this.companySetColumn[0].value = trimPrefix
        this.companySetColumn[1].value = trimCi

        const params = {
          prefix: trimPrefix,
          ciName: trimCi
        }
        // }
        if (this.selectedStartOrg.companyPrefix !== prefix || this.selectedStartOrg.companyCi !== ciName) { await this.applyData('prefixAndCI', params) }
      } catch (err) {
        console.log(err)
        throw err
      } finally {
        this.isUpdatePrefixCi = false
      }
    },
    /**
     * 도메인 or 중간관리자 or 운영담당자 데이터 등록
     */
    async applyData (type, data) {
      console.log('@applyData: selectedStartOrg:', this.selectedStartOrg)

      const companyDomain = type === 'domain' ? data : this.selectedStartOrg.companyDomain ? this.selectedStartOrg.companyDomain : null
      const middleManagerList = type === 'midManager' ? data : this.selectedStartOrg.middleManagerList ? this.selectedStartOrg.middleManagerList : null
      const operationManagerList = type === 'operator' ? data : this.selectedStartOrg.operationManagerList ? this.selectedStartOrg.operationManagerList : null
      const companyCi = type === 'prefixAndCI' ? data.ciName : this.selectedStartOrg.companyCi ? this.selectedStartOrg.companyCi : null
      const companyPrefix = type === 'prefixAndCI' ? data.prefix : this.selectedStartOrg.companyPrefix ? this.selectedStartOrg.companyPrefix : null
      let message =
        type === 'domain' ? this.$t('common.ALERT.ORG.026')
          : type === 'prefixAndCI' ? this.$t('common.ALERT.ORG.035')
            : type === 'midManager' ? this.$t('common.ALERT.ORG.033')
              : this.$t('common.ALERT.ORG.028')

      // Prefix/CI 수정시 message 변경
      if (message === this.$t('common.ALERT.ORG.035')) {
        message = this.$t('common.ALERT.ORG.036')
      }
      // 운영 담당자 수정시 message 변경
      if (message === this.$t('common.ALERT.ORG.028')) {
        message = this.$t('common.ALERT.ORG.038')
      }

      const param = {
        groupIdx: this.selectedStartOrg.groupIdx,
        groupName: this.selectedStartOrg.groupName,
        companyCode: this.selectedStartOrg.companyCode,
        companyCi: companyCi,
        companyPrefix: companyPrefix,
        groupUpper: this.selectedStartOrg.groupUpper,
        companyIdx: this.selectedStartOrg.companyIdx,
        companyDomain: companyDomain,
        middleManagerList: middleManagerList,
        operationManagerList: operationManagerList
      }
      console.log('param:', param)

      // 중간 관리자 등록인데 변경된 값 없음
      if (type === 'midManager') {
        if (isEqual(this.originMiddleManagerList, middleManagerList)) {
          this.isActiveMidMdl = false
          return
        }
      }

      try {
        this.midUpdateLoading = true
        const response = await API.iam.updateGroup(param)
        if (response) {
          this.$alert(message, {
            callback: async () => {
              this.loading = true
              this.midModalLoading = true
              this.isActivePreCIMdl = false
              await this.getGroupTree() // 트리 재조회
              this.sortTreeData(this.treeData) // 트리 데이터 재정렬
              this.$refs.startTree.setInitSelectItem(this.selectedStartOrg) // 기존 선택 조직 재선택 상태로 복귀

              // 기존 선택 조직을 업데이트 된 선택 조직 데이터로 바꿔치기
              this.selectedStartOrg = this.orgData.find(item => item.groupName === this.selectedStartOrg.groupName)
              this.selectOrg(this.selectedStartOrg)
              this.domainInputMode = false
              this.isActiveMidMdl = false
              this.loading = false
              this.midModalLoading = false
            }
          })
        }
      } catch (error) {
        if (error.data.code === 'IAM070') {
          this.$alert(this.$t('common.ALERT.ORG.029'))
        } else if (error.data.code === 'IAM300') {
          this.$alert(this.$t('common.ALERT.ORG.037')) // 이미 사용 중인 도메인입니다.
        } else if (error.data.code === 'IAM303') {
          this.$alert(this.$t('common.ALERT.ORG.030'))
        } else if (error.data.code === 'IAM027') {
          this.$alert(this.$t('common.ALERT.ORG.014'))
        } else if (error.data.code === 'IAM028') {
          this.$alert(this.$t('common.ALERT.ORG.015'))
        } else {
          this.$alert(this.$t('common.ALERT.BASE.033'))
        }
      } finally { this.midUpdateLoading = false }
    },
    /**
     * 도메인 수정
     */
    editDomain () {
      this.inputDomainName = this.selectedStartOrg.companyDomain
      this.domainInputMode = true
    },
    /**
     * 운영담당자 등록 모달 닫힘 시 실행
     */
    closeOperMdl () {
      this.selectedOperator = []
    },
    /**
     * 중간관리자 등록 모달 닫힘 시 실행
     */
    closeMidMdl () {
      this.clearSearchText()
      this.$refs.midMngrGrid.checkedRowData = []
      this.account.list.forEach(item => {
        item.checked = false
        item.disable = false
      })
      this.selectedMidManagerList = []
      this.originMiddleManagerList = []
      // this.mainDisable = false
    },
    /**
     * 중간관리자 선택 리스트 체크 시 실행
     */
    setCheckedRows (checkedRows) {
      this.checkedMiddleManagerAccounts = checkedRows
      // if (checkedRows.length > 1) this.$alert(this.$t('common.ALERT.ORG.031'))
    },
    /**
     * 중간 관리자 설정 버튼 클릭 시 실행
     */
    setMidManager (e, midManagerList = this.selectedStartOrg.middleManagerList) {
      console.log(midManagerList)
      this.isActiveMidMdl = true
      this.maxLength()
      this.$nextTick(() => {
        if (midManagerList) {
          // 기존 등록된 중간관리자 세팅
          midManagerList.forEach(mngr => {
            const typeKo = mngr.managerType === 0 ? this.$t('admin.ORG.main') : this.$t('admin.ORG.sub')
            this.selectedMidManagerList.push({
              groupIdx: this.selectedStartOrg.groupIdx,
              managerTypeKo: typeKo,
              managerType: mngr.managerType,
              userId: mngr.userId,
              userIdx: mngr.userIdx,
              userName: mngr.userName
            })

            this.$refs.midMngrGrid.grid.beginUpdate()
            this.account.list.forEach(item => {
              // 선택된 항목 체크박스 disable 처리
              if (item.userId === mngr.userId) item.disable = true
            })
            this.$refs.midMngrGrid.grid.endUpdate()
          })
          console.log('기존 등록된 중간관리자 리스트:', this.selectedMidManagerList, this.account.list)
          this.originMiddleManagerList = [...this.selectedMidManagerList]
        }
      })
    },
    /**
     * 중간관리자 선택 버튼 클릭 시 실행
     */
    setManager (type) {
      console.log('@setManager', this.$refs.midMngrGrid, this.account.list)
      const checkedRows = this.$refs.midMngrGrid.checkedRowData
      console.log('checkedRows:', checkedRows)
      const typeKo = type === 'main' ? this.$t('admin.ORG.main') : this.$t('admin.ORG.sub')
      const typeNum = type === 'main' ? 0 : 1
      const text = type === 'main' && this.$i18n.locale === 'ko' ? '으' : ''
      if (!checkedRows.length) {
        this.$alert(this.$t('common.ALERT.ORG.032', { text: typeKo + text }))
      } else {
        this.selectedMidManagerList.push(...this.checkedMiddleManagerAccounts.map(account => ({
          groupIdx: this.selectedStartOrg.groupIdx,
          managerTypeKo: typeKo,
          managerType: typeNum,
          userId: account.userId,
          userIdx: account.userIdx,
          userName: account.userName
        })))
        console.log('선택된 중간관리자 리스트:', this.selectedMidManagerList)

        this.$refs.midMngrGrid.grid.beginUpdate()
        this.checkedMiddleManagerAccounts.forEach(account => {
          const item = this.account.list.find(innerAccount => innerAccount.userId === account.userId)
          if (item) item.disable = true
        })
        this.account.list.forEach(item => {
          // 전체 체크 해제
          item.checked = false
          // 선택된 항목 체크박스 disable 처리
          // if (item.userId === checkedRows[0].userId) item.disable = true
        })
        // if (typeNum === 0) this.mainDisable = true
        // checkedRowData 해제
        this.$refs.midMngrGrid.checkedRowData = []
        this.$refs.midMngrGrid.grid.endUpdate()
      }
    },
    /**
    * 중간관리자 팝업 사번/이름 50자 이상 말줄임표
    */
    maxLength () {
      const maxlength = 50
      this.account.list.map(item => {
        let strId = item.userId
        let strName = item.userName
        console.log(strName)
        if (strId.length >= maxlength) {
          strId = strId.substr(0, maxlength - 1) + '...'
        }
        if (strName.length >= maxlength) {
          strName = strName.substr(0, maxlength - 1) + '...'
        }
        item.userId = strId
        item.userName = strName
      })
    },
    /**
     * 중간관리자 태그 삭제
     */
    deleteMidManager (userId, type) {
      console.log('@deleteMidManager', userId, type)
      const index = this.selectedMidManagerList.findIndex(item => item.userId === userId)
      if (index > -1) {
        // 해당 태그 삭제
        this.selectedMidManagerList.splice(index, 1)
        this.$refs.midMngrGrid.grid.beginUpdate()
        // checkedRowData 처리 ? 자동으로 안됨 ?
        this.$refs.midMngrGrid.checkedRowData.splice(this.$refs.midMngrGrid.checkedRowData.findIndex(data => data.userId === userId), 1)
        // disable 처리 원복
        this.account.list.forEach(item => {
          if (item.userId === userId) item.disable = false
        })
        // if (type === 0) this.mainDisable = false
        this.$refs.midMngrGrid.grid.endUpdate()
      }
    },
    /**
     * 페이지 변경 시 실행
     */
    async currentPageChange (current) {
      this.account.current = current
      await this.getCompanyAccountList()
    },
    orderByRole (a, b) { // 역할 기준[ 1. 정 2. 부 ]
      if (a.managerType < b.managerType) return -1
      else return 1
    },
    sortByASCII (a, b) {
      return a.userName?.localeCompare(b.userName)
    },

    /** 엑셀 업로드
     *  조직-계정 엑셀 업로드 모달
     *
     */
    closeExcelModal () {
      console.log('@closeExcelModal')
      this.isOpenedExcelModal = false
    }
  },
  data (root) {
    return {
      // 중간 관리자 등록 모달 오픈시 현재 등록된 중간 관리자 리스트를 복사해놓습니다.
      // 중간 관리자 등록 모달에서 확인 버튼을 눌러 등록시 해당 리스트와 추가된 중간 관리자
      // 배열을 비교해 변경된 것이 있으면 API 요청하고 변경된 내용이 없으면 그냥 모달을 닫습니다.
      originMiddleManagerList: [],
      isLoadingUploadExcel: false, // 엑셀 로딩 여부
      orgData: [], // 왼쪽 트리 데이터
      destTreeData: [], // 오른쪽 트리 데이터
      treeState: false, // 트리 folding 상태
      selectedStartOrg: null, // 왼쪽 선택 조직
      selectedDestOrg: null, // 오른쪽 선택 조직
      isOpenedExcelModal: false,

      checkedAccounts: [], // 체크된 계정
      checkedMiddleManagerAccounts: [], // 중간 관리자 등록 모달에서 체크된 계정

      // 계정 그리드 데이터
      accountColumn: [
        { header: '사번', binding: 'userId', width: '*', isReadOnly: true, format: 'd*', align: 'left', keyPath: 'common.GRID.pressure', customHtml: true },
        { header: '이름', binding: 'userName', width: '*', isReadOnly: true, keyPath: 'common.REGCON.name' }
        // { header: '이메일', binding: 'userEmail', width: '*', isReadOnly: true },
        // { header: '전화번호', binding: 'userPhone', width: '*', isReadOnly: true },
      ],
      // 관계사 Prefix,CI 데이터
      companySetColumn: [
        { name: 'Prefix', value: null, keyPath: 'admin.ORG.companyPrefix', placehold: 'admin.ORG.inputPrefix' },
        { name: 'CI', value: null, keyPath: 'admin.ORG.companyCiName', placehold: 'admin.ORG.inputCi' }
      ],
      accountTableData: [],
      accTabData: null,
      loading: false,
      treeData: null,
      totalResultCnt: 0,
      inputDomainName: '',
      domainInputMode: false,
      midMngrDataColumn: [
        { header: '역할', binding: 'managerType', width: '*', isReadOnly: true, keyPath: 'admin.ROLE.role', customHtml: true },
        { header: '사번', binding: 'userId', width: '*', isReadOnly: true, format: 'd*', keyPath: 'common.GRID.pressure', customHtml: true },
        { header: '이름', binding: 'userName', width: '*', isReadOnly: true, keyPath: 'common.REGCON.name' }
      ],
      opratrDataColumn: [
        { header: '업무 역할', binding: 'upperRoleName', width: '*', isReadOnly: true, keyPath: 'admin.ROLE.jobRole' },
        { header: '담당 역할', binding: 'roleName', width: '*', isReadOnly: true, keyPath: 'admin.ROLE.chargeRole' }
      ],
      allRoleList: [], // 역할 리스트
      roleList: [], // 가공된 역할 리스트
      selectedOperator: [], // 선택된 운영담당자 리스트
      isActiveMidMdl: false,
      isActiveOperMdl: false,
      isActivePreCIMdl: false,
      midMngrColumns: [ // 중간관리자 출력 그리드 컬럼
        { binding: 'userId', header: '사번', customHtml: true, keyPath: 'common.GRID.pressure' },
        { binding: 'userName', header: '이름', keyPath: 'common.MODAL.name' }
      ],
      account: {
        list: [], // 관계사-조직 내 AD 계정 리스트
        total: 0,
        current: 1
      },
      accountsPagerCount: 5,
      accountsPerCount: 5,
      searchText: '',
      midModalLoading: false,
      midUpdateLoading: false,
      selectedMidManagerList: [], // 선택된 중간관리자 리스트,
      // mainDisable: false, // 정 선택 disabled
      connectJdbc: false,
      noRoleMsg: root.$t('admin.ORG.PLACEHOLDER.noManager'),

      isUpdatePrefixCi: false, // 로딩: 관계사 prefix/ci 업데이트
      firstSelection: [],
      isOpChanged: false
    }
  }

}
</script>

<style lang="scss" scpoed>
  .set-organization-account {
    .organ-contents {
      display: flex;
      align-items: flex-start;
      > .body-panel {
        // flex: 1 1 100%;
        &.-left {
           width: 30vw;
          .side-tree-area {
            .new-icon {
              display: inline-block;
              background: url('../../../../assets/images/icon-new.svg') no-repeat;
              width: 16px;
              height: 16px;
              margin-right: 5px;
              position: relative;
              top: 3px;
            }
          }
          .set-organization-grid {
            position: relative;
          }
          .exc-up-btn {
            > div {
              display: flex;
              .upload-icon {
                background: url('../../../../assets/images/icon-upload.svg') no-repeat;
                width: 17px;
                height: 17px;
                margin-left: 6px;
                position: relative;
                top: 6px;
              }
            }
          }
        }
        &.-right {
          width: 30vw;
        }
      }
      > .account-info-area {
        display: flex;
        padding-left: $gap-m;
        padding-right: $gap-m;
        width: 40vw;
        overflow: hidden;
        .-mid {
          width: 100%;
        }
        .panel-body {
          padding-top: 0;
          border-top: 0;
          .info-tab {
            .tab-contents-area {
              .register-box {
                min-height: 60px;
                width: 100%;
                padding: 14px 20px;
                margin-bottom: 15px;
                border: 1px solid #3D435E;
                box-sizing: border-box;
                border-radius: 3px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                .button {
                  /* width: 130px; */
                  min-width: 130px;
                  max-width: 180px;
                }
                &.__prefix-ci {
                  background: rgba(42, 45, 68, 0.6);
                  .register-box-content__prefix-ci{
                    padding: 0px;
                    width: 80%;
                    .-is-prefix, .-is-ci {
                      display: inline-flex;
                      span.title {
                        display: inline-block;
                        width: 80px;
                        line-height:1.6;
                        height: 100%;
                        color: #7681FF;
                        font-size: 16px;
                        justify-self:start;
                        vertical-align: top;
                        font-weight: normal;
                      }
                      span:not(.title) {
                        display: inline-flex;
                        box-sizing: border-box;
                        padding-right: 12px;
                        min-width: 120px;
                        line-height: 1.6;
                        color: $light-gray;
                        white-space: normal;
                        margin-top: 2px;
                        vertical-align: middle;
                        font-size: 14px;
                        &.input-warning {
                          opacity: 0.4;
                        }
                      }
                    }
                  }
                }
                &.-is-name {
                  background: rgba(42, 45, 68, 0.6);
                  span.title {
                    color: #7681FF;
                    font-size: 16px;
                  }
                  span:not(.title) {
                    color: $light-gray;
                    font-size: 14px;
                    font-weight: normal;
                    margin-left: 76px;
                  }
                  i {
                    cursor: pointer;
                  }
                }
              }
              // 도메인
              .input-wrapper {
                position: relative;
                .domain-input {
                  width: 100%;
                  height: 60px;
                  padding: 14px 20px;
                  margin-bottom: 15px;
                  border: 1px solid #3D435E;
                  box-sizing: border-box;
                  border-radius: 3px;
                  background-color: #FFF;
                  &::placeholder {
                    color: $text-lighter-gray;
                  }
                }
                .apply-btn {
                  cursor: not-allowed;
                  position: absolute;
                  top: calc(30px - 7px);
                  right: 55px;
                  font-size: 14px;
                  color: $text-lighter-gray;
                  &.-can-apply {
                    color: $primary;
                    cursor: pointer;
                  }
                }
                .clear-icon {
                  cursor: pointer;
                  background: url('../../../../assets/images/icon-input-clear.svg') no-repeat;
                  width: 20px;
                  height: 20px;
                  position: absolute;
                  top: calc(30px - 10px);
                  right: 20px;
                }
              }
              // 중간 관리자
              .mid-manager-grid, .operator-grid {
                margin-top: 40px;
                .header {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-end;
                  width: 100%;
                  margin-bottom: 15px;
                  span {
                    font-size: 14px;
                  }
                }
              }
              .total-count {
                padding-top: 0;
              }
            }
          }
        }
        .db-arrow-icon {
          display: inline-block;
          margin: 0 $gap-m;
          width: 27px;
          height: 650px;
          background-position: center;
          background-size: contain;
          background-repeat: no-repeat;
          background-image: url('../../../../assets/images/icon-dbarrow-left@3x.png');
          transform: rotate(180deg);
        }
      }
    }
    .header-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 $gap;
      font-weight: bold;
      @include theadStyle();
      .all-expand-button {
        &:hover {color: $main-blue;}
      }
    }
  }
  .mid-manager-modal {
    .modal-body {
      .top-area {
        display: flex;
        justify-content: space-between;
        &__left {
          // display: flex;
          // align-items: center;
          // .search-input {
          //   width: 220px;
          //   .el-input__inner {
          //     border: none;
          //     border-bottom: 1px solid $input-stroke;
          //     background-color: transparent;
          //     &:focus {
          //       color: $text-color;
          //       background-color: transparent;
          //       &::placeholder {
          //         color: $input-placeholder;
          //       }
          //     }
          //   }
          // }
          // .magnify-icon {
          //   cursor: pointer;
          //   position: relative;
          //   top: calc(50% - 8px);
          //   width: 15px;
          //   height: 15px;
          //   transition: all .3s;
          //   transform: translateY(-50%);
          //   &::before,
          //   &::after {
          //     content: '';
          //     position: absolute;
          //   }
          //   &::before {
          //     top: 0;
          //     left: 0;
          //     width: 10px;
          //     height: 10px;
          //     border: 1.5px solid $white;
          //     border-radius: 50%;
          //   }
          //   &::after {
          //     bottom: 2px;
          //     right: -2px;
          //     width: 5px;
          //     height: 1.4px;
          //     background-color: $white;
          //     transform: rotate(45deg);
          //   }
          // }
          // .reset-button {
          //   cursor: pointer;
          //   margin-left: 10px;
          // }
        }
        &__right {
          display: flex;
          .button:last-child {
            margin-left: 10px;
          }
        }
      }
      .tag-area {
        margin-top: 20px;
        .el-tag {
          font-size: 13px;
          color: $light-gray;
          .el-tag__close::before {
            font-size: 13px;
            color: $light-gray;
            position: relative;
            top: 1px;
          }
          .divider {
            display: inline-block;
            margin: 0 $gap-s;
            margin-top: 5px;
            width: 1px;
            height: 8px;
            background-color: #727797;
          }
        }
      }
    }
  }
  .opratr-rgstr-modal {
    .title {
      display: flex;
      align-items: center;
      height: 42px;
      background-color: #2A2D44;
      margin-bottom: 15px;
      div {
        display: flex;
        justify-content: center;
        &:first-child {
          width: 150px;
        }
        &:last-child {
          width: calc(100% - 150px);
        }
      }
    }
    .opratr-rgstr-list {
      margin-bottom: $gap;
      > .opratr-rgstr-item {
        display: flex;
        align-items: center;
        margin-bottom: $gap-s;
        .opratr-rgstr-label {
          font-size: 13px;
          font-weight: normal;
          min-width: 150px;
          padding-left: 20px;
          box-sizing: border-box;
        }
      }
    }

    .divider {
      height: 1px;
      background-color: #3D435E;
    }
  }
.dialog-preci-container {
  .dialog-preci-list {
    .dialog-preci-list-item {
      display: flex;
      white-space: nowrap;
      align-items: center;
      margin-bottom: $gap-s;
      .dialog-preci-list-item-label {
        position: relative;
        min-width: 120px;
        margin-right: 20px;
          &::after {
            content: '*';
            font-size: 14px;
            color: $main-red;
            height: 100%;
          }
      }

    }
  }
}
.horizontal-divider {
  display: inline-block;
  // margin: 0 $gap-s;
  margin-top: 0px;
  width: 100%;
  height: 1px;
  background-color: #4e4e4e;
}
</style>
