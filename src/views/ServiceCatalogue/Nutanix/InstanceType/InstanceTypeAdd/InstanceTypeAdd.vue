<!--
  * 파일명 : InstanceTypeAdd.vue
  * 파일 기능 : 서비스 카탈로그 > 인스턴스 타입 서버 사양 추가 페이지
  * 작성자 : 김진범 외 3명
  * 최종 작성일 : 2021-01-26
  * License By Shinsegae I&C
  * 2021-01-26 버그 수정
 -->

<template>
  <div class="instance-type-add">
    <h5 class="mid-title">
      {{ $t('service.contentInstance') }}
    </h5>

    <div class="add-instance-contents">
      <register-contents
        :title="$t('service.specName')"
        required
      >
        <el-input
          :placeholder="$t('service.PLACEHOLDER.enterSpecName')"
          v-model="instanceTypeData.name"
        />
      </register-contents>
      <!-- /. 사양명 - name -->

      <register-contents
        :title="$t('service.vCpu')"
        required
      >
        <el-input-number
          :min="1"
          :max="1024"
          :placeholder="$t('service.PLACEHOLDER.enterVCpu')"
          v-model="instanceTypeData.vcpu"
          class="form-input-number"
        />
      </register-contents>
      <!-- /. Vcpu -->

      <register-contents
        title="RAM(GB)"
        required
      >
        <el-input-number
          :min="1"
          :max="1024"
          :placeholder="$t('service.PLACEHOLDER.enterMemory')"
          v-model="instanceTypeData.memory"
          class="form-input-number"
        />
      </register-contents>
      <!-- /. RAM(GB) - memory -->

      <register-contents
        title="RootDisk(GB)"
        required
      >
        <el-input-number
          :min="0"
          :max="1024"
          :placeholder="$t('service.PLACEHOLDER.enterDisk')"
          v-model="instanceTypeData.disk"
          class="form-input-number"
        />
      </register-contents>
      <!-- /. RootDisk(GB) - disk -->

      <!-- <register-contents
        :title="$t('service.perf')"
        required
      >
        <el-radio-group
          v-model="instanceTypeData.performance"
          class="usable-wrap"
        >
          <el-radio label="HIGH">
            {{ $t('service.PLACEHOLDER.highSpec') }}
          </el-radio>
          <el-radio label="NORMAL">
            {{ $t('service.PLACEHOLDER.general') }}
          </el-radio>
        </el-radio-group>
      </register-contents> -->
      <!-- /. 성능 - performance -->
    </div>

    <article class="submit-arti big-button-area">
      <h6 class="skip-article-header">
        설치프로그램 추가 설정
      </h6>

      <button
        class="button -cancel"
        type="is-anti"
        @click="cancleInstance"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button -confirm"
        type="is-primary"
        @click="saveInstance"
      >
        {{ $t('common.BTN.save') }}
      </button>
    </article>

    <!-- {{ instanceTypeData }} -->
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
export default {
  name: 'InstanceTypeAdd',
  mounted () {
    this.insTypeList = this.$route.params.list
  },
  methods: {
    cancleInstance () {
      this.$confirm(this.$t('common.CONFIRM.BASE.029'), '알림', {
        confirmButtonsText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.$router.go(-1)
      }).catch(() => false)
    },
    async saveInstance () {
      const validator = this.instanceValid()
      if (!validator) return

      const {
        name: flavorName,
        vcpu: flavorCpu,
        disk: flavorDisk,
        gpu: flavorGpu,
        memory: flavorRam,
        // performance: flavorType,
        corePerCpu: flavorCorePerCpu
      } = this.instanceTypeData

      const param = { flavorName, flavorCpu, flavorDisk, flavorGpu, flavorRam, flavorCorePerCpu }

      this.$confirm(this.$t('common.CONFIRM.BASE.018'), '알림', {
        confirmButtonsText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        const response = await API.config.insertInstance(param)
        if (response) {
          this.$alert(this.$t('common.ALERT.BASE.023'))
          this.$router.go(-1)
        } else {
          this.$alert(this.$t('common.ALERT.BASE.024'))
        }
      }).catch(() => false)
    },
    instanceValid () {
      const duplicated =
        this.insTypeList.map((itm) => {
          return {
            name: itm.name === this.instanceTypeData.name,
            vcpu: `${itm.vcpu}` === `${this.instanceTypeData.vcpu}`,
            memory: `${itm.ram}` === `${this.instanceTypeData.memory}`,
            disk: `${itm.rootDisk}` === `${this.instanceTypeData.disk}`,
            performance: itm.performance === this.instanceTypeData.performance
          }
        })
      const conditions = [
        { condition: this.instanceTypeData.name && this.instanceTypeData.name.trim(), message: '사양명을 입력해주세요.' },
        { condition: (this.instanceTypeData.vcpu || this.instanceTypeData.vcpu > 0), message: 'Vcpu를 입력해주세요.' },
        { condition: (this.instanceTypeData.memory || this.instanceTypeData.memory > 0), message: 'Ram(GB)을 입력해주세요.' },
        { condition: (this.instanceTypeData.disk || this.instanceTypeData.disk > -1), message: 'RootDisk(GB)를 입력해주세요.' },
        // { condition: this.instanceTypeData.performance, message: '성능을 입력해주세요.' },
        {
          condition: !(duplicated.some(prop => Object.keys(prop).every((key) => prop[key] === true))),
          message: '동일한 인스턴스 타입이 존재합니다.'
        }
      ]
      return conditions.every(({ condition, message }) => {
        if (!condition) this.$alert(this.$v(message))
        return condition
      })
    }
  },
  data () {
    return {
      instanceTypeData: {
        name: '',
        vcpu: '',
        memory: '',
        disk: ''
        // performance: 'NORMAL'
      },
      insTypeList: []
    }
  }
}
</script>

<style lang="scss" scoped>
  .instance-type-add {
    .add-instance-contents {
      border-top: 1px solid $border-color;
      .instance-type-os-selection {
        width: 200px;
      }
      .usable-wrap {
        display: flex;
        > label {
          flex: 0 0 5%;
        }
      }
    }
    .form-input-number {
      width: 150px;
    }
  }
</style>
