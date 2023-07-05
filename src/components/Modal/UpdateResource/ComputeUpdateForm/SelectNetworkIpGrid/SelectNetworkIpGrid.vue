<!--
  * 파일명 : SelectNetworkIpGrid.vue
  * 파일 기능 : 네트워크 IP 설정 폼
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-01-26
  * License By Shinsegae I&C
 -->
<template>
  <div class="select-network-ip-grid">
    <el-tag
      v-if="clusterName"
      style="margin-bottom: 20px;"
    >
      {{ clusterName }}
    </el-tag>
    <cmp-grid
      :item-source="gridData"
      :columns="columns"
      selectable
      @selectedRow="setSelectedNetwork(...arguments)"
      :init-auto-select-row="selectedIp"
      init-auto-select-row-key="subnetUuid"
    >
      <template
        v-for="column in columns"
        :slot="column.binding"
        slot-scope="props"
      >
        <div :key="column.binding">
          <el-input
            v-if="props.row[column.binding].edit && !props.row[column.binding].disabled"
            v-model="props.row[column.binding].data"
            type="text"
            @keypress.native.enter="saveCustomIpPool(props.row[column.binding], column.binding)"
            @blur="e => saveCustomIpPool(props.row[column.binding], column.binding)"
            :placeholder="$t('common.PLACEHOLDER.enterDirect')"
            @click.native="(e) => {
              e.stopPropagation()
            }"
          />
          <!-- 직접 입력 -->

          <!-- <button
            class="button"
            v-if="!props.row[column.binding].edit && !props.row[column.binding].data && !props.row[column.binding].disabled"
            @click="e => {
              props.row[column.binding].edit = true
            }"
          >
            {{ $t('common.PLACEHOLDER.enterDirect') }}
          </button> -->

          <span
            class="custom-ip"
            :class="{'-link' : !props.row[column.binding].disabled}"
            v-if="(!props.row[column.binding].edit && props.row[column.binding].data) ||props.row[column.binding].disabled "
            @click="e => {
              props.row[column.binding].disabled ? null : props.row[column.binding].edit = true;
            }"
          >
            <!-- clickEvt(e) -->
            {{ props.row[column.binding].data }}
          </span>
        </div>
      </template>

      <template #ipPool="props">
        <button-popup
          v-if="props.row.subnetPools"
          :popup-data="setIpPools(props.row.subnetPools)"
          trigger="hover"
          @click.native="(e) => {
            e.preventDefault()
          }"
        >
          IP Pool
        </button-popup>
      </template>

      <template #activeIPAM="props">
        <cmp-status-tag
          :type="props.row.activeIPAM ? 'is-primary' : 'is-undefined'"
          :line-style="true"
          style="width: 50px;"
        >
          {{ props.row.activeIPAM ? 'ON' : 'OFF' }}
        </cmp-status-tag>
      </template>
    </cmp-grid>

    <div
      class="button-area page-bottom -center modal-button-area"
      v-if="useBtn"
    >
      <button
        class="button"
        type="is-anti"
        @click="cancel"
      >
        <!-- 취소 -->
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="save"
      >
        <!-- 확인 -->
        {{ $t('common.BTN.confirm') }}
      </button>
    </div>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import ButtonPopup from '@/components/ButtonPopup/ButtonPopup'

export default {
  name: 'SelectNetworkIpGrid',
  props: {
    clusterName: {
      type: String,
      default: ''
    },
    gridData: {
      type: Array,
      default: () => []
    },
    initSelected: {
      type: Object,
      default: null
    },
    useBtn: {
      type: Boolean,
      default: true
    },
    customDisableIps: { // 추가로 사용 불가능한 IP 리스트 ['10.10.10.1', ...]
      type: Array,
      default: () => []
    }
  },
  components: {
    ButtonPopup
  },
  created () {
    if (this.initSelected) this.selectedIp = this.initSelected
  },
  methods: {
    /**
     * 선택 네트워크 = this.selectedNetwork
     */
    setSelectedNetwork (param) {
      // const data = param ? param.dataItem : null
      // const result = JSON.parse(JSON.stringify(this.selectedNetworkList))

      // const addSelectedInfo = {
      //   ...cateInfo,
      //   subnetName: data?.subnetName,
      //   subnetUuid: data?.subnetUuid,
      //   vlanId: data?.vlanId
      // }

      // if (data) {
      //   let hasIdIdx
      //   const hasId = result.filter((network, nIdx) => {
      //     if (network.cateId === cateInfo.cateId) {
      //       hasIdIdx = nIdx
      //       return true
      //     }
      //   })
      //   if (hasId.length) result.splice(hasIdIdx, 1, addSelectedInfo)
      //   else result.push(addSelectedInfo)
      // } else {
      //   result.forEach((network, nIdx) => {
      //     if (network?.cateId === cateInfo?.cateId) return result.splice(nIdx, 1)
      //   })
      // }

      // this.$emit('select', param)
      // this.selectedNetwork = param
      // this.selectedNetworkList = [...result]
      // this.initSelected = data
      const data = param ? param._data : null
      this.selectedIp = data
      // console.log('SE:ECt: ', this.selectedIp)
      this.$emit('select', this.selectedIp)
    },
    /**
     * [직접 입력]한 ip 를 저장합니다.
     */
    saveCustomIpPool (cellData, field) {
      if (!cellData?.data) return
      if (field === 'customIp') {
        const ipformatCheck = this.ipformat.test(cellData.data)

        if (!ipformatCheck) {
          this.$alert(this.$t('common.ALERT.PROJECT.023')) // 입력하신 값은 IP형식이 아닙니다.
          cellData.data = ''
          return false
        }
      }
      cellData.edit = false
    },
    /**
     * 업무 쪽에서 긁어왔습니다. 감사합니다..
     * IPAM ON
     * [네트워크] 영역에서 선택한 row가 [자동] 일 경우에 validation 처리
     * [직접입력] 을 사용하여 아이피가 등록되지 않은 경우는 서버에서 자동으로 IP 가 할당됩니다.
     * @param { Object } data this.selectedIp
     */
    async networkAutoValidation (item = this.selectedIp) {
      const customIP = item.customIp

      // [직접입력] 으로 직접 입력이 된 경우
      if (customIP.data) {
        const ipformatCheck = this.ipformat.test(customIP.data)

        // 1. ip 형식이 맞는지 확인
        if (!ipformatCheck) {
          this.$alert(this.$t('common.ALERT.PROJECT.023')) // 입력하신 값은 IP형식이 아닙니다.
          return false
        }

        // ip 형식 가공
        const atoi = ip => {
          const pad = n => { return (n.length < 3) ? pad('0' + n) : n }
          return parseInt(ip.split('.').map((el) => pad(el)).join(''), 10)
        }

        // 2. 직접 입력된 IP 가 startAddress ~ endAddress 내부에 있는지 확인합니다.
        //    ipPool 범위중 하나라도 포함될 경우 true 를 반환합니다.
        const isIncluded = item.subnetPools.some(pool => {
          console.log(atoi(customIP.data))
          return (
            atoi(customIP.data) >= atoi(pool.startAddress) &&
            atoi(customIP.data) <= atoi(pool.endAddress)
          )
        })

        if (!isIncluded) {
          this.$alert(this.$t('common.ALERT.SECURITY.028')) // IP 범위를 벗어났습니다.
          return false
        }

        // 3. API로 validation 추가
        const serverChecking = await this.ipChecking(customIP.data, item)
        if (!serverChecking) return false

        // 4. custom으로 사용 불가능한 IP가 있을 때 validation
        if (this.customDisableIps.length) {
          const customIp = this.selectedIp.customIp?.data
          if (customIp && this.customDisableIps.includes(customIp)) {
            this.$alert(this.$t('common.ALERT.PROJECT.021'), '', () => false) // 이미 사용 중인 IP 입니다
            return false
          }
        }
      }

      // 임시?
      // if (customIP.data) this.selectedIp.ipAddress = customIP.data
      // this.selectedIp.ipAddress = customIP.data
      // if (!customIP.data) delete this.selectedIp.ipAddress

      return true
    },
    /**
     * 업무 쪽에서 긁어왔습니다. 감사합니다..
     * IPAM OFF
     * [네트워크] 영역에서 선택한 row가 [수동] 일 경우에 validation 처리
     * 참고 ** DNS 는 입력이 옵션입니다.
     * @param { Object } item this.selectedIp
     */
    async networkManualValidation (item = this.selectedIp) {
      const ipFormatData = [item.customIp?.data, item.defaultGatewayIp?.data, item.dns?.data]

      // const isIPEditing = ipFormatData.some(cond => cond?.edit)
      // const isIPEmpty = ipFormatData.some(cond => cond?.data === '' || !cond?.data)
      // const ipformatCheck = ipFormatData.every(item => this.ipformat.test(item.data))

      // // IP, Gateway, Netmask, Prefix 수정중 일 경우
      // const conditions = [
      //   { condition: isIPEmpty, message: this.$t('common.ALERT.PROJECT.060') }, // IP가 없습니다. IP 를 먼저 입력해주세요.
      //   { condition: isIPEditing, message: this.$t('common.ALERT.SECURITY.026') }, // IP를 수정 중 입니다. 완료 하신 후 다시 확인 해주세요.
      //   { condition: !ipformatCheck, message: this.$t('common.ALERT.PROJECT.023') } // 입력하신 값은 IP형식이 아닙니다.
      // ]

      const validator = ipFormatData.every(cond => cond !== undefined)

      if (!validator) {
        this.$alert(this.$t('common.ALERT.COMP.020', { subnetName: this.selectedIp.subnetName }), {
          dangerouslyUseHTMLString: true
        })
        return false
      }

      // // prefix validation 처리를 합니다.
      // const prefixLen = item.prefixLength.data
      // if (!(prefixLen >= 0 && prefixLen <= 32)) {
      //   // prefix 는 0 ~ 32 까지의 정수가 가능합니다.
      //   this.$alert(this.$t('common.ALERT.PROJECT.061'))
      //   item.prefixLength.data = 0
      //   return false
      // }

      // 3. API로 validation 추가
      const serverChecking = await this.ipChecking(item.customIp.data, item)
      if (!serverChecking) return false

      // 4. custom으로 사용 불가능한 IP가 있을 때 validation
      if (this.customDisableIps.length) {
        const customIp = this.selectedIp.customIp?.data
        if (customIp && this.customDisableIps.includes(customIp)) {
          this.$alert(this.$t('common.ALERT.PROJECT.021'), '', () => false) // 이미 사용 중인 IP 입니다
          return false
        }
      }

      this.selectedIp = {
        ...this.selectedIp,
        ipAddress: item.customIp.data // customIP
        // gateway: item.defaultGatewayIp.data, // Gateway
        // dns: item.dns.data, // DNS
        // netmask: item.netmask.data,
        // prefix: item.prefix.data,
        // prefixLength: item.prefixLength
      }

      return true
    },
    /**
     * 서버에서 ip 를 체크합니다. => 업무 쪽에서 긁어왔습니다..
     * @param { String } data 직접 입력된 ip 의 string 데이터
     * @param { Object } item 자원에 할당된 네트워크 정보 selectedNetwork
     */
    async ipChecking (data, item) {
      try {
        // API 결과 -> ip 사용중일경우 :: false
        const vlanId = item.vlanId
        const networkIpCheck = await API.network.ipCheck({ ip: data, vlanId }) // ip 대역 체크
        // const taskIpCheck = await API.work.taskIpCheck({ ip: data, orderDataIdx: this.orderData?.orderDataIdx }) // 장바구니 ip 사용중 체크

        // if (!networkIpCheck || !taskIpCheck) {
        if (!networkIpCheck) {
          this.$alert(this.$t('common.ALERT.PROJECT.021'), '', () => false) // 이미 등록되어 있는 IP 입니다
          return false
        } else return true
      } catch (error) {
        console.error('@@ ipChecking', error)
        const message = {
          NET1507: this.$t('common.ALERT.PROJECT.076'), // 미등록 IP 입니다.
          NET1508: this.$t('common.ALERT.PROJECT.021') // 이미 사용중인 IP 입니다
        }[error.data.code]

        this.$alert(message || this.$t('common.ALERT.PROJECT.077'), '', () => false) // 해당 IP는 등록이 불가능합니다.
        return false
      }
    },
    /**
     * [직접 입력] 시 자동으로 해당 셀에 생긴 input 박스에 focus 를 입력합니다.
     * @param {Event Object} e 이벤트 객체
     */
    async clickEvt (e) {
      return new Promise(function (resolve, reject) {
        setTimeout(() => {
          const node = e.path[1].querySelectorAll('input')
          if (node.length) resolve(node[0])
        }, 20)
      })
        .then(abc => abc.focus())
        .catch(err => {
          console.error(err, 'Element doensn\'t exist.')
        })
    },
    /**
     * '취소' 클릭 시 발생 이벤트
     */
    cancel () {
      this.$emit('cancel')
      this.selectedIp = null
    },
    /**
     * '확인' 클릭 시 발생 이벤트
     */
    async save () {
      if (!this.selectedIp) return this.$alert(this.$t('common.ALERT.COMP.018'))

      const passed = !this.selectedIp.activeIPAM ? this.networkManualValidation(this.selectedIp) : this.networkAutoValidation(this.selectedIp)

      console.log('this.selectedIp: ', this.selectedIp)
      if (await passed) {
        this.$confirm(this.$t('common.CONFIRM.COMP.003')).then(async () => { // 해당 IP로 설정하시겠습니까?
        // 선택된 네트워크가 수동인 경우 : 자동인경우 - validation 체크

          this.selectedIp = {
            ...this.selectedIp,
            ipAddress: this.selectedIp.customIp?.data ? this.selectedIp.customIp.data : undefined,
            gateway: this.selectedIp.defaultGatewayIp.data, // Gateway
            dns: this.selectedIp.dns.data, // DNS
            netmask: this.selectedIp.netmask.data,
            prefix: this.selectedIp.prefix.data,
            prefixLength: this.selectedIp.prefixLength
          }

          if (!this.selectedIp.ipAddress) delete this.selectedIp.ipAddress

          this.$emit('save', this.selectedIp)
          this.cancel()
        }).catch(() => false)
      }
    }
  },
  data () {
    return {
      selectedIp: null, // 선택한 IP (row)
      columns: [
        { header: this.$t('common.REGCON.name'), binding: 'subnetName' }, // 이름
        { header: 'VLAN ID', binding: 'vlanId', width: 80, format: 'd*' },
        { header: 'IP', binding: 'customIp', customHtml: true, sorting: false },
        { header: 'Gateway', binding: 'defaultGatewayIp', customHtml: true, sorting: false },
        // { header: 'Netmask', binding: 'netmask', customHtml: true, sorting: false },
        { header: 'DNS', binding: 'dns', customHtml: true, sorting: false },
        { header: 'Prefix', binding: 'prefix', customHtml: true, sorting: false, keyPath: 'config.IP.band' }, // IP 대역
        { header: 'Pool', binding: 'ipPool', width: 150, customHtml: true, sorting: false },
        { header: this.$t('common.GRID.COMPUTE.activeIPAM'), binding: 'activeIPAM', customHtml: true, sorting: false } // IPAM 활성 여부
      ],
      setIpPools: subnetPools => {
        return subnetPools.map(pool => {
          const { startAddress, endAddress } = pool
          return { label: `${startAddress} - ${endAddress}` }
        })
      },
      ipformat: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    }
  }
}
</script>
