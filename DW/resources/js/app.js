(function () {
  var data = window.PROTOTYPE_DATA;
  var page = document.body.getAttribute("data-page") || "dashboard";
  var qs = function (s, root) { return (root || document).querySelector(s); };
  var escapeHtml = function (value) { return String(value).replace(/[&<>"']/g, function (char) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]; }); };
  var carouselTimer;
  var carouselIndex = 0;
  var trajectoryAnimation;
  var trajectoryProgress = 0;
  var dashboardMapState = { mode: "building", floor: 1 };
  var today = new Date();
  var todayValue = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  var trackingViewState = { mode: "building", floor: 1, active: false, personName: "", startDate: todayValue, endDate: todayValue };
  var trajectoryFloors = [1, 1, 2, 4, 4, 1];
  var trajectoryZones = [
    { type: "transit", label: "通行区", duration: 4, start: "08:42", end: "08:46", interval: "08:42–08:46" },
    { type: "nonwork", label: "非工作区", duration: 18, start: "09:03", end: "09:21", interval: "09:03–09:21" },
    { type: "work", label: "工作区", duration: 74, start: "09:26", end: "10:40", interval: "09:26–10:40" },
    { type: "work", label: "工作区", duration: 19, start: "10:48", end: "11:07", interval: "10:48–11:07" },
    { type: "nonwork", label: "非工作区", duration: 21, start: "11:12", end: "11:33", interval: "11:12–11:33" },
    { type: "work", label: "工作区", duration: 36, effectiveDuration: 22, excludedDuration: 14, start: "11:38", end: "12:14", interval: "11:38–12:14", excluded: "12:00–12:14 午休不计" }
  ];

  function header(title) {
    var user = sessionStorage.getItem("dweUser") || "admin";
    return '<header class="topbar"><div class="brand"><span>◇</span><div><b>DWE DIGITAL</b><small>典威电子·智能制造中心</small></div></div><h1>' +
      title + '</h1><div class="clock">' + ((page === "dashboard" || page === "tracking") ? '<a class="admin-entry" href="管理后台-运营中心.html"><span>⚙</span> 管理后台</a>' : '') + '<div class="app-user"><i>' + escapeHtml(user.charAt(0).toUpperCase()) + '</i><span><b>' + escapeHtml(user) + '</b><small>平台管理员</small></span></div><button class="app-logout" id="app-logout">⇥ 退出登录</button></div></header>';
  }
  function nav(active) {
    var items = [
      ["dashboard", "首页-AI行为分析数据看板.html", "▦", "园区态势"],
      ["tracking", "轨迹追踪-人员轨迹.html", "◎", "轨迹追踪"]
    ];
    return '<nav class="nav">' + items.map(function (i) {
      return '<a class="' + (active === i[0] ? "active" : "") + '" href="' + i[1] + '"><span>' + i[2] + '</span>' + i[3] + '</a>';
    }).join("") + '</nav>';
  }
  function panel(title, content, cls) {
    return '<section class="panel ' + (cls || "") + '"><div class="panel-title"><i></i><b>' + title + '</b></div>' + content + '</section>';
  }
  function alarmCarouselHtml() {
    var groups = [];
    for (var start = 0; start < data.alarmShots.length; start += 3) {
      var cards = data.alarmShots.slice(start, start + 3).map(function (shot, cardIndex) {
        return '<button class="alarm-card" data-alarm-shot="' + (start + cardIndex) + '" aria-label="放大查看' + shot.type + '抓拍"><div class="alarm-shot" style="background-position:' + shot.position + '"><div class="shot-scan"></div><div class="recognition-box" style="left:' + shot.boxLeft + '%"><span>' + shot.confidence + '</span></div><div class="shot-rec"><b>●</b><span>' + shot.time + '</span></div><div class="shot-zoom">⌕ 点击放大</div></div><div class="alarm-card-info"><b>' + shot.type + '</b><span>' + shot.name + '</span></div></button>';
      }).join("");
      groups.push('<div class="alarm-group ' + (start === 0 ? "active" : "") + '" data-carousel-slide="' + (start / 3) + '">' + cards + '</div>');
    }
    var dots = groups.map(function (_, index) { return '<button class="' + (index === 0 ? "active" : "") + '" data-carousel-dot="' + index + '" aria-label="查看第' + (index + 1) + '组告警抓拍"></button>'; }).join("");
    return '<section class="alarm-carousel todo-carousel"><header><span><i></i> AI 告警抓拍</span><em>每组 3 张</em></header><div class="alarm-groups">' + groups.join("") + '</div><footer>' + dots + '</footer></section>';
  }
  function floorName(floor) {
    return ["", "一层", "二层", "三层", "四层", "五层", "六层", "七层", "八层", "九层", "十层"][floor] || floor + "层";
  }
  function floorMeta(floor) {
    var floors = {
      1: { zone: "生产作业与物流", devices: 8, online: 6, alarm: 1, offline: 1, alarmTypes: [{ key: "device", short: "红灯超时", name: "设备红灯响应超时", count: 1 }] },
      2: { zone: "精密加工区", devices: 20, online: 16, alarm: 2, offline: 2, alarmTypes: [{ key: "device", short: "红灯超时", name: "设备红灯响应超时", count: 1 }, { key: "loiter", short: "长时逗留", name: "长时间逗留", count: 1 }] },
      3: { zone: "自动化生产区", devices: 16, online: 14, alarm: 1, offline: 1, alarmTypes: [{ key: "phone", short: "玩手机", name: "玩手机", count: 1 }] },
      4: { zone: "装配作业区", devices: 15, online: 13, alarm: 1, offline: 1, alarmTypes: [{ key: "device", short: "红灯超时", name: "设备红灯响应超时", count: 1 }] },
      5: { zone: "质量检测区", devices: 14, online: 12, alarm: 1, offline: 1, alarmTypes: [{ key: "smoking", short: "吸烟", name: "吸烟", count: 1 }] },
      6: { zone: "仓储周转区", devices: 12, online: 11, alarm: 0, offline: 1, alarmTypes: [] },
      7: { zone: "研发试制区", devices: 13, online: 11, alarm: 1, offline: 1, alarmTypes: [{ key: "perimeter", short: "周界入侵", name: "周界入侵", count: 1 }] },
      8: { zone: "行政办公区", devices: 11, online: 11, alarm: 0, offline: 0, alarmTypes: [] },
      9: { zone: "会议培训区", devices: 10, online: 9, alarm: 0, offline: 1, alarmTypes: [] },
      10: { zone: "设备机房区", devices: 9, online: 9, alarm: 0, offline: 0, alarmTypes: [] }
    };
    var meta = floors[floor] || floors[1];
    meta.name = floorName(floor);
    return meta;
  }
  function floorAlarmBadgesHtml(meta) {
    if (!meta.alarmTypes || !meta.alarmTypes.length) return '<i class="floor-device-total">' + meta.devices + ' 台</i>';
    return '<div class="floor-alarm-types">' + meta.alarmTypes.map(function (alarm) {
      return '<span class="alarm-type-' + alarm.key + '" title="' + alarm.name + ' ' + alarm.count + ' 条"><b></b>' + alarm.short + '<em>' + alarm.count + '</em></span>';
    }).join("") + '</div>';
  }
  function floorAlarmDotsHtml(meta) {
    if (!meta.alarmTypes || !meta.alarmTypes.length) return "";
    return '<em class="floor-alert-dots">' + meta.alarmTypes.map(function (alarm) {
      return '<i class="alarm-type-' + alarm.key + '" title="' + alarm.name + ' ' + alarm.count + ' 条"></i>';
    }).join("") + '</em>';
  }
  function cameraStripHtml(floor) {
    var positions = ["0% center", "50% center", "100% center"];
    var cards = data.cameras.map(function (camera, index) {
      var state = camera.status === "告警" ? "alarm" : camera.status === "离线" ? "offline" : "online";
      return '<button class="camera-tile ' + state + '" data-camera="' + camera.id + '" aria-label="查看' + camera.name + '视频信息"><div class="camera-thumb" style="background-position:' + positions[index % 3] + '"><span>● ' + (camera.status === "离线" ? "OFFLINE" : "LIVE") + '</span><i></i><em>▶</em></div><footer><span><b>' + camera.name + '</b><small>' + camera.id + '</small></span><i>' + camera.status + '</i></footer></button>';
    }).join("");
    var title = floor ? floorName(floor) + "摄像头快速预览" : "整栋重点摄像头预览";
    return '<section class="camera-strip"><header><span><i></i> ' + title + '</span><em>点击卡片查看视频信息</em></header><div class="camera-grid">' + cards + '</div></section>';
  }
  function factoryPlanHtml() {
    return '<div class="factory-plan-sim"><div class="plan-axis axis-x">A　B　C　D　E　F　G　H　J</div><div class="plan-axis axis-y">1<br>2<br>3<br>4<br>5<br>6</div><div class="plan-room room-life"><b>生活辅助区</b><span>男卫</span><span>女卫</span><span>楼梯间</span><span>更衣室</span></div><div class="plan-room room-production"><b>生产作业区</b><div class="machine-lines"><i></i><i></i><i></i><i></i><i></i></div><small>1号机组</small><small>2号机组</small><small>冲压区</small></div><div class="plan-room room-material"><b>原料暂存区</b><i></i><i></i><i></i><i></i></div><div class="plan-room room-pack"><b>包装发货区</b><span>检验</span><span>包装</span><span>装卸口</span></div><div class="main-passage">主 通 道</div><div class="north-mark">N<br>↑</div></div>';
  }
  function personRankingHtml() {
    var maxCount = data.personInspectionTop10[0].count;
    var rows = data.personInspectionTop10.map(function (person, index) {
      var rankClass = index < 3 ? " top" + (index + 1) : "";
      return '<a class="person-rank-row' + rankClass + '" href="轨迹追踪-人员轨迹.html?person=' + encodeURIComponent(person.name) + '" aria-label="追踪' + person.name + '的行动轨迹"><i>' + String(index + 1).padStart(2, "0") + '</i><div class="person-rank-info"><b>' + person.name + '</b><small>' + person.department + ' · ' + person.employeeId + '</small><em>' + person.type + '</em></div><strong>' + person.count + '<small>次</small></strong><span class="person-rank-bar"><i style="width:' + Math.round(person.count / maxCount * 100) + '%"></i></span></a>';
    }).join("");
    return '<div class="ranking-period"><span>近7日 · AI智能检查</span><em>按发现次数降序</em></div><div class="person-ranking-list">' + rows + '</div><div class="ranking-note">统计口径：AI检查事件发现次数</div>';
  }
  function floorSelectorHtml(activeFloor, compact) {
    var buttons = [];
    for (var floor = 10; floor >= 1; floor--) {
      var meta = floorMeta(floor);
      var state = meta.alarm ? " alarm" : meta.offline ? " offline" : " normal";
      buttons.push('<button class="' + state + (floor === activeFloor ? ' active' : '') + '" data-floor="' + floor + '" title="进入' + meta.name + meta.zone + '"><b>' + floor + 'F</b><span>' + meta.devices + '台</span>' + floorAlarmDotsHtml(meta) + '</button>');
    }
    return '<aside class="floor-selector' + (compact ? ' compact' : '') + '"><header><b>楼层导航</b><small>点击进入平面态势</small></header><div>' + buttons.join("") + '</div></aside>';
  }
  function buildingOverviewHtml() {
    var floors = [];
    for (var floor = 10; floor >= 1; floor--) {
      var meta = floorMeta(floor);
      var state = meta.alarm ? "alarm" : meta.offline ? "offline" : "normal";
      var alarmClass = meta.alarmTypes && meta.alarmTypes.length ? ' alarm-dominant-' + meta.alarmTypes[0].key : '';
      floors.push('<button class="bim-floor ' + state + alarmClass + '" data-floor="' + floor + '" aria-label="进入' + meta.name + meta.zone + '"><span class="floor-windows"></span><b>' + floor + 'F</b><em>' + meta.zone + '</em>' + floorAlarmBadgesHtml(meta) + '</button>');
    }
    return '<div class="map factory-cad-map building-overview-map"><div class="cad-toolbar building-toolbar"><span><i></i> BIM 建筑总览</span><b>1号厂房 · 整栋</b><em>10 层 · 128 台设备</em></div><div class="bim-scene"><div class="bim-ground"></div><div class="bim-building"><div class="bim-roof"><i></i><i></i><i></i></div><div class="bim-side"></div><div class="bim-facade">' + floors.join("") + '</div></div></div>' + floorSelectorHtml(0, false) + '<div class="building-alarm-legend"><b>告警类型</b><span class="alarm-type-device"><i></i>设备红灯响应超时</span><span class="alarm-type-loiter"><i></i>长时间逗留</span><span class="alarm-type-phone"><i></i>玩手机</span><span class="alarm-type-smoking"><i></i>吸烟</span><span class="alarm-type-perimeter"><i></i>周界入侵</span></div></div>';
  }
  function trackingFloorTabsHtml(activeFloor) {
    var trackedFloors = [1, 2, 4];
    return '<aside class="track-floor-tabs"><button data-track-building="true">整栋</button>' + trackedFloors.map(function (floor) {
      var nodeCount = trajectoryFloors.filter(function (value) { return value === floor; }).length;
      return '<button class="' + (floor === activeFloor ? 'active' : '') + '" data-track-floor="' + floor + '"><b>' + floor + 'F</b><span>' + nodeCount + '节点</span></button>';
    }).join("") + '</aside>';
  }
  function movingPersonMarkerHtml() {
    var markerName = trackingViewState.personName || "陈宇轩";
    return '<div class="moving-person-marker" id="moving-person-marker" aria-label="' + escapeHtml(markerName) + '当前轨迹位置"><i></i><span>' + escapeHtml(markerName) + '</span></div>';
  }
  function trackingBuildingMapHtml() {
    var usedFloors = { 1: 3, 2: 1, 4: 2 };
    var floors = [];
    for (var floor = 10; floor >= 1; floor--) {
      var count = usedFloors[floor] || 0;
      floors.push('<button class="bim-floor track-bim-floor' + (count ? ' route-hit' : '') + '"' + (count ? ' data-track-floor="' + floor + '"' : ' disabled') + ' aria-label="' + (count ? '查看' + floorName(floor) + '人员轨迹' : floorName(floor) + '无人员轨迹') + '"><span class="floor-windows"></span><b>' + floor + 'F</b><em>' + floorMeta(floor).zone + '</em><i>' + (count ? count + ' 节点' : '无轨迹') + '</i></button>');
    }
    var xs = [24, 35, 47, 60, 72, 82];
    var ys = [82, 80, 74, 61, 59, 83];
    var points = data.trajectory.map(function (point, index) {
      var zone = trajectoryZones[index];
      return '<button class="track-point building-track-point zone-' + zone.type + (zone.excluded ? ' has-excluded' : '') + '" style="left:' + xs[index] + '%;top:' + ys[index] + '%" data-index="' + index + '" data-step="' + index + '"><b>' + (index + 1) + '</b><span>开始 ' + zone.start + ' · 结束 ' + zone.end + '<br>' + trajectoryFloors[index] + 'F · ' + point.place + '<em>' + zone.label + ' · 计入 ' + (zone.effectiveDuration || zone.duration) + ' 分钟' + (zone.excluded ? '<small>' + zone.excluded + '</small>' : '') + '</em></span></button>';
    }).join("");
    return '<div class="map factory-cad-map tracking-map tracking-building-map"><div class="cad-toolbar building-toolbar"><span><i></i> 整栋人员轨迹</span><b>1号厂房 · 楼层间轨迹</b><em>涉及 1F / 2F / 4F</em></div><div class="bim-scene"><div class="bim-ground"></div><div class="bim-building"><div class="bim-roof"><i></i><i></i><i></i></div><div class="bim-side"></div><div class="bim-facade">' + floors.join("") + '</div></div></div><canvas id="trajectory-canvas" class="trajectory-canvas"></canvas>' + points + movingPersonMarkerHtml() + trackingFloorTabsHtml(0) + '<div class="cross-floor-legend"><span class="work"><i></i>工作区</span><span class="nonwork"><i></i>非工作区</span><span class="transit"><i></i>通行 / 跨层</span><small>人形标记表示当前追踪位置</small></div><div class="trajectory-status" id="trajectory-status"><i></i><span>请选择目标人员并点击“开始追踪”</span></div></div>';
  }
  function trackingFloorMapHtml(floor) {
    var meta = floorMeta(floor);
    var points = data.trajectory.map(function (point, index) {
      if (trajectoryFloors[index] !== floor) return "";
      var zone = trajectoryZones[index];
      return '<button class="track-point zone-' + zone.type + (zone.excluded ? ' has-excluded' : '') + '" style="left:' + point.x + '%;top:' + point.y + '%" data-index="' + index + '" data-step="' + index + '"><b>' + (index + 1) + '</b><span>开始 ' + zone.start + ' · 结束 ' + zone.end + '<br>' + point.place + '<em>' + zone.label + ' · 计入 ' + (zone.effectiveDuration || zone.duration) + ' 分钟' + (zone.excluded ? '<small>' + zone.excluded + '</small>' : '') + '</em></span></button>';
    }).join("");
    var nodeCount = trajectoryFloors.filter(function (value) { return value === floor; }).length;
    return '<div class="map factory-cad-map tracking-map tracking-floor-map"><div class="cad-toolbar floor-detail-toolbar"><button data-track-building="true">← 整栋轨迹</button><span class="map-crumb">轨迹追踪 / 1号厂房 / ' + meta.name + '</span><b>' + meta.zone + '</b><em>' + nodeCount + ' 个轨迹节点</em></div>' + factoryPlanHtml() + '<canvas id="trajectory-canvas" class="trajectory-canvas"></canvas>' + points + movingPersonMarkerHtml() + trackingFloorTabsHtml(floor) + '<div class="cross-floor-legend"><span class="work"><i></i>工作区</span><span class="nonwork"><i></i>非工作区</span><span class="transit"><i></i>通行区</span><small>人形标记表示当前位置</small></div><div class="trajectory-status" id="trajectory-status"><i class="complete"></i><span>' + meta.name + '层内轨迹 · ' + nodeCount + ' 个节点</span></div></div>';
  }
  function mapHtml(tracking) {
    var buildings = '<div class="building b1"><b>A栋生产楼</b><small>1#车间</small></div><div class="building b2"><b>B栋综合楼</b><small>行政办公</small></div><div class="building b3"><b>2#车间</b><small>冲压中心</small></div><div class="building b4"><b>3#车间</b><small>包装物流</small></div>';
    if (!tracking) {
      if (dashboardMapState.mode === "building") return buildingOverviewHtml();
      var selectedFloor = dashboardMapState.floor || 1;
      var selectedMeta = floorMeta(selectedFloor);
      var cameras = data.cameras.map(function (camera) {
        var state = camera.status === "告警" ? "alarm" : camera.status === "离线" ? "offline" : "online";
        return '<button class="camera-point ' + state + '" style="left:' + camera.x + '%;top:' + camera.y + '%" data-camera="' + camera.id + '" aria-label="查看' + camera.name + '摄像头"><i></i><span><b>' + camera.name + '</b><small>' + camera.id + ' · ' + camera.status + '</small></span></button>';
      }).join("");
      var floorPlan = factoryPlanHtml();
      return '<div class="map factory-cad-map floor-detail-map"><div class="cad-toolbar floor-detail-toolbar"><button data-building-overview="true">← 整栋建筑</button><span class="map-crumb">园区态势 / 1号厂房 / ' + selectedMeta.name + '</span><b>' + selectedMeta.zone + '</b><em>8 路摄像头 · 共 ' + selectedMeta.devices + ' 台设备</em></div>' + floorPlan + cameras + nonWorkZonePeopleHtml(selectedFloor) + floorSelectorHtml(selectedFloor, true) + '<div class="camera-legend"><span><i class="online"></i>在线 6</span><span><i class="alarm"></i>告警 1</span><span><i class="offline"></i>离线 1</span><small>点击摄像头或人员查看详情</small></div></div>';
    }
    return trackingViewState.mode === "floor" ? trackingFloorMapHtml(trackingViewState.floor) : trackingBuildingMapHtml();
  }
  function nonWorkZonePeopleHtml(floor) {
    var peopleByFloor = {
      1: [{ name: "李建平", minutes: 17, x: 12.5, y: 26 }, { name: "孙晓鹏", minutes: 9, x: 21, y: 35 }],
      2: [{ name: "王浩宇", minutes: 26, x: 13, y: 26 }, { name: "张继华", minutes: 12, x: 21, y: 35 }],
      3: [{ name: "赵文杰", minutes: 18, x: 13, y: 28 }],
      4: [{ name: "陈宇轩", minutes: 21, x: 12.5, y: 26 }, { name: "周晓倩", minutes: 16, x: 21, y: 35 }],
      5: [{ name: "吴佳敏", minutes: 14, x: 13, y: 28 }],
      6: [{ name: "孙晓鹏", minutes: 8, x: 13, y: 28 }],
      7: [{ name: "刘海峰", minutes: 19, x: 13, y: 28 }],
      8: [], 9: [], 10: []
    };
    var people = peopleByFloor[floor] || [];
    var markers = people.map(function (person) {
      return '<a class="zone-person-marker" style="left:' + person.x + '%;top:' + person.y + '%" href="轨迹追踪-人员轨迹.html?person=' + encodeURIComponent(person.name) + '" title="查看' + person.name + '完整轨迹"><span><b>' + person.name + '</b><small>已停留 ' + person.minutes + ' 分钟</small></span><i></i></a>';
    }).join("");
    return '<div class="nonwork-zone-highlight"><b>非工作区</b><span>' + (people.length ? '当前逗留 ' + people.length + ' 人' : '当前无人逗留') + '</span></div>' + markers;
  }
  function alarmRows(limit) {
    return data.alarms.slice(0, limit).map(function (a) {
      return '<button class="alarm-row" data-id="' + a.id + '"><span class="alarm-icon ' + a.level + '">△</span><div><b>' + a.type + '</b><small>◎ ' + a.location + '</small><em>' + a.time + ' · 推送人 ' + a.owner + '</em></div><strong class="status ' + a.status + '">' + a.status + '</strong><i>›</i></button>';
    }).join("");
  }
  function renderDashboard() {
    var d = data.devices;
    var onlineRate = (d.online / d.total * 100).toFixed(2);
    var offlineRate = (d.offline / d.total * 100).toFixed(2);
    var deviceRows = d.categories.map(function (item) {
      var rate = Math.round(item.online / item.total * 100);
      return '<div class="device-category-row"><span><b>' + item.name + '</b><small>在线率 ' + rate + '%</small></span><strong>' + item.total + '</strong><em>' + item.online + '</em><i>' + item.offline + '</i><div class="device-rate"><b style="width:' + rate + '%"></b></div></div>';
    }).join("");
    var device = '<div class="device-box"><div class="donut"><div><b>' + d.total + '</b><small>设备总数</small></div></div><div class="device-info"><span><i class="online"></i>在线设备<b>' + d.online + '</b><em>' + onlineRate + '%</em></span><span><i class="offline"></i>离线设备<b>' + d.offline + '</b><em>' + offlineRate + '%</em></span></div></div><div class="device-category-table"><header><span>设备类型</span><b>总数</b><em>在线</em><i>离线</i></header>' + deviceRows + '</div>';
    var maxEventValue = Math.max.apply(null, data.events.map(function (event) { return event.value; }));
    var eventRows = data.events.map(function (e) {
      return '<button><span>' + e.name + '</span><i><b style="width:' + (e.value / maxEventValue * 100) + '%;background:' + e.color + '"></b></i><strong>' + e.value + '</strong></button>';
    }).join("");
    var trendLegend = data.events.map(function (event) { return '<span><i style="background:' + event.color + '"></i>' + event.name + '</span>'; }).join("");
    var weeklyTrend = '<section class="weekly-trend"><header><b>近7日检查类型趋势</b><em>单位：次</em></header><div class="trend-legend">' + trendLegend + '</div><canvas id="weekly-trend-canvas" class="trend-canvas" aria-label="近7日设备红灯响应超时、长时间逗留、玩手机、吸烟和周界入侵折线趋势图"></canvas></section>';
    var events = '<div class="total"><span>今日告警</span><b>104</b><em>↑ 12.4%</em></div><div class="event-bars">' + eventRows + '</div>' + weeklyTrend;
    var actionRows = data.alarms.slice(0,4).map(function(a,i){ return '<button class="alarm-action-row" data-id="' + a.id + '"><i>0' + (i+1) + '</i><span><b>' + a.type + '</b><small>' + a.location + ' · ' + a.time + ' · ' + a.owner + '</small></span><em class="status ' + a.status + '">' + a.status + '</em><strong>' + (a.status === "已处理" ? "查看" : "去处理") + '</strong></button>'; }).join("");
    var alarmCenter = '<div class="todo-summary"><span><b>7</b>待处理</span><span><b>3</b>处理中</span><span><b>94.2%</b>今日闭环率</span></div><div class="alarm-action-list">' + actionRows + '</div>' + alarmCarouselHtml();
    qs("#page-content").innerHTML = '<main class="dashboard"><aside>' + panel("设备分类统计", device, "device-panel") + panel("AI智能检查事件", events) + '</aside><section class="center">' + mapHtml(false) + cameraStripHtml(dashboardMapState.mode === "floor" ? dashboardMapState.floor : null) + '</section><aside class="dashboard-right">' + panel("告警处置", alarmCenter, "alarm-center-panel") + panel("人员发现次数 TOP10", personRankingHtml(), "person-ranking-panel") + '</aside></main>';
    startAlarmCarousel();
    drawWeeklyTrend();
  }
  function drawWeeklyTrend() {
    var canvas = qs("#weekly-trend-canvas"); if (!canvas) return;
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    if (!width || !height) return;
    var ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    var pad = { left: 6, right: 7, top: 5, bottom: 15 };
    var plotWidth = width - pad.left - pad.right;
    var plotHeight = height - pad.top - pad.bottom;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(47, 128, 167, .22)";
    [0, .33, .66, 1].forEach(function (part) {
      var y = pad.top + plotHeight * part;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke();
    });
    ctx.font = '6px monospace';
    ctx.textAlign = "center";
    ctx.fillStyle = "#416b82";
    data.weeklyEvents.forEach(function (day, index) {
      var x = pad.left + plotWidth * index / (data.weeklyEvents.length - 1);
      ctx.fillText(day.date, x, height - 3);
    });
    data.events.forEach(function (event, eventIndex) {
      ctx.strokeStyle = event.color;
      ctx.fillStyle = event.color;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = event.color;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      data.weeklyEvents.forEach(function (day, index) {
        var x = pad.left + plotWidth * index / (data.weeklyEvents.length - 1);
        var y = pad.top + plotHeight * (1 - day.values[eventIndex] / 40);
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      data.weeklyEvents.forEach(function (day, index) {
        var x = pad.left + plotWidth * index / (data.weeklyEvents.length - 1);
        var y = pad.top + plotHeight * (1 - day.values[eventIndex] / 40);
        ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
      });
      ctx.shadowBlur = 0;
    });
  }
  function drawTrajectory(progress) {
    var canvas = qs("#trajectory-canvas");
    var map = qs(".tracking-map");
    if (!canvas || !map) return;
    var width = map.clientWidth;
    var height = map.clientHeight;
    var ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    var pointEls = Array.prototype.slice.call(map.querySelectorAll(".track-point"));
    var points = pointEls.map(function (element) {
      return { x: width * parseFloat(element.style.left) / 100, y: height * parseFloat(element.style.top) / 100, step: Number(element.getAttribute("data-step")) };
    });
    if (!points.length) return;
    var segments = [];
    var total = 0;
    for (var i = 1; i < points.length; i++) {
      var connected = points[i].step === points[i - 1].step + 1;
      var length = connected ? Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y) : 0;
      segments.push(length); total += length;
    }
    var remaining = total * progress;
    var current = points[0];
    function strokePath(lineWidth, color, blur) {
      var distance = remaining;
      ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
      current = points[0];
      for (var index = 0; index < segments.length; index++) {
        if (!segments[index]) { ctx.moveTo(points[index + 1].x, points[index + 1].y); current = points[index + 1]; continue; }
        if (distance <= 0) break;
        var fraction = Math.min(1, distance / segments[index]);
        var target = points[index + 1];
        current = { x: points[index].x + (target.x - points[index].x) * fraction, y: points[index].y + (target.y - points[index].y) * fraction };
        ctx.lineTo(current.x, current.y);
        distance -= segments[index];
      }
      ctx.lineWidth = lineWidth; ctx.strokeStyle = color; ctx.shadowColor = "#36dfff"; ctx.shadowBlur = blur; ctx.stroke(); ctx.shadowBlur = 0;
    }
    if (progress > 0) {
      strokePath(8, "rgba(31,197,242,.18)", 16);
      var coloredDistance = remaining;
      for (var coloredIndex = 0; coloredIndex < segments.length; coloredIndex++) {
        if (!segments[coloredIndex] || coloredDistance <= 0) continue;
        var coloredFraction = Math.min(1, coloredDistance / segments[coloredIndex]);
        var coloredTarget = points[coloredIndex + 1];
        var coloredEnd = {
          x: points[coloredIndex].x + (coloredTarget.x - points[coloredIndex].x) * coloredFraction,
          y: points[coloredIndex].y + (coloredTarget.y - points[coloredIndex].y) * coloredFraction
        };
        var zoneType = trajectoryZones[coloredTarget.step].type;
        var zoneColor = zoneType === "nonwork" ? "#ff645a" : zoneType === "work" ? "#35d8b1" : "#ffbd58";
        ctx.beginPath(); ctx.moveTo(points[coloredIndex].x, points[coloredIndex].y); ctx.lineTo(coloredEnd.x, coloredEnd.y);
        ctx.lineWidth = 2.6; ctx.strokeStyle = zoneColor; ctx.shadowColor = zoneColor; ctx.shadowBlur = 9; ctx.stroke(); ctx.shadowBlur = 0;
        coloredDistance -= segments[coloredIndex];
      }
      ctx.beginPath(); ctx.arc(current.x, current.y, 5, 0, Math.PI * 2); ctx.fillStyle = "#ecfdff"; ctx.shadowColor = "#42e8ff"; ctx.shadowBlur = 14; ctx.fill(); ctx.shadowBlur = 0;
    }
    var personMarker = qs("#moving-person-marker", map);
    if (personMarker) {
      personMarker.classList.toggle("visible", progress > 0);
      if (progress > 0) {
        personMarker.style.left = current.x + "px";
        personMarker.style.top = current.y + "px";
        var markerStep = Math.min(data.trajectory.length - 1, Math.floor(progress * data.trajectory.length));
        personMarker.setAttribute("class", "moving-person-marker visible marker-" + trajectoryZones[markerStep].type);
      }
    }
    pointEls.forEach(function (element, index) {
      var step = Number(element.getAttribute("data-step"));
      var reached = progress >= step / (data.trajectory.length - 1);
      element.classList.toggle("reached", reached);
      element.classList.toggle("current", reached && (step === data.trajectory.length - 1 || progress < (step + 1) / (data.trajectory.length - 1)));
    });
    var timelineEls = document.querySelectorAll(".timeline-item");
    timelineEls.forEach(function (element, index) { element.classList.toggle("reached", progress >= index / (data.trajectory.length - 1)); });
    var currentStep = Math.min(data.trajectory.length - 1, Math.floor(progress * data.trajectory.length));
    document.querySelectorAll(".track-bim-floor").forEach(function (element) {
      var floor = Number(element.getAttribute("data-track-floor"));
      var visited = trajectoryFloors.some(function (value, index) { return value === floor && progress >= index / (data.trajectory.length - 1); });
      element.classList.toggle("visited", visited);
      element.classList.toggle("current", progress > 0 && trajectoryFloors[currentStep] === floor);
    });
  }
  function startTrajectoryAnimation(name) {
    cancelAnimationFrame(trajectoryAnimation);
    trajectoryProgress = 0;
    trackingViewState.active = true;
    trackingViewState.personName = name;
    var map = qs(".tracking-map");
    var status = qs("#trajectory-status");
    if (!map) return;
    map.classList.add("tracking-started");
    drawTrajectory(0);
    if (status) status.innerHTML = '<i></i><span>正在关联摄像头并生成 ' + name + ' 的行动路径…</span>';
    var startTime;
    var duration = 5200;
    function animate(time) {
      if (!startTime) startTime = time;
      var raw = Math.min(1, (time - startTime) / duration);
      trajectoryProgress = 1 - Math.pow(1 - raw, 2);
      drawTrajectory(trajectoryProgress);
      if (raw < 1) trajectoryAnimation = requestAnimationFrame(animate);
      else if (status) status.innerHTML = '<i class="complete"></i><span>轨迹收敛完成 · 涉及 3 个楼层 · 6 个节点 · 3 次跨层</span>';
    }
    trajectoryAnimation = requestAnimationFrame(animate);
  }
  function setAlarmSlide(index) {
    var slides = document.querySelectorAll("[data-carousel-slide]");
    var dots = document.querySelectorAll("[data-carousel-dot]");
    if (!slides.length) return;
    carouselIndex = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) { slide.classList.toggle("active", i === carouselIndex); });
    dots.forEach(function (dot, i) { dot.classList.toggle("active", i === carouselIndex); });
  }
  function startAlarmCarousel() {
    clearInterval(carouselTimer);
    carouselTimer = setInterval(function () { setAlarmSlide(carouselIndex + 1); }, 4200);
  }
  function getPersonProfile(name) {
    var matched = data.personInspectionTop10.filter(function (person) { return person.name === name; })[0];
    return matched || { name: name || "陈宇轩", department: "生产一部", employeeId: "EMP-0371", type: "常规行为检查", count: 6 };
  }
  function personAnalysisHtml(person) {
    var count = person.count || 0;
    var risk = "较高";
    var riskClass = "high";
    var confidence = Math.min(99.2, 94.8 + count * .13).toFixed(1);
    var areas = ["生产作业区、冲压区", "西侧通道、原料暂存区", "加料区、包装发货区", "生活辅助区、主通道"];
    var personIndex = Math.max(0, data.personInspectionTop10.indexOf(person));
    var safeName = escapeHtml(person.name);
    var periods = ["06–08", "08–10", "10–12", "12–14", "14–16", "16–18"];
    var weights = [1, 5, 8, 4, 3, 2];
    var weightTotal = weights.reduce(function (sum, weight) { return sum + weight; }, 0);
    var timeCounts = weights.map(function (weight) { return Math.floor(count * weight / weightTotal); });
    var assigned = timeCounts.reduce(function (sum, value) { return sum + value; }, 0);
    for (var extra = 0; extra < count - assigned; extra++) timeCounts[(extra + personIndex) % timeCounts.length]++;
    var peakCount = Math.max.apply(null, timeCounts);
    var peakIndex = timeCounts.indexOf(peakCount);
    var timeBars = timeCounts.map(function (value, index) { return '<span class="' + (index === peakIndex ? "peak" : "") + '"><b>' + value + '</b><i style="height:' + Math.max(8, Math.round(value / peakCount * 100)) + '%"></i><small>' + periods[index] + '</small></span>'; }).join("");
    var timeCard = '<section class="activity-time-card"><header><div><b>活动时间分布</b><small>近7日 · 每2小时发现次数</small></div><em>峰值 ' + periods[peakIndex] + '时</em></header><div class="activity-time-chart">' + timeBars + '</div><footer><i></i> 活动峰值时段　<span>共发现 ' + count + ' 次</span></footer></section>';
    var nonworkItems = trajectoryZones.map(function (zone, index) {
      if (zone.type !== "nonwork") return "";
      return '<div><i>' + (index + 1) + '</i><span><b>' + zone.interval + ' · ' + data.trajectory[index].place + '</b><small>' + trajectoryFloors[index] + 'F · ' + data.trajectory[index].camera + '</small></span><strong>' + zone.duration + '<small>分钟</small></strong></div>';
    }).join("");
    var nonworkCard = '<section class="nonwork-summary"><header><div><b>非工作区停留统计</b><small>按排班有效工作时段统计 · AI 轨迹研判</small></div><em>需视频复核</em></header><div class="nonwork-kpis"><span><small>非工作区累计</small><b>39<em>分钟</em></b></span><span><small>有效时段占比</small><b>24.7<em>%</em></b></span><span><small>异常停留</small><b>2<em>段</em></b></span><span class="excluded"><small>休息时段剔除</small><b>14<em>分钟</em></b></span></div><div class="nonwork-list">' + nonworkItems + '</div><footer>判定口径：仅统计排班在岗时段；午休、下班后、请假及批准离岗时间自动剔除，不计入非工作区停留。</footer></section>';
    var deviceResponseCard = '<section class="device-response-summary"><header><div><b>在岗设备红灯响应统计</b><small>本人上班时段 · 08:30–17:30</small></div><em>3 次未处理</em></header><div class="device-response-kpis"><span><small>红灯事件</small><b>5<em>次</em></b></span><span class="danger"><small>超时未处理</small><b>3<em>次</em></b></span><span><small>累计超时</small><b>19<em>分钟</em></b></span></div><div class="device-response-list"><div><time>09:42</time><span><b>2号机台红灯</b><small>2F · DEV-PRD-012</small></span><strong>超时 6 分钟</strong></div><div><time>10:16</time><span><b>4号机台红灯</b><small>4F · DEV-PRD-027</small></span><strong>超时 9 分钟</strong></div><div><time>11:05</time><span><b>1号机台红灯</b><small>4F · DEV-PRD-021</small></span><strong>超时 4 分钟</strong></div></div><footer>统计口径：本人在岗且进入责任设备响应范围后，超过规定响应时限仍未处置的事件。</footer></section>';
    var overviewCard = '<section class="track-analysis-overview"><header><b>轨迹与 AI 研判概览</b><em>实时研判</em></header><div class="track-facts"><span><small>轨迹时间范围</small><b>08:42–12:14</b></span><span><small>有效在岗时长</small><b>158 分钟</b></span><span><small>非工作停留</small><b>39 分钟 / 2 段</b></span><span><small>红灯超时未处理</small><b class="fact-danger">3 次</b></span></div><div class="ai-risk"><span class="' + riskClass + '"><small>行为风险</small><b>' + risk + '</b></span><span><small>近7日发现</small><b>' + count + ' 次</b></span><span><small>主要类型</small><b>' + escapeHtml(person.type) + '</b></span></div><dl><div><dt>高频活动区域</dt><dd>' + areas[personIndex % areas.length] + '</dd></div><div><dt>非工作停留</dt><dd>西侧通道 18 分钟；东侧安全通道 21 分钟</dd></div><div><dt>统计剔除</dt><dd>12:00–12:14 午休 14 分钟，不计入研判</dd></div></dl><article><b>综合研判</b>' + safeName + '在有效在岗时段内，非工作区累计停留 39 分钟，占有效轨迹时长 24.7%；已自动剔除午休 14 分钟，建议结合排班与视频复核。</article></section>';
    return '<div class="person-card"><div class="avatar">' + safeName.charAt(0) + '</div><span><b id="person-name">' + safeName + '</b><small>' + escapeHtml(person.department) + ' · ' + escapeHtml(person.employeeId) + '</small></span><em>' + confidence + '%</em></div>' + overviewCard + nonworkCard + deviceResponseCard + timeCard;
  }
  function renderTracking() {
    var requestedName = new URLSearchParams(window.location.search).get("person");
    var person = getPersonProfile(trackingViewState.personName || requestedName || "陈宇轩");
    trackingViewState.personName = person.name;
    var trail = data.trajectory.map(function(p,i){ var zone = trajectoryZones[i]; return '<button class="timeline-item zone-' + zone.type + (zone.excluded ? ' has-excluded' : '') + '" data-index="' + i + '"><i>' + (i+1) + '</i><span><b>开始 ' + zone.start + ' · 结束 ' + zone.end + '</b><small>' + trajectoryFloors[i] + 'F · ' + p.place + '</small><em>' + zone.label + ' · 计入 ' + (zone.effectiveDuration || zone.duration) + '分钟' + (zone.excluded ? ' · 午休' + zone.excludedDuration + '分钟不计' : '') + '</em></span></button>'; }).join("");
    var info = '<div id="person-analysis-content">' + personAnalysisHtml(person) + '</div>';
    var heading = trackingViewState.mode === "building" ? "整栋楼时空轨迹" : floorName(trackingViewState.floor) + "层内轨迹";
    qs("#page-content").innerHTML = '<main class="tracking-page"><section class="searchbar"><label class="person-query">目标人员<input id="name-search" value="' + escapeHtml(person.name) + '" placeholder="输入姓名 / 工号"></label><label class="date-range-query">时间范围<span class="date-range-inputs"><input id="track-start-date" type="date" value="' + trackingViewState.startDate + '" max="' + trackingViewState.endDate + '" aria-label="开始日期"><i>至</i><input id="track-end-date" type="date" value="' + trackingViewState.endDate + '" min="' + trackingViewState.startDate + '" aria-label="结束日期"></span></label><button class="primary" id="start-search">开始追踪</button></section><div class="tracking-grid"><section class="track-main"><div class="section-heading">' + heading + '<small>BUILDING TRAJECTORY ANALYSIS</small></div>' + mapHtml(true) + '<div class="timeline-policy"><span><i></i>排班计入：08:30–12:00、13:30–17:30</span><em>自动剔除：午休 / 下班后 / 请假 / 批准离岗</em></div><div class="timeline">' + trail + '</div></section>' + panel("目标研判", info, "person-panel") + '</div></main>';
    if (trackingViewState.active) setTimeout(function () { var map = qs(".tracking-map"); if (map) map.classList.add("tracking-started"); drawTrajectory(trajectoryProgress); }, 20);
    else if (requestedName) setTimeout(function () { startTrajectoryAnimation(person.name); }, 260);
  }
  function renderAlarms() {
    var tools = '<div class="table-tools"><label>搜索<input id="alarm-search" placeholder="告警编号 / 类型 / 位置"></label><select id="status-filter"><option>全部状态</option><option>待处理</option><option>处理中</option><option>已处理</option></select><button id="export-btn">导出列表</button></div>';
    var table = tools + '<table><thead><tr><th>告警编号</th><th>告警类型</th><th>等级</th><th>位置</th><th>告警时间</th><th>推送人</th><th>处理情况</th><th>操作</th></tr></thead><tbody id="alarm-tbody"></tbody></table>';
    qs("#page-content").innerHTML = '<main class="alarms-page"><div class="alarm-kpis"><span><small>今日告警</small><b>104</b></span><span><small>待处理</small><b class="red-text">7</b></span><span><small>处理中</small><b class="amber-text">3</b></span><span><small>已闭环</small><b class="green-text">98</b></span></div>' + panel("告警列表", table, "alarm-table") + '</main>';
    renderAlarmTable();
  }
  function renderAlarmTable() {
    var tbody = qs("#alarm-tbody"); if (!tbody) return;
    var q = (qs("#alarm-search") ? qs("#alarm-search").value : "").trim();
    var status = qs("#status-filter") ? qs("#status-filter").value : "全部状态";
    tbody.innerHTML = data.alarms.filter(function(a){
      return (!q || Object.keys(a).some(function(k){ return String(a[k]).indexOf(q) >= 0; })) && (status === "全部状态" || a.status === status);
    }).map(function(a){
      return '<tr><td>' + a.id + '</td><td>' + a.type + '</td><td><span class="tag">' + a.level + '</span></td><td>' + a.location + '</td><td>2026-09-14 ' + a.time + '</td><td>' + a.owner + '</td><td><span class="status ' + a.status + '">' + a.status + '</span></td><td><button class="detail-link" data-id="' + a.id + '">查看详情</button></td></tr>';
    }).join("");
  }
  function showDetail(id) {
    var a = data.alarms.filter(function(x){ return x.id === id; })[0]; if (!a) return;
    var wrap = document.createElement("div"); wrap.className = "modal-wrap";
    wrap.innerHTML = '<section class="modal"><button class="close">×</button><header><span>告警详情</span><h2>' + a.type + '</h2><small>' + a.id + ' · ' + a.level + '告警</small></header><main><div class="video"><div class="machine"></div><div class="target">目标</div><button>▶</button><span>CAM-042 · ' + a.location + '</span></div><div class="detail"><h3>事件信息</h3><p><i>告警时间</i>2026-09-14 ' + a.time + '</p><p><i>推送人</i>' + a.owner + '</p><p><i>AI置信度</i>98.7%</p><h3>智能研判</h3><article>AI检测到异常行为，建议立即核查现场情况并完成闭环处理。</article></div></main><footer><button class="complete">确认并完成处理</button></footer></section>';
    document.body.appendChild(wrap);
    wrap.addEventListener("click", function(e){ if (e.target === wrap || e.target.classList.contains("close")) wrap.remove(); });
    qs(".complete", wrap).onclick = function(){ wrap.remove(); toast("告警已完成处理"); };
  }
  function showCamera(id) {
    var camera = data.cameras.filter(function (item) { return item.id === id; })[0]; if (!camera) return;
    var state = camera.status === "告警" ? "alarm" : camera.status === "离线" ? "offline" : "online";
    var wrap = document.createElement("div"); wrap.className = "modal-wrap camera-modal-wrap";
    wrap.innerHTML = '<section class="modal camera-modal"><button class="close">×</button><header><span>LIVE CAMERA / 实时监控</span><h2>' + camera.name + '</h2><small>' + camera.id + ' · ' + camera.area + '</small></header><main><div class="camera-feed scene-' + camera.scene + ' ' + state + '"><div class="feed-grid"></div><div class="feed-room"><i></i><i></i><i></i><i></i></div><div class="feed-person p1"></div><div class="feed-person p2"></div><div class="detect-box">PERSON 98%</div><div class="feed-status"><b>● REC</b><span>2026-09-14 <em id="feed-clock"></em></span></div>' + (camera.status === "离线" ? '<div class="signal-lost">SIGNAL LOST<small>正在尝试重新连接设备</small></div>' : '') + '</div><div class="detail camera-detail"><h3>设备信息</h3><p><i>设备编号</i>' + camera.id + '</p><p><i>运行状态</i><b class="camera-state ' + state + '">' + camera.status + '</b></p><p><i>当前人数</i>' + camera.people + ' 人</p><p><i>视频参数</i>1080P · 25FPS</p><h3>AI 实时研判</h3><article>' + camera.note + '。画面已接入行为识别、人员检测与区域入侵分析。</article></div></main><footer><span>最近巡检：2分钟前</span><button class="complete camera-switch">切换高清画面</button></footer></section>';
    document.body.appendChild(wrap);
    var tick = function () { var el = qs("#feed-clock", wrap); if (el) el.textContent = new Date().toLocaleTimeString("zh-CN", {hour12:false}); };
    tick(); var timer = setInterval(tick, 1000);
    wrap.addEventListener("click", function (e) { if (e.target === wrap || e.target.classList.contains("close")) { clearInterval(timer); wrap.remove(); } });
    qs(".camera-switch", wrap).onclick = function () { toast(camera.id + " 已切换为高清码流"); };
  }
  function showAlarmShot(index) {
    var shot = data.alarmShots[index]; if (!shot) return;
    var wrap = document.createElement("div"); wrap.className = "modal-wrap alarm-shot-modal-wrap";
    wrap.innerHTML = '<section class="modal alarm-shot-modal"><button class="close" aria-label="关闭">×</button><header><span>AI ALARM CAPTURE / 告警抓拍</span><h2>' + shot.type + '</h2><small>' + shot.camera + ' · ' + shot.location + '</small></header><main><div class="alarm-shot-large" style="background-position:' + shot.position + '"><div class="shot-scan"></div><div class="recognition-box" style="left:' + shot.boxLeft + '%"><span>' + shot.name + ' · ' + shot.confidence + '</span></div><div class="shot-rec"><b>● REC</b><span>2026-09-14　' + shot.time + '</span></div></div><div class="shot-meta"><span><small>识别人员</small><b>' + shot.name + '</b></span><span><small>所属岗位</small><b>' + shot.role + '</b></span><span><small>摄像头</small><b>' + shot.camera + '</b></span><span><small>AI置信度</small><b>' + shot.confidence + '</b></span></div></main></section>';
    document.body.appendChild(wrap);
    wrap.addEventListener("click", function (e) { if (e.target === wrap || e.target.classList.contains("close")) wrap.remove(); });
  }
  function toast(text) {
    var el = document.createElement("div"); el.className = "toast"; el.textContent = "✓  " + text; document.body.appendChild(el); setTimeout(function(){ el.remove(); }, 2200);
  }
  var title = page === "tracking" ? "人员轨迹追踪" : page === "alarms" ? "AI 告警管理中心" : "AI 行为分析数据看板";
  qs("#app").innerHTML = header(title) + nav(page) + '<div id="page-content"></div><footer class="app-footer">' + (page === "dashboard" ? "" : '数据来源：AI视频解析平台 / 智能门禁 / MES <span>数据延迟 0.8s · V2.6.4</span>') + '</footer>';
  if (page === "tracking") renderTracking(); else if (page === "alarms") renderAlarms(); else renderDashboard();
  document.addEventListener("click", function(e){
    if (e.target.closest("#app-logout")) { sessionStorage.removeItem("dweUser"); toast("已退出登录，正在返回登录页"); setTimeout(function () { window.location.href = "登录-AI行为分析运营平台.html"; }, 550); return; }
    var carouselDot = e.target.closest("[data-carousel-dot]"); if (carouselDot) { setAlarmSlide(Number(carouselDot.getAttribute("data-carousel-dot"))); startAlarmCarousel(); return; }
    var alarmShot = e.target.closest("[data-alarm-shot]"); if (alarmShot) { showAlarmShot(Number(alarmShot.getAttribute("data-alarm-shot"))); return; }
    var trackFloorButton = e.target.closest("[data-track-floor]"); if (trackFloorButton) { trackingViewState.mode = "floor"; trackingViewState.floor = Number(trackFloorButton.getAttribute("data-track-floor")) || 1; renderTracking(); toast("正在查看 " + floorName(trackingViewState.floor) + "层内轨迹"); return; }
    if (e.target.closest("[data-track-building]")) { trackingViewState.mode = "building"; renderTracking(); toast("已返回整栋楼层间轨迹"); return; }
    var floorButton = e.target.closest("[data-floor]"); if (floorButton) { dashboardMapState.floor = Number(floorButton.getAttribute("data-floor")) || 1; dashboardMapState.mode = "floor"; renderDashboard(); toast("已进入1号厂房 · " + floorName(dashboardMapState.floor)); return; }
    if (e.target.closest("[data-building-overview]")) { dashboardMapState.mode = "building"; renderDashboard(); toast("已返回1号厂房整栋态势"); return; }
    var cameraPoint = e.target.closest("[data-camera]"); if (cameraPoint) { showCamera(cameraPoint.getAttribute("data-camera")); return; }
    var target = e.target.closest("[data-id]"); if (target) showDetail(target.getAttribute("data-id"));
    if (e.target.closest("#start-search")) { var name = qs("#name-search").value || "陈宇轩"; var startDate = qs("#track-start-date"); var endDate = qs("#track-end-date"); if (startDate && endDate) { trackingViewState.startDate = startDate.value || todayValue; trackingViewState.endDate = endDate.value || todayValue; if (trackingViewState.startDate > trackingViewState.endDate) { toast("开始日期不能晚于结束日期"); return; } } var person = getPersonProfile(name); var analysisContent = qs("#person-analysis-content"); if (analysisContent) analysisContent.innerHTML = personAnalysisHtml(person); startTrajectoryAnimation(name); var dateText = trackingViewState.startDate === trackingViewState.endDate ? trackingViewState.startDate : trackingViewState.startDate + " 至 " + trackingViewState.endDate; toast("正在追踪 " + name + " · " + dateText); }
    if (e.target.closest("#export-btn")) toast("告警列表已生成");
    var point = e.target.closest(".track-point,.timeline-item"); if (point) { var pointIndex = Number(point.getAttribute("data-index")); var p = data.trajectory[pointIndex]; var zone = trajectoryZones[pointIndex]; toast(zone.start + "–" + zone.end + " · " + p.place + " · " + zone.label + "计入 " + (zone.effectiveDuration || zone.duration) + " 分钟" + (zone.excluded ? " · " + zone.excluded : "") + " · " + p.camera); }
  });
  document.addEventListener("change", function (e) {
    if (e.target.id === "track-start-date") {
      trackingViewState.startDate = e.target.value || todayValue;
      var endDate = qs("#track-end-date");
      if (endDate) { endDate.min = trackingViewState.startDate; if (endDate.value < trackingViewState.startDate) { endDate.value = trackingViewState.startDate; trackingViewState.endDate = trackingViewState.startDate; } }
    }
    if (e.target.id === "track-end-date") {
      trackingViewState.endDate = e.target.value || todayValue;
      var startDate = qs("#track-start-date");
      if (startDate) { startDate.max = trackingViewState.endDate; if (startDate.value > trackingViewState.endDate) { startDate.value = trackingViewState.endDate; trackingViewState.startDate = trackingViewState.endDate; } }
    }
  });
  if (qs("#alarm-search")) qs("#alarm-search").addEventListener("input", renderAlarmTable);
  if (qs("#status-filter")) qs("#status-filter").addEventListener("change", renderAlarmTable);
  window.addEventListener("resize", function () { if (page === "dashboard") drawWeeklyTrend(); if (page === "tracking") drawTrajectory(trajectoryProgress); });
})();
