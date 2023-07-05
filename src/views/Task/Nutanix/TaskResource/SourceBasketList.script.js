import { SetOSIcon } from '@sd-fe/cmp-core'
export default {
  name: 'SourceBasketListList',
  components: {
    'set-os-icon': SetOSIcon
  },
  props: {
    data: {
      type: Object,
      default: () => {}
    },
    binding: {
      type: String,
      default: undefined
    }
  },
  render (h) {
    return (
      <div class="basket-info" onClick={e => this.$emit('click')}>
        { this.columnsRender() }
      </div>
    )
  },
  methods: {
    columnsRender () {
      const location = { top: [], bottom: [] }
      this.columnsTypes[this.binding].forEach(column => {
        const divide = column.row === 0 ? 'top' : 'bottom'
        location[divide].push(column)
      })

      const result = []
      for (const row in location) {
        // 각 키/값 바인딩
        const inner = location[row].map(({ key, title, cssClass, type }) => {
          const valueData = this.data.orderDataForTicket ? this.data.orderDataForTicket[key] : this.data.orderData[key]
          // const value = isOS ? <set-os-icon os-name={valueData}></set-os-icon> : valueData
          const value = type ? this.setValue(type, valueData) : valueData

          // [변경] 전/후가 같은지?다른지 확인하기 (다를때만 전 데이터 보여주기)
          let before
          const beforeValueData = this.data.orderDataForTicket.beforeData ? this.data.orderDataForTicket.beforeData[key] : null
          const beforeData = type ? this.setBeforeValue(type, beforeValueData, valueData) : beforeValueData

          // console.log(key, beforeData, ' => ', valueData)

          if (beforeData && (valueData !== beforeData)) before = `${beforeData} → `

          const result = before ? (<span style="color: #d95252">{value}</span>) : value // 변화가 있으면 색 변경된 값에 색 추가

          return (
            <div class={`test ${cssClass}`}>
              <div class="title">{title}</div>
              <div class="value">{before}{result}</div>
            </div>
          )
        })

        const wrapper = <div class={`basket-info-${row} basket-info-wrapper`}>{inner}</div>
        result.push(wrapper)
      }

      return result
    },
    setValue (type, value) {
      const values = {
        // OS/OS버전
        os: () => {
          return (
            <div style="display: flex; align-items: center;">
              <div style="width: 200px; overflow: hidden">
                <set-os-icon os-name={value}></set-os-icon>
              </div>
              &nbsp;{ value?.length > 30 ? '...' : '' }
            </div>
          )
        },
        // Local Disk
        externalDisk: () => {
          let extDiskSum = 0
          let extDiskCnt = 0

          const values = value || []
          const test = values.map(({ data, diskName, name, diskSize }) => {
            extDiskSum = extDiskSum + diskSize
            extDiskCnt = extDiskCnt + 1
            return <div><span style="display: inline-block; width: 40px;">{diskName || name}</span> {data}</div>
          })

          const string = <span>{ extDiskSum || 0 } GB ({ extDiskCnt || 0 } EA)</span>

          return test.length
            ? (
              <el-tooltip
                placement="bottom-start"
                effect="light"
              >
                <div slot="content">{test}</div>
                { string }
              </el-tooltip>
            )
            : string
        },
        // 설치프로그램
        installProgram: () => {
          const values = value || []
          const softwares = values.map(({ softwareName }) => `${softwareName}`)
          const softwareNames = softwares.join('<br>')
          const softwareLen = softwares.length

          return softwares.length
            ? (
              <el-tooltip
                placement="bottom-start"
                effect="light"
                content={softwareNames}
              >
                <span>{softwareLen > 0 ? softwareLen : 0} EA</span>
              </el-tooltip>
            )
            : <span> 0 EA</span>
        }
      }[type]

      return values()
      // switch (type) {
      //   case 'os': return
      //   case 'externalDisk': return value
      //   case 'installProgram':
      //     return (() => {
      //
      //
      //     })()
      //   default: return value
      // }

      // if ()
    },
    setBeforeValue (type, before, after) {
      if (!before) return before
      // console.log(type, before, after)

      const beforeValue = JSON.stringify(before)
      const afterValue = JSON.stringify(after)

      // 비교해서 같으면 undefined : 다르면 데이터 String 가공
      const compare = beforeValue === afterValue

      const values = {
        // OS/OS버전
        os: () => compare ? undefined : before,

        // Local Disk
        externalDisk: () => {
          let extDiskSum = 0
          let extDiskCnt = 0

          const values = before || []
          console.clear()
          console.log(values)
          values.forEach(({ data, diskName, diskSize }) => {
            extDiskSum = extDiskSum + diskSize
            extDiskCnt = extDiskCnt + 1
          })

          const text = `${extDiskSum || 0} GB (${extDiskCnt || 0} EA)`

          return compare ? undefined : text
        },

        // 설치프로그램
        installProgram: () => {
          const values = before || []
          const softwares = values.map(({ softwareName }) => `${softwareName}`)
          const softwareLen = softwares.length

          return compare ? undefined : `${softwareLen > 0 ? softwareLen : 0} EA`
        }
      }[type]

      return values()
      // switch (type) {
      //   case 'os': return
      //   case 'externalDisk': return value
      //   case 'installProgram':
      //     return (() => {
      //
      //
      //     })()
      //   default: return value
      // }

      // if ()
    }
  },
  data: root => ({
    /*
    * binding key(바인딩할 키 이름), css-class(키), header(이름)
    * style { row :: [상위 / 하위] 영역, cssClass: [start|middle|end], [col1, col2] }
    */
    columnsTypes: {
      COMPUTE: [
        { key: 'osName', title: `${root.$v('이미지명')}  (OS Bit)`, row: 0, cssClass: 'start-col2', type: 'os' },
        { key: 'vcpu', title: 'vCPU', row: 0, cssClass: 'middle-col1_1' },
        { key: 'memory', title: root.$v('메모리'), row: 0, cssClass: 'middle-col1_1' },
        { key: 'rootDiskSize', title: 'RootDisk', row: 0, cssClass: 'end' },
        { key: 'installPrograms', title: root.$v('설치프로그램'), row: 1, cssClass: 'start-col2', type: 'installProgram' },
        { key: 'ipLabel', title: 'IP', row: 1, cssClass: 'middle-col1_1' },
        { key: 'networkArea', title: root.$v('네트워크 조직'), row: 1, cssClass: 'middle-col1_1' },
        { key: 'externalDiskUsage', title: 'Local Disk', row: 1, cssClass: 'end', type: 'externalDisk' }
      ],
      SECURITY: [
        { key: 'startTime', title: root.$v('시작일'), row: 0, cssClass: 'start-col2' },
        { key: 'endTime', title: root.$v('종료일'), row: 1, cssClass: 'start-col2' }
      ],
      L4: [
        { key: 'ip', title: root.$v('가상 IP'), row: 0, cssClass: 'start-col2' },
        { key: 'protocolType', title: root.$v('프로토콜'), row: 0, cssClass: 'middle-col2' },
        { key: 'port', title: root.$v('포트'), row: 1, cssClass: 'start-col2' },
        { key: 'method', title: root.$v('방식'), row: 1, cssClass: 'start-col1_1' }
      ],
      L7: [
        { key: 'ip', title: root.$v('가상 IP'), row: 0, cssClass: 'start-col2' },
        { key: 'protocolType', title: root.$v('프로토콜'), row: 0, cssClass: 'middle-col2' },
        { key: 'port', title: root.$v('포트'), row: 1, cssClass: 'start-col2' },
        { key: 'method', title: root.$v('방식'), row: 1, cssClass: 'start-col1_1' }
      ],
      STORAGE: [
        { key: 'connectedVms', title: root.$v('연결 호스트명'), row: 0, cssClass: 'start-col2' },
        { key: 'diskCount', title: root.$v('수량'), row: 0, cssClass: 'middle-col1_1' },
        { key: 'diskSize', title: root.$v('크기 (신청 용량)'), row: 1, cssClass: 'start-col2' }
      ],
      DATABASE: [
        { key: 'osInfo', title: root.$v('OS/OS 버전'), row: 0, cssClass: 'start-col2', type: 'os' },
        { key: 'vcpu', title: 'vCPU', row: 0, cssClass: 'middle-col1_1' },
        { key: 'memory', title: root.$v('메모리'), row: 0, cssClass: 'middle-col2' },
        { key: 'rootDiskSize', title: 'DB Size', row: 0, cssClass: 'end' },
        { key: 'engineInfo', title: 'DB ENGINE', row: 1, cssClass: 'start-col2' },
        { key: 'ip', title: 'IP', row: 1, cssClass: 'middle-col1_1' },
        { key: 'networkArea', title: root.$v('네트워크 조직'), row: 1, cssClass: 'middle-col1_1' },
        { key: 'port', title: 'Port', row: 1, cssClass: 'end' }
      ],
      MARKET: [
        { key: 'osName', title: root.$v('OS/OS 버전'), row: 0, cssClass: 'start-col2', type: 'os' },
        { key: 'vcpu', title: 'vCPU', row: 0, cssClass: 'middle-col1_1' },
        { key: 'memory', title: root.$v('메모리'), row: 0, cssClass: 'middle-col2' },
        { key: 'rootDiskSize', title: 'RootDisk', row: 0, cssClass: 'end' },
        { key: 'installPrograms', title: root.$v('설치프로그램'), row: 1, cssClass: 'start-col1_1', type: 'installProgram' },
        { key: 'appliation', title: 'Application', row: 1, cssClass: 'start-col1_2' },
        { key: 'ipLabel', title: 'IP', row: 1, cssClass: 'middle-col1_1' },
        { key: 'networkArea', title: root.$v('네트워크 조직'), row: 1, cssClass: 'middle-col1_1' },
        { key: 'externalDiskUsage', title: 'Local Disk', row: 1, cssClass: 'end', type: 'externalDisk' }
      ],
      FILE_SERVER: [
        { key: 'maxSizeGiB', title: root.$v('최대 용량'), row: 0, cssClass: 'middle-col1_1' },
        { key: 'protocolType', title: root.$v('프로토콜 타입'), row: 0, cssClass: 'end' },
        { key: 'mountPath', title: root.$v('마운트 경로'), row: 1 }
      ],
      EC2: [
        { key: 'instanceType', title: root.$v('인스턴스 유형'), row: 0, cssClass: 'start-col2' },
        { key: 'vcpu', title: 'vCPU', row: 0, cssClass: 'middle-col1_1' },
        { key: 'memory', title: root.$v('메모리'), row: 0, cssClass: 'middle-col1_1' },
        { key: 'storage', title: root.$v('스토리지'), row: 0, cssClass: 'end' },
        { key: 'vpc', title: 'VPC', row: 1, cssClass: 'start-col1_1' },
        { key: 'subnet', title: root.$v('서브넷'), row: 1, cssClass: 'start-col1_2' },
        { key: 'group', title: root.$v('보안그룹'), row: 1, cssClass: 'middle-col2' },
        { key: 'monitoringState', title: root.$v('세부모니터링'), row: 1, cssClass: 'end' }
      ],
      EFS: [
        { key: 'isRegion', title: root.$v('적용 범위'), row: 0, cssClass: 'start-col2' },
        { key: 'throughputMode', title: root.$v('처리량 모드'), row: 0, cssClass: 'end' },
        { key: 'performanceMode', title: root.$v('성능 모드'), row: 1, cssClass: 'start-col2' },
        { key: 'environment', title: 'VPC', row: 1, cssClass: 'end' }
      ],
      SG: [
        { key: 'description', title: root.$v('보안그룹 설명'), row: 0, cssClass: 'start-col2' },
        { key: 'vpcKor', title: 'VPC', row: 0, cssClass: 'end' },
        { key: 'inboundGroup', title: root.$v('인바운드 규칙'), row: 1, cssClass: 'start-col2' },
        { key: 'outboundGroup', title: root.$v('아웃바운드 규칙'), row: 1, cssClass: 'end' }
      ],
      TARGET_GROUP: [
        { key: 'targetType', title: root.$v('대상그룹 유형'), row: 0, cssClass: 'start-col2' },
        // { key: 'vcpu', title:root.$v( '상태확인 프로토콜'), row: 0, cssClass: 'middle-col1_2' },
        { key: 'servicePort', title: root.$v('대상그룹 서비스포트'), row: 1, cssClass: 'start-col2' },
        { key: 'healthCheckPath', title: root.$v('상태확인 경로'), row: 0, cssClass: 'end' }
        // { key: 'ipLabel', title:root.$v( '알고리즘'), row: 1, cssClass: 'middle-col1_2' },
        // { key: 'externalDiskUsage', title:root.$v( '인스턴스'), row: 1, cssClass: 'end' }
      ],
      LOADBALANCER: [
        { key: 'loadbalancerType', title: root.$v('로드밸런서 종류'), row: 0, cssClass: 'start-col2' },
        // { key: 'vcpu', title:root.$v( '삭제방지'), row: 0, cssClass: 'middle-col1_2' },
        { key: 'registerListener', title: root.$v('리스너/대상그룹'), row: 0, cssClass: 'end' },
        { key: 'isPublic', title: root.$v('스키마'), row: 1, cssClass: 'start-col2' },
        { key: 'vpc', title: 'VPC', row: 1, cssClass: 'end' }
        // { key: 'externalDiskUsage', title: '교차영역 로드밸런싱', row: 1, cssClass: 'middle-col1_2' },
        // { key: 'externalDiskUsage', title: '액세스 로그', row: 1, cssClass: 'end' }
      ],
      TRANSIT_GATEWAY: [
        { key: 'transitGatewayId', title: 'Transit Gateway ID', row: 0, cssClass: 'start-col2' },
        { key: 'resourceName', title: 'Resource Name', row: 0, cssClass: 'end' },
        { key: 'attachmentType', title: '연결 방식', row: 1, cssClass: 'start-col2' },
        { key: 'amazonAsn', title: 'Amazon ASN', row: 1, cssClass: 'end' }
      ],
      // TRANSIT_GATEWAY_VPN: [
      //   { key: 'transitGatewayId', title: 'Transit Gateway ID', row: 0, cssClass: 'start-col2' },
      //   { key: 'transitGatewayName', title: 'Transit Gateway Name', row: 0, cssClass: 'end' },
      //   { key: 'attachmentType', title: '연결 방식', row: 1, cssClass: 'start-col2' },
      //   { key: 'amazonAsn', title: 'Amazon ASN', row: 1, cssClass: 'end' }
      // ],
      // TRANSIT_GATEWAY_PEERING: [
      //   { key: 'transitGatewayId', title: 'Transit Gateway ID', row: 0, cssClass: 'start-col2' },
      //   { key: 'transitGatewayName', title: 'Transit Gateway Name', row: 0, cssClass: 'end' },
      //   { key: 'attachmentType', title: '연결 방식', row: 1, cssClass: 'start-col2' },
      //   { key: 'amazonAsn', title: 'Amazon ASN', row: 1, cssClass: 'end' }
      // ],
      VM: [
        { key: 'osName', title: `${root.$v('이미지명')}  (OS Bit)`, row: 0, cssClass: 'start-col2', type: 'os' },
        { key: 'vcpu', title: 'vCPU', row: 0, cssClass: 'middle-col1_1' },
        { key: 'memory', title: root.$v('메모리'), row: 0, cssClass: 'middle-col1_1' },
        { key: 'rootDiskSize', title: 'RootDisk', row: 0, cssClass: 'end' },
        { key: 'installPrograms', title: root.$v('설치프로그램'), row: 1, cssClass: 'start-col2', type: 'installProgram' },
        { key: 'ipLabel', title: 'IP', row: 1, cssClass: 'middle-col1_1' },
        { key: 'networkArea', title: root.$v('네트워크 조직'), row: 1, cssClass: 'middle-col1_1' },
        { key: 'externalDiskUsage', title: 'Local Disk', row: 1, cssClass: 'end', type: 'externalDisk' }
      ],
      VSAN_ISCSI: [
        { key: 'connectedVms', title: root.$v('연결 호스트명'), row: 0, cssClass: 'start-col2' },
        { key: 'diskCount', title: root.$v('수량'), row: 0, cssClass: 'middle-col1_1' },
        { key: 'diskSize', title: root.$v('크기 (신청 용량)'), row: 1, cssClass: 'start-col2' }
      ]
    }
  })
}
