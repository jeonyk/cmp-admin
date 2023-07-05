import API from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'

export default {
  computed: {
    /**
     * 배부 모델 관리, 서버별 보정 모델 관리
     * 과금 모델 관리, 관계사별 보정 모델 관리
     * 타입을 받아서 호출해야 할 API 이름 반환
     */
    apiName () {
      switch (this.send) {
        // 관계사별 보정 모델 관리
        case 'group':
          return {
            update: 'updateGroupCorModelName',
            delete: 'deleteCorGroupModel',
            create: 'insertGroupCorrectModel'
          }
        // 서버별 보정 모델 관리
        case 'server':
          return {
            update: 'updateServerCorModelName',
            delete: 'deleteCorServerModel',
            create: 'insertServerCorrectModel'
          }
        // 배부 모델 관리
        case 'dist':
          return {
            update: 'updateDistModelName',
            delete: 'deleteDistModel',
            create: 'insertDistModel'
          }
        // 과금 모델 관리
        case 'bill':
          return {
            update: 'updateModelName',
            delete: 'deleteModel',
            create: 'insertModel'
          }
      }
    }
  },
  methods: {
    /**
     * @typedef {object} DistModelRow
     * @property {string?} beforeEditData - 모델 이름 수정 전 이름
     * @property {number} billingUpper
     * @property {any[]} children - 모델에 포함된 프로젝트
     * @property {'server' | 'group'} collectionType - 서버별 보정 모델 관리 / 관계사별 보정 모델 관리
     * @property {number} createTime - 생성 시간 (타임스탬프)
     * @property {boolean} deletable - 삭제 가능?
     * @property {boolean} edit - 수정중인 상태
     * @property {number} id - 모델 아이디
     * @property {boolean} isNew - 최근 모델
     * @property {string} title - 모델 이름
     */

    /**
      * 모델 명 업데이트
      * @param {DistModelRow} data
      */
    updateModelName (data) {
      // 빈 칸 validate
      if (!data.id || !data.title) {
        data.title = data.beforeEditData
        return this.$alert(this.$t('common.ALERT.BILL.004'))
      }

      // 모델명을 변경하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.BILL.011'), {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      })
        .then(async () => {
          try {
            await API.billing[this.apiName.update]({
              id: data.id,
              name: data.title
            })
            if (data.collectionType === 'group' || data.collectionType === 'server') {
              this.newBilling.id = data.id
              this.newBilling.name = data.title
              this.newBilling.type = data.collectionType
              this.$emit('confirm', this.newBilling)
            }
            this.gridRefresh()
            this.$alert(this.$t('common.ALERT.BASE.035'))
            data.edit = false
          } catch (error) {
            data.edit = true
            switch (error.code) {
              case 'BIL2001':
                // 중복된 모델명입니다.
                return this.$alert(this.$t('common.ALERT.BILL.015'))
              case 'BIL2003':
                // 해당 과금 모델은 확정된 배치가 있어 수정이 불가능합니다.
                return this.$alert(this.$t('common.ALERT.BILL.033'))
              case 'BIL2004':
                // 해당 과금 모델은 존재하지 않습니다.
                return this.$alert(this.$t('common.ALERT.BILL.031'))
              default:
                // 모델명 변경에 실패하였습니다.
                return this.$alert(this.$t('common.ALERT.BILL.029'))
            }
          }
        })
        .catch(() => {
          data.title = data.beforeEditData
          return false
        })
    },
    /**
     * 모델 삭제
     * @param {DistModelRow} row
     */
    deleteModel (row) {
      // 해당 모델을 삭제하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.BILL.009'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      })
        .then(async () => {
          try {
            await API.billing[this.apiName.delete](row.id)
            // 삭제할 아이템 인덱스
            const idx = this.copiedData.findIndex(data => data.id === row.id)

            if (idx !== -1) {
              // 배열에서 삭제
              this.copiedData.splice(idx, 1)
              // 삭제하였습니다.
              this.$alert(this.$t('common.ALERT.BASE.017'))
            } else {
              // 삭제에 실패했습니다.
              this.$alert(this.$t('common.ALERT.BASE.016'))
            }
          } catch (error) {
            switch (error.code) {
              case 'BIL2003':
                // 해당 과금 모델은 확정된 배치가 있어 삭제가 불가능합니다.
                return this.$alert(this.$t('common.ALERT.BILL.032'))
              case 'BIL2004':
                // 해당 과금 모델은 존재하지 않습니다.
                return this.$alert(this.$t('common.ALERT.BILL.031'))
              default:
                // 삭제에 실패했습니다.
                this.$alert(this.$t('common.ALERT.BASE.016'))
            }
          }
        })
        .catch(() => {
          return false
        })
    },
    /**
     * 컴포넌트 첫 호출 함수
     * 부모로부터 받은 트리 데이터를 가공합니다.
     * @param {any[]} origin - 부모로부터 받는, 트리를 그리기 위한 데이터
     * 해당 mixins을 사용하는 모달 컴포넌트에 watch가 걸려있어 데이터가 업데이트 되면 해당 함수가 호출됩니다.
     */
    cloneTreeData (origin) {
      this.copiedData = cloneDeep(this.data).map(data => ({
        ...data,
        edit: false
      }))
    },
    /**
     * 그리드 업데이트 함수
     */
    gridRefresh () {
      if (this.grid && this.grid.collectionView) {
        this.grid.collectionView.refresh()
      }
    },
    /**
     * 모달 닫을 때 호출되는 함수
     * 현재 모달 아이템의 수정 중인 상태를 모두 false로 업데이트 합니다.
     * @param {boolean} isCancelButton '취소' 버튼을 눌러서 모달을 종료했을 때 처리 필요
     */
    close (isCancelButton) {
      if (isCancelButton) {
        this.copiedData = this.data
        this.gridRefresh()
      }
      this.setAllRowEditState(this.copiedData, false)
      this.$emit('close')
    },
    /**
     * 모달 아이템의 수정 상태를 업데이트 합니다.
     * @param {any[]} target - 업데이트할 아이템 배열
     * @param {boolean} state - 해당 값으로 업데이트
     */
    setAllRowEditState (target, state) {
      target = target.map(item => {
        item.edit = state
        return item
      })
    },
    /**
     * 모델을 생성합니다. 생성하기 전 공통된 모델 명이 있는지 아닌지 체크합니다.
     */
    confirm () {
      // 변경사항을 저장하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.BASE.006'), {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      })
        .then(async () => {
          if (this.newBilling) {
            if (!this.newBilling.name) return this.$alert(this.$t('common.ALERT.BILL.004'))
          } else {
            if (!this.newDist.name) return this.$alert(this.$t('common.ALERT.BILL.004'))
          }
          // 배부 모델
          if (this.send === 'dist') {
            const distProjects = await API.iam.getProject()
            this.newDist.distributeProjects = distProjects.filter(e => e.ownerCompanyName === '공통')

            if (!this.newDist.name) return this.$alert(this.$t('common.ALERT.BILL.004'))
          }
          // 모델명 중복 체크
          if (!this.copiedData.find(data => this.newBilling ? this.newBilling.name === data.title : this.newDist.name === data.title)) {
            await API.billing[this.apiName.create](this.newBilling || this.newDist)
            this.close()
            this.$emit('confirm', this.newBilling || this.newDist)
            this.gridRefresh()
          } else {
            this.$alert(this.$t('common.ALERT.BILL.015'))
          }
          // 서버별 보정 모델, 관계사별 보정 모델 테스트
          if (['server', 'group'].includes(this.send)) {
            this.newBilling.name = ''
            this.newBilling.type = this.send
          }
        })
    }
  }
}
