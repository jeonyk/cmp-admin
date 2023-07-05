
import API from '@sd-fe/cmp-core'
import { mapState } from 'vuex'

export default {
  props: {
    data: { // 선택된 row를 가져옵니다
      type: Object,
      default () {}
    },
    tableData: { // 전체 테이블 데이터
      type: Array,
      default: () => []
    },
    active: {
      type: Boolean,
      default: false
    },
    readOnly: { // 읽기 전용
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      cloud: state => state.cloud.cloud.toUpperCase()
    })
  },
  data: {
    operations: null
  },
  methods: {
    /**
     * [직접 입력] 시 자동으로 해당 셀에 생긴 input 박스에 focus 를 입력합니다.
     * @param {Event Object} e 이벤트 객체
     */
    async clickEvt (e) {
      return new Promise(function (resolve, reject) {
        setTimeout(() => {
          const node = e?.path ? e.path.querySelectorAll('input') : null
          if (node && node.length) resolve(node[0])
        }, 20)
      })
        .then(abc => abc.focus())
        .catch(err => {
          console.error(err, 'Element doensn\'t exist.')
        })
    },

    gridRefresh (grid) {
      if (grid) {
        const cv = grid.collectionView
        if (cv) cv.refresh()
      }
    },

    /**
     * 데이터를 emit 하여 부모컴포넌트에 보냅니다.
     * @param { Object } emitData 가공된 데이터
     */
    emitSavedData (emitData) {
      this.$confirm(this.$t('common.CONFIRM.BASE.019'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.$emit('confirm', emitData)
        this.close()
      }).catch(() => false)
    },

    /**
     * [클러스터 선택 모달]이 켜질때 {클러스터 / 노드} 가 자동으로 선택됩니다. (클러스터/노드 공통으로 사용됨)
     * @param {Object} element 바인딩된 데이터
     * @param {String} propName 카피된 데이터에서 어떤게 필요한지 프로퍼티를 string 으로 받음
     */
    checkSelectedRow (element, propName) {
      // console.log(element, '=== 저장된 요소')
      if (element) return element?.dataItem
      else if (this.cloneData) return this.cloneData[propName]
      else return null
    },

    /**
     * >> 공통
     * [운영그룹] 목록을 조회합니다.
     */
    async getOperationList (manageGroupIdx, type) {
      try {
        const moduleType = { NUTANIX: 'NX' }[this.cloud] || this.cloud
        const operatingGroupType = {
          COMPUTE: 'COMPUTE',
          DATABASE: 'COMPUTE',
          MARKET: 'COMPUTE',
          VM: 'COMPUTE',
          STORAGE: 'STORAGE',
          VSAN_ISCSI: 'STORAGE'
        }[type]

        const { data } = await API.billing.getOperationGroup({
          moduleType,
          operatingGroupType,
          manageGroupIdx
        })

        const result = {}
        for (const { clusterNodeList } of data) {
          for (const { clusterNodeType, clusterNodeId } of clusterNodeList) {
            // CLUSTER|NODE 분리
            if (result[clusterNodeType]) result[clusterNodeType].add(clusterNodeId)
            else result[clusterNodeType] = new Set().add(clusterNodeId)
          }
        }

        this.operations = result
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('운영 그릅 조회에 실패하였습니다.'), () => false)
      }
    },

    /**
     * 운영그룹에 등록되어있는 경우만 ... 보여줌
     * @param {String} type CLUSTER | HOST (있는경우만 비교)
     * @return {Boolean} 통과 여부 확인
     */
    compareOperationList (type, value) {
      if (!this.operations[type]) return true
      return this.operations[type].has(value)
    },

    /**
     * >> L4/L7 ip 검사
     * 저장 전 서버단 IP validation 체크
     * @param {Object} data cloneData
     */
    async setIPValidationPayload (data) {
      const { serviceList, netIdx, projectIdx } = data

      const results = []
      for (const service of serviceList) {
        const { server, port, protocolType, serviceName, serverName } = service

        const payload = { ip: server.ip, netIdx, port, projectIdx, protocolType, serviceName, serverName }

        try {
          const { result } = await API.network.checkSaveServiceInfo(payload)
          results.push(result)
          // if (results.length) return false // 🌸 디버깅용
        } catch (error) {
          console.error('@@ setIPValidationPayload :: ', error)
          return false
        }

        return results.every(i => i)
      }
    },

    /**
    * disabled row 설정 -> 선택 불가능 클러스터는 dimmed 처리
    */
    onLoadedRows (grid) {
      this.$nextTick(function () {
        for (let i = 0; i < grid.rows.length; i++) {
          const row = grid.rows[i]
          const item = row.dataItem
          const cssList = row.cssClass

          if (item.isSelectable === false) {
            item.disable = true
            row.cssClass = cssList + ' is-disable-row'
          } else {
            item.disable = false
            row.cssClass = cssList?.replace(' is-disable-row', '') || ''
          }
        }

        grid.formatItem.addHandler((s, e) => {
          const rowData = s.rows[e.row]?._data
          if (rowData?.osType?.includes('WINDOWS')) {
            this.imageTooltip.setTooltip(e.cell,
              '<small>* WINDOWS는 지원하지 않습니다.</small>')
          }
        })
      })
    }
  }
}
