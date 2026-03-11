import { computed, ref, type Ref } from 'vue'
import type {
  KnowledgeNode,
  KnowledgeEdge,
  KnowledgeLayer,
  KnowledgeDifficulty,
  KnowledgeKind,
  AgentStep,
  AgentRole,
} from '@/types'

// ─── 层级标签 ───

export const layerLabelMap: Record<KnowledgeLayer, string> = {
  physical: '物理 / 链路层',
  datalink: '数据链路层',
  network: '网络层',
  transport: '传输层',
  application: '应用层',
  security: '网络安全',
  ops: '运维监控',
}

export const difficultyLabelMap: Record<KnowledgeDifficulty, string> = {
  basic: '基础',
  intermediate: '进阶',
  advanced: '高级',
}

export const kindLabelMap: Record<KnowledgeKind, string> = {
  protocol: '协议',
  device: '设备',
  config: '配置',
  security: '安全',
  ops: '运维',
}

export const relationLabelMap: Record<string, string> = {
  prerequisite: '先修',
  dependency: '依赖',
  related: '关联',
}

// ─── 层级颜色 ───

export const layerColors: Record<KnowledgeLayer, string> = {
  physical: '#8B6914',
  datalink: '#B8860B',
  network: '#2E7D32',
  transport: '#1565C0',
  application: '#6A1B9A',
  security: '#C62828',
  ops: '#00838F',
}

// ─── 节点数据 ───

const nodes: KnowledgeNode[] = [
  // ── 物理 / 链路层 ──
  {
    id: 'ethernet', name: '以太网', layer: 'physical', difficulty: 'basic', kind: 'protocol', heat: 7,
    detail: {
      summary: '以太网（Ethernet）是最常用的局域网技术标准（IEEE 802.3），定义了物理层和数据链路层的帧格式与介质访问控制（CSMA/CD）。',
      commands: [
        'show interfaces ethernet 0/0',
        'show interfaces status',
        'speed 1000\nduplex full',
      ],
      topologySvg: `<svg viewBox="0 0 320 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="25" width="60" height="30" rx="6" fill="#e8f5e9" stroke="#2E7D32"/><text x="40" y="44" text-anchor="middle" font-size="11" fill="#1B5E20">PC-A</text><rect x="130" y="25" width="60" height="30" rx="6" fill="#fff3e0" stroke="#E65100"/><text x="160" y="44" text-anchor="middle" font-size="11" fill="#BF360C">Switch</text><rect x="250" y="25" width="60" height="30" rx="6" fill="#e8f5e9" stroke="#2E7D32"/><text x="280" y="44" text-anchor="middle" font-size="11" fill="#1B5E20">PC-B</text><line x1="70" y1="40" x2="130" y2="40" stroke="#666" stroke-width="2"/><line x1="190" y1="40" x2="250" y2="40" stroke="#666" stroke-width="2"/></svg>`,
      captureHint: '使用 Wireshark 过滤 eth.type == 0x0800 观察以太网帧中的 IPv4 载荷。',
      videoRef: { label: '以太网帧结构详解', timeSec: 245 },
      relatedExperiment: '实验 1：观察以太网帧的封装与解封装过程',
      prerequisites: [],
    },
  },
  {
    id: 'mac', name: 'MAC 地址', layer: 'datalink', difficulty: 'basic', kind: 'protocol', heat: 6,
    detail: {
      summary: 'MAC（Media Access Control）地址是 48 位的硬件地址，烧录在网卡中，用于数据链路层的帧寻址。格式为 XX:XX:XX:XX:XX:XX。',
      commands: ['show mac address-table', 'show interfaces | include address', 'ipconfig /all  (Windows)'],
      captureHint: '在 Wireshark 中查看 Ethernet II 帧头的 Source 和 Destination 字段即为 MAC 地址。',
      videoRef: { label: 'MAC 地址与交换原理', timeSec: 180 },
      prerequisites: ['ethernet'],
    },
  },
  {
    id: 'arp', name: 'ARP', layer: 'datalink', difficulty: 'basic', kind: 'protocol', heat: 7,
    detail: {
      summary: '地址解析协议（ARP）将 IPv4 地址映射为 MAC 地址。主机先查本地 ARP 缓存，未命中则广播 ARP Request，目标主机单播 ARP Reply。',
      commands: ['show arp', 'arp -a  (Windows/Linux)', 'clear arp-cache'],
      topologySvg: `<svg viewBox="0 0 320 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="35" width="60" height="30" rx="6" fill="#e3f2fd" stroke="#1565C0"/><text x="40" y="54" text-anchor="middle" font-size="10" fill="#0D47A1">Host A</text><rect x="250" y="35" width="60" height="30" rx="6" fill="#e3f2fd" stroke="#1565C0"/><text x="280" y="54" text-anchor="middle" font-size="10" fill="#0D47A1">Host B</text><line x1="70" y1="42" x2="250" y2="42" stroke="#F57C00" stroke-width="1.5" stroke-dasharray="6,3"/><text x="160" y="36" text-anchor="middle" font-size="9" fill="#E65100">ARP Request (broadcast)</text><line x1="250" y1="58" x2="70" y2="58" stroke="#2E7D32" stroke-width="1.5"/><text x="160" y="76" text-anchor="middle" font-size="9" fill="#1B5E20">ARP Reply (unicast)</text></svg>`,
      captureHint: '过滤 arp 可同时看到 Request（opcode=1）和 Reply（opcode=2）。',
      videoRef: { label: 'ARP 工作流程抓包演示', timeSec: 320 },
      relatedExperiment: '实验 2：手动清除 ARP 缓存后观察 ARP 交互过程',
      prerequisites: ['mac', 'ip'],
    },
  },
  {
    id: 'switch', name: '交换机', layer: 'datalink', difficulty: 'basic', kind: 'device', heat: 6,
    detail: {
      summary: '二层交换机基于 MAC 地址转发帧，维护 MAC 地址表（CAM 表）。支持 VLAN 划分、STP 环路消除等功能。',
      commands: ['show mac address-table dynamic', 'show vlan brief', 'show spanning-tree'],
      captureHint: '在交换机镜像端口（SPAN）上抓包可观察转发行为。',
      prerequisites: ['ethernet', 'mac'],
    },
  },
  {
    id: 'stp', name: 'STP', layer: 'datalink', difficulty: 'intermediate', kind: 'protocol', heat: 5,
    detail: {
      summary: '生成树协议（STP / IEEE 802.1D）通过选举根桥、计算最短路径，阻塞冗余链路来消除二层环路。RSTP（802.1w）大幅加快收敛。',
      commands: [
        'show spanning-tree',
        'spanning-tree mode rapid-pvst',
        'spanning-tree vlan 10 root primary',
      ],
      topologySvg: `<svg viewBox="0 0 260 120" xmlns="http://www.w3.org/2000/svg"><rect x="100" y="5" width="60" height="28" rx="5" fill="#fff3e0" stroke="#E65100"/><text x="130" y="23" text-anchor="middle" font-size="10" fill="#BF360C">Root</text><rect x="20" y="80" width="60" height="28" rx="5" fill="#e3f2fd" stroke="#1565C0"/><text x="50" y="98" text-anchor="middle" font-size="10" fill="#0D47A1">SW-A</text><rect x="180" y="80" width="60" height="28" rx="5" fill="#e3f2fd" stroke="#1565C0"/><text x="210" y="98" text-anchor="middle" font-size="10" fill="#0D47A1">SW-B</text><line x1="110" y1="33" x2="60" y2="80" stroke="#2E7D32" stroke-width="2"/><line x1="150" y1="33" x2="200" y2="80" stroke="#2E7D32" stroke-width="2"/><line x1="80" y1="94" x2="180" y2="94" stroke="#C62828" stroke-width="2" stroke-dasharray="5,4"/><text x="130" y="112" text-anchor="middle" font-size="9" fill="#C62828">Blocked</text></svg>`,
      captureHint: '过滤 stp 查看 BPDU 报文，关注 Root ID、Bridge ID 和 Port Role。',
      relatedExperiment: '实验 5：构建冗余拓扑观察 STP 收敛过程',
      prerequisites: ['switch'],
    },
  },
  // ── 网络层 ──
  {
    id: 'ip', name: 'IP 地址', layer: 'network', difficulty: 'basic', kind: 'protocol', heat: 9,
    detail: {
      summary: 'IPv4 地址为 32 位，分为网络号和主机号。常用 CIDR 表示法（如 192.168.1.0/24）。IPv6 为 128 位，使用冒分十六进制。',
      commands: [
        'interface GigabitEthernet0/0\n ip address 192.168.1.1 255.255.255.0',
        'show ip interface brief',
        'ipconfig  (Windows)',
      ],
      captureHint: '过滤 ip.addr == 192.168.1.1 查看特定主机的所有 IP 流量。',
      videoRef: { label: 'IP 地址与子网划分', timeSec: 480 },
      prerequisites: [],
    },
  },
  {
    id: 'subnet', name: '子网划分', layer: 'network', difficulty: 'intermediate', kind: 'config', heat: 7,
    detail: {
      summary: '子网划分通过借用主机位来创建多个子网。VLSM（可变长子网掩码）允许不同子网使用不同前缀长度，提高地址利用率。',
      commands: [
        '# /24 → 4个/26子网\n192.168.1.0/26   (0-63)\n192.168.1.64/26  (64-127)\n192.168.1.128/26 (128-191)\n192.168.1.192/26 (192-255)',
      ],
      videoRef: { label: '子网划分与 VLSM 计算', timeSec: 720 },
      relatedExperiment: '实验 3：为企业网划分子网并验证连通性',
      prerequisites: ['ip'],
    },
  },
  {
    id: 'vlan', name: 'VLAN', layer: 'network', difficulty: 'intermediate', kind: 'config', heat: 8,
    detail: {
      summary: '虚拟局域网（VLAN）在交换机上逻辑划分广播域。802.1Q 标准在帧头插入 4 字节 Tag。Trunk 端口承载多个 VLAN，Access 端口属于单一 VLAN。',
      commands: [
        'vlan 10\n name Engineering',
        'interface Fa0/1\n switchport mode access\n switchport access vlan 10',
        'interface Gi0/1\n switchport mode trunk\n switchport trunk allowed vlan 10,20,30',
        'show vlan brief',
      ],
      topologySvg: `<svg viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg"><rect x="120" y="30" width="60" height="40" rx="6" fill="#fff3e0" stroke="#E65100"/><text x="150" y="54" text-anchor="middle" font-size="10" fill="#BF360C">Switch</text><rect x="5" y="10" width="50" height="24" rx="4" fill="#e8f5e9" stroke="#2E7D32"/><text x="30" y="26" text-anchor="middle" font-size="9" fill="#1B5E20">VLAN10</text><rect x="5" y="66" width="50" height="24" rx="4" fill="#e3f2fd" stroke="#1565C0"/><text x="30" y="82" text-anchor="middle" font-size="9" fill="#0D47A1">VLAN20</text><rect x="245" y="10" width="50" height="24" rx="4" fill="#e8f5e9" stroke="#2E7D32"/><text x="270" y="26" text-anchor="middle" font-size="9" fill="#1B5E20">VLAN10</text><rect x="245" y="66" width="50" height="24" rx="4" fill="#e3f2fd" stroke="#1565C0"/><text x="270" y="82" text-anchor="middle" font-size="9" fill="#0D47A1">VLAN20</text><line x1="55" y1="22" x2="120" y2="42" stroke="#2E7D32" stroke-width="1.5"/><line x1="55" y1="78" x2="120" y2="58" stroke="#1565C0" stroke-width="1.5"/><line x1="180" y1="42" x2="245" y2="22" stroke="#2E7D32" stroke-width="1.5"/><line x1="180" y1="58" x2="245" y2="78" stroke="#1565C0" stroke-width="1.5"/></svg>`,
      captureHint: '在 Trunk 端口抓包可看到 802.1Q Tag（过滤 vlan）。',
      relatedExperiment: '实验 4：配置多 VLAN 并验证广播域隔离',
      prerequisites: ['switch', 'ip'],
    },
  },
  {
    id: 'routing', name: '路由基础', layer: 'network', difficulty: 'basic', kind: 'protocol', heat: 8,
    detail: {
      summary: '路由器根据路由表转发 IP 报文。路由来源包括：直连路由、静态路由、动态路由（RIP/OSPF/BGP）。路由选择基于最长前缀匹配和管理距离。',
      commands: [
        'show ip route',
        'ip route 10.0.0.0 255.0.0.0 192.168.1.254',
        'show ip protocols',
      ],
      captureHint: '使用 traceroute / tracert 观察数据包逐跳转发路径。',
      videoRef: { label: '路由原理与静态路由配置', timeSec: 560 },
      prerequisites: ['ip', 'subnet'],
    },
  },
  {
    id: 'ospf', name: 'OSPF', layer: 'network', difficulty: 'advanced', kind: 'protocol', heat: 9,
    detail: {
      summary: 'OSPF（Open Shortest Path First）是链路状态路由协议，使用 Dijkstra 算法计算最短路径树。支持区域划分（Area 0 为骨干区域）、LSA 泛洪、SPF 计算。',
      commands: [
        'router ospf 1\n network 192.168.1.0 0.0.0.255 area 0',
        'show ip ospf neighbor',
        'show ip ospf database',
        'show ip route ospf',
      ],
      topologySvg: `<svg viewBox="0 0 300 130" xmlns="http://www.w3.org/2000/svg"><ellipse cx="150" cy="55" rx="90" ry="40" fill="none" stroke="#2E7D32" stroke-width="1.5" stroke-dasharray="4,3"/><text x="150" y="16" text-anchor="middle" font-size="10" fill="#2E7D32">Area 0 (Backbone)</text><rect x="60" y="40" width="50" height="26" rx="5" fill="#e8f5e9" stroke="#2E7D32"/><text x="85" y="57" text-anchor="middle" font-size="9" fill="#1B5E20">R1</text><rect x="190" y="40" width="50" height="26" rx="5" fill="#e8f5e9" stroke="#2E7D32"/><text x="215" y="57" text-anchor="middle" font-size="9" fill="#1B5E20">R2</text><rect x="125" y="70" width="50" height="26" rx="5" fill="#e8f5e9" stroke="#2E7D32"/><text x="150" y="87" text-anchor="middle" font-size="9" fill="#1B5E20">R3</text><line x1="110" y1="53" x2="190" y2="53" stroke="#666" stroke-width="1.5"/><line x1="95" y1="66" x2="135" y2="74" stroke="#666" stroke-width="1.5"/><line x1="175" y1="74" x2="205" y2="66" stroke="#666" stroke-width="1.5"/><ellipse cx="40" cy="110" rx="35" ry="18" fill="none" stroke="#1565C0" stroke-dasharray="4,3"/><text x="40" y="114" text-anchor="middle" font-size="9" fill="#1565C0">Area 1</text><ellipse cx="260" cy="110" rx="35" ry="18" fill="none" stroke="#6A1B9A" stroke-dasharray="4,3"/><text x="260" y="114" text-anchor="middle" font-size="9" fill="#6A1B9A">Area 2</text><line x1="70" y1="66" x2="45" y2="94" stroke="#999" stroke-width="1"/><line x1="230" y1="66" x2="255" y2="94" stroke="#999" stroke-width="1"/></svg>`,
      captureHint: '过滤 ospf 可看到 Hello、DBD、LSR、LSU、LSAck 五种报文类型。',
      relatedExperiment: '实验 7：配置多区域 OSPF 并观察 LSA 泛洪过程',
      prerequisites: ['routing', 'subnet'],
    },
  },
  {
    id: 'bgp', name: 'BGP', layer: 'network', difficulty: 'advanced', kind: 'protocol', heat: 6,
    detail: {
      summary: 'BGP（Border Gateway Protocol）是唯一的 EGP，用于自治系统间路由。基于 TCP 179 端口，使用路径向量算法，支持策略路由和路由聚合。',
      commands: [
        'router bgp 65001\n neighbor 10.0.0.2 remote-as 65002',
        'show ip bgp summary',
        'show ip bgp neighbors',
      ],
      captureHint: '过滤 bgp 查看 OPEN、UPDATE、KEEPALIVE、NOTIFICATION 报文。',
      prerequisites: ['routing', 'ospf'],
    },
  },
  {
    id: 'nat', name: 'NAT', layer: 'network', difficulty: 'intermediate', kind: 'config', heat: 7,
    detail: {
      summary: '网络地址转换（NAT）将私有地址映射为公网地址。静态 NAT 一对一、动态 NAT 多对多、PAT（端口地址转换）多对一。',
      commands: [
        'ip nat inside source static 192.168.1.10 203.0.113.10',
        'ip nat inside source list 1 pool MYPOOL overload',
        'show ip nat translations',
        'debug ip nat',
      ],
      topologySvg: `<svg viewBox="0 0 320 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="25" width="70" height="30" rx="6" fill="#e3f2fd" stroke="#1565C0"/><text x="45" y="44" text-anchor="middle" font-size="9" fill="#0D47A1">内网 192.168.x</text><rect x="125" y="20" width="70" height="40" rx="6" fill="#fff3e0" stroke="#E65100"/><text x="160" y="38" text-anchor="middle" font-size="10" fill="#BF360C" font-weight="bold">NAT</text><text x="160" y="52" text-anchor="middle" font-size="8" fill="#E65100">Router</text><rect x="240" y="25" width="70" height="30" rx="6" fill="#fce4ec" stroke="#C62828"/><text x="275" y="44" text-anchor="middle" font-size="9" fill="#B71C1C">公网 203.0.x</text><line x1="80" y1="40" x2="125" y2="40" stroke="#1565C0" stroke-width="2"/><line x1="195" y1="40" x2="240" y2="40" stroke="#C62828" stroke-width="2"/></svg>`,
      captureHint: '在 NAT 路由器的 inside 和 outside 接口同时抓包，对比源/目的地址变化。',
      relatedExperiment: '实验 6：配置 PAT 实现多主机共享公网 IP',
      prerequisites: ['ip', 'routing'],
    },
  },
  {
    id: 'acl', name: 'ACL', layer: 'network', difficulty: 'intermediate', kind: 'config', heat: 7,
    detail: {
      summary: '访问控制列表（ACL）按顺序匹配报文特征并执行 permit/deny。标准 ACL 仅匹配源地址，扩展 ACL 可匹配五元组。应用于接口的 in/out 方向。',
      commands: [
        'access-list 100 permit tcp 192.168.1.0 0.0.0.255 any eq 80',
        'access-list 100 deny ip any any log',
        'interface Gi0/0\n ip access-group 100 in',
        'show access-lists',
      ],
      captureHint: '配合 log 关键字，ACL 匹配结果会记录到路由器日志，便于调试。',
      prerequisites: ['ip', 'routing'],
    },
  },
  // ── 传输层 ──
  {
    id: 'tcp', name: 'TCP', layer: 'transport', difficulty: 'basic', kind: 'protocol', heat: 9,
    detail: {
      summary: 'TCP（Transmission Control Protocol）提供可靠、面向连接的字节流传输。通过三次握手建立连接、四次挥手断开，使用滑动窗口进行流量控制和拥塞控制。',
      commands: [
        'netstat -an | find "ESTABLISHED"  (Windows)',
        'ss -tnp  (Linux)',
      ],
      topologySvg: `<svg viewBox="0 0 280 110" xmlns="http://www.w3.org/2000/svg"><text x="40" y="14" text-anchor="middle" font-size="10" fill="#0D47A1" font-weight="bold">Client</text><text x="240" y="14" text-anchor="middle" font-size="10" fill="#2E7D32" font-weight="bold">Server</text><line x1="40" y1="20" x2="40" y2="105" stroke="#0D47A1" stroke-width="1.5"/><line x1="240" y1="20" x2="240" y2="105" stroke="#2E7D32" stroke-width="1.5"/><line x1="42" y1="30" x2="238" y2="42" stroke="#F57C00" stroke-width="1.5"/><text x="140" y="30" text-anchor="middle" font-size="9" fill="#E65100">SYN</text><line x1="238" y1="52" x2="42" y2="64" stroke="#2E7D32" stroke-width="1.5"/><text x="140" y="55" text-anchor="middle" font-size="9" fill="#1B5E20">SYN+ACK</text><line x1="42" y1="74" x2="238" y2="86" stroke="#1565C0" stroke-width="1.5"/><text x="140" y="78" text-anchor="middle" font-size="9" fill="#0D47A1">ACK</text><text x="140" y="102" text-anchor="middle" font-size="9" fill="#666">三次握手完成</text></svg>`,
      captureHint: '过滤 tcp.flags.syn==1 查看 TCP 三次握手过程。',
      videoRef: { label: 'TCP 三次握手与四次挥手', timeSec: 410 },
      relatedExperiment: '实验 8：使用 Wireshark 捕获并分析完整 TCP 会话',
      prerequisites: ['ip'],
    },
  },
  {
    id: 'udp', name: 'UDP', layer: 'transport', difficulty: 'basic', kind: 'protocol', heat: 6,
    detail: {
      summary: 'UDP（User Datagram Protocol）提供无连接、不可靠的数据报传输。无握手开销，适用于实时音视频、DNS 查询等对延迟敏感的场景。',
      commands: ['netstat -an -p udp  (Windows)', 'ss -unp  (Linux)'],
      captureHint: '过滤 udp 查看 UDP 数据报，注意 Length 和 Checksum 字段。',
      prerequisites: ['ip'],
    },
  },
  {
    id: 'port', name: '端口', layer: 'transport', difficulty: 'basic', kind: 'protocol', heat: 5,
    detail: {
      summary: '传输层端口号（0-65535）标识主机上的应用进程。知名端口（0-1023）、注册端口（1024-49151）、动态端口（49152-65535）。',
      commands: ['netstat -tlnp  (Linux)', 'show control-plane host open-ports'],
      prerequisites: ['tcp', 'udp'],
    },
  },
  // ── 应用层 ──
  {
    id: 'dns', name: 'DNS', layer: 'application', difficulty: 'basic', kind: 'protocol', heat: 8,
    detail: {
      summary: 'DNS（Domain Name System）将域名解析为 IP 地址。采用分层分布式架构：根域 → 顶级域 → 权威域。支持递归查询和迭代查询。',
      commands: [
        'nslookup www.example.com',
        'dig @8.8.8.8 www.example.com A',
        'ip name-server 8.8.8.8',
        'show ip dns view',
      ],
      captureHint: '过滤 dns 查看 Query（A / AAAA / CNAME）和 Response 报文。',
      videoRef: { label: 'DNS 递归查询全过程', timeSec: 350 },
      relatedExperiment: '实验 9：搭建本地 DNS 服务器并配置正反向解析',
      prerequisites: ['udp', 'ip'],
    },
  },
  {
    id: 'dhcp', name: 'DHCP', layer: 'application', difficulty: 'basic', kind: 'protocol', heat: 7,
    detail: {
      summary: 'DHCP（Dynamic Host Configuration Protocol）自动分配 IP 地址、子网掩码、网关、DNS。四步流程：Discover → Offer → Request → ACK（DORA）。',
      commands: [
        'ip dhcp pool LAN\n network 192.168.1.0 /24\n default-router 192.168.1.1\n dns-server 8.8.8.8',
        'show ip dhcp binding',
        'ipconfig /renew  (Windows)',
      ],
      topologySvg: `<svg viewBox="0 0 300 90" xmlns="http://www.w3.org/2000/svg"><text x="40" y="12" text-anchor="middle" font-size="10" fill="#0D47A1">Client</text><text x="260" y="12" text-anchor="middle" font-size="10" fill="#2E7D32">DHCP Server</text><line x1="40" y1="16" x2="40" y2="88" stroke="#0D47A1" stroke-width="1"/><line x1="260" y1="16" x2="260" y2="88" stroke="#2E7D32" stroke-width="1"/><line x1="42" y1="24" x2="258" y2="32" stroke="#F57C00" stroke-width="1" stroke-dasharray="4,2"/><text x="150" y="23" text-anchor="middle" font-size="8" fill="#E65100">Discover (broadcast)</text><line x1="258" y1="42" x2="42" y2="50" stroke="#2E7D32" stroke-width="1"/><text x="150" y="42" text-anchor="middle" font-size="8" fill="#1B5E20">Offer</text><line x1="42" y1="58" x2="258" y2="66" stroke="#1565C0" stroke-width="1" stroke-dasharray="4,2"/><text x="150" y="60" text-anchor="middle" font-size="8" fill="#0D47A1">Request (broadcast)</text><line x1="258" y1="74" x2="42" y2="82" stroke="#6A1B9A" stroke-width="1"/><text x="150" y="78" text-anchor="middle" font-size="8" fill="#4A148C">ACK</text></svg>`,
      captureHint: '过滤 bootp（DHCP 基于 BOOTP）查看 DORA 四步过程。',
      prerequisites: ['udp', 'ip'],
    },
  },
  {
    id: 'http', name: 'HTTP', layer: 'application', difficulty: 'basic', kind: 'protocol', heat: 7,
    detail: {
      summary: 'HTTP（HyperText Transfer Protocol）是 Web 的基础协议，基于 TCP 80 端口。请求方法：GET、POST、PUT、DELETE 等。HTTPS 在 TLS 上运行 HTTP（443 端口）。',
      commands: [
        'curl -v http://example.com',
        'wget http://example.com/index.html',
      ],
      captureHint: '过滤 http 查看请求/响应，http.request.method == "GET" 仅看 GET 请求。',
      videoRef: { label: 'HTTP 请求响应全过程', timeSec: 290 },
      prerequisites: ['tcp', 'dns'],
    },
  },
  {
    id: 'ftp', name: 'FTP', layer: 'application', difficulty: 'intermediate', kind: 'protocol', heat: 4,
    detail: {
      summary: 'FTP（File Transfer Protocol）用于文件传输，使用两个 TCP 连接：控制连接（21）和数据连接（20 或动态端口）。支持主动和被动模式。',
      commands: ['ftp 192.168.1.100', 'show ip ftp'],
      captureHint: '过滤 ftp 看控制命令，ftp-data 看数据传输。',
      prerequisites: ['tcp'],
    },
  },
  {
    id: 'ssh', name: 'SSH / Telnet', layer: 'application', difficulty: 'basic', kind: 'config', heat: 5,
    detail: {
      summary: 'SSH（Secure Shell, TCP 22）提供加密远程管理。Telnet（TCP 23）明文传输，不安全但在实验环境常用。',
      commands: [
        'line vty 0 4\n transport input ssh\n login local',
        'crypto key generate rsa modulus 2048',
        'ssh -l admin 192.168.1.1',
      ],
      prerequisites: ['tcp'],
    },
  },
  // ── 安全 ──
  {
    id: 'firewall', name: '防火墙', layer: 'security', difficulty: 'intermediate', kind: 'security', heat: 7,
    detail: {
      summary: '防火墙基于安全策略对流量进行过滤。状态检测防火墙跟踪连接状态（会话表），仅允许已建立会话的回程流量。区域划分：Trust、Untrust、DMZ。',
      commands: [
        'firewall zone trust\n add interface GigabitEthernet0/0',
        'security-policy\n rule name allow-web\n  source-zone trust\n  destination-zone untrust\n  action permit',
      ],
      topologySvg: `<svg viewBox="0 0 320 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="25" width="60" height="30" rx="6" fill="#e8f5e9" stroke="#2E7D32"/><text x="40" y="44" text-anchor="middle" font-size="9" fill="#1B5E20">Trust</text><rect x="130" y="15" width="60" height="50" rx="6" fill="#ffebee" stroke="#C62828" stroke-width="2"/><text x="160" y="38" text-anchor="middle" font-size="10" fill="#B71C1C" font-weight="bold">FW</text><text x="160" y="52" text-anchor="middle" font-size="8" fill="#C62828">防火墙</text><rect x="250" y="25" width="60" height="30" rx="6" fill="#fce4ec" stroke="#C62828"/><text x="280" y="44" text-anchor="middle" font-size="9" fill="#B71C1C">Untrust</text><line x1="70" y1="40" x2="130" y2="40" stroke="#2E7D32" stroke-width="2"/><line x1="190" y1="40" x2="250" y2="40" stroke="#C62828" stroke-width="2"/></svg>`,
      captureHint: '查看防火墙会话表：display firewall session table。',
      prerequisites: ['acl', 'routing'],
    },
  },
  {
    id: 'vpn', name: 'VPN', layer: 'security', difficulty: 'advanced', kind: 'security', heat: 6,
    detail: {
      summary: 'VPN（Virtual Private Network）通过加密隧道在公网上构建安全的私有通信。常见类型：IPsec VPN（站点到站点）、SSL VPN（远程接入）、GRE over IPsec。',
      commands: [
        'crypto isakmp policy 10\n encryption aes 256\n hash sha256\n authentication pre-share',
        'crypto ipsec transform-set MYSET esp-aes 256 esp-sha256-hmac',
        'show crypto ipsec sa',
      ],
      captureHint: '过滤 isakmp 查看 IKE 协商，过滤 esp 查看加密数据。',
      relatedExperiment: '实验 10：配置 IPsec Site-to-Site VPN',
      prerequisites: ['firewall', 'routing'],
    },
  },
  {
    id: 'ids', name: 'IDS / IPS', layer: 'security', difficulty: 'advanced', kind: 'security', heat: 4,
    detail: {
      summary: 'IDS（入侵检测系统）被动监控并告警，IPS（入侵防御系统）在线阻断恶意流量。检测方式：基于签名、基于异常、基于行为。',
      commands: [
        'ip ips name MYIPS',
        'show ip ips signatures',
      ],
      prerequisites: ['firewall'],
    },
  },
  // ── 运维监控 ──
  {
    id: 'snmp', name: 'SNMP', layer: 'ops', difficulty: 'intermediate', kind: 'ops', heat: 5,
    detail: {
      summary: 'SNMP（Simple Network Management Protocol）用于网络设备监控和管理。管理站（NMS）通过 GET/SET 操作访问设备 MIB，设备通过 Trap 主动告警。',
      commands: [
        'snmp-server community public RO',
        'snmp-server host 192.168.1.100 traps public',
        'show snmp',
      ],
      captureHint: '过滤 snmp 查看 GET-Request / GET-Response / Trap 报文。',
      prerequisites: ['udp', 'ip'],
    },
  },
  {
    id: 'syslog', name: 'Syslog', layer: 'ops', difficulty: 'basic', kind: 'ops', heat: 4,
    detail: {
      summary: 'Syslog 是标准日志协议（UDP 514），将设备日志集中发送到日志服务器。日志级别 0-7：Emergency → Debug。',
      commands: [
        'logging host 192.168.1.200',
        'logging trap warnings',
        'show logging',
      ],
      prerequisites: ['udp'],
    },
  },
  {
    id: 'netflow', name: 'NetFlow', layer: 'ops', difficulty: 'intermediate', kind: 'ops', heat: 5,
    detail: {
      summary: 'NetFlow 收集 IP 流量统计信息（五元组+字节数+包数），用于流量分析、容量规划和安全审计。',
      commands: [
        'interface Gi0/0\n ip flow ingress\n ip flow egress',
        'ip flow-export destination 192.168.1.200 9996',
        'show ip cache flow',
      ],
      prerequisites: ['routing', 'ip'],
    },
  },
  {
    id: 'wireshark', name: 'Wireshark', layer: 'ops', difficulty: 'basic', kind: 'ops', heat: 8,
    detail: {
      summary: 'Wireshark 是最流行的网络协议分析器，支持实时抓包和离线分析。核心能力：过滤表达式、协议解析、流追踪、统计图表。',
      commands: [
        '# 常用过滤器\nip.addr == 192.168.1.1\ntcp.port == 80\nhttp.request.method == "GET"\ndns\narp',
      ],
      videoRef: { label: 'Wireshark 实战抓包技巧', timeSec: 600 },
      relatedExperiment: '实验 11：使用 Wireshark 分析常见协议报文',
      prerequisites: [],
    },
  },
  // ── 新增：高级网络技术 ──
  {
    id: 'mpls', name: 'MPLS', layer: 'network', difficulty: 'advanced', kind: 'protocol', heat: 6,
    detail: {
      summary: 'MPLS（Multi-Protocol Label Switching）在 IP 报文外层添加标签，实现基于标签的快速转发，避免逐跳查路由表。核心概念：LSR、LSP、LDP、标签栈。广泛用于运营商骨干网和 VPN（MPLS L3VPN / L2VPN）。',
      commands: [
        'mpls ip',
        'mpls label protocol ldp',
        'show mpls forwarding-table',
        'show mpls ldp neighbor',
      ],
      topologySvg: `<svg viewBox="0 0 340 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="25" width="60" height="30" rx="6" fill="#e8f5e9" stroke="#2E7D32"/><text x="40" y="44" text-anchor="middle" font-size="9" fill="#1B5E20">CE-A</text><rect x="100" y="25" width="50" height="30" rx="6" fill="#fff3e0" stroke="#E65100"/><text x="125" y="44" text-anchor="middle" font-size="9" fill="#BF360C">PE-1</text><rect x="175" y="25" width="50" height="30" rx="6" fill="#e3f2fd" stroke="#1565C0"/><text x="200" y="44" text-anchor="middle" font-size="9" fill="#0D47A1">P</text><rect x="250" y="25" width="50" height="30" rx="6" fill="#fff3e0" stroke="#E65100"/><text x="275" y="44" text-anchor="middle" font-size="9" fill="#BF360C">PE-2</text><line x1="70" y1="40" x2="100" y2="40" stroke="#666" stroke-width="1.5"/><line x1="150" y1="40" x2="175" y2="40" stroke="#1565C0" stroke-width="2"/><line x1="225" y1="40" x2="250" y2="40" stroke="#1565C0" stroke-width="2"/><text x="162" y="18" text-anchor="middle" font-size="8" fill="#1565C0">Label</text><text x="237" y="18" text-anchor="middle" font-size="8" fill="#1565C0">Label</text></svg>`,
      captureHint: '过滤 mpls 查看带标签的报文，关注标签值、TTL 和 S-bit（栈底标记）。',
      relatedExperiment: '实验 12：配置 MPLS 骨干网并验证标签转发路径',
      prerequisites: ['routing', 'ospf'],
    },
  },
  {
    id: 'qos', name: 'QoS', layer: 'network', difficulty: 'advanced', kind: 'config', heat: 6,
    detail: {
      summary: 'QoS（Quality of Service）通过分类、标记、排队和调度机制保障关键业务流量的带宽、延迟和丢包率。核心模型：IntServ（RSVP）和 DiffServ（DSCP）。常用排队算法：PQ、WFQ、CBWFQ、LLQ。',
      commands: [
        'class-map match-all VOICE\n match dscp ef',
        'policy-map QOS-POLICY\n class VOICE\n  priority 512',
        'interface Gi0/0\n service-policy output QOS-POLICY',
        'show policy-map interface',
      ],
      captureHint: '检查 IP 头的 DSCP 字段（过滤 ip.dsfield.dscp）确认标记是否正确。',
      relatedExperiment: '实验 13：配置 QoS 策略保障 VoIP 语音质量',
      prerequisites: ['routing', 'acl'],
    },
  },
  {
    id: 'ipv6', name: 'IPv6', layer: 'network', difficulty: 'intermediate', kind: 'protocol', heat: 7,
    detail: {
      summary: 'IPv6 使用 128 位地址（冒分十六进制），解决 IPv4 地址耗尽问题。无 NAT 需求，内置 IPsec 支持。地址类型：单播（GUA/LLA/ULA）、组播、任播。邻居发现协议（NDP）替代 ARP。',
      commands: [
        'ipv6 unicast-routing',
        'interface Gi0/0\n ipv6 address 2001:db8:1::1/64\n ipv6 enable',
        'show ipv6 interface brief',
        'show ipv6 neighbors',
        'show ipv6 route',
      ],
      topologySvg: `<svg viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="25" width="80" height="30" rx="6" fill="#e3f2fd" stroke="#1565C0"/><text x="50" y="38" text-anchor="middle" font-size="8" fill="#0D47A1">2001:db8:1::/64</text><text x="50" y="50" text-anchor="middle" font-size="9" fill="#0D47A1">R1</text><rect x="210" y="25" width="80" height="30" rx="6" fill="#e3f2fd" stroke="#1565C0"/><text x="250" y="38" text-anchor="middle" font-size="8" fill="#0D47A1">2001:db8:2::/64</text><text x="250" y="50" text-anchor="middle" font-size="9" fill="#0D47A1">R2</text><line x1="90" y1="40" x2="210" y2="40" stroke="#1565C0" stroke-width="2"/><text x="150" y="18" text-anchor="middle" font-size="8" fill="#6A1B9A">2001:db8:ff::/64</text></svg>`,
      captureHint: '过滤 ipv6 查看 IPv6 流量，icmpv6 查看 NDP 邻居请求/通告。',
      videoRef: { label: 'IPv6 基础配置与 NDP', timeSec: 520 },
      relatedExperiment: '实验 14：双栈环境下配置 IPv6 并验证端到端连通',
      prerequisites: ['ip', 'routing'],
    },
  },
  {
    id: 'gre', name: 'GRE 隧道', layer: 'network', difficulty: 'intermediate', kind: 'config', heat: 5,
    detail: {
      summary: 'GRE（Generic Routing Encapsulation）是通用路由封装协议（Protocol 47），可在 IP 网络上封装任意三层协议。常与 IPsec 结合实现加密隧道（GRE over IPsec）。',
      commands: [
        'interface Tunnel0\n ip address 10.0.0.1 255.255.255.252\n tunnel source Gi0/0\n tunnel destination 203.0.113.2\n tunnel mode gre ip',
        'show interface Tunnel0',
        'show ip route | include Tunnel',
      ],
      captureHint: '过滤 gre 查看封装报文，注意外层 IP 头和内层 IP 头的源/目的地址差异。',
      relatedExperiment: '实验 15：配置 GRE 隧道并在隧道上运行 OSPF',
      prerequisites: ['routing', 'ip'],
    },
  },
  {
    id: 'hsrp', name: 'HSRP / VRRP', layer: 'network', difficulty: 'intermediate', kind: 'protocol', heat: 5,
    detail: {
      summary: 'HSRP（Hot Standby Router Protocol）和 VRRP（Virtual Router Redundancy Protocol）提供网关冗余。多台路由器共享一个虚拟 IP/MAC 地址，Active/Master 故障后 Standby/Backup 自动接管，实现无缝切换。',
      commands: [
        'interface Gi0/0\n standby 1 ip 192.168.1.254\n standby 1 priority 110\n standby 1 preempt',
        'show standby brief',
      ],
      captureHint: '过滤 hsrp 或 vrrp 查看 Hello 报文和优先级协商过程。',
      prerequisites: ['routing', 'vlan'],
    },
  },
  {
    id: 'radius', name: 'RADIUS / AAA', layer: 'security', difficulty: 'intermediate', kind: 'security', heat: 5,
    detail: {
      summary: 'AAA（Authentication, Authorization, Accounting）框架管理网络访问控制。RADIUS 是最常用的 AAA 协议，基于 UDP 1812/1813。支持 802.1X 端口认证、VPN 认证、设备管理认证等场景。',
      commands: [
        'aaa new-model',
        'aaa authentication login default group radius local',
        'radius-server host 192.168.1.200 key cisco123',
        'show aaa sessions',
      ],
      captureHint: '过滤 radius 查看 Access-Request / Access-Accept / Accounting 报文。',
      prerequisites: ['firewall'],
    },
  },
  {
    id: 'ntp', name: 'NTP', layer: 'ops', difficulty: 'basic', kind: 'ops', heat: 4,
    detail: {
      summary: 'NTP（Network Time Protocol）用于网络时间同步，确保所有设备日志、证书验证和安全审计的时间一致性。采用分层 Stratum 架构，Stratum 0 为原子钟/GPS，Stratum 1 为直连时间源。',
      commands: [
        'ntp server 192.168.1.200',
        'ntp master 3',
        'show ntp status',
        'show ntp associations',
      ],
      captureHint: '过滤 ntp 查看时间同步请求和响应报文。',
      prerequisites: ['udp', 'ip'],
    },
  },
]

// ─── 边数据 ───

const edges: KnowledgeEdge[] = [
  // 物理/链路 → 网络
  { source: 'ethernet', target: 'mac', relation: 'prerequisite' },
  { source: 'ethernet', target: 'switch', relation: 'prerequisite' },
  { source: 'mac', target: 'arp', relation: 'prerequisite' },
  { source: 'switch', target: 'vlan', relation: 'prerequisite' },
  { source: 'switch', target: 'stp', relation: 'prerequisite' },
  // 网络层内部
  { source: 'ip', target: 'subnet', relation: 'prerequisite' },
  { source: 'ip', target: 'arp', relation: 'dependency' },
  { source: 'ip', target: 'routing', relation: 'prerequisite' },
  { source: 'subnet', target: 'routing', relation: 'prerequisite' },
  { source: 'subnet', target: 'vlan', relation: 'related' },
  { source: 'routing', target: 'ospf', relation: 'prerequisite' },
  { source: 'routing', target: 'bgp', relation: 'prerequisite' },
  { source: 'routing', target: 'nat', relation: 'prerequisite' },
  { source: 'routing', target: 'acl', relation: 'related' },
  { source: 'ospf', target: 'bgp', relation: 'prerequisite' },
  { source: 'ip', target: 'nat', relation: 'dependency' },
  { source: 'ip', target: 'acl', relation: 'dependency' },
  // 传输层
  { source: 'ip', target: 'tcp', relation: 'prerequisite' },
  { source: 'ip', target: 'udp', relation: 'prerequisite' },
  { source: 'tcp', target: 'port', relation: 'prerequisite' },
  { source: 'udp', target: 'port', relation: 'prerequisite' },
  // 应用层
  { source: 'udp', target: 'dns', relation: 'dependency' },
  { source: 'udp', target: 'dhcp', relation: 'dependency' },
  { source: 'tcp', target: 'http', relation: 'dependency' },
  { source: 'tcp', target: 'ftp', relation: 'dependency' },
  { source: 'tcp', target: 'ssh', relation: 'dependency' },
  { source: 'dns', target: 'http', relation: 'related' },
  { source: 'ip', target: 'dns', relation: 'related' },
  { source: 'ip', target: 'dhcp', relation: 'related' },
  // 安全
  { source: 'acl', target: 'firewall', relation: 'prerequisite' },
  { source: 'routing', target: 'firewall', relation: 'prerequisite' },
  { source: 'firewall', target: 'vpn', relation: 'prerequisite' },
  { source: 'firewall', target: 'ids', relation: 'prerequisite' },
  { source: 'routing', target: 'vpn', relation: 'dependency' },
  // 运维
  { source: 'udp', target: 'snmp', relation: 'dependency' },
  { source: 'udp', target: 'syslog', relation: 'dependency' },
  { source: 'ip', target: 'snmp', relation: 'related' },
  { source: 'routing', target: 'netflow', relation: 'related' },
  { source: 'ip', target: 'netflow', relation: 'dependency' },
  // 新增节点的边
  { source: 'routing', target: 'mpls', relation: 'prerequisite' },
  { source: 'ospf', target: 'mpls', relation: 'prerequisite' },
  { source: 'mpls', target: 'vpn', relation: 'related' },
  { source: 'routing', target: 'qos', relation: 'prerequisite' },
  { source: 'acl', target: 'qos', relation: 'prerequisite' },
  { source: 'ip', target: 'ipv6', relation: 'prerequisite' },
  { source: 'routing', target: 'ipv6', relation: 'prerequisite' },
  { source: 'ipv6', target: 'ospf', relation: 'related' },
  { source: 'routing', target: 'gre', relation: 'prerequisite' },
  { source: 'ip', target: 'gre', relation: 'prerequisite' },
  { source: 'gre', target: 'vpn', relation: 'related' },
  { source: 'routing', target: 'hsrp', relation: 'prerequisite' },
  { source: 'vlan', target: 'hsrp', relation: 'prerequisite' },
  { source: 'firewall', target: 'radius', relation: 'prerequisite' },
  { source: 'radius', target: 'vpn', relation: 'related' },
  { source: 'udp', target: 'ntp', relation: 'dependency' },
  { source: 'ip', target: 'ntp', relation: 'related' },
  { source: 'ntp', target: 'syslog', relation: 'related' },
]

// ─── 公开接口 ───

export interface NetworkGraphData {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

export function getNetworkGraphData(): NetworkGraphData {
  return { nodes: [...nodes], edges: [...edges] }
}

export function getNodeById(id: string): KnowledgeNode | undefined {
  return nodes.find((n) => n.id === id)
}

export function getAdjacentNodeIds(nodeId: string): string[] {
  const ids = new Set<string>()
  for (const e of edges) {
    if (e.source === nodeId) ids.add(e.target)
    if (e.target === nodeId) ids.add(e.source)
  }
  return [...ids]
}

// ─── Agent Mock 分析 ───

export function buildAgentSteps(node: KnowledgeNode): AgentStep[] {
  const adj = getAdjacentNodeIds(node.id)
  const adjNames = adj.map((id) => nodes.find((n) => n.id === id)?.name ?? id).slice(0, 5)
  const prereqNames = (node.detail.prerequisites ?? [])
    .map((id) => nodes.find((n) => n.id === id)?.name ?? id)

  const steps: AgentStep[] = [
    {
      role: 'knowledge-locator' as AgentRole,
      label: '知识定位 Agent',
      status: 'waiting',
      input: `用户查询节点：${node.name}`,
      reasoning: `在知识图谱中定位 ${node.name}，属于 ${layerLabelMap[node.layer]}，难度为${difficultyLabelMap[node.difficulty]}。关联知识点共 ${adj.length} 个。`,
      output: `已定位到 ${layerLabelMap[node.layer]} 的「${node.name}」，关联节点：${adjNames.join('、')}。`,
      highlightNodeIds: [node.id, ...adj],
    },
    {
      role: 'protocol-analyzer' as AgentRole,
      label: '协议分析 Agent',
      status: 'waiting',
      input: `分析 ${node.name} 的协议工作机制`,
      reasoning: `${node.name} ${node.kind === 'protocol' ? '是一个协议层实体' : node.kind === 'device' ? '是网络设备' : '是配置/运维对象'}，需要从封装关系、报文格式、状态机三个维度分析。`,
      output: node.detail.summary,
      highlightNodeIds: [node.id],
    },
    {
      role: 'fault-diagnoser' as AgentRole,
      label: '故障诊断 Agent',
      status: 'waiting',
      input: `${node.name} 的常见故障与排障路径`,
      reasoning: `结合该知识点的先修关系和依赖链，分析典型故障场景。先修知识：${prereqNames.length > 0 ? prereqNames.join('、') : '无'}。`,
      output: buildFaultDiagnosisOutput(node),
      highlightNodeIds: prereqNames.length > 0
        ? [...(node.detail.prerequisites ?? []), node.id]
        : [node.id],
    },
    {
      role: 'learning-advisor' as AgentRole,
      label: '学习建议 Agent',
      status: 'waiting',
      input: `为学习者制定 ${node.name} 的学习路径`,
      reasoning: `综合前三位 Agent 的分析结果，结合先修知识、关联实验和多模态资源，制定个性化学习建议。`,
      output: buildLearningAdviceOutput(node),
      highlightNodeIds: [...(node.detail.prerequisites ?? []), node.id, ...adj.slice(0, 3)],
    },
  ]
  return steps
}

function buildFaultDiagnosisOutput(node: KnowledgeNode): string {
  const faultMap: Record<string, string> = {
    ospf: '常见故障：\n1. 邻居关系无法建立 → 检查 Area ID、Hello/Dead 定时器是否匹配\n2. 路由震荡 → 检查 MTU 不匹配或链路不稳定\n3. 部分路由丢失 → 检查区域间路由汇总或过滤配置',
    bgp: '常见故障：\n1. Peer 状态卡在 Active → 检查 TCP 179 端口可达性和 AS 号配置\n2. 路由未通告 → 检查 network 命令或 redistribute 配置\n3. 路由环路 → 检查 AS-Path 属性和路由策略',
    vlan: '常见故障：\n1. VLAN 间无法通信 → 检查是否配置了三层路由（Router-on-a-Stick 或 SVI）\n2. Trunk 不通 → 检查 encapsulation 和 allowed vlan 配置\n3. VLAN 不存在 → 检查 VTP 模式和 VLAN 数据库',
    tcp: '常见故障：\n1. 连接超时 → 检查防火墙规则和路由可达性\n2. 连接重置（RST）→ 目标端口未监听或被安全策略拒绝\n3. 性能低下 → 检查窗口大小、重传和拥塞情况',
    dns: '常见故障：\n1. 解析失败 → 检查 DNS 服务器可达性和配置\n2. 解析缓慢 → 检查递归链路和缓存 TTL\n3. 解析结果错误 → 检查 DNS 缓存污染或记录配置',
    nat: '常见故障：\n1. 内网无法上网 → 检查 NAT inside/outside 接口和 ACL\n2. 回程流量丢失 → 检查 NAT 转换表和路由\n3. 特定应用不可用 → 检查 ALG（应用层网关）配置',
    firewall: '常见故障：\n1. 流量被误拦截 → 检查安全策略规则顺序和匹配条件\n2. 会话超时 → 调整会话老化时间\n3. 区域间通信异常 → 检查区域划分和默认策略',
    mpls: '常见故障：\n1. 标签分配失败 → 检查 LDP 邻居是否建立（show mpls ldp neighbor）\n2. 转发路径异常 → 检查 LFIB 表项和 PHP 行为\n3. VPN 路由不通 → 检查 RD/RT 配置和 MP-BGP 邻居',
    qos: '常见故障：\n1. 语音卡顿 → 检查 LLQ 是否正确配置、带宽是否充足\n2. 标记丢失 → 检查信任边界和 DSCP 重标记策略\n3. 策略不生效 → 确认 service-policy 方向（in/out）和接口绑定',
    ipv6: '常见故障：\n1. 邻居不可达 → 检查 NDP（RA/NS/NA）和链路本地地址\n2. 全局单播地址无法通信 → 检查 IPv6 路由和 ACL\n3. 双栈环境冲突 → 检查 DNS 优先级和应用层协议栈选择',
    gre: '常见故障：\n1. 隧道 Up 但无流量 → 检查路由是否指向 Tunnel 接口\n2. 递归路由问题 → 确保隧道目的 IP 不走隧道本身\n3. MTU 问题 → GRE 增加 24 字节开销，可能需要调整 MSS',
    hsrp: '常见故障：\n1. 主备不切换 → 检查 preempt 配置和优先级\n2. 双 Active → 检查 HSRP 组播地址（224.0.0.2）和 VLAN 连通性\n3. 虚拟 IP 不可达 → 确认接口状态和 standby 组配置',
    radius: '常见故障：\n1. 认证失败 → 检查 RADIUS key 是否两端一致\n2. 超时无响应 → 检查 UDP 1812 端口可达性和防火墙规则\n3. 授权不正确 → 检查 RADIUS 服务器上的用户属性和策略',
    ntp: '常见故障：\n1. 时间不同步 → 检查 NTP 服务器可达性和 Stratum 层级\n2. 认证失败 → 检查 NTP 密钥配置\n3. 漂移过大 → 确认网络延迟稳定性和 NTP 源质量',
  }
  return faultMap[node.id] ??
    `常见故障：\n1. 配置错误 → 检查相关命令语法和参数\n2. 连通性问题 → 使用 ping/traceroute 逐跳排查\n3. 兼容性问题 → 确认协议版本和厂商实现差异`
}

function buildLearningAdviceOutput(node: KnowledgeNode): string {
  const prereqs = (node.detail.prerequisites ?? [])
    .map((id) => nodes.find((n) => n.id === id)?.name ?? id)
  const parts: string[] = []

  if (prereqs.length > 0) {
    parts.push(`📋 先修知识：建议先掌握「${prereqs.join('」「')}」`)
  }
  parts.push(`📖 核心学习：${node.detail.summary.slice(0, 60)}…`)
  if (node.detail.commands && node.detail.commands.length > 0) {
    parts.push(`⌨️ 动手实践：练习 ${node.detail.commands.length} 条核心配置命令`)
  }
  if (node.detail.relatedExperiment) {
    parts.push(`🔬 推荐实验：${node.detail.relatedExperiment}`)
  }
  if (node.detail.videoRef) {
    parts.push(`🎬 视频资源：${node.detail.videoRef.label}（${Math.floor(node.detail.videoRef.timeSec / 60)}分${node.detail.videoRef.timeSec % 60}秒处）`)
  }
  if (node.detail.captureHint) {
    parts.push(`🔍 抓包验证：${node.detail.captureHint.slice(0, 50)}…`)
  }
  return parts.join('\n')
}

// ─── Composable ───

export function useNetworkGraph() {
  const graphData = getNetworkGraphData()
  const selectedNodeId = ref<string>('')
  const filterLayer = ref<KnowledgeLayer | ''>('')
  const filterDifficulty = ref<KnowledgeDifficulty | ''>('')
  const filterKind = ref<KnowledgeKind | ''>('')
  const searchQuery = ref('')

  const filteredNodes = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    return graphData.nodes.filter((n) => {
      if (filterLayer.value && n.layer !== filterLayer.value) return false
      if (filterDifficulty.value && n.difficulty !== filterDifficulty.value) return false
      if (filterKind.value && n.kind !== filterKind.value) return false
      if (q && !n.name.toLowerCase().includes(q) && !n.detail.summary.toLowerCase().includes(q)) return false
      return true
    })
  })

  const filteredNodeIds = computed(() => new Set(filteredNodes.value.map((n) => n.id)))

  const filteredEdges = computed(() => {
    const ids = filteredNodeIds.value
    return graphData.edges.filter((e) => ids.has(e.source) && ids.has(e.target))
  })

  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null
    return graphData.nodes.find((n) => n.id === selectedNodeId.value) ?? null
  })

  // Agent analysis state
  const agentSteps: Ref<AgentStep[]> = ref([])
  const agentRunning = ref(false)

  async function runAgentAnalysis(node: KnowledgeNode, onComplete?: (node: KnowledgeNode, steps: AgentStep[]) => void) {
    const steps = buildAgentSteps(node)
    agentSteps.value = steps
    agentRunning.value = true

    for (let i = 0; i < steps.length; i++) {
      const step = agentSteps.value[i]!
      agentSteps.value[i] = { role: step.role, label: step.label, status: 'running', input: step.input, reasoning: step.reasoning, output: step.output, highlightNodeIds: step.highlightNodeIds }
      await delay(800 + Math.random() * 600)
      agentSteps.value[i] = { role: step.role, label: step.label, status: 'done', input: step.input, reasoning: step.reasoning, output: step.output, highlightNodeIds: step.highlightNodeIds }
    }

    agentRunning.value = false
    onComplete?.(node, agentSteps.value)
  }

  function resetAgent() {
    agentSteps.value = []
    agentRunning.value = false
  }

  function selectNode(id: string) {
    selectedNodeId.value = id
    resetAgent()
  }

  // currently highlighted node ids from agent analysis
  const highlightedNodeIds = computed<Set<string>>(() => {
    const ids = new Set<string>()
    for (const step of agentSteps.value) {
      if (step.status === 'done' && step.highlightNodeIds) {
        step.highlightNodeIds.forEach((nid) => ids.add(nid))
      }
    }
    return ids
  })

  return {
    graphData,
    filteredNodes,
    filteredEdges,
    filteredNodeIds,
    selectedNodeId,
    selectedNode,
    filterLayer,
    filterDifficulty,
    filterKind,
    searchQuery,
    selectNode,
    // Agent
    agentSteps,
    agentRunning,
    runAgentAnalysis,
    resetAgent,
    highlightedNodeIds,
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
