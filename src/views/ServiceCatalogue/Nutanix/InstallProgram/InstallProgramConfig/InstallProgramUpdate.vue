<template>
  <el-dialog
    :visible="visible"
    :title="title"
    :width="width"
    :top="top"
    @close="closeEvent"
  >
    <!-- 🌸 :: {{ programValues }} <br> -->

    <div v-loading="loading">
      <section class="modal-body add-sw">
        <register-contents
          :title="$v('설치프로그램 명')"
          required
        >
          <el-input
            class="-input"
            :placeholder="$v('설치프로그램 명')"
            v-model="programValues.name"
            :popper-append-to-body="false"
          />
        </register-contents>
        <!-- /. 설치프로그램 명 -->

        <register-contents :title="$v('설치프로그램 설명')">
          <el-input
            :placeholder="$v('설명을 입력해주세요')"
            v-model="programValues.description"
            type="textarea"
            :rows="5"
            resize="none"
            @input="value => programValues.description = value"
            :disabled="disableDesc"
          />
        </register-contents>
      <!-- /. SW 설명 -->
      </section>

      <div class="modal-button-area">
        <button
          class="button"
          @click="closeEvent"
        >
          <!-- 취소 -->
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="actionApply(type)"
        >
          <!-- 추가 / 변경 -->
          {{ actionApplyButton(type) }}
        </button>
      </div>
    </div>
  </el-dialog>
</template>

<script>

export default {
  name: 'InstallProgramUpdate',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: undefined
    },
    width: {
      type: String,
      default: 'auto'
    },
    top: {
      type: String,
      default: '50px'
    },
    type: {
      type: String,
      default: 'add',
      validator (value) {
        return ['add', 'update'].includes(value)
      }
    },
    data: {
      type: Object,
      default: () => null
    }
  },
  watch: {
    async visible (visible) {
      if (visible) {
        console.log('%c Edit Data :: ', 'color: pink', this.data)
        this.loading = true

        // 팝업창 오픈후 (400ms) 데이터 로드
        setTimeout(async () => {
          const optTypes = {
            add: () => {
              this.loading = false
            },
            update: () => {
              this.programValues = { ...this.data }
              this.loading = false
            }
          }

          // console.log(this.type)

          optTypes[this.type]()
        }, 400)
      }
    },
    programValues: { // 🌸 디버깅용
      deep: true,
      handler (value) {
        // console.log(value)
      }
    }
  },
  methods: {
    /**
     * [추가 / 변경] 버튼 클릭시 변경 이벤트
     * @param { String } type
     */
    actionApply (type = this.type) {
      const values = this.programValues
      const validation = () => {
        const conditions = [{ condition: values.name, message: this.$v('설치프로그램 명을 입력해주세요.') }]

        return conditions.every(cond => {
          if (!cond.condition) this.$alert(cond.message)
          return cond.condition
        })
      }
      const validator = validation()
      if (!validator) return
      // 필수값 [설치프로그램 이름] 만 확인

      // 추가 / 수정 UI 다르게 설정
      const action = {
        add: () => this.$emit('update', values), // [설치프로그램 목록] > [SW 추가] > [추가]
        update: () => { // [설치프로그램 목록] > [{SW} 변경] > [변경]
          values.softwareId = this.data.id
          this.$emit('update', values)
        }
      }

      return action[type]()
    },

    /**
     * [취소/닫기] 버튼 클릭시 이벤트
     */
    closeEvent () {
      this.programValues = {}
      this.setSwOptions.forEach(option => { option.options = [] })
      this.fileList = []
      return this.$emit('close')
    }
  },
  data () {
    return {
      loading: false,
      setSwOptions: [],
      setaddProgramOptions: [
        {
          title: this.$t('service.INSTALL.swLicense'), // SW 라이선스
          field: 'swLicense',
          placeholder: this.$t('service.INSTALL.PLACEHOLDER.005'), // 라이선스를 선택해주세요
          options: []
        },
        {
          title: this.$t('service.INSTALL.supportOS'), // 지원 OS
          field: 'supportOs',
          placeholder: undefined,
          chain: true,
          options: []
        },
        {
          title: 'OS bits',
          field: 'osBits',
          placeholder: undefined,
          chain: true,
          options: []
        },
        // SW 명
        { title: this.$v('S/W 이름'), field: 'swName', disabled: true, placeholder: '-', options: [] },
        { title: this.$v('S/W 버전'), field: 'swVersion', disabled: true, placeholder: '-', options: [], width: '145px' }
      ],
      setUpdateProgramOptions: [
        {
          title: this.$v('S/W 버전'),
          field: 'swVersion',
          placeholder: undefined,
          chain: true,
          options: []
        },
        {
          title: this.$t('service.INSTALL.supportOS'), // 지원 OS
          field: 'supportOs',
          placeholder: undefined,
          chain: true,
          options: []
        },
        {
          title: 'OS bits',
          field: 'osBits',
          placeholder: undefined,
          chain: true,
          options: []
        }
      ],

      scriptOption: { field: 'script', options: [], width: '145px' },
      disableDesc: false,
      osTypes: [],
      fileList: [],
      programValues: {},
      actionApplyButton (type) { // 변경/추가 모달 버튼 설정
        return {
          add: this.$t('common.BTN.add'), // [설치프로그램 목록] > [SW 추가]
          update: this.$t('common.BTN.change') // [설치프로그램 목록] > [{SW} 변경]
        }[type]
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.add-sw {
  .title {
    line-height: 40px;
    font-weight: 400;

    > b { color: $main-red; }
  }

  .sw-lists {
    margin-top: -20px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    column-gap: 15px;
    row-gap: 12px;
    position: relative;

    .-version {
      position: absolute;
      bottom: 0;
      right: 315px;

      .title {
        display: block;
        margin-top: 40px;
      }
    }
  }

  .division {
    margin-top: $gap-s;
  }
}
</style>
