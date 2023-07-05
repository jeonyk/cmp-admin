/**
  * 파일명 : ConfigManage.js
  * 파일 기능 : [Config] 관련 API 모듈화
  * 작성자 : 김진범
  * 최종 작성일 : 2020-10-15
  * License By Shinsegae I&C
  * 2020-10-15 스토리지 작업 중
 **/

import Cluster from './ConfigManage/Cluster'
import Host from './ConfigManage/Host'
import Vm from './ConfigManage/Vms'
import Storage from './ConfigManage/Storage'

export default {
  cluster: Cluster,
  host: Host,
  vm: Vm,
  storage: Storage
}
