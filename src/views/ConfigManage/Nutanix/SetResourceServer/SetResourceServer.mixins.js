import Vue from 'vue'
import { mapState } from 'vuex'
import API from '@sd-fe/cmp-core'

export default Vue.extend({
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  async created () {
    await this.getCentralList()
  },
  methods: {
  /**
  * VM Power State ON/OFF 전환시 이벤트
  * @param {Array} vms 전환 할 Vm들
  * @param {String} state 전환 할 상태 ('ON', 'Soft Shutdown', 'Hard Power Off')
  * @return {Boolean} 상태 전환 여부 반환
  */
    async confirmConvertPower (vms, state) {
      const payload = vms.map(v => {
        return {
          beforePrice: v?.beforePrice || 0,
          groupIdx: v.groupIdx,
          groupName: v.groupName,
          isUrgent: !!v.isUrgent,
          price: v?.price || 0,
          projectIdx: v.projectIdx,
          requestData: {
            userVmIdx: v.userVmIdx,
            vmUuid: v.vmUuid,
            powerStatus: state
          },
          service: 'COMPUTE',
          ...(v?.market && { service: 'MARKET' }),
          ...(v?.era && { service: 'DATABASE' }),
          userId: this.user.userId,
          userName: this.user.userName
        }
      })

      let result = true

      const stateKey = {
        OFF: 'Off',
        ON: 'On',
        ACPI_SHUTDOWN: 'Off'
      }[state]

      const stateLabel = this.powerOptions.find(item => item.value === state)?.label || 'ON'
      await this.$confirm(this.$v('VM의 상태를 {stateLabel}(으)로<br>전환하시겠습니까?', { stateLabel }), { dangerouslyUseHTMLString: true })
        .then(async () => {
          const reqResult = await this.convertVmPower(payload, stateKey)
          result = reqResult
        }).catch(() => {
          result = false
        })
      return result
    },
    /*
   * vm Power On/OFF 전환 API 연동
   */
    async convertVmPower (payload, stateKey) {
      try {
        this.loading.convertVmPower = true
        const resultArr = await API.work_v3[`power${stateKey}NxVm`](payload)

        const failItems = resultArr.filter(item => !item.isSuccess)

        const allCheckedLength = payload.length // 요청 갯수
        const failLength = failItems.length // 요청 실패 갯수
        const successLength = allCheckedLength - failLength // 요청 성공 갯수

        // 기본 (전체 다 성공)
        let message = this.$v('VM 상태가 전환됩니다.<br>상당 시간 소요될 수 있습니다.')
        let result = true

        // 전체 다 실패했을 때
        if (!successLength) {
          message = this.$v('VM 상태 변환 중 문제가 발생했습니다.<br>관리자에게 문의해주세요.')
          result = false
        } else if (failLength) { // 성공 자원 / 실패 자원 다 있을 때
          message = `일부 VM 상태가 전환됩니다.<br>상당 시간 소요될 수 있습니다. <br><br>(${this.$v('실패')}: ${failLength} EA)}`
          result = true
        }

        this.$alert(message, { dangerouslyUseHTMLString: true })

        return result
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('VM 상태 변환 중 문제가 발생했습니다.<br>관리자에게 문의해주세요.'), { dangerouslyUseHTMLString: true })
        return false
      } finally {
        this.init()
        this.loading.convertVmPower = false
      }
    },
    /**
    * vm 정보 조회 interval clear
    */
    clearGetVmInterval () {
      clearInterval(this.interval)
      this.interval = null
    },
    /**
     * vm 정보 조회 interval
     */
    async getVmInterval () {
      // await this.init()
      if (this.interval) this.clearGetVmInterval()

      const callbackFlag = false // 비동기 콜백 중첩 방지 위한 flag
      this.interval = setInterval(() => {
        if (!callbackFlag) this.init()
      }, 10000)
    },

    /**
   * vm 생성 이벤트
   */
    async createVm (payload) {
      try {
        this.loading.createVm = true
        // console.log('nx VM 생성: ', payload)
        const result = payload.service === 'VM_TEMPLATE'
          ? await API.work_v3.createNxOVA(payload) // VM 템플릿 직접 생성
          : await API.work_v3.createNxVm(payload) // 일반 vm 생성

        if (result) {
          this.$alert(this.$v('VM 실행 작업이 요청되었습니다.<br>{vmName}', { vmName: payload.requestData.hostname }), { dangerouslyUseHTMLString: true })
          this.init()
          return true
        } return false
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.LOGGING.004'), { dangerouslyUseHTMLString: true }) // 생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        throw error
      } finally {
        this.loading.createVm = false
      }
    },
    /**
     * vm 업데이트 이벤트
     */
    async updateVm (payload) {
      try {
        this.loading.updateVm = true
        console.log('NX 자원 수정: ', payload)
        const result = await API.work_v3.updateNxVm(payload)

        if (result) {
          this.$alert(this.$v('VM 실행 작업이 요청되었습니다.<br>{vmName}', { vmName: payload.requestData.hostname }), {
            dangerouslyUseHTMLString: true
          })
          this.init()
          return true
        } else return false
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), { dangerouslyUseHTMLString: true })
      } finally {
        this.loading.updateVm = false
      }
    },
    /**
     * 미등록 vm 업데이트 이벤트
     */
    async updateUnregisterVm (payload) {
      try {
        this.loading.updateVm = true
        console.log('@updateVm: ', payload.requestData)
        const result = await API.compute.updateUnregisterVm(payload.requestData)

        if (result?.isSuccess) {
          this.$alert(this.$v('VM 실행 작업이 요청되었습니다.<br>{vmName}', { vmName: payload.requestData.hostname }), { dangerouslyUseHTMLString: true }) // VM 실행 작업이 요청되었습니다.<br>{VM명}
          this.init()
          return true
          // this.getVmInterval()
        } else {
          this.$alert(this.$t('common.ALERT.LOGGING.005'), { dangerouslyUseHTMLString: true }) // 수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.
          if (result?.failMessage) console.error(result?.failMessage)
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.LOGGING.005'), { dangerouslyUseHTMLString: true }) // 수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        throw error
      } finally {
        this.loading.updateVm = false
      }
    },

    /*
    * vm Migrate (이관) API 연동
    */
    async migrateVm (payload) {
      try {
        this.loading.migrateVm = true
        const result = await API.work_v3.migrateNxVm(payload)

        if (result) {
          // this.$alert(this.$t('common.ALERT.COMP.028'), { dangerouslyUseHTMLString: true }) // 자원 이관을 진행합니다.<br>상당 시간 소요될 수 있습니다.
          this.$alert(this.$v('VM 실행 작업이 요청되었습니다.<br>{vmName}', { vmName: payload.requestData.hostname }), {
            dangerouslyUseHTMLString: true,
            callback: () => false
          })
          this.modal.migrateVm = false
          this.init()
          return true
        } else return false
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('자원 이관을 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      } finally {
        this.loading.migrateVm = false
      }
    },

    /*
    * vm Clone (복제) API 연동
    * @param {Object} 복제 데이터
    */
    async cloneVm (userVmIdx, vms) {
      try {
        this.loading.cloneVm = true

        const payload = vms.map(clone => {
          const { groupIdx, groupName, isUrgent, price, projectIdx } = clone

          return {
            beforePrice: 0,
            groupIdx,
            groupName,
            isUrgent,
            price,
            projectIdx,
            requestData: clone,
            service: 'COMPUTE',
            userId: this.user.userId,
            userName: this.user.userName
          }
        })

        const clonedVmNames = vms.map(item => item.hostname)
        const clonedVmNamesText = clonedVmNames.join('<br>')

        const resultArr = await API.work_v3.cloneNxVm(userVmIdx, payload)

        const failItems = resultArr.filter(item => !item.isSuccess)
        const allCheckedLength = payload.length // 요청 갯수
        const failLength = failItems.length // 요청 실패 갯수
        const successLength = allCheckedLength - failLength // 요청 성공 갯수

        // 기본 (전체 다 성공)
        let message = this.$v('자원 복제를 진행합니다.<br>상당 시간 소요될 수 있습니다.', { vmName: clonedVmNamesText })
        let result = true

        // 전체 다 실패했을 때
        if (!successLength) {
          message = this.$v('자원 복제를 실패하였습니다.<br>관리자 문의 부탁드립니다.')
          result = false
        } else if (failLength) { // 성공 자원 / 실패 자원 다 있을 때
          message = `자원 복제를 일부 진행합니다.<br>상당 시간 소요될 수 있습니다. <br><br>(${this.$v('실패')}: ${failLength} EA)}`
          result = true
        }

        this.$alert(message, { dangerouslyUseHTMLString: true })

        return result
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('자원 복제를 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      } finally {
        this.loading.cloneVm = false
      }
    },

    /**
     * vm 삭제 이벤트
     */
    async deleteVm (payload) {
      try {
        this.loading.deleteVm = true
        const result = await API.work_v3.deleteNxVm(payload)

        if (result) {
          this.$alert(this.$v('자원을 삭제하였습니다.'), () => false)
          this.init()
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      } finally {
        this.loading.deleteVm = false
      }
    },
    /**
     * MP 자원 삭제 이벤트
     */
    async deleteVmMp (payload) {
      try {
        this.loading.deleteVm = true
        const result = await API.work_v3.deleteNxMp(payload)

        if (result) {
          this.$alert(this.$v('자원을 삭제하였습니다.'), () => false)
          this.init()
        } else return false
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), { dangerouslyUseHTMLString: true })
      } finally {
        this.loading.deleteVm = false
      }
    },
    /**
     * DB 자원 삭제 이벤트
     */
    async deleteVmDb (userDbIdx, payload) {
      try {
        this.loading.deleteVm = true
        const result = await API.work_v3.deleteNxDb(userDbIdx, payload)

        if (result) {
          this.$alert(this.$v('자원을 삭제하였습니다.'), () => false)
          this.init()
        } else return false
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), { dangerouslyUseHTMLString: true })
      } finally {
        this.loading.deleteVm = false
      }
    },

    /**
    * 바로 삭제 이벤트
    */
    async forceDeleteResource (params) {
      try {
        this.loading.deleteVm = true
        const result = await API.work_v3.forceDeleteResource(params)

        if (result) {
          this.$alert(this.$v('자원을 삭제하였습니다.'), () => false)
          return true
        } else { return false }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      } finally {
        this.loading.deleteVm = false
      }
    },

    /**
    * Central 전체 리스트를 가져옵니다. (OVA Export 가능 여부 체크용)
    */
    async getCentralList () {
      try {
        this.loading.getCentralList = true
        const centralList = await API.compute.getCentralList()
        this.nxCentrals = centralList
      } catch (error) {
        console.error('Read Error: Central List\n', error)
      } finally {
        this.loading.getCentralList = false
      }
    },
    /**
   * 모달 닫기 전, 정말 취소하겠냐는 알람
   */
    beforeCloseModal (done) {
      this.$confirm(this.$v('내용을 저장하지 않고 취소하시겠습니까?'))
        .then(() => {
          done()
        }).catch(() => false)
    }
  },
  data () {
    return {
      loading: {
        getCentralList: false, // Central 조회
        convertVmPower: false, // powerState
        createVm: false, // 생성
        updateVm: false, // 수정
        deleteVm: false, // 삭제
        migrateVm: false, // 이관
        cloneVm: false // 복제
      },
      powerOptions: [
        { value: 'ACPI_SHUTDOWN', label: 'Soft Shutdown' },
        { value: 'OFF', label: 'Hard Power Off' }
      ],
      interval: null,
      selectedPowerState: '',
      nxCentrals: []
    }
  }
})
