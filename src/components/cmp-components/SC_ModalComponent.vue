<!--
  * 파일명 : SC_ModalComponent.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-08-21
  * License By Shinsegae I&C
  * 2020-08-21 fix: [할 일, 한 일]-티켓으로 보기 - 스타일 수정
 -->

<template>
  <el-dialog
    title="자원 생성"
    :visible.sync="createProjectModal.view"
    class="create-project-modal"
    top="25vh"
    @close="closeCreateProjectModal()"
  >
    <!-- width="%" -->
    <ul class="create-project-list">
      <li class="create-project-item">
        <span class="create-project-label">관계사</span>
        <el-select
          v-model="createProjectModal.newProjectCn"
          :popper-append-to-body="false"
          placeholder="관계사 선택"
        >
          <el-option
            v-for="item in createProjectModal.cnList"
            :key="item.field"
            :label="item.name"
            :value="item.name"
          />
        </el-select>
      </li>
      <li class="create-project-item">
        <span class="create-project-label">프로젝트</span>
        <el-select
          v-model="createProjectModal.newProject"
          :popper-append-to-body="false"
          placeholder="프로젝트 선택"
        >
          <el-option
            v-for="item in projectList"
            :key="item.field"
            :label="item.name"
            :value="item.name"
          />
        </el-select>
      </li>
      <li class="create-project-item">
        <span class="create-project-label">서비스</span>
        <el-input
          placeholder="신규 서비스명 입력"
          v-model="createProjectModal.newService"
        />
      </li>
    </ul>
    <span
      class="create-alert"
      v-if="
        createProjectModal.newProjectCn &&
          createProjectModal.newProject &&
          createProjectModal.newService"
    >
      선택한 <b>{{ createProjectModal.newProjectCn }} > {{ createProjectModal.newProject }}</b> 내에 새로운 서비스 <b>{{ createProjectModal.newService }}</b>가 생성됩니다.
    </span>

    <span
      v-else
      class="create-alert -empty"
    />

    <div class="button-area">
      <button
        class="button -modal-button"
        @click.stop="closeCreateProjectModal"
      >
        취소
      </button>
      <button
        class="button -modal-button"
        type="is-primary"
        :disabled="
          !createProjectModal.newProjectCn ||
            !createProjectModal.newProject ||
            !createProjectModal.newService"
        @click="confirmProject"
      >
        확인
      </button>
    </div>
  </el-dialog>
</template>
<script>

export default {
  name: 'SCModalComponent',
  props: {
    modalShow: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    '$route' (to, from) {
      if (to !== from) this.showProjectList = false
    },
    modalShow (after) {
      if (after) this.createProjectModal.view = true
      else this.createProjectModal.view = false
    }
  },
  created () {
    if (typeof window !== 'undefined') document.addEventListener('click', this.clickedOutside)
  },
  beforeDestroy () {
    if (typeof window !== 'undefined') document.addEventListener('click', this.clickedOutside)
  },
  methods: {
    confirmProject () {
      this.$emit('modal-closed', { view: false, emit: this.createProjectModal })
    },
    closeCreateProjectModal () {
      this.createProjectModal.newProjectCn = ''
      this.createProjectModal.newProject = ''
      this.createProjectModal.newService = ''
      this.createProjectModal.view = false

      this.$emit('modal-closed', { view: false })
    }
  },
  data () {
    return {
      // --------------자원생성 모달----------
      showProjectList: false,
      createProjectModal: {
        view: false,
        // newProjectCn: this.cnList.length > 0 ? this.cnList[0] : '',
        newProjectCn: '',
        newProject: '',
        newService: '',
        cnList: [
          { field: 'depart', name: '백화점' },
          { field: 'cmp', name: '신세계' }
        ]
      },
      projectList: [
        {
          field: 'all',
          name: '전체'
        },
        {
          field: 'order',
          name: '발주'
        },
        {
          field: 'purchase',
          name: '구매'
        },
        {
          field: 'approve',
          name: '승인'
        },
        {
          field: 'logistics',
          name: '물류'
        },
        {
          field: 'logistics1',
          name: '물류'
        },
        {
          field: 'logistics2',
          name: '물류'
        }
      ]
    }
  }
}
</script>
<style lang="scss">
  .create-project-modal {
    .create-project-list {
      margin-bottom: $gap;
      > .create-project-item {
        display: flex;
        align-items: center;
        margin-bottom: $gap-s;
        .create-project-label {
          font-size: 16px;
          font-weight: 500;
          min-width: 90px;
        }
      }
    }
    .create-alert {
      width: 100%;
      display: block;
      margin-bottom: 30px;
    }
    .-empty {
      height: 16px;
    }
  }
</style>
