<!--
  * 파일명 : NetworkCategorySelection.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-01-07
  * License By Shinsegae I&C
  * 2021-01-07 fix: [환경설정 > 뉴타닉스 설정] - 로딩 추가 및 ui 자잘한 수정
 -->

<template>
  <div v-loading="isLoading">
    <article class="network-category-wrap">
      <!-- <button
        class="button"
        :type="categoryViews ? 'is-anti' : 'is-dark'"
        @click="categoryViews = !categoryViews"
        :disabled="disabled"
      >
        {{ categoryViews ? $t('common.BTN.cancel') : $t('common.BTN.add') }}
      </button>
        {{ categoryViews ? '취소' : '추가' }}
        {{ categoryViews ? $t('COMMON.BTN.CANCEL') : $t('COMMON.BTN.ADD') }}
      </button> -->

      <transition name="fade">
        <div
          v-if="categoryViews"
          class="network-category-add"
        >
          <h5 v-if="viewTitle">
            네트워크 카테고리 선택
            <!-- {{ $t('CONSOLE.NETWORK_CATE.TIT') }} -->
          </h5>
          <div class="select-category">
            <!-- {{ selectedNetwork }} -->
            <el-select
              class="-category"
              v-for="items in optionsNames"
              :key="`${items.field}_category`"
              :popper-append-to-body="false"
              :placeholder="$t(items.keyPath) || items.placeholder"
              v-model="selectedNetwork[items.field]"
              @change="changeEvent(items.field)"
              :disabled="cateLimit === cateLists.length"
            >
              <el-option
                v-for="item in options[items.field]"
                :key="item.cateName"
                :value="item.cateName"
              />
            </el-select>

            <button
              class="button"
              type="is-primary"
              @click="save"
              :disabled="cateLimit === cateLists.length"
            >
              <!-- 적용 -->
              {{ $t('common.BTN.apply') }}
            </button>
          </div>
        </div>
      </transition>

      <small
        class="-reference"
        v-if="cateLimit === cateLists.length"
      >
        <span>*</span>&nbsp;
        <!-- 네트워크 조직은 최대 {{ cateLimit }} 개 까지 설정 가능합니다. -->
        {{ $t('common.ALERT.NETWORK.055', {cateLimit}) }}
      </small>
      <small
        v-if="allValidator"
        class="-reference -alert"
      >
        <span>*</span> {{ $t('common.ALERT.NUTA.042') }}
      </small>
    </article>

    <!-- 추가된 네트워크 조직 목록 -->
    <div
      v-if="cateLists.length"
      class="tag-lists"
    >
      <ul>
        <li
          class="list"
          v-for="(cate, index) in cateLists"
          :key="cate + index + '_key'"
        >
          <span>
            {{ cate.cateKey }}
            <i
              class="mdi mdi-close"
              @click="removeList(index)"
              v-if="!disabled"
            />
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'

export default {
  name: 'NetworkCategorySelection',
  props: {
    cateLists: { // 리스트
      type: Array,
      default: () => []
    },
    cateLimit: { // 최대 길이 설정
      type: Number,
      default: undefined
    },
    disabled: { // disabled 시킬건지 결정합니다
      type: Boolean,
      default: false
    },
    viewTitle: { // '네트워크카테고리 선택'이라는 타이틀이 보이게 할건지?
      type: Boolean,
      default: false
    }
  },
  async created () {
    try {
      this.isLoading = true
      this.response = await API.network.getNetworkCategoryTree()
      this.setInitOpts(this.response)
    } catch (error) {
      console.error(error)
    } finally {
      this.isLoading = false
    }
  },
  methods: {
    /**
     * 초기 option을 설정합니다
     */
    setInitOpts (response = this.response) {
      this.options.dataCenter = response.map(data => data)
    },
    /**
     * selection을 클릭할 때마다 해당 데이터를 설정합니다
     */
    changeEvent (field) {
      // console.log(`%c 선택된것:: ${this.selectedNetwork[field]}, // field: ${field}`, 'background: #222; color: #bada55')

      const setSelection = {
        dataCenter: () => this.setNetwork(field),
        network: () => this.setNetType(field),
        netType: () => this.setData(field)
      }[field]

      return setSelection()
    },
    /**
     * network 옵션 설정
     */
    setNetwork (field) {
      this.options.network = undefined
      this.options.netType = undefined
      this.selectedNetwork.network = undefined
      this.selectedNetwork.netType = undefined
      this.selectedTemp = ''

      const value = this.optionFilter('dataCenter', field)

      this.options.network = [...value[0].children]
      return this.options.network
    },
    /**
     * 망 옵션 설정
     */
    setNetType (field) {
      this.options.netType = undefined
      this.selectedNetwork.netType = undefined
      this.selectedTemp = ''

      const value = this.optionFilter('network', field)

      this.options.netType = [...value[0].children]
      return this.options.netType
    },
    /**
     * 망 설정까지 끝낸 경우..
     */
    setData (field) {
      const value = this.optionFilter('netType', field)

      // this.selectedTemp = value[0].cateKey
      this.selectedTemp = value[0]
      return this.selectedTemp
    },
    optionFilter (type, field) {
      const options = this.options[type]
      return options.filter(option => option.cateName === this.selectedNetwork[field])
    },
    /**
     * 네트워크 데이터를 push 및 저장합니다.
     */
    save () {
      if (this.selectedTemp) {
        const validation = () => this.limitValidation()

        if (validation()) {
          this.cateLists.push(this.selectedTemp)
          this.selectedTemp = ''
          this.resetOptions()
          this.$emit('data', this.cateLists)
          // this.categoryViews = false
          this.allValidator = false
        }
      } else {
        this.allValidator = true
        // this.$alert(this.$t('CONSOLE.NETWORK_CATE.ALERT.001'), '', { // 모두 선택하신 후 진행해주세요
        //   confirmButtonText: this.$t('COMMON.BTN.CONFIRM'), // 확인,
        //   callback: () => false
        // })
      }
    },
    limitValidation () {
      if (!this.cateLimit || this.cateLists.length < this.cateLimit) return true
      else {
        this.$alert(this.$t('CONSOLE.NETWORK_CATE.ALERT.002', { n: this.cateLimit }), '', { // 최대${this.cateLimit} 개 까지만 설정 가능합니다.
          confirmButtonText: this.$t('COMMON.BTN.CONFIRM'), // 확인,
          callback: () => false
        })
        return false
      }
    },
    /**
     * 모든 데이터를 reset 합니다.
     */
    resetOptions (innerData) {
      this.options = {
        dataCenter: undefined,
        network: undefined,
        netType: undefined
      }
      this.selectedNetwork = {
        dataCenter: undefined,
        network: undefined,
        netType: undefined
      }

      return this.setInitOpts(this.response)
    },
    removeList (index) {
      this.cateLists.splice(index, 1)
      return this.$emit('data', this.cateLists)
    }
  },
  data () {
    return {
      isLoading: false,
      networkCategory: [],
      response: undefined,
      categoryViews: true, // false
      allValidator: false,
      options: {
        dataCenter: undefined,
        network: undefined,
        netType: undefined

        // 데이터 형식
        // options: {
        //   dataCenter: [{ title: '김포' }, { title: '송도' }],
        //   network: [{ title: 'legacy' }, { title: 'sdn' }, { title: 'sksk' }],
        //   netType: [{ title: '내부' }, { title: '외부' }, { title: 'NAT' }]
        // }
      },
      selectedTemp: '',
      selectedNetwork: { // 네트워크 조직 (수정필요)
        dataCenter: '',
        network: '',
        netType: ''
      },

      optionsNames: [
        { placeholder: '데이터센터', field: 'dataCenter', keyPath: 'admin.PREF.dataCenter' },
        { placeholder: '네트워크환경', field: 'network', keyPath: 'admin.PREF.networkEnv' },
        { placeholder: '망분류', field: 'netType', keyPath: 'admin.PREF.networkClass' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>

  .network-category-wrap {
    display: flex;
    flex-direction: column;
    > button { margin-right: $gap }
    .-reference {
      margin-top: 5px;
      color: $input-placeholder;
      span, &.-alert { color: $main-red; }
    }
    .network-category-add {
      // border: 1px solid pink;
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      > h5 {
        font-size: 15px;
        height: 15px;
        margin-right: $gap;
      }
      > .select-category {
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        > .-category {
          width: 120px;
          margin-right: $gap-s;
        }
      }
    }
    & + .tag-lists {
      margin-top: 15px;
      .list {
        display: inline-block;
        line-height: 28px;
        background-color: $main-gray;
        border-radius: 25px;
        padding: 0 15px;
        margin-right: 7px;
        font-size: 13px;
        margin-bottom: $gap-s;
        > span {
          display: flex;
          align-items: center;
          .mdi-close {
            cursor:pointer;
            margin-left: 5px;
            line-height: 30px;
            &:before {
              line-height: 30px;
              font-size: 12px;
            }
          }
        }
      }
    }
  }

.fade-enter-active, .fade-leave-active {
  transition: opacity .2s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
