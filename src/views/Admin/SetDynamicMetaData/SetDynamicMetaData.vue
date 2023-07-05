<template>
  <div
    class="set-dynamic-meta-form"
    v-loading="loading.isGetMetaForm"
  >
    <section class="form-area">
      <g-tab
        :data="moduleTypes"
        :padding-top="20"
        @click="row => {
          activeModule = row.field
          activeServiceName = resourceList[activeModule]
            ? resourceList[activeModule][0].value
            : 'COMPUTE'
        }"
      />
      <div class="form-area-contents">
        <ul class="resource-list side-tree-area">
          <li>
            <card-row
              v-for="resource in resourceList[activeModule]"
              :key="resource.value"
              :data="resource"
              :selected-card="activeServiceName"
              @selectCard="param => {
                activeServiceName = param
                setFormByService()
              }"
              :use-index="false"
            />
          </li>
        </ul>

        <div class="meta-list-wrap">
          <div class="load-form">
            <span>{{ $v('불러오기') }}</span>
            <el-select
              class="load-form-select"
              v-model="loadResource"
              :popper-append-to-body="false"
              :placeholder="$v('불러 올 폼 선택')"
              @change="changeLoadResource"
            >
              <el-option
                v-for="item in loadResourceOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <div class="meta-list tiny-scroll">
            <draggable
              :list="forms"
              handle=".drag-btn"
            >
              <register-contents
                v-for="(item ,idx) in forms"
                :key="idx + '_cate'"
                :title-width-px="300"
                class="meta-item-wrap"
              >
                <div
                  class="flex-wrap"
                  slot="title"
                  style="gap: 10px;"
                >
                  <a
                    slot="header-prefix"
                    class="-draggable-icon drag-btn"
                  />
                  <el-checkbox
                    v-model="item.required"
                    class="meta-item-required-checkbox"
                    @change="changeItemResuired(item, $event)"
                  >
                    {{ $v('필수') }}
                  </el-checkbox>
                  <div class="meta-item-title">
                    <el-input
                      class="meta-item-title-input"
                      v-model="item.title"
                      placeholder="label"
                    />
                    <el-input
                      class="meta-item-title-input"
                      v-model="item.key"
                      placeholder="key"
                      style="margin-top: 5px"
                      @input="() => {
                        testUsableKey(item, idx)
                      }"
                      @change="testKeyChanged(item, idx)"
                    />
                  </div>
                </div>

                <draggable
                  :list="[]"
                  :group="{name: 'componentGroup', pull: false, put: true}"
                  draggable=".-draggable-icon"
                  :sort="false"
                  ghost-class="ghost"
                  @change="changeFormItem(...arguments, idx)"
                >
                  <div style="position: relative;">
                    <span
                      class="is-pub-switch"
                      v-show="item.type"
                    >
                      <small style="margin-right: 5px;">{{ $v('사용자 포탈 노출') }}</small>
                      <el-switch v-model="item.isShownUser" />
                    </span>
                    <i
                      class="-delete-icon -delete-btn"
                      @click.stop="deleteItem(idx)"
                    />
                    <small
                      v-if="!item.type"
                      class="empty-text"
                      @dragenter="(e)=>onDragEnter(e)"
                      @dragleave="(e)=>onDragLeave(e)"
                    >
                      {{ $v('컴포넌트를 Drag & Drop으로 옮기세요.') }}
                    </small>
                    <div
                      v-else
                      class="meta-item"
                    >
                      <a
                        v-if="!item.isEdit"
                        class="-edit-icon -edit-btn"
                        @click="() => {
                          item.isEdit = true
                          item.beforeAtt = JSON.parse(JSON.stringify(item.customAtt))
                          $forceUpdate()
                        }"
                      />

                      <meta-component-element
                        :type="item.type"
                        :default-data="item.data"
                        :custom-att="item.customAtt"
                        :group-tree-data="groupTreeData"
                        style="padding-right: 180px;"
                      />

                      <div
                        v-if="item.isEdit"
                        class="meta-item-att"
                        style="margin-top: 20px;"
                      >
                        <div class="att-editing-btns">
                          <button
                            class="button save-btn"
                            size="is-mini"
                            type="is-primary"
                            @click="saveItemCustomAtt(item)"
                          >
                            {{ $v('저장') }}
                          </button>
                          <a
                            class="clear-icon -clear-btn"
                            @click="(e) => {
                              item.customAtt = JSON.parse(JSON.stringify(item.beforeAtt))
                              item.isEdit = false
                              $forceUpdate()
                            }"
                          />
                        </div>
                        <meta-component-custom-att
                          :type="item.type"
                          :custom-att="item.customAtt"
                        />
                      </div>
                    </div>
                  </div>
                </draggable>
              </register-contents>
            </draggable>
            <div class="add-area">
              <a
                class="mdi mdi-plus-circle"
                @click="addCate"
              />
            </div>
          </div>

          <div class="button-area -center page-bottom">
            <button
              class="button -cancel"
              type="is-anti"
              size="is-middle"
              @click="resetForm"
            >
              {{ $v('초기화') }}
            </button>
            <button
              class="button -cancel"
              size="is-middle"
              @click="modal.previewView = true"
            >
              {{ $v('미리보기') }}
            </button>
            <button
              class="button -confirm"
              type="is-primary"
              size="is-middle"
              @click="saveForm"
            >
              {{ $v('저장') }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <i class="db-arrow-icon" />

    <dashboard-panel
      title="컴포넌트"
      class="component-area"
    >
      <template #header>
        <a
          class="expand-button"
          @click.stop="isAllExpand = !isAllExpand"
        >
          {{ isAllExpand ? $t('common.BTN.fold') : $t('common.BTN.expand') }}
        </a>
      </template>
      <draggable
        :list.sync="components"
        class="component-list tiny-scroll"
        draggable=".component-item"
        :animation="250"
        :clone="cloneComponent"
        handle=".-draggable-icon"
        @start="onDragStart"
        @end="onDragEnd"
        :group="{name: 'componentGroup', pull: 'clone', put: false}"
        :sort="false"
      >
        <dynamic-meta-component-item
          class="component-item"
          v-for="comp in components"
          :key="comp"
          :type="comp"
          :ref="'componentRef_' + comp"
          :is-collapsed="!isAllExpand"
        />
      </draggable>
    </dashboard-panel>

    <el-dialog
      :title="`[${capitalize(activeModule)}] ${capitalize(activeServiceName)} 미리보기`"
      :visible.sync="modal.previewView"
      width="1350px"
      top="5vh"
    >
      <component
        v-if="modal.previewView"
        :is="activeServiceForm"
        :init-step-index="forms.length ? 1 : 0"
        :custom-meta-form-data="forms"
        @close="closePreviewModal()"
        in-admin
        read-only
        :height="activeServiceName === 'MARKET' ? 'calc(72vh - 186px)' : '72vh'"
        :market-product-info="activeServiceName === 'MARKET' ? maketProductInfoSample : undefined"
      />
    </el-dialog>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import API, { DashboardPanel, MetaComponentElement, NXComputeUpdateForm, NXDatabaseUpdateForm, NXShareUpdateForm, NXStorageUpdateForm, VMwareComputeUpdateForm, VMwareIscsiUpdateForm, NetworkL4UpdateForm, NetworkL7UpdateForm, NetworkSgUpdateForm } from '@sd-fe/cmp-core'

import draggable from 'vuedraggable'
import { cloneDeep, groupBy, uniqBy, isEmpty } from 'lodash'
import CardRow from '@/components/ConfigAws/CardRow'
import DynamicMetaComponentItem from './DynamicMetaComponentItem.vue'
import MetaComponentCustomAtt from './MetaComponentCustomAtt.vue'

export default {
  name: 'SetDynamicMetaData',
  components: {
    draggable,
    DashboardPanel,
    CardRow,
    DynamicMetaComponentItem,
    'meta-component-element': MetaComponentElement,
    MetaComponentCustomAtt,

    NXComputeUpdateForm,
    NXStorageUpdateForm,
    NXDatabaseUpdateForm,
    NXShareUpdateForm,
    VMwareComputeUpdateForm,
    VMwareIscsiUpdateForm,
    NetworkL4UpdateForm,
    NetworkL7UpdateForm,
    NetworkSgUpdateForm
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      moduleInfo: state => state.cloud.moduleInfo
    }),
    activeServiceForm () {
      return {
        COMPUTE: NXComputeUpdateForm,
        MARKET: NXComputeUpdateForm,
        STORAGE: NXStorageUpdateForm,
        DATABASE: NXDatabaseUpdateForm,
        FILE_SERVER: NXShareUpdateForm,
        VM: VMwareComputeUpdateForm,
        VSAN_ISCSI: VMwareIscsiUpdateForm,
        NETWORK_L4: NetworkL4UpdateForm,
        NETWORK_L7: NetworkL7UpdateForm,
        SECURITY: NetworkSgUpdateForm
      }[this.activeServiceName]
    }
  },
  watch: {
    activeModule: {
      handler () { this.setFormByService() }
    }
  },
  async created () {
    await this.getServiceList()
    await this.getManageTree()

    this.activeServiceName = this.resourceList[this.activeModule]
      ? this.resourceList[this.activeModule][0].value
      : 'COMPUTE'

    this.setFormByService()
  },
  methods: {
    /**
     * 선택 서비스(자원)에 해당하는 폼 정보를 불러옵니다.
     */
    async setFormByService (csp = this.activeModule, service = this.activeServiceName) {
      if (!csp || !service) return
      const serviceInfo = await this.getMetadataForm(csp, service)
      if (!serviceInfo) return

      const { dataForm } = serviceInfo
      const forms = JSON.parse(dataForm)

      this.originForms = [...forms]
      console.log('@forms::', forms)

      this.forms = forms.map(form => ({
        ...form,
        isShownUser: !!form?.isShownUser || false
      }))
    },
    // 드래그 이벤트
    onDragEnter (e) {
      e.preventDefault()
      e.target.classList.add('-drag-over')
    },
    onDragLeave (e) {
      e.preventDefault()
      e.target.classList.remove('-drag-over')
    },
    /**
     * 드래그가 끝났을 때, 모든 .empty-text, .meta-item 의 '-drag-over' 클래스를 제거합니다.
     * @param {event} e 드래그 끝났을 때, 커스텀 event
     */
    onDragEnd (e) {
      e.item.classList.remove('-dragging')

      const emptyNodes = document.querySelectorAll('.empty-text')
      const contentsNodes = document.querySelectorAll('.meta-item')

      emptyNodes.forEach(node => {
        node.classList.remove('-drag-over')
      })
      contentsNodes.forEach(node => {
        node.classList.remove('-drag-over')
      })
    },
    onDragStart (e) {
      this.draggingEl = e
      e.item.classList.add('-dragging')
    },
    /**
     * item 드래그 시, deep clone을 합니다.
     */
    cloneComponent (componentType) {
      const ref = this.$refs[`componentRef_${componentType}`]
      if (!ref) return

      const sendData = ref[0].activeType
      const { type, data, customAtt } = sendData
      return cloneDeep({ type, data, customAtt })
    },
    addCate () {
      const newItem = {}

      this.$set(newItem, 'title', '')
      this.$set(newItem, 'data', '')
      this.$set(newItem, 'required', false)
      this.$set(newItem, 'isShownUser', false)
      this.$set(newItem, 'isNew', true) // 새로 추가된 항목임을 알기 위해서...
      this.forms.push(newItem)
    },
    deleteItem (idx) {
      this.$confirm('해당 항목을 삭제하시겠습니까?', '', {
      }).then(() => {
        this.forms.splice(idx, 1)
      }).catch(() => false)
    },
    /**
     * 드래그 드랍할 때 발생 이벤트
     * @param {Object} parameter 드래그 앤 드롭된 데이터
     */
    changeFormItem (parameter, idx) {
      const addedData = parameter?.added?.element
      if (!addedData) return

      const { type, data, customAtt, isShownUser } = addedData

      this.forms[idx].type = type
      this.forms[idx].data = data
      this.forms[idx].customAtt = customAtt
      this.forms[idx].isShownUser = isShownUser || false

      console.log('customAtt', customAtt)

      if (customAtt?.minLength && +customAtt?.minLength) this.forms[idx].required = true
      this.$forceUpdate()
    },
    /**
     * [디바운싱] key 중복 테스트
     * @param {Object} item 검사할 item
     * @param {Number} index 검사할 대상의 index (새로 추가 시 null)
     */
    async testUsableKey (item, index = null) {
      const test = async () => {
        let isAvailable = true
        this.forms.forEach((form, idx) => {
          if (idx !== index && form.key === item.key) {
            isAvailable = false
            return false
          }
        })
        item.isAvailableKey = isAvailable
      }

      if (this.timer) clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        test()
        this.$forceUpdate()
      }, 300)
    },
    /**
     * key가 변경되었는지 테스트
     * @param {Object} item 검사할 item
     * @param {Number} index 검사할 대상의 index
     */
    testKeyChanged (item) {
      if (item.isNew) return
      if (!item?.key?.trim()) return

      const isKeyChanged = this.originForms.find(data => data?.key === item?.key)
      if (!isKeyChanged) {
        return this.$alert('key 정보가 변경됩니다.<br>기존 key를 사용 중인 페이지에서 데이터 노출이 불가능합니다.', {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      }
    },
    /**
     * 불러오기 폼 선택
     */
    changeLoadResource (val) {
      const [csp, service] = val.split('-')

      this.$confirm(`<b>${this.capitalize(csp)} - ${this.capitalize(service)}</b><br/>메타데이터 폼을 불러오시겠습니까?`, '', {
        dangerouslyUseHTMLString: true
      }).then(() => this.setFormByService(csp, service))
        .catch(() => false)

      this.loadResource = ''
    },
    /**
     * 현 라이센스 버전에 포함되는 서비스 조회
     */
    async getServiceList () {
      try {
        const services = await API.work_v3.getVersionServiceList()

        const groupedByCsp = groupBy(services, 'module')
        // { NUTAIX: [...], VMWARE: [...] }

        // 서비스 순서가 정렬된 Csp별 자원 목록
        const orderedResourceCsp = this.setServiceOrder(groupedByCsp)

        const loadResourceOptions = []

        for (const [key, value] of Object.entries(orderedResourceCsp)) {
          if (key === 'AWS') continue
          this.moduleTypes.push({
            name: this.capitalize(key),
            field: key
          })

          const moduleResourceList = value.map(sv => {
            loadResourceOptions.push({
              label: `${this.capitalize(key)} - ${this.capitalize(sv.service)}`,
              value: `${key}-${sv.service}`
            })

            return {
              value: sv.service,
              name: this.capitalize(sv.service)
            }
          })

          this.resourceList[key] = uniqBy(moduleResourceList, 'value')
        }
        this.loadResourceOptions = uniqBy(loadResourceOptions, 'value')
      } catch (error) {
        console.error(error)
      }
    },
    /**
     * 서비스 목록을 순서 정렬 (기반: Cloud.store > moduleInfo > .serviceResources)
     */
    setServiceOrder (groupedByCsp) {
      if (!isEmpty(this.moduleInfo)) {
        const moduleServices = {}
        for (const [key, value] of Object.entries(groupedByCsp)) {
          const basic = this.moduleInfo[key.toLowerCase()].serviceResources.map(({ id }) => ({
            module: key,
            service: id
          }))
          const serviceList = value.map(item => item.service)
          moduleServices[key] = basic.filter(item => serviceList.includes(item.service))
        }
        return moduleServices
      } else return groupedByCsp
    },
    /**
     * 관계사-그룹 트리 데이터 조회
     */
    async getManageTree () {
      try {
        const response = await API.iam.getGroupManageTree()
        if (!response) return
        this.groupTreeData = [...response]
      } catch (error) {
        this.groupTreeData = []
        console.error(error)
      }
    },
    /**
     * 폼 저장 가능 validation
     */
    isSavableForm () {
      let flag = true
      let message = ''

      this.forms.forEach((form, idx) => {
        if (!form.title?.trim()) message = this.$v('label을 입력하지 않은 항목이 있습니다.')
        else if (!form.key?.trim()) message = this.$v('key를 입력하지 않은 항목이 있습니다.')
        else if (form.isAvailableKey === false) message = this.$v('key가 중복된 항목이 있습니다.')
        else if (form.type === undefined) message = this.$v('컴포넌트를 할당하지 않은 항목이 있습니다.')
        else if (form?.customAtt?.options) {
          const optionsValue = form.customAtt.options.map(option => option.value)
          const isOptionsUnique = (new Set(optionsValue)).size === optionsValue.length
          if (!isOptionsUnique) message = `${form.title}(${form.key})의 옵션에<br>중복된 value가 있습니다.`
        }

        if (message) {
          flag = false
          return false
        }
      })

      if (message) {
        this.$alert(message, {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      }
      return flag
    },

    saveForm () {
      if (!this.isSavableForm()) return

      const forms = this.forms.map(form => {
        const { beforeAtt, isEdit, isAvailableKey, isRef, isNew, ...rest } = form
        return { ...rest, isShownUser: rest.isShownUser || false }
      })

      try {
        this.$confirm(`${this.capitalize(this.activeModule)} > ${this.capitalize(this.activeServiceName)} 폼을 저장하시겠습니까?`, '', {
        }).then(async () => {
          const payload = {
            userId: this.user.userId,
            dataForm: JSON.stringify(forms)
          }

          await API.work_v3.updateMetadataForm(
            this.activeModule,
            this.activeServiceName,
            payload
          )
          this.$alert(this.$v('저장되었습니다.'), () => this.setFormByService())
        }).catch(() => false)
      } catch (error) {
        this.$alert(this.$v('메타데이터 폼 저장에 문제가 발생했습니다.'), () => false)
        console.error(error)
      }
    },

    async getMetadataForm (csp = this.activeModule, service = this.activeServiceName) {
      try {
        this.loading.isGetMetaForm = true
        const result = await API.work_v3.getMetadataForm(
          csp,
          service
        )
        return result || null
      } catch (error) {
        console.error('메타데이터 조회 에러: ', error)
      } finally { this.loading.isGetMetaForm = false }
    },
    /**
     * 커스텀 속성 저장 시 발생 이벤트
     */
    saveItemCustomAtt (item) {
      item.isEdit = false
      if (item.customAtt?.minLength && +item.customAtt.minLength && !item.required) {
        item.required = true
        this.$alert(this.$v('minLength 설정으로 필수 항목으로 전환합니다.'), () => false)
      }
      this.$forceUpdate()
    },
    /**
     * 필수 토글 시 발생 이벤트
     * minLength가 설정되어 있는데 필수 아님으로 전환 시, minLength를 비워줌.
     */
    changeItemResuired (item, val) {
      if (item.customAtt?.minLength && +item.customAtt.minLength && !val) {
        item.customAtt.minLength = ''
        this.$alert(this.$v('필수 항목 제거로 minLength 설정을 초기화합니다.'), () => false)
      }
    },
    /**
     * 미리보기 모달을 닫습니다.
     */
    closePreviewModal () {
      this.modal.previewView = false
    },
    capitalize (val) {
      if (!val) return ''
      if (val === 'MARKET') return this.$v('마켓플레이스')
      else if (val === 'VMWARE') return 'VMware'
      else if (val === 'FILE_SERVER') return 'File Server'
      else if (val === 'VM') return 'VM'
      else if (val === 'VSAN_ISCSI') return 'vSAN iSCSI'
      return this.$options.filters.capitalize(val)
    },
    /**
     * [초기화] 버튼 클릭 시 발생 이벤트
     */
    resetForm () {
      this.$confirm('변경 사항을 정말 초기화 하시겠습니까?').then(async () => {
        this.setFormByService()
      }).catch(() => false)
    }

  },
  data: (root) => ({
    activeModule: 'NUTANIX',
    activeServiceName: '',
    moduleTypes: [],
    loadResource: '', // 불러 올 자원 폼
    loadResourceOptions: [],
    draggingEl: null,
    isAllExpand: false, // 전체 펼침?
    loading: {
      isGetMetaForm: true
    },
    resourceList: {},

    components: ['text', 'textarea', 'radio', 'checkbox', 'combobox', 'toggle', 'datepicker', 'dateTimePicker', 'groupTree', 'groupAccount'],
    forms: [],
    originForms: [],

    modal: {
      groupTree: false,
      groupAccountView: false,
      previewView: false // 미리보기
    },
    groupTreeModalTitle: '',
    groupAccountViewTitle: '',
    groupTreeData: [],
    selectedGroups: null,
    selectedAccounts: [],

    maketProductInfoSample: {

      bpDescriptions: [],
      bpIdx: 265,
      bpImg: {
        bpImgIdx: 267,
        bpIdx: 265,
        bpUuid: '7b4c54b9-ad02-4138-85ba-ff9877248617',
        imageUuid: '0e3ffba3-d831-4993-adab-c70922654c80',
        imageName: 'CMP_CentOS-7.9.2009.qcow2',
        deviceType: 'DISK',
        adapterType: 'SCSI',
        isDeleted: null,
        userImageIdx: 1,
        centralIdx: 4,
        osType: 'LINUX',
        osBit: 'X64',
        osName: 'CentOS',
        osDesc: '',
        osRootDiskSize: 50,
        swIdx: 1,
        imageOsType: 'CENTOS_7_6'
      },
      bpInfo: {
        isPub: true,
        bpIdx: 265,
        category: 'WAS',
        iconImage: '',
        summary: 'Sample',
        swIdxList: '[21,10]'
      },
      bpName: '[SAMPLE] CMP_APACHE_CENTOS-7',
      bpState: 'ACTIVE',
      bpUuid: '7b4c54b9-ad02-4138-85ba-ff9877248617',
      isDeleted: false,
      osInfo: 'LINUX CentOS 7.6 xX64',
      osType: 'LINUX',
      pgName: 'APACHE',
      pgPort: '80',
      pgVersion: '2.4.6-89',
      specVersion: 1,
      swIdxList: null,
      swIdxListArr: []
    }
  })
}
</script>

<style lang="scss" scoped>
  .set-dynamic-meta-form {
    display: flex;
    align-items: flex-start;
  }
  .component-area {
    margin-top: 5px;
    min-width: 350px;
    &::v-deep .panel-head {
      padding: 7px 0;
    }
    .component-list {
      overflow-y: auto;
      max-height: 790px;
      transition: all .5s;
    }
    .dynamic-meta-component-item {
      & + .dynamic-meta-component-item { margin-top: $gap-s; }
      &.-dragging {
        color: $color-black;
        background-color: #fff !important;
        border-color: #fff !important;
      }
    }
  }
  .form-area {
    width: calc(100% - 437px);
    &-contents {
      display: flex;
      gap: 30px;
    }
    .resource-list {
      padding: $gap;
      width: 270px;
      max-width: 270px;
      min-height: 755px;
      max-height: 755px;
    }
    .meta-list-wrap {
      width: 100%;
      .load-form {
        display: flex;
        gap: $gap;
        align-items: center;
        margin-bottom: $gap;
        &-select { width: 232px; }
      }
      .meta-list {
        overflow-y: auto;
        height: 650px;
        max-width: 870px;

        .empty-text {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          // margin-right: $gap * 2;
          height: 45px;
          font-size: 13px;
          border: 1px dashed $input-stroke;
          border-radius: $radius-s;
          color: $input-placeholder;
          &.-drag-over {
            background-color: rgba($color: $purple-blue, $alpha: .2);
            border-color: $purple-blue;
          }
        }
        .meta-item-title {
          position: relative;
          .mdi-information-outline {
            position: absolute;
            bottom: 5px;
            right: -20px;
            color: #d95252;
            &::before { font-size: 17px; }
          }
        }
        .meta-item-title-input {
          &::v-deep .el-input__inner {
            border: 1px solid lighten($input-stroke, 7%);
          }
        }
        .meta-item-required-checkbox {
          &::v-deep .el-checkbox__inner {
            border: 1px solid lighten($input-stroke, 7%);
          }
          &::v-deep .el-checkbox__label { color: $input-placeholder; }
        }
        .meta-item {
          position: relative;
          // padding-right: $gap * 2;
          &.-drag-over {
            position: relative;
            &:after {
              content: '';
              position: absolute;
              top: 0;
              bottom: 0;
              left: 0;
              right: 0;
              background-color: rgba($color: $purple-blue, $alpha: .2);
              border: $purple-blue dashed 1px;
              z-index: 10;
            }
          }
          .-edit-btn {
            position: absolute;
            top: 7px;
            right: 5px;
          }

          .editing-btns {
            display: flex;
            gap: 10px;
            position: absolute;
            top: 5px;
            right: -20px;
          }
        }

        &::v-deep .register-contents {
        .contents { display: flex; align-items: center; }
        }
      }
    }
  }
  .add-area {
    display: flex;
    justify-content: center;
    margin: $gap 0;
    > .mdi {
      -webkit-filter: invert(50%);
      filter: invert(50%);
      &:hover {color: $main-red;}
    }
  }
  .is-pub-switch {
    position: absolute;
    top: 5px;
    right: 35px;
    z-index: 1;
  }
  .-delete-btn {
    position: absolute;
    top: 8px;
    right: -20px;
    cursor: pointer;
  }
  .db-arrow-icon {
    display: inline-block;
    margin: 0 $gap-m;
    min-width: 27px;
    width: 27px;
    height: 865px;
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
    background-image: url('../../../assets/images/icon-dbarrow-left@3x.png');
  }
  .ghost {
    display: none;
  }

  .register-contents:first-child { border-top: 1px solid $purple-gray; }

  .-draggable-icon {
    display: inline-block;
    margin-right: $gap-s;
    width: 20px;
    height: 12px;
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
    background-image: url('../../../assets/images/icon-dnd.svg');
  }

  .meta-item-att {
    padding: 20px;
    border-radius: $radius;
    background-color: $ticket-back-color;
    .att-editing-btns {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-bottom: 10px;
      .clear-icon {
        cursor: pointer;
        display: block;
        background: url('../../../assets/images/icon-input-clear.svg') no-repeat;
        width: 20px;
        height: 20px;
      }
    }
  }
</style>
