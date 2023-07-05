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
          userId: this.user.userId,
          userName: this.user.userName,
          userPosition: this.user.userPosition,
          groupIdx: v.groupIdx,
          groupName: v.groupName,
          orderData: {
            userVmIdx: v.userVmIdx,
            powerStatus: state
          }
        }
      })

      let result = true

      const stateLabel = this.powerOptions.find(item => item.value === state)?.label || 'ON'
      await this.$confirm(this.$t('common.ALERT.COMP.032', { stateLabel }), { dangerouslyUseHTMLString: true }).then(async () => { // VM의 상태를 ${stateLabel}(으)로<br>전환하시겠습니까?
        await this.convertVmPower(payload)
        result = true
      }).catch(() => {
        result = false
      })
      return result
    },
    /*
   * vm Power On/OFF 전환 API 연동
   */
    async convertVmPower (payload) {
      try {
        this.loading.convertVmPower = true
        const result = await API.work.convertVmPower(payload)

        let message
        if (result?.isSuccess) {
          message = this.$t('common.ALERT.COMP.026') // VM 상태가 전환됩니다.<br>상당 시간 소요될 수 있습니다.
        } else {
          if (result?.failMessage) console.error(result?.failMessage)
          message = this.$t('common.ALERT.COMP.019')// VM 상태 변환 중 문제가 발생했습니다.<br>관리자에게 문의해주세요.
        }
        this.$alert(message, { dangerouslyUseHTMLString: true })
        return result
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.COMP.019'), { dangerouslyUseHTMLString: true }) // VM 상태 변환 중 문제가 발생했습니다.<br>관리자에게 문의해주세요.
        throw error
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
      if (this.interval) this.clearGetVmInterval()
      this.interval = setInterval(async () => {
        await this.init()
      }, 10000)
    },

    /**
   * vm 생성 이벤트
   */
    async createVm (payload) {
      try {
        this.loading.createVm = true
        const result = await API.work.createVm(payload)

        if (result.isSuccess) {
          // this.$alert(this.$t('common.ALERT.COMP.027'), { dangerouslyUseHTMLString: true }) // 자원을 생성합니다.<br> 상당 시간 소요될 수 있습니다.
          this.$alert(this.$t('common.ALERT.COMP.044', { vmName: payload.orderData.computeName }), { dangerouslyUseHTMLString: true }) // VM 실행 작업이 요청되었습니다.<br>{VM명}
          this.getVmInterval()
          return true
        } else {
          this.$alert(this.$t('common.ALERT.LOGGING.004'), { dangerouslyUseHTMLString: true }) // 생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.
          if (result?.failMessage) console.error(result?.failMessage)
        }
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
        console.log('@updateVm: ', payload)
        const result = await API.work.updateVm(payload)

        if (result?.isSuccess) {
          this.$alert(this.$t('common.ALERT.COMP.044', { vmName: payload.orderData.computeName }), { dangerouslyUseHTMLString: true }) // VM 실행 작업이 요청되었습니다.<br>{VM명}
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
    /**
     * 미등록 vm 업데이트 이벤트
     */
    async updateUnregisterVm (payload) {
      try {
        this.loading.updateVm = true
        console.log('@updateVm: ', payload.orderData)
        const result = await API.compute.updateUnregisterVm(payload.orderData)

        if (result?.isSuccess) {
          this.$alert(this.$t('common.ALERT.COMP.044', { vmName: payload.orderData.computeName }), { dangerouslyUseHTMLString: true }) // VM 실행 작업이 요청되었습니다.<br>{VM명}
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
        const result = await API.work.migrateVm(payload)

        if (result?.isSuccess) {
          // this.$alert(this.$t('common.ALERT.COMP.028'), { dangerouslyUseHTMLString: true }) // 자원 이관을 진행합니다.<br>상당 시간 소요될 수 있습니다.
          this.$alert(this.$t('common.ALERT.COMP.044', { vmName: payload.orderData.computeName }), { dangerouslyUseHTMLString: true }) // VM 실행 작업이 요청되었습니다.<br>{VM명}
          this.modal.migrateVm = false
          this.init()
          return true
          // if (!this.interval) this.getVmInterval()
        } else {
          this.$alert(this.$t('common.ALERT.COMP.029'), { dangerouslyUseHTMLString: true }) // 자원 이관을 실패하였습니다.<br>관리자 문의 부탁드립니다.
          if (result?.failMessage) console.error(result?.failMessage)
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.COMP.029'), { dangerouslyUseHTMLString: true })
        throw error
      } finally {
        this.loading.migrateVm = false
      }
    },

    /*
    * vm Clone (복제) API 연동
    * @param {Object} payload POST payload 데이터
    * @param {Number} userVmIdx 클론 할 VM의 userVmIdx
    */
    async cloneVm (payload, userVmIdx) {
      try {
        this.loading.cloneVm = true

        const clonedVmNames = payload.orderDataList.map(item => item.name)
        const clonedVmNamesText = clonedVmNames.join('<br>')

        const result = await API.work.cloneVm(userVmIdx, payload)

        if (result?.isSuccess) {
          // this.$alert(this.$t('common.ALERT.COMP.030'), { dangerouslyUseHTMLString: true }) // 자원 복제를 진행합니다.<br>상당 시간 소요될 수 있습니다.
          this.$alert(this.$t('common.ALERT.COMP.044', { vmName: clonedVmNamesText }), { dangerouslyUseHTMLString: true }) // VM 실행 작업이 요청되었습니다.<br>{VM명}
          this.modal.cloneVm = false
          if (!this.interval) this.getVmInterval()
          return true
        } else {
          this.$alert(this.$t('common.ALERT.COMP.031'), { dangerouslyUseHTMLString: true }) // 자원 복제를 실패하였습니다.<br>관리자 문의 부탁드립니다.
          if (result?.failMessage) console.error(result?.failMessage)
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.COMP.031'), { dangerouslyUseHTMLString: true })
        throw error
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
        const result = await API.work.deleteVm(payload)

        if (result?.isSuccess) {
          this.$alert(this.$t('common.ALERT.NETWORK.023')) // 자원을 삭제하였습니다.
          this.init()
          // this.routeTo({ name: 'set-resource-server' })
        } else {
          if (result?.failMessage) console.error(result?.failMessage)
          return this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        throw error
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
        const result = await API.work.deleteVmMp(payload)

        if (result?.isSuccess) {
          this.$alert(this.$t('common.ALERT.NETWORK.023')) // 자원을 삭제하였습니다.
          this.init()
          // this.routeTo({ name: 'set-resource-server' })
        } else {
          if (result?.failMessage) console.error(result?.failMessage)
          return this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        throw error
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
        const result = await API.work.deleteVmDb(userDbIdx, payload)

        if (result?.isSuccess) {
          this.$alert(this.$t('common.ALERT.NETWORK.023')) // 자원을 삭제하였습니다.
          this.init()
        } else {
          if (result?.failMessage) console.error(result?.failMessage)
          return this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        throw error
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
        const result = await API.work_3.forceDeleteResource(params)

        if (result?.data?.isSuccess) {
          this.$alert(this.$t('common.ALERT.NETWORK.023')) // 자원을 삭제하였습니다.
          return true
        } else {
          if (result?.failMessage) console.error(result?.failMessage)
          this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
          return false
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        throw error
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
      this.$confirm(this.$t('common.CONFIRM.BASE.002'), '알림', { // 내용을 저장하지 않고 취소하시겠습니까?
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
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
