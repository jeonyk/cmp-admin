<template>
  <div
    class="set-resource-autoscale-group-detail"
    v-loading="loading.detailPage"
  >
    <section class="policy-list-section">
      <h2>정책 리스트</h2>
      <section class="table-top-wrap">
        <div class="policy-search">
          <span class="title">정책 상태</span>
          <el-select
            v-model="filteredStatus"
            placeholder="정책 상태 선택"
            :popper-append-to-body="false"
            @change="filtering"
          >
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
        <section class="button-area -right">
          <template
            v-if="checkedPolicy.length"
          >
            <button
              class="button"
              type="is-primary"
              :disabled="checkedPolicy.length > 1"
              @click="deletePolicy"
            >
              삭제
            </button>
            <button
              v-loading="loading.policyLog"
              class="button"
              type="is-primary"
              :disabled="checkedPolicy.length > 1"
              @click="viewPolicyModal"
            >
              정책 로그
            </button>
          </template>
          <button
            v-loading="loading.createASGBtn"
            class="button"
            type="is-primary"
            style="margin-left: 10px;"
            @click="createModal = true"
          >
            추가
          </button>
        </section>
      </section>

      <section class="table-area">
        <cmp-grid
          v-loading="loading.isGetPolicyRequest"
          ref="asGroupGrid"
          class="route-detail-grid"
          :columns="policyColumns"
          :item-source="filteredPolicyData"
          :use-excel-download="true"
          :changing-page-reset="false"
          :paging-size="5"
          @total-count="cnt => totalResultCnt = cnt"
          @changingPage="num => {
            activePageNum = num
          }"
          @checkedRowsData="setCheckedItems"
          use-checkbox
          header-checkbox
          page-keeping
        >
          <template #startTime="props">
            {{ props.row.startTime | date }}
          </template>
          <template #endTime="props">
            {{ props.row.endTime | date }}
          </template>
          <template #vmCount="props">
            {{ props.row.vmCount + ' 개' }}
          </template>
        </cmp-grid>
      </section>
    </section>

    <section class="vm-list-section">
      <h2>VM 리스트</h2>
      <section class="table-area">
        <cmp-grid
          v-loading="loading.isGetVmRequest"
          ref="asGroupGrid"
          class="route-detail-grid"
          :columns="vmColumns"
          :item-source="vmTableData"
          :use-excel-download="true"
          :paging-size="5"
        >
          <template #hostname="props">
            <div
              class="hostname-name-wrap"
              v-if="props.row.hostname"
            >
              <span
                v-if="props.row.createTime > new Date(Date.now() - ( 3600 * 1000 * 24))"
                class="new-tag-wh"
              >N</span>
              <!-- NEW 태그 : 만들어진지 하루 지나면 사라짐 -->

              <span
                v-if="props.row.isCopy"
                class="new-tag-wh -copy"
              >C</span>
              <!-- COPY 태그 -->

              <span
                v-if="props.row.deleteDate"
                class="new-tag-wh -delete"
              >{{ setDeleteDateState(props.row.deleteDate) }}</span>
              <!-- 삭제 예정/중/실패 태그 -->

              <cmp-status-tag
                v-if="props.row.market"
                type="mp"
                contents="MP"
              />
              <cmp-status-tag
                v-else-if="props.row.era"
                type="mp"
                contents="DB"
              />
              <cmp-status-tag
                v-if="props.row.isSwTest"
                type="test"
                contents="TEST"
              />

              {{ props.row.hostname }}
            </div>
            <span v-else>-</span>
          </template>
          <!-- 호스트 명 -->

          <template #powerState="props">
            <template v-if="props.row.powerState || props.row.vmStatus">
              <cmp-status-tag
                :type="props.row.vmStatus === 'START' ? 'is-loading' : {
                  ON: 'is-info',
                  OFF: 'is-undefined',
                }[props.row.powerState]"
                :line-style="true"
                :style="{width: props.row.vmStatus === 'START' ? '75px' : '60px'}"
              >
                {{ props.row.vmStatus === 'START' ? 'Progress' : props.row.powerState }}
              </cmp-status-tag>
            </template>
            <span v-else>-</span>
          </template>
          <!-- 상태 -->

          <template #ips="props">
            <div v-if="props.row.ips && props.row.ips.length">
              <span
                v-if="props.row.ips.length > 1"
              >{{ props.row.ips[0] }} {{ $t('common.TERMS.other') }}
                <el-tooltip
                  placement="bottom-end"
                  popper-class="panel-title-popper"
                  effect="light"
                >
                  <template #content>
                    <span v-html="ipHtml(props.row.ips)" />
                  </template>
                  <a class="-link">{{ props.row.ips.length - 1 }}</a>
                </el-tooltip>
              </span>

              <span v-else>{{ props.row.ips[0] }}</span>
            </div>
            <span v-else>-</span>
          </template>
          <!-- ip -->

          <template #osType="props">
            <span
              v-if="props.row.osType"
            >
              {{ props.row.osType }}
            </span>
            <span v-else>-</span>
          </template>
          <!-- OS타입 -->

          <template #osName="props">
            <set-os-icon
              v-if="props.row.osName"
              :os-name="props.row.osName"
            />
            <span v-else>-</span>
          </template>
          <!-- OS명 -->

          <template #vcpu="props">
            <span>{{ props.row.vcpu }} Core</span>
          </template>

          <template #hypervisorCpuUsagePpmValue="props">
            <span v-if="props.row.hypervisorCpuUsagePpmValue === null || props.row.powerState !== 'ON'">-</span>
            <progress-bar
              v-else
              height="20px"
              :total="1000000"
              :value="props.row.hypervisorCpuUsagePpm"
              :notice-percent="60"
              :alert-percent="80"
            />
          </template>
          <!-- CPU 사용량 -->

          <template #memory="props">
            {{ props.row.memory|GB }}
          </template>
          <template #memoryUsagePpmValue="props">
            <span v-if="props.row.memoryUsagePpmValue === null || props.row.powerState !== 'ON'">-</span>
            <progress-bar
              v-else
              height="20px"
              :total="1000000"
              :value="props.row.memoryUsagePpm"
              :notice-percent="60"
              :alert-percent="80"
            />
          </template>
          <!-- 메모리 사용량 -->

          <template #externalDiskTotalSize="props">
            <el-popover
              v-if="props.row.externalDiskList.length"
              placement="bottom"
              width="200"
              trigger="hover"
              popper-class="-scroll"
            >
              <!-- <div class="more-info-list"> -->
              <span slot="reference"> {{ props.row.externalDiskTotalSize |byte }} ({{ props.row.externalDiskTotalCount }}EA)</span>
              <template><pre>{{ props.row.externalDiskList |externalDiskInfo }}</pre></template>
            <!-- </div> -->
            </el-popover>
            <span v-else>{{ props.row.externalDiskTotalSize |byte }} ({{ props.row.externalDiskTotalCount }}EA)</span>
          </template>
        </cmp-grid>
      </section>
    </section>

    <!-- 모달 -->
    <!-- 정책 추가 -->
    <el-dialog
      v-loading="loading.createPolicyLoading"
      :visible.sync="createModal"
      title="정책 추가"
      width="700px"
      top="5vh"
      @close="closeCreateModal"
    >
      <div
        class="auto-scale-group-update-form"
      >
        <vertical-table
          :columns="verticalTableColumns"
        >
          <el-input
            slot="autoScalePolicyName"
            placeholder="Auto Scale 그룹 정책 명을 입력하세요"
            v-model="policyInfo.autoScalePolicyName"
            maxlength="25"
            show-word-limit
          />
          <!-- 그룹명 -->

          <el-date-picker
            slot="startDateTime"
            class="service-date-pick"
            popper-class="asg-datetime-ppoper"
            v-model="policyInfo.startDateTime"
            type="datetime"
            default-time="12:00:00"
            placeholder="그룹 시작일을 지정해주세요"
          />
          <!-- 그룹 시작일 -->

          <el-date-picker
            slot="endDateTime"
            class="service-date-pick"
            popper-class="asg-datetime-ppoper"
            v-model="policyInfo.endDateTime"
            type="datetime"
            default-time="12:00:00"
            placeholder="그룹 종료일을 지정해주세요"
          />
          <!-- 그룹 시작일 -->

          <template #vmCount>
            <el-select
              v-model="policyInfo.vmCount"
              :placeholder="$t('common.PLACEHOLDER.serviceSelectCate')"
              :popper-append-to-body="false"
              class="form-input"
            >
              <template
                v-for="(item, idx) in countOptions"
              >
                <el-option
                  v-if="item.value > groupData.vmCount"
                  :key="idx"
                  :label="item.label"
                  :value="item.value"
                />
              </template>
            </el-select>
            <span :style="{'margin-left': '10px'}"> 개</span>
          </template>
          <!-- 희망 VM 수 -->
        </vertical-table>
        <section class="modal-button-area">
          <button
            class="button -modal-button"
            type="is-anti"
            @click="closeCreateModal"
          >
            취소
          </button>
          <button
            class="button -modal-button"
            type="is-primary"
            @click="createPolicy"
          >
            생성
          </button>
        </section>
      </div>
    </el-dialog>

    <!-- 정책 로그 -->
    <el-dialog
      :visible.sync="viewLogModal"
      title="정책 로그"
      width="1100px"
      top="5vh"
      @close="viewLogModal = false"
    >
      <div class="log-wrap">
        <div class="log-area">
          <template v-if="logData.length">
            <div
              v-for="(data, idx) in logData"
              :key="idx"
              class="log-messages"
            >
              <span>{{ data.createTime }}</span><span>{{ data.message }}</span>
            </div>
          </template>
          <div
            v-else
            style="display:flex;align-items:center;justify-content:center;height:100%;"
          >
            <span>데이터가 없습니다.</span>
          </div>
        </div>
        <section class="modal-button-area">
          <button
            class="button -modal-button"
            type="is-primary"
            @click="viewLogModal = false"
          >
            확인
          </button>
        </section>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import API, { SetOSIcon } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import { uniqBy } from 'lodash'

export default {
  name: 'SetResourceAutoScaleGroupDetail',
  components: {
    'set-os-icon': SetOSIcon
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType
    })
  },
  watch: {
    activePageNum: {
      handler (num) {
        sessionStorage.setItem('configServerGridPage', num)
      }
    }
  },
  async created () {
    this.asgIdx = this.$route.params.autoScaleGroupIdx
    await this.getAutoScaleGroupByIdx(this.asgIdx)
    await this.getPolicyList()
    await this.getVmList()
    this.startInterval()
  },
  destoyed () {
    clearInterval(this.interval)
  },
  methods: {
    startInterval () {
      this.interval = setInterval(() => {
        this.getPolicyList()
        this.getVmList()
      }, 10000)
    },
    async viewPolicyModal (e,
      autoScaleIdx = this.asgIdx,
      autoScalePolicyIdx = this.checkedPolicy[0].autoScalePolicyIdx
    ) {
      this.loading.policyLog = true
      try {
        const res = await API.compute.getAutoScaleGroupHistory(autoScaleIdx, autoScalePolicyIdx)
        // const res = await API.compute.getAutoScaleGroupHistory(autoScaleIdx)
        if (res?.result?.length) {
          res.result.sort((a, b) => {
            if (a.createTime > b.createTime) return -1
            if (a.createTime < b.createTime) return 1
            return 0
          })
          let message, beforeObj, afterObj, workKo, isSuccessKo
          const logs = res.result.map(obj => {
            if (obj.beforeObj) beforeObj = JSON.parse(obj.beforeObj)
            if (obj.afterObj) afterObj = JSON.parse(obj.afterObj)
            workKo = obj.work === 'CREATE' ? '추가' : obj.work === 'DELETE' ? '삭제' : '변경'
            isSuccessKo = obj.isSuccess ? '성공' : '실패'
            if (obj.type === 'AUTO_SCALE') {
              message = `${this.autoScaleName} 이 ${afterObj.updateUserName} 에 의해 ${workKo} 에 ${isSuccessKo} 하였습니다.`
            }
            if (obj.type === 'AUTO_SCALE_POLICY') {
              message = `${this.autoScaleName} 의 ${this.checkedPolicy[0].autoScalePolicyName} 이 ${afterObj.updateUserName} 에 의해 ${workKo} 에 ${isSuccessKo} 하였습니다.`
            }
            if (obj.type === 'VM') {
              const hostName = obj.work === 'CREATE' ? afterObj.hostname : beforeObj.hostname
              message = `${this.autoScaleName} 에 ${hostName} ${workKo} 에 ${isSuccessKo} 하였습니다.`
            }
            if (obj.type === 'VM_CREATE' || obj.type === 'VM_DELETE') {
              message = `${this.autoScaleName} 에 ${workKo} 이(가) ${isSuccessKo} 하였습니다.`
            }
            if (!obj.isSuccess) {
              message += ` (${obj.failMessage})`
            }
            return {
              createTime: this.$options.filters.date(obj.createTime),
              message: message
            }
          })
          this.$nextTick(() => {
            this.logData = logs
          })
        }
      } catch (error) {
        console.log(error)
      } finally {
        this.loading.policyLog = false
        this.viewLogModal = true
      }
    },
    async getAutoScaleGroupByIdx (idx) {
      if (idx) {
        const res = await API.compute.getAutoScaleGroupByIdx(idx)
        if (res) {
          console.log('그룹 데이터:', res)
          this.groupData = res
          // 희망 vm 수 초기 세팅 (희망 vm 수 > 그룹 최소 vm 수)
          this.policyInfo.vmCount = res.vmCount + 1
          this.autoScaleName = res.autoScaleName
          this.$store.commit('common/ADD_PARAMETERS', {
            label: res.autoScaleName || 'Auto Scale Group 상세',
            path: ''
          })
        }
      }
    },
    /**
     * 오토스케일 그룹명 필터링 이벤트
     */
    filtering () {
      console.log('@filtering', this.filteredStatus)
      if (!this.filteredStatus) {
        this.filteredPolicyData = this.policyTableData
      } else {
        this.filteredPolicyData = this.policyTableData.filter(item => {
          let result = true
          if (this.filteredStatus) {
            result = result && (item.status === this.filteredStatus)
          }
          return result
        })
      }
    },
    dataSetting (orgData) {
      orgData.sort((a, b) => {
        if (a.createTime > b.createTime) return -1
        if (a.createTime < b.createTime) return 1
        return 0
      })
      let statusKo
      const list = orgData.map(data => {
        switch (data.status) {
          case 'WAIT':
            statusKo = '대기'
            break
          case 'START':
            statusKo = '시작'
            break
          case 'RUNNING':
            statusKo = '실행중'
            break
          case 'END':
            statusKo = '종료'
            break
          case 'SUCCESS':
            statusKo = '성공'
            break
          case 'FAIL':
            statusKo = '실패'
            break
        }
        return {
          ...data,
          createUser: `${data.createUserName} (${this.$options.filters.maskingName(data.createUserId)})`,
          statusKo: statusKo
        }
      })
      return list
    },
    async getPolicyList () {
      this.loading.isGetPolicyRequest = true
      const result = await API.compute.getAutoScaleGroupPolicy(this.asgIdx)
      if (result.length) {
        this.policyTableData = this.dataSetting(result)
        this.filtering(this.policyTableData)
      } else {
        this.policyTableData = []
      }
      this.loading.isGetPolicyRequest = false
    },
    async getVmList () {
      this.loading.isGetVmRequest = true
      const res = await API.compute.getAutoScaleGroupVmList(this.asgIdx)
      if (res) {
        this.vmListDataSetting(res)
      } else {
        this.vmTableData = []
      }
    },
    vmListDataSetting (data) {
      if (!data) {
        this.vmTableData = []
        return
      }
      const list = []
      const allVmStatus = []
      const mappedExternals = []
      for (let i = 0; i < data.length; i++) {
        if (data[i].nicIps?.length) {
          // data[i].ips = data[i].nicIps.filter(ip => ip.nicIpType === 'ASSIGNED')
          data[i].ips = uniqBy(data[i].nicIps, 'ipAddress')
            .map(ip => { return ip.ipAddress })
        }
        data[i].hostname = data[i].vmName || data[i].computeName
        data[i].osType = data[i].osType || '-' // OS 타입
        data[i].osBit = data[i].osBit || '-' // OS Bit
        data[i].vcpu = data[i].numVcpus || data[i].vcpu || 0 // vCPU
        data[i].memory = this.$options.filters.byteToGb(data[i].memoryCapacityInBytes) || data[i].memory // Memory

        // CPU 사용량
        if (!data[i].hypervisorCpuUsagePpm) data[i].hypervisorCpuUsagePpmValue = 0
        else if (data[i].hypervisorCpuUsagePpm < 0) data[i].hypervisorCpuUsagePpmValue = null
        else {
          const cpuUsageValue = data[i].hypervisorCpuUsagePpm / 10000
          data[i].hypervisorCpuUsagePpmValue = Number(cpuUsageValue.toFixed(2))
        }
        // 메모리 사용량
        if (!data[i].memoryUsagePpm) data[i].memoryUsagePpmValue = 0
        else if (data[i].memoryUsagePpm < 0) data[i].memoryUsagePpmValue = null
        else {
          const memUsageValue = data[i].memoryUsagePpm / 10000
          data[i].memoryUsagePpmValue = Number(memUsageValue.toFixed(2))
        }
        // External Disk
        data[i].externalDiskTotalSize = 0
        data[i].externalDiskTotalCount = 0
        data[i].externalDiskList = []
        if (data[i].disks) {
          data[i].rootDisk = {}
          for (let j = 0; j < data[i].disks.length; j++) {
            if (
              data[i].disks[j].isCdrom ||
              (data[i].disks[j].deviceType === 'CDROM' || data[i].disks[j].deviceBus === 'IDE')
            ) continue
            data[i].disks[j].diskSize = this.$options.filters.byteToGb(data[i].disks[j].vmDiskSize)
            if ((data[i].disks[j].deviceIndex === 0 || data[i].disks[j].diskIndex === 0) &&
            data[i].disks[j].deviceBus === 'SCSI') {
              data[i].rootDisk = data[i].disks[j]
            } else {
              data[i].externalDiskList.push(data[i].disks[j])
              data[i].externalDiskTotalCount++
              if (data[i].disks[j].vmDiskSize) {
                data[i].externalDiskTotalSize += data[i].disks[j].vmDiskSize
              }
            }
          }
          mappedExternals.push({ value: data[i].externalDiskTotalSize, caption: this.$options.filters.byte(data[i].externalDiskTotalSize) })
        }
        data[i].rootDiskTd = data[i].rootDisk?.diskSize // rootDiskSize (생성 전인 vm)
          ? this.$options.filters.GB(data[i].rootDisk.diskSize)
          : data[i].rootDiskSize
            ? data[i].rootDiskSize + 'GB'
            : 0
        data[i].defaultOsType = ['WINDOWS', 'LINUX', 'UBUNTU', 'CENTOS', 'RHEL'].find(os => data[i].osType.includes(os))

        list.push(data[i])
        allVmStatus.push(data[i].vmStatus)
      }

      this.vmTableData = [...list].sort((a, b) => {
        const isNew = (item) => item.createTime > new Date(Date.now() - (3600 * 1000 * 24))

        if (isNew(a) < isNew(b)) return 1
        else if (isNew(a) > isNew(b)) return -1
        else return 0
      })
      // this.isProgressVm = this.setIsProgressVm(allVmStatus) // vms 중 작업 진행 중인 친구들이 있는지 세팅
      // await this.setCheckedItems(this.checkedVms)

      this.columnDataMap.externalDiskTotalSize = Array.from(new Set(mappedExternals))
      this.loading.isGetVmRequest = false
    },
    setCheckedItems (items) {
      console.log('@체크된 친구들: ', items)
      this.checkedPolicy = [...items]
    },
    closeCreateModal () {
      this.policyInfo = {
        autoScalePolicyName: '',
        startDateTime: null,
        endDateTime: null,
        vmCount: this.groupData.vmCount + 1
      }
      this.createModal = false
    },
    // applyOffsetToDateTime (data) {
    //   const timezoneOffset = new Date().getTimezoneOffset() * 60000
    //   const timezoneDate = new Date(data - timezoneOffset)
    //   return timezoneDate.toISOString()
    // },
    policyDataValidation (plcyData) {
      const startDateTime = plcyData.startDateTime
      const endDateTime = plcyData.endDateTime
      if (!plcyData.autoScalePolicyName || !plcyData.startDateTime || !plcyData.endDateTime) {
        this.$alert('필수값을 입력해주세요.')
        return false
      }
      if (startDateTime > endDateTime || startDateTime === endDateTime) {
        this.$alert('운영 종료 일시는 운영 시작 일시보다 같거나 이전일 수 없습니다.')
        return false
      }
      if (plcyData.vmCount <= this.groupData.vmCount) {
        this.$alert(`희망 VM 수는 그룹의 최소 VM 수 (${this.groupData.vmCount}개) 보다 많아야 합니다.`)
        return false
      }
      return true
    },
    async createPolicy (e, data = this.policyInfo) {
      if (!this.policyDataValidation(data)) return

      this.loading.createPolicyLoading = true
      try {
        const payload = {
          autoScaleIdx: this.asgIdx,
          autoScalePolicyName: data.autoScalePolicyName,
          endTime: data.endDateTime.toISOString(),
          startTime: data.startDateTime.toISOString(),
          vmCount: data.vmCount
        }
        // console.log(payload)
        const res = await API.compute.createAutoScaleGroupPolicy(payload)
        if (res) {
          this.$alert('정책이 생성되었습니다.', {
            callback: async () => {
              this.loading.createPolicyLoading = false
              await this.getPolicyList()
              this.closeCreateModal()
            }
          })
        }
      } catch (error) {
        if (error.code === 'COMMON0010') {
          this.$alert('운영 기간이 겹치는 정책이 있습니다.', {
            callback: () => {
              this.loading.createPolicyLoading = false
            }
          })
        } else if (error.code === 'COMMON0006') {
          this.$alert('그룹 내 중복된 정책명이 존재합니다.', {
            callback: () => {
              this.loading.createPolicyLoading = false
            }
          })
        } else {
          this.$alert('생성 실패했습니다.', {
            callback: () => {
              this.loading.createPolicyLoading = false
            }
          })
        }
      }
    },
    async deletePolicy (e, checkedItem = this.checkedPolicy) {
      this.$confirm('선택한 정책을 삭제하시겠습니까?', '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        try {
          const res = await API.compute.deleteAutoScaleGroupPolicyByIdx(checkedItem[0].autoScalePolicyIdx)
          if (res) {
            this.$alert('정책이 삭제되었습니다.', {
              callback: async () => {
                this.checkedPolicy = []
                await this.getPolicyList()
                this.closeCreateModal()
              }
            })
          }
        } catch (error) {
          console.log(error)
        }
      }).catch(() => false)
    }
  },
  data () {
    return {
      asgIdx: null,
      autoScaleName: '',
      loading: {
        createPolicyLoading: false,
        policyLog: false,
        createASGBtn: false,
        detailPage: false,
        isGetPolicyRequest: false,
        isGetVmRequest: false
      },
      policyColumns: [
        { binding: 'autoScalePolicyName', header: '정책 명' },
        { binding: 'statusKo', header: '정책 상태' },
        { binding: 'startTime', header: '정책 시작', customHtml: true },
        { binding: 'endTime', header: '정책 종료', customHtml: true },
        { binding: 'vmCount', header: '희망 VM 수', customHtml: true },
        { binding: 'createUser', header: '작성자' }
      ],
      vmColumns: [
        { binding: 'hostname', header: '호스트명', customHtml: true },
        { binding: 'powerState', header: '상태', customHtml: true },
        { binding: 'ips', header: 'IP', customHtml: true },
        { binding: 'osType', header: 'OS 타입', customHtml: true },
        { binding: 'osName', header: 'OS 명', customHtml: true },
        { binding: 'osBit', header: 'OS Bit', customHtml: true },
        { binding: 'vcpu', header: 'vCPU', customHtml: true },
        { binding: 'hypervisorCpuUsagePpmValue', header: 'vCPU 사용량(%)', customHtml: true },
        { binding: 'memory', header: 'Memory', customHtml: true },
        { binding: 'memoryUsagePpmValue', header: 'Memory 사용량(%)', customHtml: true },
        { binding: 'rootDiskTd', header: 'RootDisk', customHtml: true },
        { binding: 'externalDiskTotalSize', header: 'ExternalDisk', customHtml: true }
      ],
      policyTableData: [],
      filteredPolicyData: [],
      vmTableData: [],
      checkedPolicy: [],
      countOptions: [
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
        { label: '4', value: 4 },
        { label: '5', value: 5 }
      ],
      policyInfo: {
        autoScalePolicyName: '',
        startDateTime: null,
        endDateTime: null,
        vmCount: null
      },
      verticalTableColumns: [
        { header: '정책명', binding: 'autoScalePolicyName', required: true },
        { header: '운영 시작 일시', binding: 'startDateTime', required: true },
        { header: '운영 종료 일시', binding: 'endDateTime', required: true },
        { header: '희망 VM 수', binding: 'vmCount', required: true }
      ],
      createModal: false,
      viewLogModal: false,
      logData: [],

      activePageNum: 1,
      totalResultCnt: 0,
      originGridState: null, // 인터벌 돌기 전, 그리드의 sorting/filtering 상태 저장

      filteredStatus: '', // 핉터링 > 상태
      fifilteredASGName: '', // 필터링 > 오토스케일 그룹명
      powerState: '', // 버튼 영역 > 파워 상태 선택
      checkedASG: [], // 체크한 vms

      // 상태 옵션
      statusOptions: [
        { value: '', label: '전체' },
        { value: 'WAIT', label: '대기' },
        { value: 'START', label: '시작' },
        { value: 'RUNNING', label: '실행중' },
        { value: 'END', label: '종료' },
        { value: 'SUCCESS', label: '성공' },
        { value: 'FAIL', label: '실패' }
      ],
      vmImages: [], // vm 템플릿 이미지 리스트
      columnDataMap: {
        externalDiskTotalSize: null
      },
      groupData: {}, // 해당 idx 의 ASG 데이터
      interval: null
    }
  }
}
</script>

<style lang="scss">
  .asg-datetime-ppoper {
    .el-input--small {
      width: 100%;
      .el-input__inner {
        border: 1px solid #DCDFE6;
      }
    }
  }
</style>
<style lang="scss" scoped>
.set-resource-autoscale-group-detail {
  .policy-list-section {
    margin-bottom: 50px;
    .policy-search {
      margin-top: 20px;
      display: flex;
      align-items: center;
      .title {
        width: 80px;
        font-weight: bold;
        font-size: 13px;
      }
    }
  }
  .log-wrap {
    .log-area {
      height: 370px;
      background-color: #000;
      padding: 20px 30px;
      font-size: 14px;
      font-weight: normal;
      overflow: scroll;
      box-sizing: border-box;
      div.log-messages {
        margin-bottom: 15px;
        span:first-child {
          margin-right: 20px;
        }
      }
    }
  }
}
</style>
