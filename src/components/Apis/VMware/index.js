import VM from './VM'
import Datastore from './Datastore'
import VCenter from './VCenter.js'
import Network from './Network.js'
import Host from './Host.js'
import VMTemplate from './VMTemplate.js'
import Threshold from './Threshold'

export default {
  vm: VM,
  datastore: Datastore,
  vcenter: VCenter,
  network: Network,
  host: Host,
  template: VMTemplate,
  threshold: Threshold
}
