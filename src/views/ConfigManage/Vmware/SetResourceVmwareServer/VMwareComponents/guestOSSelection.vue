<!--
  * 파일명 : guestOSSelection.vue
  * 파일 기능 : 게스트 운영 체제 선택 컴포넌트
  * 작성자 : 김예담
  * 최종 작성일 : 2022-08-30
  * License By Shinsegae I&C
 -->

<template>
  <div v-loading="isLoading">
    <article class="guest-os-wrap">
      <transition name="fade">
        <div
          class="guest-os-add"
        >
          <div class="select-family">
            <el-select
              class="-family"
              :popper-append-to-body="false"
              placeholder="게스트 운영 체제 패밀리"
              v-model="guestOsFamily"
              @change="changeFamily"
              :disabled="!!syncData"
            >
              <el-option
                v-for="item in familyOptions"
                :key="item.value"
                :value="item.value"
                :label="item.value"
              />
            </el-select>

            <el-select
              class="-version"
              :popper-append-to-body="false"
              placeholder="게스트 운영 체제 버전"
              v-model="guestOsVersion"
              :disabled="!!syncData"
            >
              <el-option
                v-for="item in versionOptions"
                :key="item.id"
                :value="item.id"
                :label="item.fullName"
              />
            </el-select>

            <button
              class="button"
              type="is-primary"
              :disabled="!guestOsFamily || !guestOsVersion || !!syncData"
              @click="save"
            >
              {{ $v('적용') }}
            </button>
          </div>
        </div>
      </transition>
    </article>

    <!-- 추가된 네트워크 조직 목록 -->
    <el-tag
      v-if="syncData"
      class="guest-os-tag"
      :closable="!disabled"
      @close="removeSyncData"
    >
      {{ syncData.family }} &nbsp;-&nbsp;
      {{ syncData.fullName }}
    </el-tag>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { groupBy } from 'lodash'

export default {
  name: 'GuestOSSelection',
  props: {
    hostUuid: {
      type: String,
      default: ''
    },
    syncData: {
      type: Object,
      default: undefined
    },
    disabled: { // disabled 시킬건지 결정합니다
      type: Boolean,
      default: false
    }
  },
  watch: {
    hostUuid: {
      immediate: true,
      async handler (val) {
        await this.getGuestOSList(val)
      }
    }
  },
  methods: {
    /**
     * Guest OS 조회
     */
    async getGuestOSList (hostUuid) {
      if (!this.hostUuid) return

      try {
        this.isLoading = true
        const data = await API.vmware.vm.getVmwareGuestOSList({
          hostUuid
        })
        if (!data) return
        this.originGuestOsList = data
        const groupByFamily = groupBy(data, 'family')

        for (const key of Object.keys(groupByFamily)) {
          this.familyOptions.push({ label: key, value: key })
        }
        this.guestOSList = data
      } catch (error) {
        console.error(error)
        return this.$alert('Guest-OS 조회에 문제가 발생했습니다.')
      } finally {
        this.isLoading = false
      }
    },
    /**
     * family 변경 이벤트
     */
    changeFamily (value) {
      this.guestOsVersion = ''
      this.versionOptions = this.originGuestOsList.filter(item => item.family === value)
    },
    /**
     * 네트워크 데이터를 push 및 저장합니다.
     */
    save () {
      if (!this.guestOsFamily || !this.guestOsVersion) return

      const selectedData = this.originGuestOsList.find(os => os.id === this.guestOsVersion)
      if (selectedData) {
        this.$emit('save', selectedData)
        this.resetOptions()
      }
    },
    /**
     * 모든 데이터를 reset 합니다.
     */
    resetOptions (innerData) {
      this.guestOsFamily = ''
      this.guestOsVersion = ''
      this.versionOptions = []
    },

    removeSyncData () {
      return this.$emit('save', null)
    }
  },
  data () {
    return {
      isLoading: false,
      originGuestOsList: [],
      familyOptions: [],
      versionOptions: [],
      guestOsFamily: '',
      guestOsVersion: '',

      optionsNames: [
        { placeholder: '게스트 운영 체제 패밀리', field: 'family' },
        { placeholder: '게스트 운영 체제 버전', field: 'version' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>

  .guest-os-wrap {
    display: flex;
    flex-direction: column;
    > button { margin-right: $gap }
    .-reference {
      margin-top: 5px;
      color: $input-placeholder;
      span, &.-alert { color: $main-red; }
    }
    .guest-os-add {
      // border: 1px solid pink;
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      > h5 {
        font-size: 15px;
        height: 15px;
        margin-right: $gap;
      }
      > .select-family {
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        .-family {
          width: 200px;
          margin-right: $gap-s;
        }
        .-version {
          width: 330px;
          margin-right: $gap-s;
        }
      }
    }
  }

  .guest-os-tag { margin-top: $gap-s; }

.fade-enter-active, .fade-leave-active {
  transition: opacity .2s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
