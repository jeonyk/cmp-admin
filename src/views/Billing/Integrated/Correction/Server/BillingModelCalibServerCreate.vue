<template>
  <div
    v-loading="isLoadingGetData"
    class="billing-model-calib-server-create"
  >
    <billing-model-calib-create-content
      :model-items="registeredServerList"
      :is-server="true"
      :center-list="centerOptions"
      :server-map="serverMap"
      :fallback-update-model="fallbackUpdateModel"
      @add-server-or-company="onClickAddContent"
      @remove-register-item="onRemoveRegisteredItem"
      @fetch-model="onFetchModel"
      @load-models="onLoadSimpleModels"
    />
    <el-dialog
      :title="$v('서버 추가')"
      width="90%"
      :visible="isOpenedServerAddModal"
      @close="isOpenedServerAddModal = false"
      v-loading="(loading.company && loading.group) || isLoadingVmData"
    >
      <div class="form-wrap tiny-scroll">
        <!-- 버튼 및 태그확인 영역 -->
        <div class="form">
          <div class="form-flex__row">
            <span class="form-label">{{ $v("과금 모델 적용") }}</span>
            <button
              class="button apply-btn"
              @click="isOpendBillingSelect = true"
            >
              {{ $v("과금 모델 선택") }}
            </button>
            <span
              v-if="selectedBillingModel"
              class="selected-bill"
            >
              <span class="selected-bill-name">
                {{ selectedBillingModel.name }}
              </span>
              <span class="selected-bill-action">
                <i
                  class="mdi mdi-close"
                  @click="onRemoveSelectedBillingModel"
                />
              </span>
            </span>
          </div>
          <div class="form-flex__row">
            <span class="form-label">{{ $v("선택 서버") }}</span>
            <template v-if="checkedServerList && checkedServerList.length">
              <div class="selected-servers">
                <clearable-tag
                  v-for="server in checkedServerList"
                  unique-key="hostName"
                  :split-string-replace-icon="false"
                  :key="server.hostName"
                  :content="getServerTag(server)"
                  @clear-raw="() => onClearServerTag(server)"
                  split-string="|"
                />
              </div>
            </template>
            <span
              v-else
              class="form-value__is-empty"
            >
              {{ $v("서버를 선택해주세요.") }}
            </span>
          </div>
        </div>

        <div class="filter">
          <filtering-component
            style="margin-top: 20px;"
            class="filter-comp"
            @reset-data="onResetFilter"
          >
            <div class="flex-between">
              <div class="filter-wrap margin">
                <div class="filter-form">
                  <span class="filter-name">
                    {{ $v("관계사") }}
                  </span>
                  <searchable-select
                    v-model="serverFilter.group"
                    :options="companyOptions"
                  />
                </div>
              </div>
              <div class="filter-wrap">
                <div class="filter-form">
                  <el-select
                    v-model="serverFilter.searchCategory"
                    :placeholder="$v('검색 선택')"
                  >
                    <el-option
                      v-for="option in searchCategoryOptions"
                      :key="option.value"
                      :value="option.value"
                      :label="option.label"
                    />
                  </el-select>
                </div>
                <div class="filter-form">
                  <search-component
                    v-model="serverFilter.searchKeyword"
                    :placeholder="$v('검색어 입력')"
                  />
                </div>
              </div>
            </div>
          </filtering-component>
        </div>

        <cmp-grid
          ref="serverGrid"
          :item-source="filteredGridData"
          :columns="serverAddGridColumns"
          :changing-page-reset="false"
          :init-custom-action="onInitGrid"
          use-checkbox
          header-checkbox
          @checkedRowsData="onCheckServer"
        >
          <template #ipAddress="{ row }">
            <span v-if="row.moduleType === 'VMware' && row.ipAddress && row.ipAddress.length === 1">
              {{ row.ipAddress[0] }}
            </span>
            <el-tooltip
              v-else-if="row.moduleType === 'VMware' && row.ipAddress && row.ipAddress.length > 1"
              effect="light"
            >
              <span>{{ row.ipAddress[0] }} 외 {{ row.ipAddress.length - 1 }}</span>
              <div slot="content">
                <div
                  v-for="ip in row.ipAddress"
                  :key="ip"
                >
                  {{ ip }}
                </div>
              </div>
            </el-tooltip>
          </template>
          <template #cost="{ row }">
            <!-- <cmp-status-tag
              v-if="
                simulateInterval.state === SIMULATE_STATE.PROGRESS &&
                  !isLoadedPrevMonthBill
              "
              tag-type="progress"
            >
              {{ $v("진행중") }}
            </cmp-status-tag> -->
            <span v-if="!row.cost && row.cost === 0">
              0
            </span>
            <span v-else-if="!row.cost">
              -
            </span>
            <span v-else>
              {{ row.cost | moneyFormat }}
            </span>
          </template>
          <template #finishCost="{ row }">
            <cmp-status-tag
              v-if="simulateInterval.state === SIMULATE_STATE.PROGRESS"
              tag-type="progress"
            >
              {{ $v("진행중") }}
            </cmp-status-tag>
            <span v-else>
              <span v-if="!row.finishCost && row.finishCost === 0">
                0
              </span>
              <span v-else-if="!row.finishCost">
                -
              </span>
              <span v-else>
                {{ row.finishCost | moneyFormat }}
              </span>
            </span>
          </template>
        </cmp-grid>
      </div>

      <!--푸터 버튼 영역-->
      <section
        class="modal-button-area"
        style="margin-top: 40px;"
      >
        <button
          class="button"
          type="is-anti"
          @click="onCloseCreateServerModal"
        >
          {{ $v("취소") }}
        </button>
        <button
          class="button"
          type="is-primary"
          :disabled="!checkedServerList || !checkedServerList.length"
          @click="onAddCheckedServerList"
        >
          {{ $v("등록") }}
        </button>
      </section>
    </el-dialog>

    <!--과금모델 선택 (모달)-->
    <modal-billing-model-calib-billing-select
      :visible="isOpendBillingSelect"
      @close="isOpendBillingSelect = false"
      @register-billing-model="onChangeSimulateBillingModel"
    />
  </div>
</template>

<script>
import BillingModelCalibCreateContent from '../Common/BillingModelCalibCreateContent.vue'
import ModalBillingModelCalibBillingSelect from '../Common/Modal/ModalBillingModelCalibBillingSelect.vue'
import API, { ClearableTag } from '@sd-fe/cmp-core'
import { uniqueId, omit } from 'lodash'
import { EventBus } from '@/components/Billing/Correction/CorrectionEventBus'
import { mapGetters } from 'vuex'
import dayjs from 'dayjs'

const __SIMULATE_INTERVAL_DELAY__ = 2000
const __SIMULATE_STATE__ = {
  UNKNOWN: 'UNKNOWN',
  SUCCESS: 'SUCCESS',
  PROGRESS: 'PROGRESS'
}

export default {
  name: 'BillingModelCalibServerCreate',
  components: {
    BillingModelCalibCreateContent,
    ModalBillingModelCalibBillingSelect,
    ClearableTag
  },
  watch: {
    isOpenedServerAddModal (active) {
      if (active) {
        const currentMap = this.getCurrentMap()
        const registerServers = currentMap.registeredServerList
        const registerHostNames = registerServers.map(
          server => server.hostName
        )
        const checked = []

        this.gridData.forEach(server => {
          if (registerHostNames.includes(server.hostName)) {
            server.checked = true
            checked.push(server)
          } else {
            server.checked = false
          }
        })

        currentMap.checkedServerList = checked
        this.checkedServerList = currentMap.checkedServerList

        if (this.$refs.serverGrid) {
          this.$refs.serverGrid.changedCheckbox()
        }
      }
    }
  },
  computed: {
    ...mapGetters({
      cloud: 'cloud/getCloud',
      getProject: 'project/getProject'
    }),
    serverMap () {
      return {
        registeredServerList: this.registeredServerList,
        checkedServerList: this.checkedServerList
      }
    },
    isEdit () {
      return !!(
        this.$route.query &&
        this.$route.query.edit &&
        this.$route.query.id
      )
    },
    companyOptions () {
      return [].concat(
        [{ label: this.$v('전체'), value: null }],
        this.companyList.map(el => ({ label: el.label, value: el.groupIdx }))
      )
    },
    centerOptions () {
      return [].concat(
        [{ label: this.$v('전체'), value: null, cateIdx: null }],
        this.centerList.map(el => ({
          label: el.cateKey,
          value: el.cateKey,
          ...el
        }))
      )
    },
    /**
     * 서버 추가 모달 > 그리드 (필터 미적용)
     */
    gridData () {
      return this.serverAddGridList
        .map((item, itemIdx) => ({
          ...item,
          itemOrderIdx: itemIdx + 1,
          checked: item.checked || false
          // checked:
          //   this.checkedServerList.map(vm => vm.vmUuid).includes(item.vmUuid) ||
          //   false
          // corrections: [] // 서버별 보정 모델 오른쪽 패널 "보정 추가" 리스트
        }))
    },
    /**
     * 서버 추가 모달 > 그리드 (필터 적용)
     */
    filteredGridData () {
      if (!this.gridData || !this.gridData.length) return []
      if (!Object.values(this.serverFilter).filter(Boolean).length) { return this.gridData }

      let origin = this.gridData.slice(0)

      // if (this.serverFilter.category) origin = origin.filter(item => item.cateIdx === this.serverFilter.category)
      if (this.serverFilter.group) {
        origin = origin.filter(
          item => item.companyIdx === this.serverFilter.group
        )
      }
      if (this.serverFilter.searchCategory && this.serverFilter.searchKeyword) {
        origin = origin.filter(item => {
          return (item[this.serverFilter.searchCategory] || '').includes(
            this.serverFilter.searchKeyword
          )
        })
      }

      return origin
    },
    /**
     * IP 카테고리 전부 펼친 상태
     */
    ipCategories () {
      if (this.centerList && this.centerList.length) {
        const result = []
        const travel = item => {
          if (item.children && item.children.length) {
            item.children.forEach(travel)
          }
          result.push(item)
        }
        this.centerList.forEach(travel)
        return result
      } else return []
    }
  },
  async created () {
    EventBus.$on('reset-form', this.resetForm)

    this.mapVm = new Map()
    this.companyList = await this.getCompanyList()
    this.centerList = await this.getNetworkCategoryTree()

    // 데이터값 세팅
    this.initMap()

    // 이전달 청구 조회
    await this.getBeforeMonthBilling()
    this.vmList = await this.getVmList()

    if (this.isEdit) {
      this.getCorrectionModelDetail(this.$route.query.id)
    }
  },
  beforeDestroy () {
    this.clearSimulateInterval()
  },
  methods: {
    /**
     * 전달 확정 배치 조회
     */
    async getConfirmedBatch () {
      let res = await API.billing.getBillingBatchData()
      res = res ? res.map(batch => ({ ...batch, formatDate: dayjs(new Date(batch.date)).format('YYYY-MM') })) : []

      const beforeMonth = dayjs(new Date()).add(-1, 'month').format('YYYY-MM')
      const confirmedBatch = res.find(batch => batch.confirmed && batch.formatDate === beforeMonth)

      if (confirmedBatch) {
        const report = await API.billing.getListById(confirmedBatch.id)
        if (report && report.compute) return report.compute
        else return null
      } else {
        return null
      }
    },
    /**
     * 전달 청구 금액 조회
     */
    async getBeforeMonthBilling () {
      const confirmedBatch = await this.getConfirmedBatch()
      this.beforeMonthBillingMap = new Map()

      if (confirmedBatch && confirmedBatch.length) {
        confirmedBatch.forEach(batch => {
          this.beforeMonthBillingMap.set(batch.vmUuid, batch)
        })
      }
    },
    onLoadSimpleModels (models) {
      if (models && models.length && !this.isEdit) {
        const copyModels = models.map(model => ({
          id: model.id,
          createTime: model.createTime
        }))

        let recentModel = null

        copyModels.forEach(model => {
          if (!recentModel || recentModel.createTime < model.createTime) {
            recentModel = model
          }
        })

        this.getCorrectionModelDetail(recentModel.id)
      }
    },
    /**
     * 폼 초기화
     */
    resetForm () {
      this.registeredServerList = []
      this.checkedServerList = []
    },
    /**
     * 모뎅를 불러온다.
     */
    onFetchModel (model) {
      EventBus.$emit('reset-form')
      this.resetForm()
      this.getCorrectionModelDetail(model.id)
    },
    getCateIdxByCateName (cateName) {
      return (this.centerList.find(cate => cate.cateName === cateName) || {})
        .cateIdx
    },
    /**
     * API에서 내려온 데이터를 UI에 적용 (업데이트 데이터 적용)
     */
    initForm (model = this.updateModelData) {
      if (model.serverInfo && model.serverInfo.length) {
        // 내부 서버 보정을 UI에 사용할 수 있도록 변형한다.
        const transformServerInfo = correction => {
          return {
            ...correction,
            priceType: correction.discountPrice > 0 ? 'plus' : 'minus',
            discountPrice: Math.abs(correction.discountPrice)
          }
        }

        model.serverInfo.forEach(server => {
          // 해당하는 맵 객체를 찾는다.
          const currentMap = this.getCurrentMap()

          if (!currentMap) return

          // 서버 데이터를 맵 객체에서 조회한다.
          const findServer = this.mapVm.get(server.vmUuid)
          // UI에 등록한다.
          currentMap.registeredServerList = [].concat(
            currentMap.registeredServerList,
            [
              findServer
                ? {
                  ...findServer,
                  __ui_uid__: uniqueId('reg-server-'),
                  corrections: server.serverInfo.map(transformServerInfo)
                }
                : {
                  ...omit(server, ['serverInfo']),
                  __ui_uid__: uniqueId('reg-server-'),
                  corrections: server.serverInfo.map(transformServerInfo)
                }
            ]
          )
          this.registeredServerList = currentMap.registeredServerList
        })
      }
    },
    /**
     * 선택한 과금 모델 초기화
     */
    onRemoveSelectedBillingModel () {
      const remove = () => {
        this.selectedBillingModel = null
        this.clearSimulateInterval()
      }

      if (
        this.simulateInterval &&
        this.simulateInterval.state === __SIMULATE_STATE__.PROGRESS
      ) {
        this.$confirm(
          this.$v(
            '현재 시뮬레이션 진행중입니다.<br>취소할 경우 진행중인 시뮬레이션이 취소됩니다.<br>그래도 취소하시겠습니까?'
          ),
          { dangerouslyUseHTMLString: true }
        )
          .then(() => remove())
          .catch(() => false)
      } else {
        remove()
      }
    },
    /**
     * 시뮬레이션 결과 비용 바인딩
     */
    bindSimulateResult (data) {
      if (!data || !data.length) return

      data.forEach(vm => {
        const targetVm = this.mapVm.get(vm.vmUuId)

        if (targetVm) {
          // targetVm.cost = vm.forwardBillingAmount
          targetVm.finishCost = vm.batchApplyAmount
        }
      })

      if (!this.isLoadedPrevMonthBill) this.isLoadedPrevMonthBill = true
    },
    /**
     * 시뮬레이션 결과 조회
     */
    async getSimulateResult () {
      try {
        const { data } = await API.billing.getSimulatedServerCorrection(
          this.simulateInterval.model
          // this.getModuleType()
        )
        if (data.every(result => result.expectBatchStatus === 'DONE')) {
          this.bindSimulateResult(data)
          this.clearSimulateInterval()
        }
      } catch (error) {
        console.log(error)
      }
    },
    /**
     * 시뮬레이션 인터벌 초기화
     */
    clearSimulateInterval () {
      if (this.simulateInterval && this.simulateInterval.interval) {
        clearInterval(this.simulateInterval.interval)
      }
      this.simulateInterval = {
        interval: null,
        model: null,
        state: __SIMULATE_STATE__.UNKNOWN
      }
    },
    /**
     * 시뮬레이션 인터벌 설정
     */
    setSimulateInterval () {
      this.simulateInterval.model = this.selectedBillingModel.id
      this.simulateInterval.state = __SIMULATE_STATE__.PROGRESS
      this.simulateInterval.interval = setInterval(
        this.getSimulateResult,
        __SIMULATE_INTERVAL_DELAY__
      )
    },
    /**
     * 모듈 타입 변환
     */
    getModuleType () {
      return {
        nutanix: 'NX',
        vmware: 'VMWARE'
      }[this.cloud]
    },
    /**
     * 시뮬레이션 대상 과금모델 변경 이벤트
     */
    async onChangeSimulateBillingModel (model) {
      if (
        this.selectedBillingModel &&
        this.selectedBillingModel.id === model.id
      ) { return }

      this.selectedBillingModel = model
      this.isOpendBillingSelect = false

      if (this.simulateInterval && this.simulateInterval.interval) {
        this.clearSimulateInterval()
      }

      try {
        this.isLoadingVmData = true
        await API.billing.simulateServerCorrection(
          model.id
          // this.getModuleType()
        )
        this.setSimulateInterval()
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('보정 모델 시뮬레이션에 실패하였습니다.'))
      } finally {
        this.isLoadingVmData = false
      }
    },
    /**
     * 네트워크 카테고리 최상위 조회
     */
    getParentCategory (categoryIdx) {
      let target = this.ipCategories.find(
        category => category.cateIdx === categoryIdx
      )

      while (target && target.upperCategoryIdx) {
        const findTarget = this.ipCategories.find(
          category => category.cateIdx === target.upperCategoryIdx
        )
        if (!findTarget) return target
        target = this.ipCategories.find(
          category => category.cateIdx === target.upperCategoryIdx
        )
      }

      return target
    },
    // mapVmNutanix (vm) {
    //   if (!vm.nics || !vm.nics.length) return vm

    //   let mapVm

    //   if (vm.nics && vm.nics.length) {
    //     const nics = vm.nics[0]
    //     const parentCategory = this.getParentCategory(nics.cateIdx)
    //     mapVm = {
    //       ...vm,
    //       center: parentCategory?.cateName,
    //       cateIdx: parentCategory?.cateIdx,
    //       ipAddress: nics.ipAddress,
    //       hostName: vm.hostname,
    //       taskName: vm.itsmName,
    //       taskInfo: vm.itsmName,
    //       cost: null,
    //       finishCost: null
    //     }
    //   } else {
    //     mapVm = vm
    //   }

    //   const findBeforeBilling = this.beforeMonthBillingMap.get(vm.vmUuid)

    //   if (findBeforeBilling) {
    //     mapVm.cost = findBeforeBilling.priceSum || 0
    //   } else {
    //     mapVm.cost = '-'
    //   }

    //   this.mapVm.set(mapVm.vmUuid, mapVm)

    //   return mapVm
    // },
    // mapVmVmware (vm) {
    //   const categories = []

    //   if (vm?.userInfo?.networkList) {
    //     vm.userInfo.networkList.forEach(network => {
    //       categories.push(this.getParentCategory(network.cateIdx))
    //     })
    //   }

    //   const projectInfo = this.getProject(vm.userInfo.projectIdx)
    //   const findBeforeBilling = this.beforeMonthBillingMap.get(vm.vmUuid)

    //   return {
    //     ...vm,
    //     center: categories.map(category => category.cateName).join(', '),
    //     cateIdx: categories.map(category => category.cateIdx),
    //     ipAddress: flatten(vm.networkAdapterList.map(network => network.guestNic ? network.guestNic.ipAddressList : [])),
    //     hostName: vm.userInfo.hostname,
    //     // taskName:
    //     companyName: projectInfo?.companyName,
    //     projectName: projectInfo?.projectName,
    //     cost: findBeforeBilling ? (findBeforeBilling.priceSum || 0) : '-',
    //     finishCost: null
    //   }
    // },
    /**
     * VM 네트워크 데이터 변환
     */
    mapVmNetwork (vm) {
      // if (vm.moduleType === 'NX') return this.mapVmNutanix(vm)
      // else if (vm.moduleType === 'VMWARE') return this.mapVmVmware(vm)
      const project = this.getProject(vm.projectIdx)

      // CSP
      const moduleType = vm.moduleType === 'NX'
        ? 'Nutanix'
        : vm.moduleType === 'VMWARE'
          ? 'VMware'
          : '-'
      // 센터
      let center
      // IP 주소
      let ipAddress
      // 관계사
      const companyName = project?.companyName
      // 프로젝트
      const projectName = project?.projectName
      // 전월 청구 금액
      const findBeforeBilling = this.beforeMonthBillingMap.get(vm.vmUuid)
      const parseNetworkCategory = (category) => {
        if (!category) return '-'
        if (!category.includes('-')) return category
        return category.split('-')[0]
      }

      if (!vm.nics || !vm.nics.length) {
        center = '-'
        ipAddress = '-'
      } else {
        if (vm.moduleType === 'NX') {
        // nics 1개
          center = parseNetworkCategory(vm.nics[0].cateKey)
          ipAddress = vm.nics[0].ipAddress
        } else if (vm.moduleType === 'VMWARE') {
          center = vm.nics.map(nic => parseNetworkCategory(nic.cateKey)).join(', ')
          ipAddress = vm.nics.map(nic => nic.ipAddress)
        }
      }

      return {
        ...vm,
        moduleType,
        center,
        companyName,
        projectName,
        ipAddress,
        cost: findBeforeBilling ? (findBeforeBilling.priceSum || 0) : '-',
        finishCost: null
      }
    },
    /**
     * VM 조회
     */
    async getAllVmList () {
      // const vmList = await API.compute.getVms({
      //   filterChargeDate: true,
      //   isProgress: true
      // })
      // const vmwareVmList = await API.vmware.vm.getVmwareVmList()
      // // const vmList = await API.metering.getMeteringStatus({
      // //   chargeDate: dayjs().format('YYYY-MM'),
      // //   moduleType: this.getModuleType()
      // // })
      const vmList = await API.metering.getMeteringStatus({
        isOpen: false
      })
      this.serverAddGridList = (vmList || [])
        // .filter(vm => vm.nics && vm.nics.length)
        .map(this.mapVmNetwork)
      return vmList
    },
    /**
     * CSP에 맞는 VM 리스트 조회 메서드 호출
     */
    async getVmList () {
      try {
        this.isLoadingVmData = true
        // if (this.cloud === 'nutanix') {
        //   return await this.getNxVmList()
        // } else if (this.cloud === 'vmware') {
        //   return await this.getVmwVmList()
        // }
        return await this.getAllVmList()
      } catch (error) {
        this.$alert(this.$v('보정을 위한 서버 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingVmData = false
      }
    },
    /**
     * 수정시 보정 모델 상세 조회
     */
    async getCorrectionModelDetail (id) {
      this.isLoadingGetData = true

      try {
        const { data } = await API.billing.getServerCorrModelByModelIdx(id)
        this.updateModelData = data

        if (this.isEdit && id === this.$route.query.id) {
          this.fallbackUpdateModel = data
        }

        EventBus.$emit('init-form', this.updateModelData)
        this.initForm(this.updateModelData)
      } catch (error) {
        console.log(error)
        this.$alert(
          this.$v('보정 모델 조회에 실패하였습니다.', {
            callback: () => this.$router.go(-1)
          })
        )
      } finally {
        this.isLoadingGetData = false
      }
    },
    /**
     * 서버 추가 모달 종료시
     * 등록된 서버들을 체크된 상태로 이전시키기
     */
    onCloseCreateServerModal () {
      this.isOpenedServerAddModal = false
    },
    /**
     * 선택 서버 > 태그 삭제
     */
    onClearServerTag (server) {
      const currentMap = this.getCurrentMap()

      // 체크된 거 처리
      const findTarget = this.gridData.find(
        _server => _server.hostName === server.hostName
      )
      if (findTarget) findTarget.checked = false

      if (this.$refs.serverGrid) {
        this.$refs.serverGrid.changedCheckbox()
      }

      currentMap.checkedServerList = currentMap.checkedServerList.filter(
        _server => _server.hostName !== server.hostName
      )
      this.checkedServerList = currentMap.checkedServerList

      if (this.$refs.serverGrid) {
        this.$refs.serverGrid.changedCheckbox()
      }
    },
    /**
     * 선택 서버 > 태그에 표시할 이름 구하기
     */
    getServerTag (server) {
      return `${server.hostName} | ${server.ipAddress || '-'}`
    },
    /**
     * 가운데 그리드 > 아이템 삭제
     */
    onRemoveRegisteredItem (row) {
      const currentMap = this.getCurrentMap()

      currentMap.registeredServerList = currentMap.registeredServerList.filter(
        server => server.hostName !== row.hostName
      )
      this.registeredServerList = currentMap.registeredServerList

      // 체크된 거 처리
      const findTarget = this.gridData.find(
        server => server.hostName === row.hostName
      )
      if (findTarget) findTarget.checked = false

      if (this.$refs.serverGrid) {
        this.$refs.serverGrid.changedCheckbox()
      }

      this.checkedServerList = currentMap.checkedServerList
      currentMap.checkedServerList = currentMap.checkedServerList.filter(
        server => server.hostName !== row.hostName
      )
    },
    getCurrentMap () {
      return {
        checkedServerList: this.checkedServerList,
        registeredServerList: this.registeredServerList
      }
    },
    /**
     * 네트워크 카테고리별 맵 객체 생성
     */
    initMap () {
      this.registeredServerList = []
      this.checkedServerList = []
    },
    /**
     * 서버 추가 모달에서 선택한 서버들 추가
     */
    onAddCheckedServerList () {
      this.$confirm(this.$v('선택한 서버들을 등록하시겠습니까?'))
        .then(() => {
          const currentMap = this.getCurrentMap()
          const checked = (this.checkedServerList.slice(0) || []).map(item => {
            const findServer = currentMap.registeredServerList.find(
              regVm => regVm.vmUuid && regVm.vmUuid === item.vmUuid
            )
            let corrections = []
            if (findServer) {
              corrections = findServer.corrections || []
            }
            return {
              ...item,
              __ui_uid__: uniqueId('reg-server-'),
              corrections
            }
          })

          currentMap.registeredServerList = checked
          this.registeredServerList = checked
          this.isOpenedServerAddModal = false
        })
        .catch(() => false)
    },
    /**
     * 그리드 생성 (체크된 애들 호출)
     */
    onInitGrid (grid) {
      if (this.$refs.serverGrid) {
        this.$refs.serverGrid.changedCheckbox(null)
      }
    },
    /**
     * 필터 초기화
     */
    onResetFilter () {
      this.serverFilter = {
        category: null,
        group: null,
        searchCategory: 'hostName',
        searchKeyword: null
      }
    },
    /**
     * 서버 추가시 이벤트
     */
    onCheckServer (checkedRows) {
      const currentMap = this.getCurrentMap()

      currentMap.checkedServerList = checkedRows
      this.checkedServerList = checkedRows
    },
    onClickAddContent () {
      this.isOpenedServerAddModal = true
    },
    /** 관계사 리스트 가져오기 */
    async getCompanyList () {
      try {
        this.loading.company = true
        const companies = await this.getGroupList({ groupUpper: 0 })
        if (!companies) return
        return companies.filter(
          el => el.companyCode !== 'common' && el.label !== '전체'
        ) // 공통 관계사 제거,전체 제거
      } catch (error) {
        this.allCompany = []
        console.error(error)
      } finally {
        this.loading.company = false
      }
    },
    async getGroupList (params) {
      try {
        console.log('그룹 조회')
        this.loading.group = true
        const response = await API.iam.getGroupList(params)
        if (!response) return
        const result = response.map(item => {
          return {
            ...item,
            label: item.groupName,
            companyCode: item.companyCode || null
          }
        })
        return [
          {
            label: this.$t('main.DASHBOARD.all'),
            companyCode: null,
            groupIdx: null
          },
          ...result
        ] // 전체 포함
      } catch (error) {
        console.error(error)
        const message =
          error.response && error.response.data
            ? error.response.data.message
            : error.message
        this.$alert(message)
        throw error
      } finally {
        this.loading.group = false
      }
    },
    // 센터 트리를 가져옵니다.
    async getNetworkCategoryTree () {
      const cateTreeRes = await API.network.getNetworkCategoryTree()
      return cateTreeRes
    }
  },
  data () {
    return {
      SIMULATE_STATE: __SIMULATE_STATE__,
      fallbackUpdateModel: null,
      isLoadedPrevMonthBill: false,
      simulateInterval: {
        interval: null,
        model: null,
        state: __SIMULATE_STATE__.UNKNOWN
      },
      beforeMonthBillingMap: new Map(),
      selectedBillingModel: null,
      mapVm: null,
      isLoadingVmData: false,
      updateModelData: null,
      isLoadingGetData: false,
      serverAddGridColumns: [
        { header: 'No', binding: 'itemOrderIdx', width: 80 },
        { header: 'CSP', binding: 'moduleType', width: '*' },
        { header: this.$v('센터'), binding: 'center', width: 120 },
        { header: this.$v('관계사'), binding: 'companyName' },
        { header: this.$v('프로젝트'), binding: 'projectName' },
        { header: 'IP', binding: 'ipAddress', customHtml: true },
        { header: this.$v('호스트명'), binding: 'hostName' },
        // { header: this.$v('업무명'), binding: 'taskName' },
        {
          header: this.$v('전월 청구 금액'),
          binding: 'cost',
          customHtml: true
        },
        {
          header: this.$v('배치 적용 금액'),
          binding: 'finishCost',
          customHtml: true
        }
      ],
      vmList: [],
      serverAddGridList: [
        // {
        //   index: 0,
        //   center: '김포',
        //   cateIdx: 2,
        //   companyIdx: 1,
        //   companyName: '신세계I&C',
        //   projectName: 'KHLEE',
        //   ipAddress: '192.168.10.11',
        //   hostName: 'kqq-khlee-01',
        //   taskName: '[테,Te] njhievjoww-01',
        //   cost: 50000,
        //   finishCost: 150000
        // },
        // {
        //   index: 1,
        //   center: '김포',
        //   cateIdx: 2,
        //   companyIdx: 1,
        //   companyName: '이마트(주)',
        //   projectName: 'KHLEE',
        //   ipAddress: '192.168.10.15',
        //   hostName: 'emt-khlee-01',
        //   taskName: '[테,Te] defnefhemat-01',
        //   cost: 1500000,
        //   finishCost: 354300
        // }
      ],
      // 체크된 서버 -> 등록된 서버 리스트
      registeredServerList: [],
      // 체크된 서버 리스트
      checkedServerList: [],
      // 관계사 리스트
      companyList: [],
      // 센터 리스트
      centerList: [],
      // 로딩
      loading: {
        company: false,
        group: false
      },
      // 서버추가 모달
      isOpenedServerAddModal: false,
      // 과금 모델 선택
      isOpendBillingSelect: false,
      searchCategoryOptions: [
        { label: this.$v('호스트명'), value: 'hostName' },
        { label: this.$v('프로젝트'), value: 'projectName' },
        { label: 'IP', value: 'ipAddress' }
        // { label: this.$v('업무명'), value: 'taskName' }
      ],
      serverFilter: {
        group: null,
        searchCategory: 'hostName',
        searchKeyword: null
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.form {
  display: flex;
  flex-direction: column;
  .form-flex__row {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    .selected-bill {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      margin-left: $gap;

      &-name {
        margin-right: $gap-s;
      }

      &-action {
        cursor: pointer;
      }
    }

    .form-label {
      display: flex;
      flex-wrap: nowrap;
      width: 140px;
      flex: 0 0 140px;
      align-self: center;
    }
    .form-value__is-empty {
      display: flex;
      align-self: center;
      color: $gray;
      font-size: 14px;
      font-weight: 300;
    }
    .button {
      display: flex;
      background-color: $primary;
    }
  }

  .selected-servers {
    display: flex;
    flex-wrap: wrap;
  }
}
.modal-button-area {
  border-top: 1px solid $purple-gray;
  padding-top: 20px;
}

.filter {
  &-comp {
    margin-bottom: 10px;
  }

  &-wrapper {
    .flex-between {
      display: flex;
      justify-content: space-between;
      width: 100%;
    }

    .filter-wrap {
      &.margin {
        & > * + * {
          margin-left: $gap;
        }
      }

      .filter-name,
      .filter-form {
        display: inline-block;
      }

      .filter-form {
        margin-right: $gap-s;
      }
    }
  }
}

.cmp-grid-wrapper div[wj-part="root"] {
  overflow: hidden !important;
}

.billing-model-calib-server-create {
  .form-wrap {
    max-height: 800px;
    overflow: auto;
  }
}
</style>
