<!--
자원에 현재 상태 데이터를 변경하는 팝업 화면

동일한 자원 폼 (Compute, Marketplace, VM template, VM ware)
-->
<template>
  <el-dialog
    :title="$v('자원 정보')"
    :visible="active"
    width="1200px"
    @close="$emit('close')"
  >
    <div class="modal-body resource-info-wrapper">
      <!-- [자원 정보] 탭 -->
      <div
        class="tab"
        v-if="sourceColumns.length > 0"
      >
        <div class="button-area flex-wrap -space-between">
          <el-radio-group
            v-model="current"
            class="custom-switch-group"
            @change="changeCurrent"
            :disabled="compareCurrent"
          >
            <el-radio-button
              v-for="{ label, value } in setCurrent"
              :key="value"
              :label="value"
            >
              {{ label }}
            </el-radio-button>
          </el-radio-group>

          <div
            class="flex-wrap -flex-end"
            v-if="!readOnly"
          >
            <button
              class="button"
              type="is-primary"
              v-if="!editable"
              :disabled="current === true"
              @click="editable = true"
            >
              {{ $v('변경') }}
            </button>
            <button
              class="button"
              type="is-anti"
              v-if="editable"
              @click="cancelInfo"
            >
              {{ $v('취소') }}
            </button>
            <button
              class="button"
              type="is-primary"
              v-if="editable"
              @click="saveInfo"
            >
              {{ $v('저장') }}
            </button>
          </div>
        </div>

        <vertical-table
          type="horizontal"
          :data="rawData"
          :columns="sourceColumns"
        >
          <!-- ///////////// -->
          <!-- //// 왼쪽 //// -->
          <!-- ///////////// -->

          <template
            v-for="{ edit, unit, binding, options } in sourceColumns"
            :slot="binding"
          >
            <!-- slot-scope="props" -->
            <div :key="binding">
              <!-- 편집 안할때 (기본) || 편집가능한 상태인데 편집 불가능한 항목일때 (???) -->
              <span
                v-if="!editable || (editable && !edit)"
                :class="['flex-wrap', displayDiffStyle(binding)]"
              >
                {{ displayReadOnlyText(binding) }}

                <span
                  v-if="unit"
                  class="-unit"
                > {{ unit }}</span>

                <el-tooltip
                  v-if="binding === 'hostname'"
                  placement="top"
                  effect="light"
                  popper-class="shade-popper"
                >
                  <i class="mdi mdi-information-outline" />
                  <p
                    slot="content"
                    v-html="hostnameRules"
                  />
                </el-tooltip>
                <!-- /. [호스트명 규칙] 툴팁 -->
              </span>

              <el-select
                style="max-width: 200px;"
                v-else-if="editable && (edit === 'select')"
                v-model="cloneData[binding]"
                @change="$event => selectChange($event, binding)"
              >
                <el-option
                  v-for="option in options"
                  :key="option.label"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>

              <!-- v-else-if="editable && (edit !== 'select' || edit !== 'custom')" -->
              <component
                v-else
                style="max-width: 200px;"
                :is="showEditableComponents(edit)"
                v-model="cloneData[binding]"
              />
            </div>
          </template>

          <!-- ////////////// -->
          <!-- //// 커스텀 //// -->
          <!-- ////////////// -->

          <template #networkList>
            <span
              v-if="!editable"
              :class="displayDiffStyle('networkList')"
            >{{ cloneData.networkList ? cloneData.networkList[0].cateKey : '-' }}</span>

            <div v-else>
              <!-- 네트워크 카테고리 모달 -->
              <network-category-tree-selection-btn
                :visible="networkCateModalView"
                :cate-limit="1"
                :init-data="cloneData.networkList"
                @close="networkCateModalView = false"
                @save="setNetworkCategory"
              />
              <!-- <span
                style="margin-right: 20px"
                v-if="cloneData.networkList && cloneData.networkList.length"
              >
                {{ cloneData.networkList[0].cateKey }}
              </span>

              <button
                class="button"
                type="is-primary"
                @click="setNetworkCategoryModal"
              >
                {{ $v('Network 선택') }}
              </button> -->
            </div>
          </template>
          <!-- /. 네트워크 카테고리 (Compute, MP, DB) -->

          <template #engineType>
            <span
              v-if="!editable"
              :class="displayDiffStyle('engineType')"
            >{{ cloneData.engineType }}</span>

            <div v-else>
              <button
                class="button"
                type="is-primary"
                @click="setDbEngineModal"
              >
                {{ displayDBEngine(cloneData) }}
              </button>
            </div>
          </template>
          <!-- /. DB Engine (Database) -->

          <template #externalDiskList>
            <div v-if="type === 'VM'">
              <div
                v-if="!editable"
                :class="displayDiffStyle('externalDiskList')"
              >
                <ul v-if="cloneData.externalDisk && cloneData.externalDisk.length">
                  <li
                    v-for="(disk, diskIdx) in cloneData.externalDisk"
                    :key="diskIdx"
                  >
                    <vmware-disk-info-item :disk-info="disk" />
                  </li>
                </ul>
                <span
                  v-else
                  class="empty-content"
                >-</span>
              </div>

              <vmware-set-hard-disk-form
                v-else
                :default-disk="initDisk"
                :init-disks="cloneData._initExternalDisk"
                :project-idx="cloneData.projectIdx"
                :host-uuid="cloneData.esxi ? cloneData.esxi.hostUuid : undefined"
                :controller-list="cloneData.scsiControllerList"
                @change="changeDiskDetail"
              />
            </div>
            <!-- /. VMWARE 는 LocalDisk 형식이 따로 있음 -->

            <div
              v-else
              class="flex-wrap"
            >
              <button-popup
                v-if="!editable"
                :popup-data="displayCountDiskList(cloneData)"
                :class="displayDiffStyle('externalDiskList')"
                trigger="hover"
              >
                {{ displayExternalDisk(cloneData) }}
              </button-popup>

              <button
                v-else
                class="button"
                type="is-primary"
                @click="setExternalDiskModal({ view: true, onlyVolume: false, step: 50, title: 'Local Disk', name: 'externalDisk' })"
              >
                {{ displayExternalDisk(cloneData) }}
              </button>
            </div>
          </template>
          <!-- /. Local Disk (Compute, MP, VM) -->

          <template #rootDiskSize>
            <span
              v-if="!editable"
              :class="displayDiffStyle('rootDiskSize')"
            >{{ cloneData.rootDiskSize }} GB</span>

            <button
              v-else
              class="button"
              type="is-primary"
              @click="setExternalDiskModalWithType({ view: true, onlyVolume: true, step: 10, title: 'Root Disk', name: 'rootDisk' })"
            >
              {{ cloneData.rootDiskSize }} GB
            </button>
          </template>
          <!-- /. Root Disk (Compute, MP) -->

          <template #spec>
            <span
              v-if="!editable"
              :class="displayDiffStyle('profileName')"
            >{{ displaySpec(cloneData) }}</span>
            <button
              v-else
              class="button"
              type="is-primary"
              @click="setGridModal({ view: true, title: $v('사양선택'), selectable: true, name: 'spec' })"
            >
              {{ displaySpec(cloneData) }}
            </button>
          </template>
          <!-- /. 사양 선택 (Database) -->

          <template #installProgramList>
            <button-popup
              v-if="!editable"
              :class="displayDiffStyle('installProgramList')"
              :popup-data="displayCountInstallProram(cloneData)"
              trigger="hover"
            >
              {{ displayInstallProram(cloneData) }}
            </button-popup>
            <button
              v-else
              class="button"
              type="is-primary"
              @click="getInstallProgramList"
            >
              {{ displayInstallProram(cloneData) }}
            </button>
          </template>
          <!-- /. 설치프로그램 (Compute, MP, DB) -->

          <template #vmList>
            <span
              v-if="!editable"
              :class="displayDiffStyle('vmList')"
            >{{ displayVMList(cloneData) }}</span>

            <button
              v-else
              class="button"
              type="is-primary"
              @click="setGridModal({ view: true, title: $v('연결호스트'), selectable: false, name: 'vmList' })"
            >
              {{ displayVMList(cloneData) }}
            </button>
          </template>
          <!-- /. 연결호스트 (Storage) -->

          <template #diskList>
            <span
              v-if="!editable"
              :class="displayDiffStyle('diskList')"
            >{{ cloneData.diskList | volumnGroupSize }} GB</span>

            <button
              v-else
              class="button"
              type="is-primary"
              @click="setExternalDiskModal({ view: true, onlyVolume: true, step: 50, title: '신청용량', name: 'volumnGroupSize' })"
            >
              {{ cloneData.diskList | volumnGroupSize }} GB
            </button>
          </template>
          <!-- /. 신청용량 (Storage) -->

          <template #isSnapshot>
            <span
              v-if="!editable"
              :class="displayDiffStyle('isSnapshot')"
            >{{ cloneData.isSnapshot ? $v('사용함') : $v('사용 안함') }}</span>

            <el-radio-group
              v-else
              v-model="cloneData.isSnapshot"
            >
              <el-radio :label="true">
                {{ $v('사용함') }}
              </el-radio>
              <el-radio :label="false">
                {{ $v('사용 안함') }}
              </el-radio>
            </el-radio-group>
          </template>
          <!-- /. 스냅샷 사용 (File Server) -->

          <template #lunList>
            <div
              v-if="!editable"
              :class="displayDiffStyle('lunList')"
            >
              <cmp-grid
                v-if="cloneData.lunList && cloneData.lunList.length"
                :columns="lunColumns"
                :item-source="cloneData.lunList"
                :use-column-filter="false"
              >
                <template #lunSize="{ row }">
                  {{ row.lunSize | byte }}
                </template>
                <template #status="{ row }">
                  {{ row.status === 'Online' ? '온라인' : '오프라인' }}
                </template>
              </cmp-grid>
              <span v-else>-</span>
            </div>

            <vmware-iscsi-lun-form
              v-else
              :init-data="cloneData ? cloneData.lunList : []"
              @change="changeLunList"
            />
          </template>
          <!-- /. LUN (vSAN iSCSI) -->

          <template #authentication>
            <span
              v-if="!editable"
              :class="displayDiffStyle('authentication')"
            >{{ authOptionObj[cloneData.authentication] }}</span>

            <div v-else>
              <el-select
                v-model="cloneData.authentication"
                :placeholder="$v('인증')"
                :popper-append-to-body="false"
                style="width: 200px;"
                @change="changeAuthType"
              >
                <el-option
                  v-for="(auth, idx) in authOption"
                  :key="`auth_${idx}`"
                  :label="auth.label"
                  :value="auth.value"
                />
              </el-select>

              {{ cloneData.userNameAttachToTarget }}

              <ul
                class="auth-detail-list -dark"
                v-if="cloneData.authentication !== 'NONE'"
              >
                <li>
                  <b><span class="-required">{{ $v('수신 CHAP 사용자') }}</span></b>
                  <div class="auth-password-wrap">
                    <el-input
                      v-model="cloneData.userNameAttachToTarget"
                      :placeholder="$v('수신 CHAP 사용자')"
                    />

                    <el-tooltip
                      placement="top"
                      effect="light"
                      popper-class="shade-popper"
                    >
                      <i class="mdi mdi-information-outline" />
                      <div
                        v-if="iscsiRegex"
                        v-html="iscsiRegex.chapUserName.alertMsg"
                        slot="content"
                      />
                    </el-tooltip>
                  </div>
                </li>
                <li>
                  <b>
                    <span :class="{'-required': !(rawData && rawData.authSpecAutoType === cloneData.authentication)}">{{ $v('수신 CHAP 암호') }}</span>
                  </b>
                  <div class="auth-password-wrap">
                    <el-input
                      v-model="cloneData.userSecretAttachToTarget"
                      type="password"
                      show-password
                      :placeholder="rawData && rawData.authSpecUserNameAttachToTarget ? $v('암호를 변경하려면 입력하세요.') : $v('송신 CHAP 암호')"
                    />
                    <el-tooltip
                      placement="top"
                      effect="light"
                      popper-class="shade-popper"
                    >
                      <i class="mdi mdi-information-outline" />
                      <div
                        v-if="iscsiRegex"
                        v-html="iscsiRegex.chapPassword.alertMsg"
                        slot="content"
                      />
                    </el-tooltip>
                  </div>
                </li>

                <li v-if="cloneData.authentication === 'MUTUAL_CHAP'">
                  <b><span class="-required">{{ $v('송신 CHAP 사용자') }}</span></b>
                  <div class="auth-password-wrap">
                    <el-input
                      v-model="cloneData.userNameAttachToInitiator"
                      :placeholder="$v('송신 CHAP 사용자')"
                    />
                    <el-tooltip
                      placement="top"
                      effect="light"
                      popper-class="shade-popper"
                    >
                      <i class="mdi mdi-information-outline" />
                      <div
                        v-if="iscsiRegex"
                        v-html="iscsiRegex.chapUserName.alertMsg"
                        slot="content"
                      />
                    </el-tooltip>
                  </div>
                </li>
                <li v-if="cloneData.authentication === 'MUTUAL_CHAP'">
                  <b>
                    <span :class="{'-required': !(rawData && rawData.authSpecAutoType === cloneData.authentication)}">{{ $v('송신 CHAP 암호') }}</span>
                  </b>
                  <div class="auth-password-wrap">
                    <el-input
                      v-model="cloneData.userSecretAttachToInitiator"
                      type="password"
                      show-password
                      :placeholder="rawData && rawData.authSpecUserNameAttachToInitiator ? $v('암호를 변경하려면 입력하세요') : $v('송신 CHAP 암호')"
                    />
                    <el-tooltip
                      placement="top"
                      effect="light"
                      popper-class="shade-popper"
                    >
                      <i class="mdi mdi-information-outline" />
                      <div
                        v-if="iscsiRegex"
                        v-html="iscsiRegex.chapPassword.alertMsg"
                        slot="content"
                      />
                    </el-tooltip>
                  </div>
                </li>
              </ul>
            </div>
          </template>
          <!-- /. 인증 -->
          <!-- // 🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧 나중에 컴포넌트화 할것 같음 -->

          <template #tagInfo>
            <select-multiple-tag
              v-model="cloneData.tagInfo"
              widths="200px"
              placeholder="자원 태그를 입력해주세요."
              after-placeholder="태그 추가"
              @change="tags => $emit('change-tags', cloneData.tagInfo)"
              :is-modify="editable ? true : false"
            />
          </template>
        </vertical-table>
        <!-- /. 자원 태그 -->
      </div>

      <!-- ===================================== -->
      <!-- ===================================== -->
      <!-- ===================================== -->
      <!-- ===================================== -->

      <!-- [운영 정보] 탭 -->
      <g-tab
        :data="[tabs[1]]"
        class="tab"
      >
        <template #operation>
          <meta-data-form
            :form-data="metaInfo"
            :use-update-btns="!readOnly"
            read-only
            @save-info="saveMetaInfo"
            ref="metaDataFormRef"
          />
        </template>
      </g-tab>
    </div>

    <div
      v-if="readOnly"
      class="modal-button-area -center"
    >
      <button
        class="button"
        @click="$emit('close')"
      >
        {{ $v('닫기') }}
      </button>
    </div>

    <div
      v-else
      class="modal-button-area -center"
    >
      <button
        class="button"
        @click="$emit('close')"
      >
        {{ editable ? $v('취소') : $v('닫기') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="save()"
      >
        {{ $v('등록') }}
      </button>
      <!-- /. 닫기/변경 || 취소/등록 -->
    </div>

    <!-- ////////////////////////////////// -->
    <!-- ////////////////////////////////// -->
    <!-- ////////////////////////////////// -->

    <!-- DB Engine 설정 모달 -->
    <set-db-engine-modal
      :active.sync="dbEngineModal"
      :data="gridCheckedRow"
      @save="setDbEngine"
      @close="dbEngineModal = false"
    />

    <!-- Local Disk 설정 모달 -->
    <external-disk-modal
      :active.sync="externalDiskModal.view"
      :title="externalDiskModal.title"
      :only-volume="externalDiskModal.onlyVolume"
      :data="cloneData"
      :step="externalDiskModal.step"
      @save="setExternalDisk"
      @close="e => {
        externalDiskModal = { view: false, onlyVolume: false, step: 50 }
      }"
    />

    <!-- 설치프로그램 모달 -->
    <set-install-program-modal
      :active.sync="installProgramModalView"
      :data="cloneData"
      @save="setInstallProgram"
      @close="installProgramModalView = false"
    />

    <!-- 기타 Grid 설정 모달 -->
    <grid-modal
      v-loading="loading"
      :active.sync="gridModal.view"
      :title="gridModal.title"
      :column-data="gridModalColumns"
      :table-data="gridModalData"
      :header-checkbox="!gridModal.selectable"
      :init-auto-select-row="gridCheckedRow ? gridCheckedRow : null"
      :init-auto-select-row-key="gridCheckedRowKey"
      :selectable="gridModal.selectable"
      :changing-page-reset="false"
      width="60%"
      @confirm="gridDataSave"
      @close="gridModal.view = false"
    />
  </el-dialog>
</template>

<script>

import API, {
  NetworkCategoryTreeSelectionBtn,
  NXComputeUpdateForm,
  MetaDataForm,
  VMwareDiskInfoItem,
  VMwareIscsiLunForm,
  VMwareSetHardDiskForm,
  SelectMultipleTag,
  joinExternalDiskList,
  setChangeHistory,

  // VMW 전용 비교 함수
  setLunListOperation,
  setExternalDiskOperation
  // setScsiControllerOperation, // 컨트롤러 정보 (operation 정보 세팅)
  // setNetworkInfoOperation, // 네트워크 정보 (operation 정보 세팅) - 네트워크는 변경 불가능이라 생성 시에만 'ADD' 주면 될 듯
  // setInstallProgramsOperation, // 설치프로그램 정보 (operation 정보 세팅)
} from '@sd-fe/cmp-core'
import ButtonPopup from '@/components/ButtonPopup/ButtonPopup'
import ExternalDiskModal from '@/components/Modal/ExternalDiskModal/ExternalDiskModal'
import SetInstallProgramModal from '@/components/Modal/SetInstallProgramModal/SetInstallProgramModal'
import SetDBEngineModal from '@/components/Modal/SetDBEngineModal/SetDBEngineModal'
import ServiceDate from '@/components/ServiceDate/ServiceDate'
import GridModal from '@/components/Modal/GridModal/GridModal'
import { mapState } from 'vuex'
import { cloneDeep } from 'lodash'

export default {
  name: 'ResourceInfo',
  components: {
    'network-category-tree-selection-btn': NetworkCategoryTreeSelectionBtn,
    'nx-compute-update-form': NXComputeUpdateForm,
    'button-popup': ButtonPopup,
    'external-disk-modal': ExternalDiskModal,
    'set-install-program-modal': SetInstallProgramModal,
    'set-db-engine-modal': SetDBEngineModal,
    'grid-modal': GridModal,
    'service-date': ServiceDate,
    'meta-data-form': MetaDataForm,
    'vmware-disk-info-item': VMwareDiskInfoItem,
    'vmware-set-hard-disk-form': VMwareSetHardDiskForm,
    'vmware-iscsi-lun-form': VMwareIscsiLunForm,
    SelectMultipleTag
  },
  props: {
    active: { // 모달 on/off
      type: Boolean,
      default: false
    },
    type: { // COMPUTE, STORAGE, DATABASE, MARKET, VMWARE ...
      type: String,
      default: undefined
    },
    readOnly: { // 읽기전용 (true)
      type: Boolean,
      default: false
    },
    data: { // grid 생 row
      type: [Object, Array],
      default: () => []
    }
  },
  watch: {
    active (active) {
      if (active) this.init()
    },
    editable (state) {
      // 차이확인
      this.setSourceColumnsDiff(state)

      // required 표기
      this.sourceColumns = this.sourceColumns.map(column => {
        column.required = state ? column.req : false
        return column
      })
    }
  },
  computed: {
    iscsiRegex () { return this.regexInfo },
    ...mapState({
      user: state => state.auth.user,
      metaForm: state => state.metadata,
      cloud: state => state.cloud.cloud.toUpperCase()
    }),
    /**
     * 변경전 vs 변경후 데이터 비교 => 변경 여부 확인
     *
     * - [NEW]     beforeData(this.rawData) vs afterData(this.tempData)
     * - [CHANGE]  beforeData(this.beforeData) vs afterData(this.rawData)
     */
    compareCurrent () {
      // 편집중일때는 항상 disabled
      if (this.editable) return true
      // 비교를 하는 주체 : beforeData vs tempData
      const before = cloneDeep(this.beforeData || {})
      const after = cloneDeep(this.tempData || {})

      const loop = data => {
        const values = this.sourceColumns.map(({ binding }) => data[binding])
        return JSON.stringify(values)
      }

      // console.log(loop(after), loop(before), loop(after) === loop(before))
      // console.log(raw, before)
      const compare1 = loop(before)
      const compare2 = loop(after)
      return (compare1 === compare2)
    }
  },
  methods: {
    /*
      🔸 해당 컴포넌트 수정시 유의점

        [사전협의/할일] 의 [Compute / Stroage / MP / DB] 자원의
        [자원 정보] 수정시 공통으로 사용되는 컴포넌트이기 때문에 수정시 주의해서 사용해야합니다.
        각 함수에 어디서 사용하는지 주석 반드시 작성해주세요!
     */
    async init () {
      console.clear()
      console.log('%c@@ DATA :: ', 'color: yellow', this.data)
      console.log('%c@@ Type :: ' + this.type, 'color: pink')

      this.orderType = this.data.resourceType // NEW/CHANGE/DELETE

      this.rawData = cloneDeep(JSON.parse(this.data.originJson)) // 원본 데이터
      this.tempData = cloneDeep(this.data) // 복제 + 수정 전 데이터 + 저장 임시 데이터
      this.cloneData = cloneDeep(this.data) // 수정 임시 데이터 (화면에 보여질 데이터 - tempData 로 원복 가능함)

      this.current = false // 기본 [변경 후] 보기
      this.editable = false // 기본 변경 OFF

      // 각 자원마다 기본 데이터 세팅
      this.setDefaultData()

      // 변경 전 데이터 세팅
      this.beforeData = this.setBeforeData(this.rawData)

      // [자원 정보] 세팅
      this.tabs = this.setTabs(this.type)
      this.sourceColumns = this.resourceTypeColumns[this.type]
      this.setSourceColumnsDiff() // 변경 전/후 데이터 비교

      // [운영그룹] 옵션 세팅
      this.setColumnOptions()

      // [호스트명 규칙] 툴팁 세팅
      this.getHostnameRules()

      // [운영 정보] 세팅
      let metaData = null

      // [신규] 에는 사용자에서 저장된 metaInfo 저장
      if (this.orderType === 'NEW') {
        const { metaInfo } = this.data
        metaData = metaInfo ? JSON.parse(metaInfo) : null
      // [변경/삭제] 에는 api로 metaInfo 호출
      } else {
        metaData = await this.getMetaInfo(this.data)
      }

      if (this.$refs.metaDataFormRef) this.$refs.metaDataFormRef.activeEdit = false // 초기에는 읽기모드
      this.metaInfo = this.settingMetaDataArr(metaData)
    },

    /**
     *
     */
    async setDefaultData () {
      // VMware 일경우 [local disk] 따로 설정
      if (this.type === 'VM') {
        const tempData = await this.setVMDisks(this.data)
        this.cloneData = cloneDeep(tempData)
        // this.getVmwareVmDefaultDisk()
        // this.setVMLocalDisk(this.data)
      }

      // VSAN_ISCSI 일 경우 인증 🟧 관련 정보 추가
      if (this.type === 'VSAN_ISCSI') {
        this.setISCSIData(this.rawData)
        this.setISCSIData(this.tempData)
        this.cloneData = cloneDeep(this.tempData)
        // this.$set(this.cloneData, 'authentication', this.cloneData.authType.authentication || 'NONE')
        // this.$set(this.cloneData, 'userNameAttachToInitiator', this.cloneData.userNameAttachToInitiator || undefined)
        // this.$set(this.cloneData, 'userSecretAttachToInitiator', this.cloneData.userSecretAttachToInitiator || undefined)
      }

      // Database 일 경우 사양 선택을 임의로 지정해줌 (validation 에서 차단됨)
      if (this.type === 'DATABASE') {
        this.cloneData.spec = { profileId: this.data.profileId, profileName: this.data.profileName }
      }
    },

    /**
     * 기본 탭을 설정합니다.
     * @param {String} type 자원 타입 (resourceType)
     */
    setTabs (type = this.type) {
      const defaultTabs = [
        { field: 'source', name: this.$v('자원 정보') },
        { field: 'operation', name: this.$v('운영 정보') }
      ]

      return defaultTabs
    },

    /**
     * >> 공통 (변경건)
     * beforeData 비교
     * @param {Boolean} editable
     */
    setSourceColumnsDiff (editable = this.editable) {
      this.sourceColumnsDiff = {}
      // console.log(editable, this.current)

      // 편집중 아닐때 => 전 / 후 데이터 비교해서 색 표기
      for (const { binding } of this.sourceColumns) {
        let diff = false

        if (!editable && this.current === false) {
          const before = JSON.stringify(this.beforeData[binding])
          const after = JSON.stringify(this.cloneData[binding])

          // console.log(binding, (before !== after))
          diff = (before !== after)
        }

        this.sourceColumnsDiff[binding] = diff
      }

      // console.log(this.sourceColumnsDiff)
    },

    /**
     * >> 공통
     * select 의 옵션을 설정합니다.
     * @return {Array}
     */
    async getHostnameRules () {
      try {
        const response = await API.config.getCodeList({ codeType: 'HOSTNAME_RULE' })
        this.hostnameRules = response.map(({ codeName }) => codeName).join('<br>')
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('호스트명 조회에 실패하였습니다.'), () => false)
      }
    },

    /**
     * >> 공통
     * select 의 옵션을 설정합니다.
     * @return {Array}
     */
    async setColumnOptions () {
      const options = await this.getOperationList()

      return this.sourceColumns.map(column => {
        if (column.binding === 'manageGroupIdx') column.options = options // [운영그룹]
        return column
      })
    },

    /**
     * Select 변경시에 변경 이벤트 캐치
     * @param {Object} $event
     * @param {String} binding
     */
    selectChange ($event, binding) {
      if (binding !== 'manageGroupIdx') return // [운영그룹]일 때만 이벤트 캐치!

      const before = this.rawData[binding]
      if (before !== $event) {
        this.$confirm(this.$v('운영그룹 변경시 선택된 클러스터 정보도 모두 사라집니다.<br>계속 진행하시겠습니까?'), { dangerouslyUseHTMLString: true })
          .then(() => (this.cloneData[binding] = $event))
          .catch(() => (this.cloneData[binding] = before))
      }
      // console.log(before, $event, binding, '으응?')
    },

    /**
     * 메타데이터 정보 세팅 (CHANGE|DELETE 인 경우는 관리자 화면내에서 조회)
     * @param { Object } metaInfo 자원할당에 저장된 메타정보
     */
    async getMetaInfo (data = this.type) {
      const { apiName, payload } = {
        COMPUTE: { apiName: API.compute.getNxResourceMetaInfo, payload: { resourceType: this.type, resourceId: data.userVmIdx } },
        STORAGE: { apiName: API.compute.getNxResourceMetaInfo, payload: { resourceType: this.type, resourceId: data.userVmIdx } },
        DATABASE: { apiName: API.compute.getNxResourceMetaInfo, payload: { resourceType: this.type, resourceId: data.userVgIdx } },
        MARKET: { apiName: API.compute.getNxResourceMetaInfo, payload: { resourceType: this.type, resourceId: data.userDbIdx } },
        FILE_SERVER_SMB: { apiName: API.compute.getNxResourceMetaInfo, payload: { resourceType: this.type, resourceId: data.userShareIdx } },
        FILE_SERVER_NFS: { apiName: API.compute.getNxResourceMetaInfo, payload: { resourceType: this.type, resourceId: data.userShareIdx } },

        NETWORK_L4: { apiName: API.network.getNetworkResourceMetaInfo, payload: { resourceType: 'L4', resourceIdx: data.vrserverIdx } },
        NETWORK_L7: { apiName: API.network.getNetworkResourceMetaInfo, payload: { resourceType: 'L7', resourceIdx: data.csVrserverIdx } },
        SECURITY: { apiName: API.network.getNetworkResourceMetaInfo, payload: { resourceType: 'SECURITY_GROUP', resourceIdx: data.securityGroupIdx } },

        VM: { apiName: API.vmware.vm.getVmwareVmMetaInfo, payload: { userVmIdx: data.userVmIdx } },
        VSAN_ISCSI: { apiName: API.vmware.vsan.getVmwareVsanIscsiMetaInfo, payload: { userIscsiIdx: data.userIscsiIdx } }
      }[this.type]

      const result = await apiName(payload)
      return result
    },

    /**
     * 메타데이터 정보 세팅
     * @param { Object } metaInfo 자원할당에 저장된 메타정보
     */
    settingMetaDataArr (metaInfo = {}) {
      const metaForm = this.metaForm[this.cloud][this.type]

      // store 에 저장되어있는 metaForm
      // console.log(this.metaForm, metaForm, metaInfo, this.type)

      const metaData = metaForm?.map(meta => {
        const info = (metaInfo && metaInfo[meta.key]) ? metaInfo[meta.key] : ''

        return {
          ...meta,
          data: info || meta.data
        }
      })

      return metaData
    },

    /**
     * 메타정보를 업데이트 합니다.
     * @param {Object} params
     */
    saveMetaInfo (params) {
      this.cloneData.metaInfo = JSON.stringify(params)
      this.tempData.metaInfo = JSON.stringify(params)
    },

    // ======================================================
    // ======================================================
    // ==================== 함수 개별 역할 정의 =================
    // ======================================================
    // ======================================================

    // ------------------------------------------------------
    // ------ Local Disk / Root Disk / DB Size / 신청용량 ----
    // ------------------------------------------------------

    /**
     * >> Compute, MP, DB, Storage
     * [Local Disk / Root Disk / DB Size / 신청용량] 모달 세팅 (커스텀)
     */
    setExternalDiskModalWithType (defaultOption) {
      const option = {
        DATABASE: { view: true, onlyVolume: true, step: 50, title: 'DB Size', name: 'rootDisk' }
      }[this.type] || defaultOption

      return this.setExternalDiskModal(option)
    },

    /**
     * >> Compute, MP, DB, Storage
     * [Local Disk / Root Disk / DB Size / 신청용량] 모달 세팅
     */
    setExternalDiskModal ({ view, onlyVolume, step, title, name }) {
      this.externalDiskModal = { view, onlyVolume, step, title, name }
    },

    /**
     * >> Compute, MP, DB, Storage
     * [Local Disk / Root Disk / DB Size / 신청용량] 설정
     */
    setExternalDisk (data) {
      const { title, name } = this.externalDiskModal

      const action = {
        // Root Disk 설정
        rootDisk: () => {
          if (!data?.disk.length) return this.$alert(this.$v(`${title} 최솟값은 50GB 입니다.`))

          const [disk] = data?.disk
          const { diskSize } = disk

          this.cloneData = {
            ...this.cloneData,
            rootDiskSize: diskSize,
            displayRootDiskSize: `${diskSize} GB`
          }
        },

        // Local Disk 설정
        externalDisk: () => {
          const { disk } = data

          const gbToByte = d => this.$options.filters.gbToByte(d)
          disk.forEach(dsk => { dsk.diskSizeBytes = gbToByte(dsk.diskSize) })
          const displayExternalDiskList = disk?.filter(dsk => !(dsk?.deviceIndex === 0 && dsk?.deviceBus === 'SCSI'))
          const externalDiskListSum = this.$options.filters.volumnGroupSize(displayExternalDiskList)

          this.cloneData = {
            ...this.cloneData,
            externalDiskList: disk,
            displayExternalDiskList,
            externalDiskListSum
          }
        },

        // 신청용량 설정
        volumnGroupSize: () => {
          const { disk } = data

          this.cloneData = {
            ...this.cloneData,
            diskList: cloneDeep(disk)
          }
        }
      }[name]

      if (action) return action()
    },

    // ----------------------------------------------------
    // --------------------- DB Engine --------------------
    // ----------------------------------------------------

    /**
     * >> DB
     * [DB Engine] 모달 세팅
     */
    setDbEngineModal () {
      this.dbEngineModal = true

      this.gridCheckedRow = { engineType: this.cloneData.engineType }
      this.gridCheckedRowKey = 'engineType'
    },

    /**
     * >> DB
     * [DB Engine] 설정
     */
    setDbEngine ({ engineType, ...engine }) {
      this.cloneData = { ...this.cloneData, engineType }
    },

    // ----------------------------------------------------
    // --------------------- 설치프로그램 --------------------
    // ----------------------------------------------------

    /**
     * >> Compute, MP, DB
     * [설치프로그램 목록] 호출
     */
    async getInstallProgramList () {
      this.installProgramModalView = true
    },

    /**
     * >> Compute, MP, DB
     * [설치프로그램 목록] 설정
     */
    setInstallProgram (data) {
      this.cloneData = {
        ...this.cloneData,
        installProgramList: data
      }
    },

    // ----------------------------------------------------
    // --------------------- 네트워크 카테고리 --------------------
    // ----------------------------------------------------

    /**
     * >> Compute, MP, DB
     * [네트워크 카테고리] 데이터 저장
     * @param {Array} networkList
     */
    setNetworkCategory (networkList) {
      this.networkList = cloneDeep(networkList)
      this.cloneData = {
        ...this.cloneData,
        networkList: this.networkList
      }
    },

    /**
     * >> Compute, MP, DB
     * [네트워크 카테고리] 모달 세팅
     */
    setNetworkCategoryModal () {
      this.networkCateModalView = true
      this.networkList = cloneDeep(this.cloneData.networkList)
    },

    // ======================================================
    // ======================================================
    // ================== /. 함수 개별 역할 정의 =================
    // ======================================================
    // ======================================================

    /**
     * >> 공통
     * [운영그룹] 목록을 조회합니다.
     */
    async getOperationList () {
      try {
        const moduleType = { NUTANIX: 'NX' }[this.cloud] || this.cloud
        const operatingGroupType = {
          COMPUTE: 'COMPUTE',
          DATABASE: 'COMPUTE',
          VM: 'COMPUTE',
          STORAGE: 'STORAGE',
          VSAN_ISCSI: 'STORAGE'
        }[this.type]

        const { data } = await API.billing.getOperationGroup({
          moduleType,
          operatingGroupType
        })

        const options = []
        for (const { operatingGroupName, operatingGroupIdx } of data) {
          options.push({ label: operatingGroupName, value: operatingGroupIdx }) // 옵션 세팅
          this.$set(this.manageGroupOptions, operatingGroupIdx, operatingGroupName) // 보여주기용 옵션 세팅
        }

        return options
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('운영 그릅 조회에 실패하였습니다.'), () => false)
      }
    },

    /**
     * >> 공통
     * >> Datbase (사양선택)
     * >> Storage (연결호스트)
     *
     * 기본 선택 grid modal인 경우 컬럼/데이터 세팅
     * @param {Boolean} view on/off 상태
     * @param {String} title 모달 제목
     * @param {Boolean} selectable 단건선택/다건선택(체크박스)
     * @param {String} name 사용할 컬럼명
     */
    setGridModal ({ view, title, selectable, name }) {
      this.gridModal = { view, title, selectable, name }
      this.gridModalColumns = cloneDeep(this.gridModalColumnsTest[name])

      const action = {
        spec: this.getSpec, // [사양선택] 목록 호출 (Database)

        vmList: this.getStorageHosts // [연결호스트] 목록 호출 (Storage)
      }[name]

      // console.log({ view, title, selectable, name })
      if (action) return action()
    },

    /**
     * >> 공통
     * >> Datbase (사양선택)
     * >> Storage (연결호스트)
     *
     * 저장 이벤트
     * @param {Object} result
     */
    gridDataSave (result) {
      const { name, selectable } = this.gridModal
      // console.log('## 저장 데이터', name, result, result.dataItem)

      const update = {}
      const data = selectable ? result.dataItem : result
      update[name] = JSON.parse(JSON.stringify(data))

      // 커스텀으로 정의되어야 하는경우가 있을 수 있음
      const updateData = {
        spec: { profileId: data.profileId, profileName: data.profileName, spec: data }
      }[name] || update

      this.cloneData = {
        ...this.cloneData,
        ...updateData
      }

      // 데이터 초기화
      this.gridCheckedRow = null
      this.gridCheckedRowKey = undefined
      this.gridModalData = []
    },

    // -------------------------------------------------------
    // -------------------- 공통 그리드 호출 ---------------------
    // -------------------------------------------------------

    /**
     * >> DB
     * [사양선택] 목록 호출
     */
    async getSpec () {
      try {
        this.loading = true

        // 유저 Profile 조회
        const response = await API.database.getUserProfiles()
        if (!Object.keys(response).length) return

        this.gridCheckedRow = { profileId: this.cloneData.profileId }
        this.gridCheckedRowKey = 'profileId'

        if (response?.COMPUTE) {
          this.gridModalData = response.COMPUTE.map(({ userProfMap, ...profile }) => ({
            profileName: userProfMap.profileName,
            vcpu: userProfMap.vcpu,
            memory: userProfMap.memory,
            profileId: profile.userProfIdx
            // ...profile
          }))
        }
      } catch (error) {
        console.error('@@ ResourceInfo > getSpec', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * >> Storage
     * [연결호스트] 그리드 목록 호출
     */
    async getStorageHosts () {
      try {
        this.loading = true

        this.gridCheckedRow = this.cloneData.vmList
        this.gridCheckedRowKey = 'vmUuid'

        // [연결 정보] 데이터 바인딩
        const data = await API.compute.getVms({ projectIdx: this.data.projectId })
        this.gridModalData = data
      } catch (error) {
        console.error('@@ ResourceInfo > getStorageHosts', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * >> VMware
     * [Local Disk] 호출 동시에 default 데이터 세팅
     */
    async setVMDisks (data) {
      const scsiControllerList = await this.getVmwareVmDefaultDisk(data)
      const disks = await this.setVMLocalDisk({ ...data, scsiControllerList })
      return disks
    },

    /**
     * >> VMware
     * [Lodal Disk] 기본 호출
     */
    async getVmwareVmDefaultDisk (data) {
      try {
        const disk = await API.vmware.vm.getVmwareVmDefaultDisk()

        // ** controllerKey = 1000이고 unitNumber = 0 인 디스크는 루트 디스크

        const initDisk = {
          profileId: disk.defaultDiskProfileId,
          storagePolicyName: 'Datastore Default',
          eagerlyScrub: disk.defaultDiskEagerlyScrub,
          vmSharing: disk.defaultDiskSharing,
          vmSharingLevel: disk.defaultDiskStorageIOAllocation?.shares?.level || '',
          vmSharingLevelValue: disk.defaultDiskStorageIOAllocation?.shares?.shares || '',
          storageIOLimit: disk.defaultDiskStorageIOAllocation?.limit,
          storageIOReservation: disk.defaultDiskStorageIOAllocation?.reservation || '',
          diskMode: disk.defaultDiskMode,
          controllerKey: 1000, // 컨트럴의 키 (1001부터 시작, 1001 1002... )
          scsiCtlrUnitNumber: disk.defaultDiskUnitNumber,
          unitNumber: 1,
          diskControllerKey: disk.defaultDiskControllerKey,

          diskName: '',

          diskSize: 50,
          diskKey: 2001,
          busNumber: 0
        }

        const initSCSIController = {
          busNumber: 0, // 1씩 증가
          type: disk.defaultSCSIControllerType,
          sharedBus: disk.defaultSCSIControllerSharedBus,
          scsiCtlrUnitNumber: disk.defaultSCSIControllerUnitNumber,
          controllerKey: disk.defaultSCSIControllerKey
        }
        this.initDisk = initDisk
        this.initSCSIController = initSCSIController

        return (!data.scsiControllerList?.length) ? [{ ...initSCSIController }] : data.scsiControllerList
      } catch (error) {
        console.error(error)
        this.$alert('기본 디스크 조회에 문제가 발생했습니다.', () => false)
        return []
      }
    },

    /**
     * >> VMware
     * [Lodal Disk] 설정 (조건이 많음)
     * @param {Object} data
     */
    async setVMLocalDisk (data) {
      const userInfo = data?.userInfo

      // Local Disk, 컨트롤러
      let scsiControllerList = []
      if (data.scsiControllerList) {
        scsiControllerList = data.scsiControllerList.map(c => {
          const { _data, ...rest } = c
          return {
            _data: rest,
            scsiControllerKey: c?.scsiControllerKey || c.controllerKey,
            controllerKey: c?.scsiControllerKey || c.controllerKey,
            busNumber: c?.busNumber,
            type: c?.scsiTypeEnum || c.type,
            sharedBus: c.sharedBus,
            scsiCtlrUnitNumber: c.scsiCtlrUnitNumber
          }
        })
      }

      let disks = []
      let externalDisk = []
      let rootDisk = data?.rootDisk
      let rootDiskSize = data?.rootDiskSize
      if (data.diskList && userInfo?.externalDiskList) {
        disks = joinExternalDiskList(data.diskList, userInfo.externalDiskList, scsiControllerList)

        // **루트 디스크 => controllerKey = 1000이고 unitNumber = 0 인 디스크
        rootDisk = disks.find(disk => disk.controllerKey === 1000 && disk.unitNumber === 0)
        rootDiskSize = rootDisk ? rootDisk.size : 0
        externalDisk = disks.filter(disk => !(disk.controllerKey === 1000 && disk.unitNumber === 0))
      } else if (data.externalDiskList) externalDisk = data.externalDiskList

      const result = {
        ...data,
        externalDisk,
        rootDiskSize,
        _initExternalDisk: cloneDeep(externalDisk)
      }

      return result
    },

    /**
     * >> VMware
     * [Local Disk] 저장 이벤트
     * @param {Array} data
     */
    changeDiskDetail (data) {
      const disks = data.map((disk, idx) => {
        const { controllerKey, diskKey, diskMode, diskName, diskSize, eagerlyScrub, profileId, vmSharing, storageIOLimit, storageIOReservation, unitNumber, busNumber, vmSharingLevel, vmSharingLevelValue, fileName, storagePolicyName, hostUuid, registerHostUuidMap, registerHostUuidList } = disk
        //     -씩 프로비저닝 : eagerlyScrub:false, thinProvisioned:false
        // - 빠르게 비워지는 씩 프로비저닝 :  eagerlyScrub:true, thinProvisioned: false
        // - 씬 프로비저닝 : eagerlyScrub:null, thinProvisioned: true

        return {
          ...(eagerlyScrub !== undefined && {
            eagerlyScrub,
            thinProvisioned: typeof eagerlyScrub !== 'boolean'
          }),

          controllerKey,
          diskKey,
          diskMode,
          diskName: diskName || null,
          size: diskSize,
          diskSize,

          name: `SCSI ${busNumber}:${unitNumber}`,
          operation: 'ADD',
          profileId,
          storagePolicyName,
          sharing: vmSharing,
          storageIOAllocation: {
            limit: storageIOLimit,
            reservation: storageIOReservation,
            shares: {
              level: vmSharingLevel,
              shares: vmSharingLevelValue
            }
          },
          unitNumber,
          userVmIdx: 0,
          busNumber,

          ...(fileName && {
            fileName,
            hostUuid,
            registerHostUuidMap,
            registerHostUuidList
          })
        }
      })

      // console.log(data, '> change data')
      // console.log(disks, '> change disks')
      this.vmwareExternalDisk = disks
      // this.$set(this.cloneData, 'externalDisk', disks) // 이거 .. 주석 해제하면 절대안돼 ㄷㄷ
    },

    /**
     * >> vSAN iSCISI
     * LUN 변경 이벤트
     * @param {Array} data lun 목록
     */
    changeLunList (data) {
      const lunList = data.map(lun => {
        const lunSize = lun?.lunSize || this.sizeToByte(lun.size, lun.sizeUnit)
        return {
          ...lun,
          lunSize
        }
      })

      this.lunList = lunList
    },

    /**
     * >> vSAN ISCS
     * 정보 세팅
     */
    setISCSIData (data = this.rawData) {
      this.$set(data, 'authentication', data.authType.authentication || 'NONE')
      this.$set(data, 'userNameAttachToInitiator', data.userNameAttachToInitiator || undefined)
      this.$set(data, 'userSecretAttachToInitiator', data.userSecretAttachToInitiator || undefined)
    },

    /**
     * >> vSAN iSCISI
     * 인증 변경 이벤트
     */
    changeAuthType () {
      const sameAuth = this.rawData && this.rawData.authSpecAutoType === this.cloneData.authentication

      this.cloneData.userNameAttachToTarget = sameAuth ? this.rawData?.authSpecUserNameAttachToTarget : '' // 수신 CHAP 사용자
      this.cloneData.userSecretAttachToTarget = '' // 수신 CHAP 암호

      this.cloneData.userNameAttachToInitiator = sameAuth ? this.rawData?.authSpecUserNameAttachToInitiator : '' // 송신 CHAP 사용자
      this.cloneData.userSecretAttachToInitiator = ''// 송신 CHAP 암호

      if (!this.editable) {
        setChangeHistory(
          this.$v('인증'),
          this.changeHistory,
          this.authOptionObj[this.rawData.authSpecAutoType],
          this.authOptionObj[this.cloneData.authentication]
        )
      }
    },

    // ----------------------------------------------------
    // -------------------- 기타 공통요소 --------------------
    // ----------------------------------------------------

    /**
     * [자원정보] 저장 전 Validation 설정
     * @return {Array}
     */
    validator () {
      const validator = this.sourceColumns.map(({ header, binding, edit, req, ...column }) => {
        // console.log(header, binding, edit, this.cloneData[binding]) // input, custom, undefined, select

        // 배열인경우 1개 이상 확인
        let condition = Array.isArray(this.cloneData[binding]) ? !!this.cloneData[binding].length : this.cloneData[binding] !== undefined
        const message = this.$v(`${header} 항목은 필수입니다.`)

        if (!req) condition = true // 필수가 아닌건 스킵

        return { condition, message, binding, data: this.cloneData[binding] }
      })

      return validator
    },

    /**
     * >> 공통
     * [자원정보] 변경 취소
     */
    cancelInfo () {
      return this.$confirm(this.$v('입력하신 내용을 적용하지 않고<br>취소하시겠습니까?'), { dangerouslyUseHTMLString: true })
        .then(() => {
          this.cloneData = cloneDeep(this.data)
          this.editable = false
        })
        .catch(() => false)
    },

    /**
     * >> 공통
     * [자원정보] 변경 저장 전, 임시 저장했던 데이터들 모두 저장
     */
    beforeSaveInfo () {
      // VM > externalDisk 저장
      if (this.type === 'VM') {
        const beforeDisks = cloneDeep(this.rawData.externalDisk)
        const afterDisks = cloneDeep(this.vmwareExternalDisk)
        const setOperationExternalDisks = setExternalDiskOperation(beforeDisks, afterDisks)

        // console.log(beforeDisks, afterDisks, setOperationExternalDisks)
        this.cloneData.externalDisk = setOperationExternalDisks// this.vmwareExternalDisk
        this.cloneData.externalDiskList = setOperationExternalDisks// this.vmwareExternalDisk
      }

      // VMware > VSAN iSCSCI Lun 저장
      if (this.type === 'VSAN_ISCSI') {
        const setOperationLunList = setLunListOperation(this.rawData.lunList, this.lunList, 'id')

        this.cloneData.lunList = setOperationLunList
      }
    },

    /**
     * >> 공통
     * [자원정보] 변경 저장
     */
    saveInfo () {
      this.beforeSaveInfo() // 저장하기전에 활동

      const validator = this.validator()

      const validation = validator.every(({ condition, message }) => {
        if (!condition) this.$alert(message)
        return condition
      })

      // validation 처리
      if (!validation) return

      return this.$confirm(this.$v('자원 정보를 업데이트 하시겠습니까?'))
        .then(() => {
          this.editable = false
          this.tempData = cloneDeep(this.cloneData)

          // 임시 데이터들 초기화
          this.networkList = []
          this.vmwareExternalDisk = []
          this.lunList = []
        })
        .catch(() => false)
    },

    /**
     * >> 공통
     * [자원정보 & 운영정보] 저장
     */
    save () {
      const editable1 = this.editable
      const editable2 = this.$refs?.metaDataFormRef?.activeEdit

      if (editable1 || editable2) return this.$alert('현재 변경된 내용을 저장한 후 등록할 수 있습니다.')

      // [운영그룹] 이 변경되었는지 확인!
      const isChanged = this.tempData.manageGroupIdx !== this.rawData.manageGroupIdx

      return this.$confirm(this.$v('해당 내용으로 저장하시겠습니까?'))
        .then(() => {
          console.log('%c## 저장 데이터', 'background: blue', this.tempData)
          this.$emit('save', { item: this.tempData, manage: isChanged })
          this.$emit('close')
        })
        .catch(() => false)
    },

    /**
     * >> 공통
     * editable 이 가능한경우, 어떤 컴포넌트가 보여질 것인지 확인
     * @param {String} type input, select, number, custom, undefined
     */
    showEditableComponents (type) {
      if (!this.editable || !type) return false

      // 단순한 것만 dynamic component 사용
      return {
        input: 'el-input',
        number: 'el-input-number'
      }[type]
    },

    /**
     * >> 공통
     * @param {Object} rawData originJson
     */
    setBeforeData ({ beforeData, ...rawData }) {
      // [CHANGE(변경)] rawData.beforeData 정보 || [NEW(신규)] rawData 데이터
      // const text = beforeData ? 'beforeData' : 'rawData'
      const before = beforeData || rawData

      // 각 자원에 맞게 데이터 가공
      const setBeforeData = {
        VM: value => ({
          ...value,
          hostname: value.name
        }),
        VSAN_ISCSI: value => ({
          ...value,
          authentication: value.authType.authentication || 'NONE'
        })
      }[this.type]

      const formatting = setBeforeData ? setBeforeData(before) : before

      const result = { ...before }
      this.sourceColumns.forEach(({ binding }) => (result[binding] = formatting[binding]))
      // console.log(result)
      // console.log(before, rawData, formatting)

      return cloneDeep(result)
    },

    /**
     * >> 공통
     * 현재 보고있는 cloneData 값 세팅
     *
     * - 비교를 하는 주체 : beforeData vs tempData
     * - 보여주기용 데이터: cloneDapta
     *
     * - [NEW]     beforeData(this.rawData) vs afterData(this.tempData)
     * - [CHANGE]  beforeData(this.beforeData) vs afterData(this.rawData)
     * @param {Boolean} current
     */
    async changeCurrent (current) {
      const { beforeData, afterData } = {
        NEW: { beforeData: this.beforeData, afterData: this.tempData },
        CHANGE: { beforeData: this.beforeData, afterData: this.rawData }
        // DELETE: 변경 비교 필요 없음
      }[this.orderType]

      // true (변경 전 - beforeData) vs false (변경 후 - afterData)
      const currentData = cloneDeep(current ? beforeData : afterData)

      if (this.type === 'VM') {
        this.cloneData = await this.setVMDisks(currentData)
      } else {
        this.cloneData = currentData
      }

      // console.log(this.cloneData)
    }
  },
  data: root => ({
    loading: false,
    editable: false,
    orderType: undefined, // NEW/CHANGE/DELETE (orderType)
    rawData: null, // 원본 데이터
    tempData: null, // 복제 + 수정 전 데이터 + 저장 임시 데이터
    cloneData: null, // (화면에 보여질 데이터 - tempData 로 원복 가능 + beforeData와 비교용 데이터)
    beforeData: null, // 수정 전 데이터 (원본 - NEW: 수정 전, CHANGE: 생성 데이터)
    networkList: [], // [네트워크 카테고리] 저장 -> 예외적으로 데이터 따로 분리
    lunList: [], // [LUN]  저장 -> 예외적으로 데이터 따로 분리
    vmwareExternalDisk: [], // VM > [Local Disk] 저장 -> 예외적으로 데이터 따로 분리
    metaInfo: undefined, // [운영 정보] 저장 -> 예외적으로 데이터 따로 분리
    tabs: [], // [자원정보] / [운영정보] 탭 설정
    sourceColumns: [], // [자원정보] 컬럼 (기본),
    sourceColumnsDiff: {}, // [자원정보] 컬럼 변경여부 체크 (-diff)
    current: false, // 현재 보고있는 정보 [전/후] 데이터를 보여줌 (default: 후)
    setCurrent: [
      { label: root.$v('변경 전'), value: true },
      { label: root.$v('변경 후'), value: false }
    ],
    dbEngineModal: false,
    externalDiskModal: {
      view: false,
      onlyVolume: false
    },

    gridModal: { // 선택 그리드 모달 설정
      view: false,
      title: undefined,
      selectable: false
    },

    gridModalColumnsTest: { // 그리드 모달 컬럼
      // [사양선택]
      spec: [
        { header: root.$v('이름'), binding: 'profileName' },
        { header: root.$v('vCPUs (개)'), binding: 'vcpu' },
        { header: root.$v('Memory'), binding: 'memory' }
      ],
      // [설치프로그램]
      installProgramList: [
        { header: root.$v('S/W Name'), binding: 'name' },
        { header: root.$v('Version'), binding: 'version' }
      ],
      // [연결호스트]
      vmList: [
        { header: root.$v('호스트명'), binding: 'hostname' }
      ]
    },

    gridModalColumns: [],
    gridModalData: [],
    gridCheckedRow: null,
    gridCheckedRowKey: undefined,

    installProgramModalView: false, // [설치프로그램] 모달 상태
    networkCateModalView: false, // [네트워크 카테고리] 모달 상태

    initDisk: null, // 초기 디스크 정보
    initSCSIController: null, // 초기 SCSI 컨트롤러 정보

    // 공통 > [호스트명] 규칙 목록
    hostnameRules: undefined,

    // 공통 > [운영그룹] 옵션 하드코딩
    manageGroupOptions: {},
    shareAccessTypeOptions: { // File Server > NFS > [Share Access Type] 옵션 하드코딩
      READ_WRITE: 'Read-Write',
      READ_ONLY: 'Read-Only',
      NONE: 'No Access'
    },
    // ---------
    // ---------
    // ---------
    // ---------

    /**
     * 변경 전 / 후 차이를 확인해서 style 클래스 생성
     * @param {String} binding
     */
    displayDiffStyle (binding) {
      return { '-diff': this.sourceColumnsDiff[binding] }
    },

    /**
     * 화면에 보일 read only 텍스트 설정 및 예외처리
     * @param {String} binding
     */
    displayReadOnlyText (binding) {
      const value = this.cloneData[binding]

      // masking 처리 정보
      const masking = val => {
        if (!val) return
        const string = []
        for (let i = 0; i < val.length; i++) string.push('*')
        return string.join('')
      }

      // 예외적으로 텍스트가 다르게 보여져야할 경우만 동작
      // 기본적으로는 key-value 바인딩
      const exception = {
        dbPassword: masking(value), // DB 패스워드
        initialDbName: masking(value), // DB Schema
        manageGroupIdx: this.manageGroupOptions[value], // 운영정보 (Compute/MP)
        shareAccessType: this.shareAccessTypeOptions[value] // Share Access Type (NFS)
      }[binding]

      // console.log(this.manageGroupOptions, binding, exception)
      return exception || this.cloneData[binding]
    },

    /**
     * 화면에 보일 [Local Disk] 이름 설정 (button-pop)
     */
    displayCountDiskList ({ displayExternalDiskList: lists }) {
      return lists ? lists.map(list => { return { label: `${list.diskSize} GB` } }) : []
    },

    /**
     * 화면에 보일 [Local Disk] 이름 설정
     */
    displayExternalDisk ({ displayExternalDiskList, externalDiskList }) {
      const check = data => (data && data.length >= 0) ? `${data.length} EA` : undefined
      const length = check(displayExternalDiskList) || check(externalDiskList) || this.$v('선택')

      // 표기?
      // const volumn = disk => this.$options.filters.volumnGroupSize(disk)
      // const detail = volumn(displayExternalDiskList) || undefined

      // return { detail, length }
      return length
    },

    /**
     * 화면에 보일 [설치프로그램] 이름 설정 (button-pop)
     */
    displayCountInstallProram ({ installProgramList }) {
      return installProgramList ? installProgramList.map(list => ({ label: list.osType })) : []
    },

    /**
     * 화면에 보일 [설치프로그램] 이름 설정
     */
    displayInstallProram ({ installProgramList }) {
      const length = (installProgramList && installProgramList.length + ' EA') || this.$v('선택')
      return length
    },

    /**
     * 화면에 보일 [사양선택] 이름 설정
     */
    displaySpec ({ profileName }) {
      return profileName || this.$v('선택') || '-'
    },

    /**
     * 화면에 보일 [DB Engine] 이름 설정
     */
    displayDBEngine ({ engineType }) {
      return engineType || this.$v('선택')
    },

    /**
     * 화면에 보일 [연결호스트] 이름 설정
     */
    displayVMList ({ vmList }) {
      const length = (vmList && vmList.length + ' EA') || this.$v('선택')
      return length
    },

    /**
     * 화면에 보일 [서비스개시일] 설정
     */
    displayServiceDate ({ serviceDate }) {
      const setDate = date => this.$options.filters.date(date, 'YYYY.MM.DD HH:mm')
      return (this.editable) ? new Date(serviceDate) : setDate(serviceDate)
    },

    /**
     * Size => Byte
     */
    sizeToByte: (size, unit) => {
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      if (size === 0 || !unit) return 0
      const idx = sizes.findIndex(s => s === unit)
      if (idx === 0) return size
      return (size * (1024 ** idx)).toFixed(0)
    },

    useTooltip () {

    },

    // ====
    // ====
    // ====
    // ====
    // ====
    // ====

    resourceTypeColumns: { // [자원 정보] 컬럼 세팅
      COMPUTE: [
        { header: root.$v('호스트명'), binding: 'hostname' },
        { header: root.$v('네트워크 카테고리'), binding: 'networkList', edit: 'custom', req: true },
        { header: root.$v('운영그룹'), binding: 'manageGroupIdx', edit: 'select' },
        { header: 'VCPU', binding: 'vcpu', edit: 'number', unit: 'Core', req: true },
        { header: root.$v('OS 이미지'), binding: 'osName', req: true },
        { header: 'Local Disk', binding: 'externalDiskList', edit: 'custom' },
        { header: root.$v('Memory'), binding: 'memory', edit: 'number', unit: 'GB', req: true },
        { header: root.$v('설치 프로그램'), binding: 'installProgramList', edit: 'custom', req: false },
        { header: 'Root Disk', edit: 'custom', binding: 'rootDiskSize', colspan: true, req: true },
        { header: root.$v('자원태그'), binding: 'tagInfo', edit: 'custom', colspan: true, req: false }
      ],
      // VMWARE: [],
      // VMTemplate: [],
      STORAGE: [
        { header: root.$v('volume 그룹명'), binding: 'storageName', edit: 'input', req: true },
        { header: root.$v('연결 호스트'), binding: 'vmList', edit: 'custom', req: true },
        { header: root.$v('운영그룹'), binding: 'manageGroupIdx', edit: 'select', req: true },
        { header: root.$v('신청 용량'), binding: 'diskList', edit: 'custom', req: true },
        { header: root.$v('volume 설명'), binding: 'storageDesc', edit: 'input', req: true, colspan: true }
      ],
      DATABASE: [
        { header: root.$v('호스트명'), binding: 'hostname' },
        { header: root.$v('네트워크 카테고리'), binding: 'networkList', edit: 'custom', req: true },
        { header: root.$v('운영그룹'), binding: 'manageGroupIdx', edit: 'select' },
        { header: 'DB Engine', binding: 'engineType', edit: 'custom', req: true },
        { header: root.$v('DB 계정'), binding: 'dbId', req: true },
        { header: 'DB Size', binding: 'rootDiskSize', edit: 'custom', req: true },
        { header: root.$v('DB 패스워드'), binding: 'dbPassword', req: true },
        { header: root.$v('설치 프로그램'), binding: 'installProgramList', edit: 'custom', req: false },
        { header: 'DB Schema', binding: 'initialDbName', edit: 'input', req: true },
        { header: root.$v('사양선택'), binding: 'spec', edit: 'custom', req: true },
        { header: root.$v('자원태그'), binding: 'tagInfo', edit: 'custom', colspan: true, req: false }
      ],
      MARKET: [
        { header: root.$v('호스트명'), binding: 'hostname' },
        { header: root.$v('네트워크 카테고리'), binding: 'networkList', edit: 'custom', req: true },
        { header: root.$v('운영그룹'), binding: 'manageGroupIdx', edit: 'select' },
        { header: 'VCPU', binding: 'vcpu', edit: 'number', unit: 'Core', req: true },
        { header: root.$v('OS 이미지'), binding: 'osName', req: true },
        { header: 'Local Disk', binding: 'externalDiskList', edit: 'custom' },
        { header: root.$v('Memory'), binding: 'memory', edit: 'number', unit: 'GB', req: true },
        { header: root.$v('설치 프로그램'), binding: 'installProgramList', edit: 'custom', req: false },
        { header: 'Root Disk', edit: 'custom', binding: 'rootDiskSize', colspan: true, req: true },
        { header: root.$v('자원태그'), binding: 'tagInfo', edit: 'custom', colspan: true, req: false }
      ],
      NETWORK_L4: [],
      NETWORK_L7: [],
      SECURITY: [],
      FILE_SERVER_SMB: [
        { header: 'Share name', binding: 'shareName', edit: 'input', req: true },
        { header: '네트워크 카테고리', binding: 'networkList', edit: 'custom', req: true },
        { header: '신청 용량', binding: 'maxSizeGiB', edit: 'number', unit: 'GB', req: true },
        { header: '프로토콜 타입', binding: 'protocolType' },
        { header: '스냅샷 사용 여부', binding: 'isSnapshot', edit: 'radio', req: true },
        { header: '차단 파일', binding: 'fileBlocking', edit: 'input' }
      ],
      FILE_SERVER_NFS: [
        { header: 'Share name', binding: 'shareName', edit: 'input', req: true },
        { header: '네트워크 카테고리', binding: 'networkList', edit: 'custom', req: true },
        { header: '신청 용량', binding: 'maxSizeGiB', edit: 'number', unit: 'GB', req: true },
        { header: '프로토콜 타입', binding: 'protocolType' },
        { header: '스냅샷 사용 여부', binding: 'isSnapshot', edit: 'radio', req: true },
        { header: '차단 파일', binding: 'fileBlocking', edit: 'input' },
        {
          header: 'Share access type',
          binding: 'shareAccessType',
          edit: 'select',
          req: true,
          options: [
            { label: 'Read-Write', value: 'READ_WRITE' },
            { label: 'Read-Only', value: 'READ_ONLY' },
            { label: 'No Access', value: 'NONE' }
          ]
        }

      ],
      VM: [
        { header: root.$v('호스트명'), binding: 'hostname' },
        { header: root.$v('네트워크 카테고리'), binding: 'networkList', edit: 'custom', req: true },
        { header: root.$v('운영그룹'), binding: 'manageGroupIdx', edit: 'select' },
        { header: 'VCPU', binding: 'vcpu', edit: 'number', unit: 'Core', req: true },
        { header: root.$v('OS 이미지'), binding: 'osName', req: true },
        { header: root.$v('Memory'), binding: 'memory', edit: 'number', unit: 'GB', req: true },
        { header: 'Root Disk', edit: 'custom', binding: 'rootDiskSize', req: true },
        { header: root.$v('설치 프로그램'), binding: 'installProgramList', edit: 'custom', req: false },
        { header: 'Local Disk', binding: 'externalDiskList', edit: 'custom', colspan: true },
        { header: root.$v('자원태그'), binding: 'tagInfo', edit: 'custom', colspan: true, req: false }
      ],
      VSAN_ISCSI: [
        { header: root.$v('별칭'), binding: 'alias', edit: 'input' },
        { header: root.$v('네트워크 카테고리'), binding: 'networkList', edit: 'custom', req: true },
        { header: root.$v('운영 그룹'), binding: 'manageGroupIdx', edit: 'select' },
        { header: root.$v('인증'), binding: 'authentication', edit: 'custom' },
        { header: root.$v('LUN'), binding: 'lunList', colspan: true }
      ]
    },

    // 🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧 나중에 컴포넌트화 할것 같음
    lunColumns: [ // lun 컬럼
      { binding: 'lunId', header: 'ID', width: 60 },
      { binding: 'alias', header: root.$v('별칭'), width: 100 },
      { binding: 'lunSize', header: root.$v('용량'), customHtml: true, width: 80 },
      { binding: 'status', header: root.$v('상태'), customHtml: true, width: 80 },
      { binding: 'spbmProfileName', header: root.$v('스토리지 정책'), customHtml: true }
    ],
    authOption: [ // 인증 컬럼
      { label: root.$v('없음'), value: 'NONE' },
      { label: 'CHAP', value: 'CHAP' },
      { label: root.$v('상호 CHAP'), value: 'MUTUAL_CHAP' }
    ],
    authOptionObj: {
      NONE: root.$v('없음'),
      CHAP: 'CHAP',
      MUTUAL_CHAP: root.$v('상호 CHAP')
    },
    // vSAN iSCSI 정규식
    regexInfo: {
      iqn: {
        condition: /^iqn\.[0-9]{4}-(0[1-9]|1[0-2])\.[a-z0-9]+(\.[a-z0-9]+)*(:[a-z0-9-.:]+)?$/g,
        alertMsg: '<div style="text-align: left;">vSAN에서 IQN을 자동으로 생성합니다.<br/>IQN을 입력하려는 경우 IQN은 다음과 같은 요구 사항을 충족해야 합니다.<br/><br /><small>* iqn.YYYY-MM.domain:Name 형식이어야 합니다.<br />* 마지막 필드(및 콜론)는 선택 사항입니다.<br />* 날짜가 유효해야 합니다(MM:01-12).<br />*ASCII 소문자("a"..."z"), 숫자(0-9) 및 특수 문자(-.:)만 허용됩니다.</small></div>'
      },
      tcpPort: {
        condition: (val) => (+val >= 1025) && (+val <= 65535),
        alertMsg: 'TCP 포트는 1025에서 65535 사이의 숫자여야 합니다.'
      },
      lunId: {
        condition: (val) => (+val >= 1) && (+val <= 255),
        alertMsg: 'LUN ID는 1에서 255 사이의 숫자여야 합니다.'
      },
      chapUserName: {
        condition: /^(?=.*[@_\-.:])[a-zA-Z0-9@_\-.:]+$/g,
        alertMsg: '<div style="text-align: left;">사용자 이름은 다음과 같은 요구 사항을 충족해야 합니다.<br/><br/><small>* 하나 이상의 문자를 포함해야 합니다.<br/>*허용되는 특수 문자는 (\'_\', \'-\', \'.\', \'@\', \':\')입니다.<br/>* 특수 문자로 시작할 수 없습니다.<br />* 표시되는 ASCII 문자만 사용해야 합니다.</small></div>'
      },
      chapPassword: {
        condition: /^(?!\s)(?!.*\s$)(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%&^*])[ -~]{12,16}$/g,
        alertMsg: '<div style="text-align: left;">암호는 다음과 같은 요구사항을 충족해야 합니다.<br/><br/><small>* 12-16자 사이의 길이,<br>* 대문자 1자 이상, <br/>* 소문자 1자 이상, <br/>* 숫자 1자 이상, <br />* 특수 문자(!, @, #, $, %, &, ^, *) 1자 이상, <br />* 공백을 포함하여 표시되는 ASCII 문자만, <br />* 공백으로 시작하거나 끝날 수 없습니다.</small></div>'
      }

    }
  })
}
</script>

<style lang="scss" scoped>
.resource-info-wrapper {
  max-height: 800px;
  overflow-y: auto;

  .-diff {
    color: $main-red;
    &::v-deep .button {
      border-color: $main-red;
      color: $main-red;
    }
  }
  .-unit { margin-left: 5px; }
  > .tab:first-child {
    margin-bottom: 40px;

    .button-area { margin-bottom: $gap-s; }
  }
  .service-time-select {
    width: 65px !important;
    margin-left: 15px;
    margin-right: 5px;
  }

  .mdi {
    margin-left: $gap-s;
    color: $main-blue;
  }

  // 🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧 나중에 컴포넌트화 할것 같음
  .auth-detail-list {
    display: flex;
    flex-direction: column;
    gap: $gap-s;
    margin-top: $gap-s;
    padding: $gap;
    border-radius: $radius;
    &.-light { border: 1px solid #eee; }
    &.-dark { background-color: #070a20; }
    > li {
      display: flex;
      align-items: flex-start;
      > b {
        display: block;
        margin-top: 6px;
        min-width: 150px;
        font-weight: normal;
      }
    }
    .auth-password-wrap {
      display: flex;
      gap: $gap-s;
      width: 100%;
    }
  }
}
</style>
