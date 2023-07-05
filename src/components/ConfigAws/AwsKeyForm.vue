<template>
  <form class="form">
    <div class="form-control">
      <label class="form-label">Access Key</label>
      <el-input
        type="text"
        v-model.trim="key"
        placeholder="Enter access key."
        :disabled="isRegistered && !isEditing"
        @input="$emit('change', key ,secretKey)"
      />
    </div>
    <div class="divider" />
    <div class="form-control">
      <label class="">Secret Access Key</label>
      <el-input
        type="text"
        v-model.trim="secretKey"
        placeholder="Enter access key."
        :disabled="isRegistered && !isEditing"
        @input="$emit('change', key ,secretKey)"
      />
    </div>
    <div class="button-area">
      <button
        v-if="!isRegistered"
        class="button button-search"
        type="is-primary"
        @click.prevent="registerKeys"
        style="margin-left:10px;"
        :disabled="isValidInput"
      >
        {{ $v('등록') }}
      </button>
      <!-- v-if="isRegistered && !isValid" -->
      <button
        v-if="isRegistered && !isDecrypted"
        @click.prevent="searchKeys"
        class="button button-search"
        type="is-primary"
        style="margin-left:10px;"
      >
        {{ $v('조회') }}
      </button>
      <!-- afteSync -->
      <div>
        <!-- v-if="isRegistered && isValid && !isEditing" -->
        <button
          v-if="isRegistered && isDecrypted && !isEditing"
          class="button button-search"
          type="is-primary"
          :disabled="isEditing"
          @click.prevent="cancalAccountSync"
          style="margin-left:10px;"
        >
          <!-- @click.prevent="editKeys(true)" -->
          {{ $v('변경') }}
        </button>

        <button
          v-if="isRegistered && isDecrypted && !isEditing"
          class="button button-search"
          type="is-anti"
          @click.prevent="$emit('hide')"
        >
          {{ $v('취소') }}
        </button>
      </div>
    </div>
  </form>
</template>
<script>
export default {
  props: {
    accessKey: {
      type: String,
      default: ''
    },
    secretAccessKey: {
      type: String,
      default: ''
    },
    isRegistered: {
      type: Boolean,
      default: false
    },
    isDecrypted: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    accessKey: {
      immediate: true,
      handler (newVal) {
        this.key = newVal
      }
    },
    secretAccessKey: {
      immediate: true,
      handler (newVal) {
        this.secretKey = newVal
      }
    }
  },
  computed: {
    isValidInput () {
      if (this.key && this.secretKey) return false
      return true
    }
  },
  methods: {
    clearInputFields () {
      this.key = ''
      this.secretKey = ''
    },
    registerKeys () {
      this.$emit('register', this.key, this.secretKey)
    },
    updateKeys () {
      this.$confirm('Access Key/ScretAccess Key<br>를 변경하시겠습니까?', {
        dangerouslyUseHTMLString: true
      }).then(() => {
        this.$alert('API is required.')
      })
    },
    searchKeys () {
      this.$emit('search')
      // this.key = this.accessKey
      // this.secretKey = this.secretAccessKey
    },
    editKeys (boolean) {
      if (!boolean) this.$emit('restore')
      this.isEditing = boolean
    },
    cancalAccountSync () {
      this.$emit('delete', false)
    },
    clickOutside (el) {
      document.querySelector('body').addEventListener('click', e => {
        if (el.contains(e.target)) return
        if (this.isEditing) {
          this.isEditing = false
        }
      })
    }
  },
  data () {
    return {
      isEditing: false,
      type: 'beforeRegister',
      maskedkey: '123' + '*'.repeat(10),
      key: '',
      secretKey: ''
    }
  }
}
</script>

<style lang="scss" scoped>
.form {
  padding-top:32px;
  display: flex;
  justify-content: space-between;
  .form-control {
    flex-grow: 1;
  }
  .form-control label {
    display: block;
    font-size: 16px;
    height: 40px;
    line-height: 40px;
  }

  .button-area {
    align-items: flex-end;
    .button-search {
      height: 44px;
    }
  }
}

.divider {
 width:20px;
 display:inline-block;
}
</style>
