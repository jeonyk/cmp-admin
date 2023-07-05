/**
  * 파일명 : index.js
  * 파일 기능 : 모든 API를 모듈화합니다.
  * 작성자 : 전경열 외 5명
  * 최종 작성일 : 2020-12-31
  * License By Shinsegae I&C
  * 2020-12-31 api 목록 metering, billing 추가, 서버현황 클릭 오류 수정
 **/

import Alarm from './Alarm'
import Compute from './Compute'
import IAM from './IAM'
import Database from './Database'
import Config from './Config'
// import ConfigAws from './ConfigAws'
import Admin from './Admin'
import ConfigManage from './ConfigManage'
import Network from './Network'
import Market from './Market'
import NetworkCategory from './NetworkCategory'
import Auth from './Auth'
import Notice from './Notice'
import FAQ from './FAQ'
import Task from './Task'
import Order from './ORDER'
import WorkMngTask from './WorkMngTask'
import Metering from './Metering'
import Billing from './Billing'
import Work from './Work'
import Monitoring from './Monitoring'
import Enum from './Enum'
import * as OVA from './OVA'
import * as Audit from './Audit'
// import NetworkAws from './NetworkAws'
import EC2 from './EC2'
import EBS from './EBS'
import EFS from './EFS'
// import * as AWS from './AWS'
import VMware from './VMware'

export default {
  alarm: Alarm,
  compute: Compute,
  iam: IAM,
  database: Database,
  config: Config,
  // configAws: ConfigAws,
  admin: Admin,
  configManage: ConfigManage,
  network: Network,
  market: Market,
  auth: Auth,
  notice: Notice,
  faq: FAQ,
  networkCategory: NetworkCategory,
  task: Task,
  order: Order,
  workMngTask: WorkMngTask,
  metering: Metering,
  billing: Billing,
  work: Work,
  monitoring: Monitoring,
  enum: Enum,
  OVA,
  audit: Audit,
  // NetworkAws,
  EC2,
  EBS,
  EFS,
  // AWS, // ... 구분이 없어서 ...;
  vmware: VMware
}
