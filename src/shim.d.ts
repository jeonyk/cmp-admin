import Vue from 'vue'
import { Validate } from './utils/validate-type'

declare module 'vue/types/vue' {
  interface Vue {
    $validate: Validate
    $v: (k: string) => string
  }
}
