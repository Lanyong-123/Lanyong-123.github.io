window.PROTOTYPE_DATA = {
  devices: {
    total: 128,
    online: 119,
    offline: 9,
    categories: [
      { name: "固定摄像机", total: 68, online: 65, offline: 3 },
      { name: "AI智能摄像机", total: 24, online: 22, offline: 2 },
      { name: "门禁控制器", total: 18, online: 17, offline: 1 },
      { name: "人员通道闸机", total: 10, online: 9, offline: 1 },
      { name: "车辆道闸", total: 8, online: 6, offline: 2 }
    ]
  },
  events: [
    { name: "设备红灯响应超时", value: 28, color: "#ff5b54" },
    { name: "长时间逗留", value: 24, color: "#ffb64c" },
    { name: "玩手机", value: 21, color: "#b974ff" },
    { name: "吸烟", value: 17, color: "#37d9b1" },
    { name: "周界入侵", value: 14, color: "#35cfff" }
  ],
  weeklyEvents: [
    { date: "09/08", values: [19, 16, 13, 11, 8] },
    { date: "09/09", values: [22, 18, 15, 12, 9] },
    { date: "09/10", values: [21, 19, 14, 13, 10] },
    { date: "09/11", values: [25, 21, 17, 14, 12] },
    { date: "09/12", values: [24, 22, 18, 15, 11] },
    { date: "09/13", values: [27, 23, 20, 16, 13] },
    { date: "09/14", values: [28, 24, 21, 17, 14] }
  ],
  personInspectionTop10: [
    { name: "陈志强", department: "生产一部", employeeId: "EMP-0186", type: "设备红灯响应超时", count: 26 },
    { name: "王浩宇", department: "制造中心", employeeId: "EMP-0241", type: "长时间逗留", count: 23 },
    { name: "李建平", department: "配料班组", employeeId: "EMP-0098", type: "玩手机", count: 21 },
    { name: "周明凯", department: "设备保障部", employeeId: "EMP-0315", type: "吸烟", count: 19 },
    { name: "刘海峰", department: "品质部", employeeId: "EMP-0172", type: "周界入侵", count: 17 },
    { name: "赵文杰", department: "生产二部", employeeId: "EMP-0289", type: "玩手机", count: 15 },
    { name: "张继华", department: "冲压班组", employeeId: "EMP-0127", type: "设备红灯响应超时", count: 13 },
    { name: "孙晓鹏", department: "仓储物流部", employeeId: "EMP-0362", type: "长时间逗留", count: 11 },
    { name: "吴佳敏", department: "行政服务部", employeeId: "EMP-0056", type: "吸烟", count: 9 },
    { name: "何志远", department: "生产一部", employeeId: "EMP-0203", type: "周界入侵", count: 8 }
  ],
  alarms: [
    { id: "AI-0914-087", type: "设备红灯响应超时", level: "紧急", location: "1号厂房 · 2号机台", time: "14:32:18", owner: "张继华", status: "待处理" },
    { id: "AI-0914-086", type: "长时间逗留", level: "重要", location: "1号厂房 · 西侧通道", time: "14:28:46", owner: "李晓峰", status: "处理中" },
    { id: "AI-0914-085", type: "玩手机", level: "重要", location: "1号厂房 · 生产作业区", time: "14:16:09", owner: "王浩", status: "待处理" },
    { id: "AI-0914-084", type: "吸烟", level: "一般", location: "1号厂房 · 东侧通道", time: "13:57:32", owner: "周慧", status: "已处理" }
  ],
  cameras: [
    { id: "CAM-001", name: "南门入口", area: "1号厂房 · 南门", x: 18, y: 84, status: "在线", people: 4, scene: "gate", note: "人员进出正常" },
    { id: "CAM-018", name: "西侧通道", area: "1号厂房 · 西侧通道", x: 14, y: 48, status: "在线", people: 2, scene: "corridor", note: "通道无拥堵" },
    { id: "CAM-032", name: "生产一线", area: "1号厂房 · 1号机组", x: 35, y: 61, status: "在线", people: 7, scene: "production", note: "设备运行正常" },
    { id: "CAM-042", name: "冲压作业区", area: "1号厂房 · 冲压区", x: 52, y: 56, status: "告警", people: 3, scene: "machine", note: "检测到设备红灯响应超时" },
    { id: "CAM-051", name: "原料暂存区", area: "1号厂房 · 物料区", x: 69, y: 42, status: "在线", people: 1, scene: "warehouse", note: "库存区域正常" },
    { id: "CAM-067", name: "东侧安全通道", area: "1号厂房 · 东侧通道", x: 84, y: 34, status: "在线", people: 0, scene: "corridor", note: "安全通道畅通" },
    { id: "CAM-073", name: "卫生间入口", area: "1号厂房 · 生活区", x: 10, y: 22, status: "在线", people: 1, scene: "hall", note: "区域状态正常" },
    { id: "CAM-082", name: "包装发货区", area: "1号厂房 · 发货口", x: 78, y: 76, status: "离线", people: 0, scene: "loading", note: "设备连接中断" }
  ],
  alarmShots: [
    { type: "设备红灯响应超时", name: "陈志强", role: "操作员", location: "1号厂房 · 2号机台", time: "13:36:18", camera: "CAM-032", position: "0% center", confidence: "98.6%", boxLeft: 49 },
    { type: "长时间逗留", name: "王浩宇", role: "生产一部", location: "西侧公共通道", time: "13:38:42", camera: "CAM-018", position: "50% center", confidence: "96.4%", boxLeft: 46 },
    { type: "玩手机", name: "李建平", role: "配料员", location: "1号厂房 · 生产作业区", time: "13:40:07", camera: "CAM-051", position: "100% center", confidence: "97.9%", boxLeft: 74 },
    { type: "吸烟", name: "周明凯", role: "设备员", location: "1号厂房 · 东侧通道", time: "13:42:25", camera: "CAM-036", position: "0% center", confidence: "97.2%", boxLeft: 52 },
    { type: "周界入侵", name: "刘海峰", role: "品质部", location: "东侧周界", time: "13:44:11", camera: "CAM-067", position: "50% center", confidence: "95.8%", boxLeft: 48 },
    { type: "设备红灯响应超时", name: "赵文杰", role: "操作员", location: "1号厂房 · 5号机台", time: "13:46:39", camera: "CAM-055", position: "100% center", confidence: "98.1%", boxLeft: 72 }
  ],
  trajectory: [
    { time: "08:42:16", place: "南门入口", camera: "CAM-001", x: 18, y: 86 },
    { time: "09:03:28", place: "西侧通道", camera: "CAM-018", x: 17, y: 52 },
    { time: "09:26:45", place: "生产一线", camera: "CAM-032", x: 38, y: 61 },
    { time: "10:48:02", place: "原料暂存区", camera: "CAM-051", x: 72, y: 32 },
    { time: "11:12:37", place: "东侧安全通道", camera: "CAM-067", x: 78, y: 62 },
    { time: "11:38:19", place: "包装发货区", camera: "CAM-082", x: 82, y: 78 }
  ]
};
