/**
 * 战狼系统 - 主应用逻辑 v2.0
 * 选品→内容→拆解→投流全链路，8模块全部基于飞书真实数据渲染
 */
class ZhanLangApp {
  constructor() {
    this.config = CONFIG;
    this.feishu = new FeishuAPI(this.config.feishu);
    this.douyin = new DouyinAPI(this.config.douyin);
    this.currentTab = 'dashboard';
    this.data = {};
    this.init();
  }

  async init() {
    this.showLoading('系统初始化中...');
    try {
      this.loadCachedData();
      if (this.config.feishu.sync.autoSync) await this.syncFeishuData();
      this.render();
      this.bindEvents();
      if (this.config.feishu.sync.enabled) this.startAutoSync();
      this.hideLoading();
    } catch (error) {
      this.showError('系统初始化失败: ' + error.message);
      this.hideLoading();
    }
  }

  loadCachedData() {
    if (window.ZHANLANG_DATA) { this.data = window.ZHANLANG_DATA; return; }
    for (const t of Object.keys(this.config.feishu.tables)) {
      const cached = this.feishu.getLocalData(t);
      if (cached) this.data[t] = cached;
    }
  }

  async syncFeishuData() {
    this.showLoading('正在从飞书多维表格同步数据...');
    try {
      const response = await fetch('/api/sync/all');
      const result = await response.json();
      if (result.success) {
        const names = ['suggestions','content','videos','touliu','zhihui','hotwords','baokuan','jingpin','kefu'];
        let ok = 0;
        for (const t of names) {
          try {
            const tr = await (await fetch(`/api/data/${t}`)).json();
            if (tr.success && tr.data) { this.data[t] = tr.data; ok++; }
          } catch (e) { console.warn(t, e.message); }
        }
        localStorage.setItem('feishu_lastSync', new Date().toISOString());
        this.showToast(`数据同步完成: ${ok}个表已更新`);
      } else throw new Error(result.error || '同步失败');
    } catch (error) {
      if (window.ZHANLANG_DATA) { this.data = window.ZHANLANG_DATA; this.showToast('后端未启动，使用本地缓存数据','warning'); }
      else this.showToast('同步失败，请确保后端服务已启动','error');
    }
    this.hideLoading();
    this.render();
  }

  startAutoSync() { setInterval(() => this.syncFeishuData(), this.config.feishu.sync.interval); }

  render() { this.renderHeader(); this.renderSidebar(); this.renderContent(); this.renderFooter(); }

  renderHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    const lastSync = localStorage.getItem('feishu_lastSync');
    const syncTime = lastSync ? new Date(lastSync).toLocaleString('zh-CN') : '未同步';
    header.innerHTML = `
      <div class="header-left">
        <div class="logo"><span class="logo-icon">🐺</span><span class="logo-text">战狼系统</span></div>
        <div class="system-info">
          <span class="version">v${this.config.system.version}</span>
          <span class="sync-status"><span class="dot"></span>数据同步: ${syncTime}</span>
        </div>
      </div>
      <div class="header-right">
        <button class="btn btn-primary" id="syncBtn"><span>🔄</span> 同步数据</button>
        <button class="btn" id="settingsBtn"><span>⚙️</span> 设置</button>
      </div>`;
  }

  renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const menus = [
      {id:'dashboard',icon:'📊',name:'作战指挥室',desc:'全局数据总览'},
      {id:'xuanpin',icon:'🎯',name:'选品中心',desc:'爆款选品分析'},
      {id:'content',icon:'🎬',name:'内容素材',desc:'视频内容方向'},
      {id:'chaijie',icon:'🔍',name:'爆款拆解',desc:'视频拆解混剪'},
      {id:'touliu',icon:'💰',name:'投流测算',desc:'投放决策分析'},
      {id:'hotwords',icon:'🔥',name:'搜索热度',desc:'关键词趋势'},
      {id:'jingpin',icon:'👁️',name:'竞品监控',desc:'竞品动态追踪'},
      {id:'kefu',icon:'💬',name:'客服售后',desc:'话术知识库'}
    ];
    sidebar.innerHTML = menus.map(m => `
      <div class="menu-item ${this.currentTab===m.id?'active':''}" onclick="app.switchTab('${m.id}')">
        <span class="menu-icon">${m.icon}</span>
        <div class="menu-text"><span class="menu-name">${m.name}</span><span class="menu-desc">${m.desc}</span></div>
      </div>`).join('');
  }

  renderContent() {
    const c = document.getElementById('content');
    if (!c) return;
    const map = {dashboard:'renderDashboard',xuanpin:'renderXuanpin',content:'renderContentTab',chaijie:'renderChaijie',touliu:'renderTouliu',hotwords:'renderHotwords',jingpin:'renderJingpin',kefu:'renderKefu'};
    (this[map[this.currentTab]] || this.renderDashboard).call(this, c);
  }

  renderDashboard(container) {
    const s = this.getDashboardStats();
    container.innerHTML = `
      <div class="page-header"><h2>作战指挥室</h2><p>全链路数据实时监控</p></div>
      <div class="stats-grid">
        <div class="stat-card stat-primary"><div class="stat-icon">🎯</div><div class="stat-info"><div class="stat-value">${s.xuanpinTotal}</div><div class="stat-label">选品总数</div></div><div class="stat-trend up">+${s.xuanpinNew} 已勾选要做</div></div>
        <div class="stat-card stat-success"><div class="stat-icon">🎬</div><div class="stat-info"><div class="stat-value">${s.contentTotal}</div><div class="stat-label">内容素材</div></div><div class="stat-trend">${s.contentPending} 个待处理</div></div>
        <div class="stat-card stat-warning"><div class="stat-icon">🔍</div><div class="stat-info"><div class="stat-value">${s.chaijieTotal}</div><div class="stat-label">爆款拆解</div></div><div class="stat-trend">${s.chaijieAnalyzed} 个已分析</div></div>
        <div class="stat-card stat-danger"><div class="stat-icon">💰</div><div class="stat-info"><div class="stat-value">${s.touliuTotal}</div><div class="stat-label">投流测算</div></div><div class="stat-trend">ROI > ${this.config.touliu.roiThreshold} 加大投放</div></div>
      </div>
      <div class="charts-grid">
        <div class="chart-card"><h3>品类分布</h3><div id="categoryChart" style="height:300px;"></div></div>
        <div class="chart-card"><h3>全链路进度</h3><div id="pipelineChart" style="height:300px;"></div></div>
      </div>
      <div class="charts-grid">
        <div class="chart-card"><h3>搜索热度TOP5</h3><div id="hotwordsChart" style="height:300px;"></div></div>
        <div class="chart-card"><h3>最近爆款</h3><div class="hot-list">${this.getRecentHotList()}</div></div>
      </div>`;
    this.renderCharts();
  }

  getDashboardStats() {
    const recs = (t) => this.data[t]?.records || [];
    const count = (t) => recs(t).length;
    return {
      xuanpinTotal: count('suggestions') + count('baokuan'),
      xuanpinNew: recs('suggestions').filter(r => r['是否要做']===true||r['是否要做']==='是').length,
      contentTotal: count('content'),
      contentPending: recs('content').filter(r => !(r['出片状态']||'').includes('已') && !r['DS出片提示词']).length,
      chaijieTotal: count('videos'),
      chaijieAnalyzed: recs('videos').filter(r => r['混剪状态']==='已分析').length,
      touliuTotal: count('touliu')
    };
  }

  renderCharts() {
    const tc = '#A6A9B8';
    const recs = (t) => this.data[t]?.records || [];
    const cats = this.config.feishu.categories;
    const catData = cats.map(cat => {
      const n = recs('content').filter(r => {const c=r['关联品类']; return Array.isArray(c)?c.includes(cat):c===cat;}).length
        + recs('suggestions').filter(r => {const c=r['类目']||r['关联品类']; return Array.isArray(c)?c.includes(cat):c===cat;}).length;
      return {name:cat,value:n};
    }).filter(d=>d.value>0);
    echarts.init(document.getElementById('categoryChart')).setOption({
      tooltip:{trigger:'item',formatter:'{b}: {c}个 ({d}%)'},
      legend:{bottom:'2%',left:'center',textStyle:{color:tc,fontSize:11}},
      color:['#FF4D4F','#FAAD14','#1890FF','#722ED1','#13C2C2'],
      series:[{type:'pie',radius:['42%','68%'],center:['50%','45%'],itemStyle:{borderRadius:8,borderColor:'#161A2E',borderWidth:2},label:{show:false},emphasis:{label:{show:true,fontWeight:'bold',color:'#F0F2F5'}},data:catData.length?catData:cats.map(c=>({name:c,value:1}))}]
    });
    const s = this.getDashboardStats();
    echarts.init(document.getElementById('pipelineChart')).setOption({
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'}},
      grid:{left:'3%',right:'6%',bottom:'3%',top:'12%',containLabel:true},
      xAxis:{type:'category',data:['选品','内容','拆解','投流'],axisLabel:{color:tc},axisLine:{lineStyle:{color:'rgba(255,255,255,0.1)'}}},
      yAxis:{type:'value',axisLabel:{color:tc},splitLine:{lineStyle:{color:'rgba(255,255,255,0.05)'}}},
      series:[{type:'bar',barWidth:'48%',data:[s.xuanpinTotal,s.contentTotal,s.chaijieTotal,s.touliuTotal],itemStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#FF4D4F'},{offset:1,color:'#FAAD14'}]),borderRadius:[6,6,0,0]},label:{show:true,position:'top',color:'#F0F2F5',fontWeight:'bold'}}]
    });
    const hot = recs('hotwords').filter(r=>r['搜索热度']!=null).sort((a,b)=>(Number(b['搜索热度'])||0)-(Number(a['搜索热度'])||0)).slice(0,5);
    echarts.init(document.getElementById('hotwordsChart')).setOption({
      tooltip:{trigger:'axis'},
      grid:{left:'3%',right:'10%',bottom:'3%',top:'8%',containLabel:true},
      xAxis:{type:'value',axisLabel:{color:tc,fontSize:10},splitLine:{lineStyle:{color:'rgba(255,255,255,0.05)'}}},
      yAxis:{type:'category',data:hot.length?hot.map(r=>r['关键词']).reverse():['暂无数据'],axisLabel:{color:tc,fontSize:11}},
      series:[{type:'bar',data:hot.map(r=>Number(r['搜索热度'])||0).reverse(),barWidth:'55%',itemStyle:{color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#FAAD14'},{offset:1,color:'#FF7A45'}]),borderRadius:[0,6,6,0]},label:{show:true,position:'right',color:'#FFC53D',fontSize:11}}]
    });
  }

  getRecentHotList() {
    let items = this.data['baokuan']?.records || [];
    if (!items.length) return '<div class="empty-state">暂无爆款数据</div>';
    return [...items].sort((a,b)=>(Number(b['销量'])||0)-(Number(a['销量'])||0)).slice(0,5).map((item,i)=>{
      const name = item['爆品名称']||item['商品名称']||item['单品名称']||'未知';
      const sales = item['销量']||'-';
      const trend = item['热度趋势']||'';
      const icon = trend==='飙升'?'🚀':trend==='上升'?'📈':'';
      const pf = item['平台']||'';
      return `<div class="hot-item"><span class="hot-rank ${i<3?'top':''}">${i+1}</span><div class="hot-info"><span class="hot-title">${icon} ${name} ${pf?'· '+pf:''}</span><span class="hot-meta">销量: ${sales} ${trend?'· '+trend:''}</span></div></div>`;
    }).join('');
  }

  renderXuanpin(container) {
    container.innerHTML = `
      <div class="page-header"><h2>选品中心</h2><p>爆款选品分析与2-3倍定价筛选</p></div>
      <div class="filter-bar">
        <select class="filter-select" id="categoryFilter"><option value="">全部品类</option>${this.config.feishu.categories.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
        <label class="checkbox-label"><input type="checkbox" id="pricingFilter" checked> 仅显示符合2-3倍定价</label>
        <button class="btn btn-primary" onclick="app.refreshXuanpin()">刷新数据</button>
      </div>
      <div id="xuanpinList" class="data-list">${this.renderXuanpinList()}</div>`;
  }

  renderXuanpinList() {
    const items = this.data['suggestions']?.records || [];
    if (!items.length) return '<div class="empty-state">暂无选品数据，请先同步</div>';
    return items.slice(0,24).map((fields,i)=>{
      const name=fields['单品名称']||fields['商品名称']||'未知';
      const category=fields['关联品类']||fields['类目']||'未知';
      const price=fields['建议售价']||fields['价格']||'-';
      const cost=fields['1688采购价']||'-';
      const toDo=fields['是否要做']===true||fields['是否要做']==='是';
      const grade=fields['推荐等级']||'';
      const score=fields['综合评分']||fields['综合评分(自动)']||'';
      const pr=fields['预计利润率']||'';
      const hot=fields['搜索热度']||'';
      const trend=fields['销量趋势']||'';
      const season=fields['应季节点']||'';
      const gt=grade.includes('S')?'tag-red':grade.includes('A')?'tag-green':'tag-gray';
      const tt=trend==='飙升'?'tag-red':trend==='上升'?'tag-green':'tag-gray';
      return `<div class="data-card">
        <div class="card-header"><span class="card-title">${name}</span><span class="card-badge ${toDo?'active':''}">${toDo?'✓ 要做':'待选'}</span></div>
        <div class="card-body"><div class="card-meta">
          <div class="card-meta-row"><span class="card-meta-label">品类</span><span class="tag tag-blue">${category}</span></div>
          ${grade?`<div class="card-meta-row"><span class="card-meta-label">推荐等级</span><span class="tag ${gt}">${grade}</span></div>`:''}
          <div class="card-meta-row"><span class="card-meta-label">售价/采购</span><span class="card-meta-value">¥${price} / ¥${cost}</span></div>
          ${pr?`<div class="card-meta-row"><span class="card-meta-label">预计利润率</span><span class="card-meta-value" style="color:#73D13D;">${pr}</span></div>`:''}
          ${hot?`<div class="card-meta-row"><span class="card-meta-label">搜索热度</span><span class="card-meta-value" style="color:#FFC53D;">${hot}</span></div>`:''}
          ${trend?`<div class="card-meta-row"><span class="card-meta-label">销量趋势</span><span class="tag ${tt}">${trend}</span></div>`:''}
          ${season?`<div class="card-meta-row"><span class="card-meta-label">应季节点</span><span class="card-meta-value" style="font-size:12px;">${season}</span></div>`:''}
          ${score?`<div class="card-meta-row"><span class="card-meta-label">综合评分</span><span class="card-meta-value">${score}</span></div>`:''}
        </div></div>
        <div class="card-actions"><button class="btn btn-sm" onclick="app.viewDetail('xuanpin',${i})">查看详情</button><button class="btn btn-sm btn-primary" onclick="app.pushToContent(${i})">推送到内容</button></div>
      </div>`;
    }).join('');
  }

  switchTab(tabId){ this.currentTab=tabId; this.renderSidebar(); this.renderContent(); }
  bindEvents(){ document.getElementById('syncBtn')?.addEventListener('click',()=>{this.syncFeishuData();this.render();}); }
  showLoading(m){const l=document.getElementById('loading');if(l){l.querySelector('.loading-text').textContent=m;l.style.display='flex';}}
  hideLoading(){const l=document.getElementById('loading');if(l)l.style.display='none';}
  showToast(message,type='success'){const t=document.createElement('div');t.className=`toast toast-${type}`;t.textContent=message;document.body.appendChild(t);setTimeout(()=>t.remove(),3000);}
  showError(m){this.showToast(m,'error');}

  // 通用表格页生成器
  _tablePage(container,cfg){
    const records=this.data[cfg.key]?.records||[];
    const cards=cfg.cards(records);
    container.innerHTML=`<div class="page-header"><h2>${cfg.title}</h2><p>${cfg.sub(records)}</p></div><div class="stats-grid" style="grid-template-columns:repeat(${cfg.cols||3},1fr);">${cards}</div><div class="data-table-wrap"><table class="data-table"><thead><tr>${cfg.heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${cfg.rows(records)}</tbody></table></div>`;
  }

  renderContentTab(c){this._tablePage(c,{key:'content',cols:3,title:'内容素材',sub:r=>`视频内容方向与DS出片提示词（共${r.length}个品）`,heads:['单品名称','品类','出片状态','BGM风格','DS出片提示词'],cards:r=>`<div class="stat-card stat-primary"><div class="stat-icon">🎬</div><div class="stat-info"><div class="stat-value">${r.length}</div><div class="stat-label">素材品总数</div></div></div><div class="stat-card stat-success"><div class="stat-icon">✅</div><div class="stat-info"><div class="stat-value">${r.filter(x=>(x['出片状态']||'').includes('已')).length}</div><div class="stat-label">已出片</div></div></div><div class="stat-card stat-warning"><div class="stat-icon">⏳</div><div class="stat-info"><div class="stat-value">${r.filter(x=>!(x['出片状态']||'').includes('已')).length}</div><div class="stat-label">待出片</div></div></div>`,rows:r=>r.slice(0,30).map(x=>{const st=x['出片状态']||'待出片';return `<tr><td><strong>${x['单品名称']||'-'}</strong></td><td><span class="tag tag-blue">${x['关联品类']||'-'}</span></td><td><span class="tag ${st.includes('已')?'tag-green':'tag-orange'}">${st}</span></td><td>${x['BGM风格']||'-'}</td><td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${(x['DS出片提示词']||'').replace(/"/g,'')}">${x['DS出片提示词']?x['DS出片提示词'].substring(0,40)+'...':'-'}</td></tr>`;}).join('')||'<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">暂无数据</td></tr>'});}

  renderChaijie(c){const records=this.data['videos']?.records||[];const an=records.filter(r=>r['混剪状态']==='已分析').length;this._tablePage(c,{key:'videos',cols:3,title:'爆款拆解',sub:()=>`视频拆解分析与混剪执行卡（共${records.length}条）`,heads:['视频标题','关联单品','混剪状态','平台','视频链接'],cards:()=>`<div class="stat-card stat-primary"><div class="stat-icon">🔍</div><div class="stat-info"><div class="stat-value">${records.length}</div><div class="stat-label">拆解视频总数</div></div></div><div class="stat-card stat-success"><div class="stat-icon">✅</div><div class="stat-info"><div class="stat-value">${an}</div><div class="stat-label">已分析</div></div></div><div class="stat-card stat-warning"><div class="stat-icon">⏳</div><div class="stat-info"><div class="stat-value">${records.length-an}</div><div class="stat-label">待分析</div></div></div>`,rows:()=>records.slice(0,30).map(x=>{const st=x['混剪状态']||'待分析';const lk=x['视频链接']?`<a href="${x['视频链接']}" target="_blank" style="color:#40A9FF;">查看视频</a>`:'-';return `<tr><td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${x['视频标题']||''}">${x['视频标题']?x['视频标题'].substring(0,28):'-'}</td><td><strong>${x['关联单品']||'-'}</strong></td><td><span class="tag ${st==='已分析'?'tag-green':'tag-orange'}">${st}</span></td><td>${x['视频平台']||'抖音'}</td><td>${lk}</td></tr>`;}).join('')});}

  renderTouliu(c){const records=this.data['touliu']?.records||[];this._tablePage(c,{key:'touliu',cols:3,title:'投流测算',sub:()=>`投放决策与ROI分析（共${records.length}个品）`,heads:['单品名称','品类','总成本','目标ROI','出价建议','状态'],cards:()=>`<div class="stat-card stat-danger"><div class="stat-icon">💰</div><div class="stat-info"><div class="stat-value">${records.length}</div><div class="stat-label">投流品总数</div></div></div><div class="stat-card stat-info"><div class="stat-icon">🎯</div><div class="stat-info"><div class="stat-value">${records.filter(r=>r['目标ROI']).length}</div><div class="stat-label">已设目标ROI</div></div></div><div class="stat-card stat-success"><div class="stat-icon">📈</div><div class="stat-info"><div class="stat-value">${records.filter(r=>(r['出片状态']||r['投流状态']||'').includes('测试')||(r['出片状态']||'').includes('放量')).length}</div><div class="stat-label">测试/放量中</div></div></div>`,rows:()=>records.slice(0,30).map(x=>`<tr><td><strong>${x['单品名称']||'-'}</strong></td><td><span class="tag tag-purple">${x['关联品类']||'-'}</span></td><td>${x['总成本']||'-'}</td><td><span class="tag tag-cyan">ROI ${x['目标ROI']||'-'}</span></td><td>${x['出价建议']||'-'}</td><td>${x['出片状态']||x['投流状态']||'-'}</td></tr>`).join('')});}

  renderHotwords(c){const all=this.data['hotwords']?.records||[];const r24=all.filter(r=>r['时间维度']==='24h实时');const show=(r24.length?r24:all).slice(0,50);const tt=t=>t==='飙升'?'tag-red':t==='上升'?'tag-green':t==='下降'?'tag-gray':'tag-blue';this._tablePage(c,{key:'hotwords',cols:4,title:'搜索热度',sub:()=>`关键词趋势（24h实时 ${r24.length}条 / 全量${all.length}条）`,heads:['关键词','趋势','搜索热度','品类','平台','应季节点'],cards:()=>`<div class="stat-card stat-primary"><div class="stat-icon">🔥</div><div class="stat-info"><div class="stat-value">${all.length}</div><div class="stat-label">关键词总数</div></div></div><div class="stat-card stat-danger"><div class="stat-icon">🚀</div><div class="stat-info"><div class="stat-value">${all.filter(r=>r['热度趋势']==='飙升').length}</div><div class="stat-label">飙升词</div></div></div><div class="stat-card stat-success"><div class="stat-icon">📈</div><div class="stat-info"><div class="stat-value">${all.filter(r=>r['热度趋势']==='上升').length}</div><div class="stat-label">上升词</div></div></div><div class="stat-card stat-info"><div class="stat-icon">⏰</div><div class="stat-info"><div class="stat-value">24h</div><div class="stat-label">实时维度</div></div></div>`,rows:()=>show.map(x=>`<tr><td><strong>${x['关键词']||'-'}</strong></td><td><span class="tag ${tt(x['热度趋势'])}">${x['热度趋势']||'稳定'}</span></td><td style="font-variant-numeric:tabular-nums;font-weight:600;color:#FFC53D;">${x['搜索热度']||'-'}</td><td><span class="tag tag-blue">${Array.isArray(x['关联品类'])?x['关联品类'].join('/'):(x['关联品类']||'-')}</span></td><td>${Array.isArray(x['关联平台'])?x['关联平台'].join('/'):(x['关联平台']||'-')}</td><td>${x['应季节点']||'-'}</td></tr>`).join('')});}

  renderJingpin(c){const records=this.data['jingpin']?.records||[];this._tablePage(c,{key:'jingpin',cols:3,title:'竞品监控',sub:()=>`竞品动态追踪（共${records.length}个竞品）`,heads:['竞品名称','关联品','平台','月销量','历史最低价','监控状态','链接'],cards:()=>`<div class="stat-card stat-primary"><div class="stat-icon">👁️</div><div class="stat-info"><div class="stat-value">${records.length}</div><div class="stat-label">监控竞品总数</div></div></div><div class="stat-card stat-danger"><div class="stat-icon">🔴</div><div class="stat-info"><div class="stat-value">${records.filter(r=>(r['监控状态']||'').includes('重点')).length}</div><div class="stat-label">重点监控</div></div></div><div class="stat-card stat-info"><div class="stat-icon">🔵</div><div class="stat-info"><div class="stat-value">${records.filter(r=>!(r['监控状态']||'').includes('重点')).length}</div><div class="stat-label">常规监控</div></div></div>`,rows:()=>records.slice(0,30).map(x=>{const st=x['监控状态']||'常规监控';const lk=x['竞品链接']?`<a href="${x['竞品链接']}" target="_blank" style="color:#40A9FF;">链接</a>`:'-';return `<tr><td><strong>${x['竞品名称']||'-'}</strong></td><td>${x['关联品']||'-'}</td><td><span class="tag tag-purple">${x['平台']||'-'}</span></td><td style="font-variant-numeric:tabular-nums;">${x['月销量']||'-'}</td><td>${x['历史最低价']||'-'}</td><td><span class="tag ${st.includes('重点')?'tag-red':'tag-blue'}">${st}</span></td><td>${lk}</td></tr>`;}).join('')});}

  renderKefu(c){const records=this.data['kefu']?.records||[];const tt=t=>t==='差评痛点'?'tag-red':t==='客服话术'?'tag-green':t==='售后处理'?'tag-orange':'tag-gray';this._tablePage(c,{key:'kefu',cols:4,title:'客服售后',sub:()=>`话术知识库（共${records.length}条）`,heads:['关联品','来源类型','问题','标准回复/处理方案','评分'],cards:()=>`<div class="stat-card stat-primary"><div class="stat-icon">💬</div><div class="stat-info"><div class="stat-value">${records.length}</div><div class="stat-label">知识条目总数</div></div></div><div class="stat-card stat-danger"><div class="stat-icon">⚠️</div><div class="stat-info"><div class="stat-value">${records.filter(r=>r['来源类型']==='差评痛点').length}</div><div class="stat-label">差评痛点</div></div></div><div class="stat-card stat-success"><div class="stat-icon">💡</div><div class="stat-info"><div class="stat-value">${records.filter(r=>r['来源类型']==='客服话术').length}</div><div class="stat-label">客服话术</div></div></div><div class="stat-card stat-warning"><div class="stat-icon">🔧</div><div class="stat-info"><div class="stat-value">${records.filter(r=>r['来源类型']==='售后处理').length}</div><div class="stat-label">售后处理</div></div></div>`,rows:()=>records.slice(0,40).map(x=>`<tr><td><strong>${x['关联品']||'-'}</strong></td><td><span class="tag ${tt(x['来源类型'])}">${x['来源类型']||'-'}</span></td><td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${x['问题描述']||x['高频问题']||''}">${(x['问题描述']||x['高频问题']||'-').toString().substring(0,36)}</td><td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${x['标准回复话术']||x['处理方案']||''}">${(x['标准回复话术']||x['处理方案']||'-').toString().substring(0,40)}</td><td>${x['话术评分']||'-'}</td></tr>`).join('')});}

  renderFooter(){const f=document.getElementById('footer');if(f)f.innerHTML=`<span>战狼系统 v${this.config.system.version}</span><span>数据源: 飞书多维表格</span><span>内容源: 抖音开源内容</span>`;}
  refreshXuanpin(){this.syncFeishuData().then(()=>this.renderContent());}
  viewDetail(t,i){this.showToast(`查看${t}详情: 第${i+1}条`);}
  pushToContent(i){this.showToast('已推送到内容素材方向表');}
}

let app;
document.addEventListener('DOMContentLoaded',()=>{app=new ZhanLangApp();});
