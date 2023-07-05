import Vue from 'vue'
import { mapState } from 'vuex'
import API from '@sd-fe/cmp-core'

export default Vue.extend({
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  methods: {
  /**
  * VM Power State ON/OFF 전환시 이벤트
  * @param {Array} vms 전환 할 Vm들
  * @param {String} state 전환 할 상태 ('ON', 'Soft Shutdown', 'Hard Power Off')
  * @return {Boolean} 상태 전환 여부 반환
  */
    async confirmConvertPower (vms, state) {
      if (!vms?.length) this.$alert('vm을 선택하세요.', () => false)

      const { beforePrice, groupIdx, groupName, isUrgent, price, projectIdx, userVmIdx, vmUuid } = vms[0]

      const payload = vms.map(v => {
        return {
          beforePrice,
          groupIdx,
          groupName,
          isUrgent,
          price,
          projectIdx,
          requestData: {
            userVmIdx: v.userVmIdx,
            powerStatus: state,
            vmUuid: v.vmUuid
          },
          service: 'VM',
          userId: this.user.userId,
          userName: this.user.userName
        }
      })

      const rebootPayload = {
        beforePrice,
        groupIdx,
        groupName,
        isUrgent,
        price,
        projectIdx,
        requestData: {
          userVmIdx,
          vmUuid
        },
        service: 'VM',
        userId: this.user.userId,
        userName: this.user.userName
      }

      let result = true

      const stateLabel = this.powerOptions.find(item => item.value === state)?.label || 'ON'
      const stateKey = {
        POWERED_OFF: 'Off',
        POWERED_ON: 'On',
        REBOOT_GUEST: 'RebootGuest'
      }[state]

      const message = state === 'REBOOT_GUEST'
        ? this.$v('VM의 게스트 운영 체제를 다시 시작하시겠습니까?')
        : this.$v('VM의 상태를 {stateLabel}(으)로<br>전환하시겠습니까?', { stateLabel })

      await this.$confirm(message, { dangerouslyUseHTMLString: true }).then(async () => {
        if (state === 'REBOOT_GUEST') await this.rebootVmwareVm(rebootPayload)
        else await this.convertVmwareVmPower(payload, stateKey)
        result = true
      }).catch(() => {
        result = false
      })
      return result
    },
    /*
   * vm Power ON / OFF  전환 API 연동
   */
    async convertVmwareVmPower (payload, stateKey) {
      try {
        this.loading.convertVmPower = true

        const resultArr = await API.work_v3[`power${stateKey}VmwareVm`](payload)

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
        this.$alert(this.$v('VM 상태 변환 중 문제가 발생했습니다.<br>관리자에게 문의해주세요.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
        throw error
      } finally {
        this.init()
        this.loading.convertVmPower = false
      }
    },
    /*
 * vm Reboot  전환 API 연동
 */
    async rebootVmwareVm (payload) {
      try {
        this.loading.convertVmPower = true

        const result = await API.work_v3.powerRebootGuestVmwareVm(payload)

        let message
        if (result) {
          message = this.$v('VM의 게스트 운영 체제를 다시 시작합니다.<br>상당 시간 소요될 수 있습니다.')

          this.$alert(message, {
            dangerouslyUseHTMLString: true,
            callback: () => false
          })
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('VM 상태 변환 중 문제가 발생했습니다.<br>관리자에게 문의해주세요.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
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
      const callbackFlag = false
      this.interval = setInterval(async () => {
        if (!callbackFlag) await this.init()
      }, 10000)
    },

    /**
   * vm 생성 이벤트
   */
    async createVmwareVm (payload) {
      try {
        this.loading.createVm = true
        // console.log('vmw VM 생성: ', payload)
        const result = await API.work_v3.createVmwareVm(payload) // 일반 VM

        if (result) {
          this.$alert(this.$v('VM 실행 작업이 요청되었습니다.<br>{vmName}', { vmName: payload.requestData.hostname }), {
            dangerouslyUseHTMLString: true,
            callback: () => false
          })
          this.init()
          return true
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
        throw error
      } finally {
        this.loading.createVm = false
      }
    },
    /**
     * vm 업데이트 이벤트
     */
    async updateVmwareVm (payload) {
      try {
        this.loading.updateVm = true
        console.log('VM 자원 수정: ', payload)
        const result = await API.work_v3.updateVmwareVm(payload)

        if (result) {
          this.$alert(this.$v('VM 실행 작업이 요청되었습니다.<br>{vmName}', { vmName: payload.name }), {
            dangerouslyUseHTMLString: true,
            callback: () => false
          })
          this.init()
          return true
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
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
        const result = await API.work_v3.migrateVmwareVm(payload)

        if (result) {
          this.$alert(this.$v('VM 실행 작업이 요청되었습니다.<br>{vmName}', { vmName: payload?.requestData?.resourceName }), {
            dangerouslyUseHTMLString: true,
            callback: () => false
          })
          this.modal.migrateVm = false
          this.init()
          return true
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('자원 이관을 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
        throw error
      } finally {
        this.loading.migrateVm = false
      }
    },

    /*
    * vm Clone (복제) API 연동
    * @param {Object} payload POST payload 데이터
    */
    async cloneVm (userVmIdx, { vmData, cloneVms }) {
      try {
        const payload = cloneVms.map(clone => {
          const { groupIdx, groupName, price, projectIdx } = vmData

          return {
            beforePrice: 0,
            groupIdx,
            groupName,
            isUrgent: clone.isUrgent,
            price: price || 0,
            projectIdx,
            requestData: clone,
            service: 'VM',
            userId: this.user.userId,
            userName: this.user.userName
          }
        })

        const clonedVmNames = cloneVms.map(item => item.hostname)
        const clonedVmNamesText = clonedVmNames.join('<br>')

        const resultArr = await API.work_v3.cloneVmwareVm(userVmIdx, payload)

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

        this.$alert(message, {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })

        return result
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('자원 복제를 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
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
        const result = await API.work_v3.deleteVmwareVm(payload)

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
    * 바로 삭제 이벤트
    */
    async forceDeleteResource (params) {
      try {
        this.loading.deleteVm = true
        const result = await API.work_v3.forceDeleteResource(params)

        if (result) {
          this.$alert(this.$v('자원을 삭제하였습니다.'), () => false)
          return true
        } return false
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

    // ======= CRUD 외 리스트/상세에서 공통으로 사용되는 메서드 =======
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
  data (root) {
    return {
      loading: {
        convertVmPower: false, // powerState
        createVm: false, // 생성
        updateVm: false, // 수정
        deleteVm: false, // 삭제
        migrateVm: false, // 이관
        cloneVm: false // 복제
      },
      powerOptions: [
        { value: 'POWERED_ON', label: 'ON' },
        { value: 'POWERED_OFF', label: 'OFF' },
        { value: 'REBOOT_GUEST', label: root.$v('게스트 운영 체제 다시 시작') }
      ],
      interval: null,
      selectedPowerState: '',
      nxCentrals: []
    }
  }
})
