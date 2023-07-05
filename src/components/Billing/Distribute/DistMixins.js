import Vue from 'vue'

export default Vue.extend({
  methods: {
    validateDistModel (req) {
      if (!req.name) {
        this.$alert(this.$t('common.ALERT.BILL.058'))
        return false
      }

      // 모든 공통 프로젝트의 배부 기준명 입력 여부
      const allProjects = req.distributeProjects.map(distribute => {
        return distribute.distributeStandardName
      })

      if (!allProjects.every(Boolean)) {
        this.$alert(this.$t('common.ALERT.BILL.059'))
        return false
      }

      // 모튼 공통 프로젝트의 1차 배부 관계사 등록 여부
      const oneDepthLen = req.distributeProjects.map(
        dist => dist.distributeGroups.length
      )
      if (oneDepthLen.some(distLen => distLen === 0)) {
        this.$alert(this.$t('common.ALERT.BILL.060'))
        return false
      }

      // 배부 비율 미입력 체크
      // const oneDepth = req.distributeProjects.map(
      //   dist => dist.distributeGroups.filter(group => group.groupIdx !== null && !group.parentGroupName)
      // )
      // const validatedAllAmount = oneDepth.every(dist => dist.some(group => group.amount > 0))
      // if (!validatedAllAmount) {
      //   this.$alert(this.$t('common.ALERT.BILL.063'))
      //   return false
      // }

      return true
    },
    /**
     * 공통 프로젝트 변경시 입력하고 있던 내용 부모 컴포넌트 최신화
     */
    syncDist (project, oneDepth, twoDepth, distName) {
      project.distInfo = {}
      this.$set(project, 'distInfo', {
        oneDepth,
        twoDepth,
        distName
      })
    },
    copyModelGroup (model) {
      this.copying = true
      this.modelName = model.name
      model.distributeProjects.forEach(project => {
        // 현재 작성중인 배부 모델에서 똑같은 프로젝트를 찾는다.
        const findProject = this.commonProjects.find(
          innerProject => innerProject.projectIdx === project.projectIdx
        )
        // 찾음 (존재함)
        if (findProject) {
          // 1차 배부 관계사 정리
          const oneDepth = project.distributeGroups
            .filter(group => !group.parentGroupName)
            .map(group => ({
              ...group,
              groupIdx: group.groupIdx,
              companyName: group.groupName,
              amount: group.amount
            }))

          // 2차 배부 관계사
          // parentGroupName이 존재하는 걸 찾음
          // 키를 다 찾고 중복 제거
          const isDepthArr = project.distributeGroups
            .filter(group => group.parentGroupName)
            .map(group => group.parentGroupName)

          // 객체에 그룹 이름으로 child 추합
          // { 공통: [...] }
          const result = {}
          let twoDepth = null

          if (isDepthArr.length) {
            isDepthArr.forEach(groupName => {
              const items = project.distributeGroups.filter(
                group => group.parentGroupName === groupName
              ).map(group => ({ ...group, companyName: group.groupName }))
              result[groupName] = {
                selected: items,
                commonAffName: groupName,
                distName: items[0].distributeStandardName
              }
            })

            twoDepth = [...Object.keys(result).map(key => result[key])]
          }

          // 마지막 데이터 바인딩
          this.$set(findProject, 'distInfo', {
            distName: project.distributeStandardName,
            oneDepth,
            twoDepth: twoDepth || []
          })
        }
      })
      if (this.$refs.createForm) {
        this.$refs.createForm.copied()
      }
      this.activeFetchModal = false
      this.copying = false
    },
    /**
     * 배부 모델 초기화
     */
    resetDist () {
      this.commonProjects.forEach(project => {
        this.$set(project, 'distInfo', {
          distName: '',
          oneDepth: [],
          twoDepth: []
        })
      })

      // 공통 프로젝트 없을 경우 대비
      if (this.$refs.createForm) this.$refs.createForm.resetCreateForm()
      this.modelName = ''
    },
    onChangeActiveModel (model, modelIdx, isApplyModel, noApplyIndex) {
      this.commonProjects.forEach(project => {
        project.active = false
        project.expanded = false
      })
      if (model) {
        model.active = true
        model.expanded = true
        this.activeProject = model
      }
    },
    onExpandModel (model, modelIdx, isApplyModel) {
      model.expanded = !model.expanded
    },
    onChangeActiveChildrenModel (item, isApplyModel, model) {}
  }
})
