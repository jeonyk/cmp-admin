<!--
  * 파일명 : AppOperatingTeam.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-02-22
  * License By Shinsegae I&C
  * 2021-02-22 add: 구성원 목록 - taskName || jobName 추가
 -->

<template>
  <section class="operating-team-body">
    <div
      v-if="useHeader"
      class="-header"
    >
      <a @click="cancelChange">
        <close-icon
          class="close-button"
          icon-color="white"
          :width="16"
          :height="16"
        />
      </a>
      <h6 class="-title">
        {{ $t('admin.PREF.operTeam') }}
      </h6>
    </div>

    <!-- <el-select
      class="-selector"
      v-model="selectedPart"
      :popper-append-to-body="false"
      placeholder="선택"
      popper-class="department"
    >
      <el-option
        v-for="item in departmentList"
        :key="item.field"
        :label="item.label"
        :value="item.field"
      />
    </el-select> -->

    <!--  tiny-scroll -->
    <div
      class="department-tree tiny-scroll"
      v-loading="isLoading"
    >
      <g-tree
        :select-object.sync="selTempOpTeam"
        unique-key="groupIdx"
        @selected="saveOpTeam"
        :data="treeData"
        :selectable-company="true"
        :view-line="true"
        ref="tree"
        :root-parent="hasRootGroup"
      >
        <template #title="{ node }">
          <span>
            {{ node.groupName }}
          </span>
        </template>
      </g-tree>
    </div>

    <div class="apply-wrap modal-button-area">
      <button
        class="button"
        type="is-primary"
        @click="savePeople"
      >
        {{ $t('common.BTN.apply') }}
      </button>
    </div>
    <!-- /. 부서명 tree -->
  </section>
</template>

<script>
import { mapState } from 'vuex'
import { GTree, treeFindChild } from '@sd-fe/cmp-core'
import CloseIcon from '@/components/Icons/CloseIcon.vue'
import { isEmpty } from 'lodash'

export default {
  name: 'AppOperatingTeam',
  components: {
    'g-tree': GTree,
    CloseIcon
  },
  computed: {
    ...mapState({
      rootGroup: state => state.common.rootGroup
    }),
    hasRootGroup () {
      return this.rootGroup ? { groupName: this.rootGroup, groupUpper: 0, isRootParent: true } : undefined
    }

  },
  props: {
    useHeader: { // el-dialog를 사용할 때는 false로 설정해주세요
      type: Boolean,
      default: true
    },
    data: { // 기본 데이터가 있을 경우 이용하세요! > 자동으로 태그를 만들어줍니다..
      type: Object,
      default: undefined
    },
    triggerBtn: { // 외부에 정의된 trigger 버튼 > 모달안에 모달을 띄울 경우 사용합니다...!!!
      // 부모 컴포넌트의 trigger 버튼에 ref="opTeamTrigger"라고 정의해주세요
      // 외부를 클릭하면 모달을 닫도록 해요!
      type: Object,
      default: undefined
    },
    groupTreeData: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    groupTreeData: {
      immediate: true,
      handler (newVal) {
        this.treeData = newVal
      }
    }
  },
  async mounted () {
    // await this.getManageTree()
    this.setInitSelectTeam()

    // this.setSearchString(undefined, this.approverList)
    if (this.triggerBtn?.opTeamTrigger) document.addEventListener('click', this.clickTarget)
  },
  beforeDestroy () {
    document.removeEventListener('click', this.clickTarget)
  },
  methods: {
    /**
     * 트리에서 처음 선택되어있는 팀 오브젝트 세팅
     */
    setInitSelectTeam () {
      if (!isEmpty(this.data)) this.selTempOpTeam = treeFindChild(this.treeData, 'groupIdx', +this.data.groupIdx)
      else this.setUserGroup()

      this.$nextTick(function () {
        if (this.selTempOpTeam) {
          this.treeAutoScroll()
        }
      })
    },
    treeAutoScroll () {
      const tree = this.$refs.tree.$el
      const selectEl = tree.querySelector('.tree-label-text.-selected')
      const scrollTop = selectEl.getBoundingClientRect().top >= 400 ? selectEl.getBoundingClientRect().top - 400 : 0

      this.$el.querySelector('.department-tree').scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
    },
    setUserGroup () {
      const userGroupIdx = this.$store.state.auth.user.userGroup
      const userGroupInfo = treeFindChild(this.treeData, 'groupIdx', userGroupIdx)
      this.selTempOpTeam = userGroupInfo ? { ...userGroupInfo } : undefined
    },
    /**
     * tree 데이터를 순회하며 동일 id를 가진 tree를 찾습니다.
     * @param {Object} element 검사 할 객체
     * @param {string} matchingId 찾을 groupIdx
     */
    treeFindGroup (element, matchingId) {
      if (element.groupIdx === matchingId) return element
      else if (element.children && element.children.length > 0) {
        let result = null
        for (let i = 0; !result && i < element.children.length; i++) result = this.treeFindGroup(element.children[i], matchingId)
        return result
      }
      return null
    },
    // async getManageTree () {
    //   try {
    //     this.isLoading = true
    //     let response = await API.iam.getGroupManageTree()
    //     response = response.map(item => {
    //       const result = { ...item }
    //       result.title = item.groupName
    //       return result
    //     })
    //     this.setTreeTitle(response)
    //     this.treeData = response
    //     this.departmentList = response?.filter(item => item.groupUpper === 0)
    //     this.isLoading = false
    //   } catch (error) {
    //     this.isLoading = false
    //   }
    // },
    saveOpTeam (item) { // 단건 선택일 때
      this.selTempOpTeam = item
    },
    savePeople () {
      if (!this.selTempOpTeam) this.$alert(this.$t('common.ALERT.PROJECT.011'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      else {
        this.$confirm(this.$t('common.CONFIRM.CONF.004'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        }).then(() => {
          this.$emit('operate-team', this.selTempOpTeam)
          this.$emit('close')
        }).catch(() => false)
      }
    },
    cancelChange () {
      this.selTempOpTeam = { ...this.data }
      this.$emit('close')
    },
    setSearchString (text, list) {
      if (list.length === 0) return false

      if (!text) this.filteredApproverList = list
      else {
        const str = text.replace(/(\s*)/g, '')
        const string = new RegExp(str, 'i')
        const newData = []
        for (let i = 0; i < list.length; i++) {
          const valueArr = Object.values(list[i])
          if (valueArr.join('').replace(/(\s*)g/, '').match(string)) {
            newData.push(list[i])
          }
        }
        this.filteredApproverList = newData
      }
    },
    clickTarget (e) {
      if (e.target !== this.triggerBtn.opTeamTrigger) {
        const elements = Array.from(this.$el.querySelectorAll('*'))
        const validator = elements.some(element => element === e.target) || e.target === this.$el

        const alert = document.querySelector('.el-message-box__wrapper')
        if (alert) {
          const alertInner = Array.from(alert.querySelectorAll('*'))
          const isAlert = alertInner.some(element => element === e.target) || e.target === alert
          if (isAlert) return false
        }
        if (!validator) return this.cancelChange()
      }
    }
  },
  data () {
    return {
      isLoading: false,
      treeData: [],
      selTempOpTeam: undefined,
      selectedPart: '',
      selectedRow: [],
      filteredApproverList: [],
      approverList: [],
      listColumns: [
        { binding: 'apprv', header: '결재/합의', width: 100, customHtml: true, keyPath: 'admin.PREF.approAgree' },
        { binding: 'index', header: '순번', width: 50, customHtml: true, keyPath: 'admin.PREF.index' },
        { binding: 'name', header: '이름', keyPath: 'common.REGCON.name' },
        { binding: 'status', header: '상태', width: 60, customHtml: true, keyPath: 'admin.NOTI.state' },
        { binding: 'cate', header: '종류', width: 60, keyPath: 'bill.kinds' },
        { binding: 'remove', header: '삭제', width: 60, keyPath: 'admin.PREF.delete' }
      ],
      listData: []
    }
  }
}
</script>

<style lang="scss" scoped>
  .-magnify-icon {
    position: relative;
    cursor: pointer;
    display: inline-block;
    width: 16px;
    height: 16px;
    transition: all .3s;
    &::before,
    &::after {
      content: '';
      position: absolute;
    }
    &::before {
      top: 0;
      left: 0;
      width: 10px;
      height: 10px;
      border: 2px solid $text-black;
      border-radius: 50%;
    }
    &::after {
      bottom: 1px;
      right: -1px;
      width: 7px;
      height: 2px;
      background-color: $text-black;
      border-radius: 2px;
      transform: rotate(45deg);
    }

    &:hover {
      &::before {
        border-color: $primary;
      }
      &::after {
        background-color: $primary;
      }
    }
  }

  // ---
  .operating-team-body {
    text-align: left;
    .-header {
      .close-button {
        position: absolute;
        top: 15px; right: 15px;
        cursor: pointer;
      }
      .-title {
        font-size: 16px;
        margin-bottom: $gap;
      }
    }
    .-selector {
      width: 100%;
      margin-bottom: $gap-s;
    }
    .department-tree {
      overflow-y: auto;
      padding: $gap-s $gap;
      margin-bottom: $gap;
      height: 410px;
      border: 1px solid $border-color;
      border-radius: $radius;
      // background: $ticket-back-color;
    }
    .apply-wrap { text-align: center; }
  }
</style>

<style lang="scss">
.operating-team-body {
  .-selector {
    .el-input__inner {
      border: none;
      border-bottom: 1px solid $input-stroke;
      border-radius: 0;
    }
  }
}
</style>
