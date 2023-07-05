<template>
  <el-dialog
    :visible="isVisible"
    :title="$v('시뮬레이션 적용')"
    width="1600px"
    @close="closeModal"
  >
    <div>
      <section>
        <register-contents
          label="label"
          title="자원 유형"
          style="border-top: 1px solid #2a2d44"
        >
          <el-radio-group
            class="set-type"
            v-model="type"
          >
            <el-radio
              label="HW"
            >
              H/W
            </el-radio>
            <el-radio
              label="VM"
            >
              VM
            </el-radio>
          </el-radio-group>
        </register-contents>
        <register-contents
          label="label"
          title="시뮬레이션 모드"
        >
          <el-select
            style="width: 300px"
            value="추가"
            v-model="mode"
          >
            <el-option
              value="CREATE"
              label="추가"
            />
            <el-option
              value="DELETE"
              label="삭제"
            />
            <el-option
              v-if="type === 'VM'"
              value="TRANSFER"
              label="이관"
            />
          </el-select>
        </register-contents>
        <template v-if="['CREATE', 'DELETE'].includes(mode)">
          <register-contents
            label="label"
            title="대상 클러스터 선택"
          >
            <el-select
              style="width: 300px;"
              v-model="selectedCluster"
            >
              <el-option
                v-for="cluster in uniqueClusters"
                :key="cluster"
                :value="cluster"
                :label="cluster"
              />
            </el-select>
          </register-contents>
        </template>
        <template v-if="mode === 'TRANSFER'">
          <register-contents
            label="label"
            :title="$v('이관 대상 클러스터 선택')"
          >
            <el-select
              style="width: 300px"
              v-model="selectedCluster"
            >
              <el-option
                v-for="cluster in uniqueClusters"
                :key="cluster"
                :value="cluster"
                :label="cluster"
              />
            </el-select>
          </register-contents>
          <register-contents
            label="label"
            :title="$v('이관 목적지 클러스터 선택')"
          >
            <el-select
              style="width: 300px"
              v-model="transferTo"
            >
              <el-option
                v-for="cluster in uniqueDestinationClusters"
                :key="cluster"
                :value="cluster"
                :label="cluster"
              />
            </el-select>
          </register-contents>
        </template>
      </section>
      <main class="main">
        <div v-if="selectedCluster">
          <h5
            v-if="mode === 'CREATE' || mode === 'DELETE' || (mode === 'TRANSFER' && this.selectedCluster && this.transferTo)"
            class="title"
          >
            {{ subTitle }}
          </h5>
          <section
            class="section"
            v-if="mode === 'CREATE'"
          >
            <div class="">
              <ul
                class="select-list"
                style="max-height:300px; overflow-y:auto;"
              >
                <li
                  class="select-option"
                  :key="idx"
                  v-for="(x, idx) in selecOptions"
                >
                  <div :style="{width: labelWidth + 'px'}" />
                  <div>
                    <div>
                      <span>CPU (core)</span>
                      <el-input
                        v-model="selecOptions[idx].cpu"
                        type="number"
                        @input="formatInputValue(idx, 'cpu', $event)"
                      />
                    <!-- pattern="[0-9]*" -->
                    </div>
                    <div>
                      <span>MEM (GB)</span>
                      <el-input
                        v-model="selecOptions[idx].memory"
                        type="number"
                        @input="formatInputValue(idx, 'memory', $event)"
                      />
                    </div>
                    <div>
                      <span>DISK (GB)</span>
                      <el-input
                        class="input-field"
                        v-model="selecOptions[idx].disk"
                        type="number"
                        @input="formatInputValue(idx, 'disk', $event)"
                      />
                    </div>
                    <div v-if="type === 'VM'">
                      <span>수량</span>
                      <el-input
                        class="input-field"
                        v-model="selecOptions[idx].amount"
                        type="number"
                        @input="formatInputValue(idx, 'amount', $event)"
                      />
                    </div>
                    <a
                      v-if="selecOptions.length > 1"
                      class="mdi mdi-minus -delete-button"
                      @click="removeOption(x.hostUuid)"
                    />
                    <a
                      v-if="selecOptions.length - 1 === idx"
                      class="mdi mdi-plus -add-button"
                      @click="addOption"
                    />
                  </div>
                </li>
              </ul>
              <div class="total">
                <div
                  style="text-align:right; line-height:33px;"
                  :style="{width: labelWidth + 'px'}"
                >
                  합 계 :
                </div>
                <div>
                  <span>CPU (Core)</span>
                  <el-input
                    :value="totalCpu"
                    disabled
                  />
                  <pre />
                </div>
                <div>
                  <span>MEM (GB)</span>
                  <el-input
                    :value="totalMemory"
                    disabled
                  />
                </div>
                <div>
                  <span>DISK (GB)</span>
                  <el-input
                    :value="totalDisk"
                    disabled
                  />
                </div>
                <div v-if="type === 'VM'">
                  <span>수량</span>
                  <el-input
                    :value="totalAmount"
                    disabled
                  />
                </div>
              </div>
            </div>
          </section>
          <section v-if="(selectedCluster &&['DELETE'].includes(mode)) || isTransferValid">
            <cmp-grid
              header-checkbox
              use-checkbox
              :columns="testColumns"
              :changing-page-reset="false"
              :use-column-filter="false"
              :item-source="getData(this.type)"
              @checkedRowsData="onCheckboxRow"
              :paging-size="6"
            />
          </section>
        </div>
        <footer
          class="button-area"
        >
          <button
            class="button"
            type="is-anti"
            @click="closeModal"
          >
            {{ $v('취소') }}
          </button>
          <button
            class="button"
            type="is-primary"
            @click="apply"
            :disabled="isDisabled"
          >
            {{ $v('적용') }}
          </button>
        </footer>
      </main>
    </div>
  </el-dialog>
</template>

<script>
export default {
  props: {
    data: {
      type: Array,
      default: (newVal) => {
        if (newVal) {}
      }
    },
    title: {
      type: String,
      default: '추가 할 H/W 사양 입력'
    },
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    selectedCluster: {
      handler (newVal) {
        if (newVal) this.transferTo = ''
      }
    },
    type: {
      deep: true,
      handler (newVal) {
        // 타입 변경 시 check 한 리스트 초기화
        const random = (Math.random() * 100000).toFixed(0)
        this.selecOptions = [{ hostUuid: `uuid-${random}`, cpu: 0, memory: 0, disk: 0, amount: 1 }]
        this.mode = ''
        if (newVal === 'HW' && this.hasSelectedList) this.uniqueVms.map(x => (x.checked = false))
        if (newVal === 'VM' && this.hasSelectedList) this.uniqueHosts.map(x => (x.checked = false))
        this.selectedList = []
      }
    }
  },
  computed: {
    isDisabled () {
      //  v-if="mode === 'CREATE' || mode === 'DELETE' || (mode === 'TRANSFER' && this.selectedCluster && this.transferTo)" -->
      if (['CREATE', 'DELETE'].includes(this.mode) && this.selectedCluster) return false
      if (this.mode === 'TRANSFER' && this.selectedCluster && this.transferTo) return false
      return true
    },
    isTransferValid () {
      return this.mode === 'TRANSFER' && this.selectedCluster && this.selectedCluster && this.transferTo
    },
    labelWidth () {
      return this.type === 'HW' ? 400 : 300
    },
    totalCpu () {
      return this.selecOptions?.reduce((x, y) => Number(x) + (Number(y.cpu) * Number(y.amount)), 0)
    },
    totalMemory () {
      return this.selecOptions?.reduce((x, y) => Number(x) + (Number(y.memory) * Number(y.amount)), 0)
    },
    totalDisk () {
      return this.selecOptions?.reduce((x, y) => Number(x) + (Number(y.disk) * Number(y.amount)), 0)
    },
    totalAmount () {
      return this.selecOptions?.reduce((x, y) => Number(x) + Number(y.amount), 0)
    },
    subTitle () {
      const { type, mode } = this
      if (type === 'HW' && mode === 'CREATE') return '추가 할 H/W 사양 입력'
      if (type === 'HW' && mode === 'DELETE') return '삭제 할 H/W 선택'
      if (type === 'HW' && mode === 'TRANSFER') return '이관 할 HW 자원 선택'
      if (type === 'VM' && mode === 'CREATE') return '추가 할 VM 자원 사양 입력'
      if (type === 'VM' && mode === 'DELETE') return '삭제 할 VM 자원 선택'
      if (type === 'VM' && mode === 'TRANSFER') return '이관 할 VM 자원 선택'
      return ''
    },
    testColumns () {
      const { type } = this
      if (type === 'HW') {
        return [
          // { binding: 'nodeName', header: '호스트명' },
          { binding: 'nodeName', header: this.$v('노드명') }
        ]
      }
      return [
        { binding: 'nodeName', header: this.$v('노드명') },
        { binding: 'vmName', header: this.$v('VM명') }
        // { binding: 'vmUuid', header: 'vmUuid' },
        // { binding: 'hostName', header: '호스트명' }

      ]
    },
    testList () {
      const { type } = this
      if (type === 'HW') {
        return this.uniqueHosts
      }
      return this.uniqueVms
    },
    hasSelectedList () {
      return this.selectedList && this.selectedList.length
    },
    isMorethanTwoClusters () {
      return this.uniqueClusters && this.uniqueClusters.length > 1
    },
    uniqueClusters () {
      return [...new Set(this.data?.map(cluster => cluster.clusterName))]
    },
    uniqueDestinationClusters () {
      return [...new Set(this.data?.map(cluster => cluster.clusterName))].filter(x => x !== this.selectedCluster)
    },
    uniqueHosts () {
      return this.data?.find(cluster => cluster.clusterName === this.selectedCluster)?.afterHosts || []
    },

    uniqueVms () {
      const selectedCluster = this.data?.find(cluster => cluster.clusterName === this.selectedCluster)
      if (selectedCluster) {
        const hosts = selectedCluster.afterHosts || []
        const vms = []
        for (const host of hosts) {
          vms.push(...(host.vms || []))
        }
        return vms
      }
      return []
    }
  },
  methods: {
    closeModal () {
      this.type = 'HW'
      this.mode = ''
      this.transferTo = ''
      this.selectedCluster = ''
      this.$emit('close')
    },
    formatInputValue (idx, prop, event) {
      this.selecOptions[idx][prop] = parseInt(Number(event), 10)
    },
    getData (type) {
      return {
        HW: this.uniqueHosts,
        VM: this.uniqueVms,
        EMPTY: []
      }[type] || []
    },
    apply () {
      const { mode } = this
      if (mode === 'TRANSFER') {
        const data = {
          selectedCluster: this.selectedCluster,
          transferTo: this.transferTo,
          type: this.type,
          mode: this.mode,
          data: this.selectedList?.map(x => {
            return {
              ...x,
              checked: false
            }
          })

        }
        this.$emit('apply', data)
        this.closeModal()
      }

      if (mode === 'DELETE') { // 삭제
        const data = {
          selectedCluster: this.selectedCluster,
          type: this.type,
          mode: this.mode,
          data: this.selectedList
        }
        this.$emit('apply', data)
        this.closeModal()
      }
      if (mode === 'CREATE') { // 생성
        const data = {
          selectedCluster: this.selectedCluster,
          type: this.type,
          mode: this.mode,
          data: this.selecOptions
        }

        this.$emit('apply', data)
        this.closeModal()
        const random = (Math.random() * 100000).toFixed(0)
        this.selecOptions = [{ hostUuid: `uuid-${random}`, cpu: 0, memory: 0, disk: 0, amount: 1 }]
      }
    },
    onCheckboxRow (rows) {
      this.selectedList = [...rows]
    },
    addOption () {
      this.selecOptions.push({
        hostUuid: Math.random() * 1000000,
        cpu: 0,
        memory: 0,
        disk: 0,
        amount: 1
      })
    },
    removeOption (hostUuid) {
      this.selecOptions = this.selecOptions.filter(x => x.hostUuid !== hostUuid)
    }
  },
  data () {
    const random = (Math.random() * 100000).toFixed(0)
    return {
      selectedList: [],
      gonBeDeletedHosts: [],
      selectedVms: [],
      selectedHws: [],
      selectedClusterName: undefined,
      transferFrom: '',
      transferTo: '',
      selectedCluster: '',
      type: 'HW',
      mode: '',
      selecOptions: [{ hostUuid: `uuid-${random}`, cpu: 0, memory: 0, disk: 0, amount: 1 }],
      defaultSelecOptions: [{ hostUuid: `uuid-${random}`, cpu: 0, memory: 0, disk: 0, amount: 1 }]
    }
  }
}
</script>

<style lang="scss" scoped>
.title {
  margin: 20px 0px;
  text-indent: 10px;
  font-size: 18px;
}

.main {
  &::v-deep {
    .el-input {
      width: 150px;
    }
  }
  .section {
    border: 1px solid #2a2d44;
    .select-list {
      padding: 20px;
      .select-option {
        display: flex;
        position: relative;
        margin-bottom:10px;
        &:last-child {
          margin-bottom:0px;
        }
        > div {
          display: flex;
          span {
            padding: 0px 20px;
          }
        }
      }
    }
  }

  .total {
    position:relative;
    border-top: 1px solid #2a2d44;
    padding: 20px;
    display: flex;
    > div {
      span {
        width: auto;
        text-align: center;
        display: inline-block;
        padding: 0px 20px;
      }

      .input-field {
        width: 150px !important;
      }
    }
  }
}

.button-area {
  display: flex;
  justify-content: center;
  padding-top: 30px;
}

.-add-button {
  right: -$gap-m;
  color: $primary;

}
.-delete-button {
  margin-left: $gap-s;
  color: $primary;
}

</style>
