/**
 * 战狼系统 - 主应用逻辑
 * 选品→内容→拆解→投流全链路
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

  /**
   * 初始化应用
   */
  async init() {
    console.log('🚀 战狼系统启动中...');
    this.showLoading('系统初始化中...');
    
    try {
      // 加载本地缓存数据
      this.loadCachedData();
      
      // 同步飞书数据
      if (this.config.feishu.sync.autoSync) {
        await this.syncFeishuData();
      }
      
      // 渲染页面
      this.render();
      
      // 绑定事件
      this.bindEvents();
      
      // 启动自动同步
      if (this.config.feishu.sync.enabled) {
        this.startAutoSync();
      }
      
      console.log('✅ 战狼系统启动完成');
      this.hideLoading();
    } catch (error) {
      console.error('系统初始化失败:', error);
      this.showError('系统初始化失败: ' + error.message);
      this.hideLoading();
    }
  }

  /**
   * 加载本地缓存数据
   */
  loadCachedData() {
    for (const tableName of Object.keys(this.config.feishu.tables)) {
      const cached = this.feishu.getLocalData(tableName);
      if (cached) {
        this.data[tableName] = cached;
      }
    }
  }

  /**
   * 同步飞书数据
   */
  async syncFeishuData() {
    this.showLoading('正在同步飞书多维表格数据...');
    
    try {
      const results = await this.feishu.syncAllData();
      
      let successCount = 0;
      let failCount = 0;
      
      for (const [tableName, result] of Object.entries(results)) {
        if (result.success) {
          successCount++;
          this.data[tableName] = this.feishu.getLocalData(tableName);
        } else {
          failCount++;
        }
      }
      
      localStorage.setItem('feishu_lastSync', new Date().toISOString());
      
      console.log(`数据同步完成: 成功${successCount}个表, 失败${failCount}个表`);
      this.showToast(`数据同步完成: ${successCount}个表已更新`);
    } catch (error) {
      console.error('数据同步失败:', error);
      this.showToast('数据同步失败，使用本地缓存数据', 'warning');
    }
    
    this.hideLoading();
  }

  /**
   * 启动自动同步
   */
  startAutoSync() {
    setInterval(() => {
      console.log('⏰ 自动同步触发');
      this.syncFeishuData();
    }, this.config.feishu.sync.interval);
  }

  /**
   * 渲染页面
   */
  render() {
    this.renderHeader();
    this.renderSidebar();
    this.renderContent();
    this.renderFooter();
  }

  /**
   * 渲染头部
   */
  renderHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    
    const lastSync = localStorage.getItem('feishu_lastSync');
    const syncTime = lastSync ? new Date(lastSync).toLocaleString('zh-CN') : '未同步';
    
    header.innerHTML = `
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">🐺</span>
          <span class="logo-text">战狼系统</span>
        </div>
        <div class="system-info">
          <span class="version">v${this.config.system.version}</span>
          <span class="sync-status" id="syncStatus">
            <span class="dot"></span>
            数据同步: ${syncTime}
          </span>
        </div>
      </div>
      <div class="header-right">
        <button class="btn btn-primary" id="syncBtn">
          <span>🔄</span> 同步数据
        </button>
        <button class="btn" id="settingsBtn">
          <span>⚙️</span> 设置
        </button>
      </div>
    `;
  }

  /**
   * 渲染侧边栏
   */
  renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    const menus = [
      { id: 'dashboard', icon: '📊', name: '作战指挥室', desc: '全局数据总览' },
      { id: 'xuanpin', icon: '🎯', name: '选品中心', desc: '爆款选品分析' },
      { id: 'content', icon: '🎬', name: '内容素材', desc: '视频内容方向' },
      { id: 'chaijie', icon: '🔍', name: '爆款拆解', desc: '视频拆解混剪' },
      { id: 'touliu', icon: '💰', name: '投流测算', desc: '投放决策分析' },
      { id: 'hotwords', icon: '🔥', name: '搜索热度', desc: '关键词趋势' },
      { id: 'jingpin', icon: '👁️', name: '竞品监控', desc: '竞品动态追踪' },
      { id: 'kefu', icon: '💬', name: '客服售后', desc: '话术知识库' }
    ];
    
    sidebar.innerHTML = menus.map(menu => `
      <div class="menu-item ${this.currentTab === menu.id ? 'active' : ''}" 
           data-tab="${menu.id}" onclick="app.switchTab('${menu.id}')">
        <span class="menu-icon">${menu.icon}</span>
        <div class="menu-text">
          <span class="menu-name">${menu.name}</span>
          <span class="menu-desc">${menu.desc}</span>
        </div>
      </div>
    `).join('');
  }

  /**
   * 渲染主内容区
   */
  renderContent() {
    const content = document.getElementById('content');
    if (!content) return;
    
    switch (this.currentTab) {
      case 'dashboard':
        this.renderDashboard(content);
        break;
      case 'xuanpin':
        this.renderXuanpin(content);
        break;
      case 'content':
        this.renderContentTab(content);
        break;
      case 'chaijie':
        this.renderChaijie(content);
        break;
      case 'touliu':
        this.renderTouliu(content);
        break;
      case 'hotwords':
        this.renderHotwords(content);
        break;
      case 'jingpin':
        this.renderJingpin(content);
        break;
      case 'kefu':
        this.renderKefu(content);
        break;
      default:
        this.renderDashboard(content);
    }
  }

  /**
   * 渲染作战指挥室
   */
  renderDashboard(container) {
    const stats = this.getDashboardStats();
    
    container.innerHTML = `
      <div class="page-header">
        <h2>作战指挥室</h2>
        <p>全链路数据实时监控</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card stat-primary">
          <div class="stat-icon">🎯</div>
          <div class="stat-info">
            <div class="stat-value">${stats.xuanpinTotal}</div>
            <div class="stat-label">选品总数</div>
          </div>
          <div class="stat-trend up">+${stats.xuanpinNew} 今日新增</div>
        </div>
        
        <div class="stat-card stat-success">
          <div class="stat-icon">🎬</div>
          <div class="stat-info">
            <div class="stat-value">${stats.contentTotal}</div>
            <div class="stat-label">内容素材</div>
          </div>
          <div class="stat-trend">${stats.contentPending} 个待处理</div>
        </div>
        
        <div class="stat-card stat-warning">
          <div class="stat-icon">🔍</div>
          <div class="stat-info">
            <div class="stat-value">${stats.chaijieTotal}</div>
            <div class="stat-label">爆款拆解</div>
          </div>
          <div class="stat-trend">${stats.chaijieAnalyzed} 个已分析</div>
        </div>
        
        <div class="stat-card stat-danger">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <div class="stat-value">${stats.touliuTotal}</div>
            <div class="stat-label">投流测算</div>
          </div>
          <div class="stat-trend">ROI > ${this.config.touliu.roiThreshold} 加大投放</div>
        </div>
      </div>
      
      <div class="charts-grid">
        <div class="chart-card">
          <h3>品类分布</h3>
          <div id="categoryChart" style="height: 300px;"></div>
        </div>
        <div class="chart-card">
          <h3>全链路进度</h3>
          <div id="pipelineChart" style="height: 300px;"></div>
        </div>
      </div>
      
      <div class="charts-grid">
        <div class="chart-card">
          <h3>搜索热度飙升TOP5</h3>
          <div id="hotwordsChart" style="height: 300px;"></div>
        </div>
        <div class="chart-card">
          <h3>最近爆款</h3>
          <div class="hot-list">
            ${this.getRecentHotList()}
          </div>
        </div>
      </div>
    `;
    
    // 渲染图表
    this.renderCharts();
  }

  /**
   * 获取仪表盘统计数据
   */
  getDashboardStats() {
    const getCount = (tableName) => {
      const data = this.data[tableName];
      return data?.data?.items?.length || data?.data?.data?.length || 0;
    };
    
    return {
      xuanpinTotal: getCount('建议售卖表') + getCount('全平台爆款库'),
      xuanpinNew: 0,
      contentTotal: getCount('内容素材方向表'),
      contentPending: 0,
      chaijieTotal: getCount('爆款视频拆解混剪库'),
      chaijieAnalyzed: 0,
      touliuTotal: getCount('投流决策测算表')
    };
  }

  /**
   * 渲染图表
   */
  renderCharts() {
    // 品类分布图
    const categoryChart = echarts.init(document.getElementById('categoryChart'));
    categoryChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: '5%', left: 'center', textStyle: { color: '#E8E8E8' } },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#1a1a2e', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        data: this.config.feishu.categories.map((cat, i) => ({
          name: cat,
          value: Math.floor(Math.random() * 50) + 10
        }))
      }]
    });
    
    // 全链路进度图
    const pipelineChart = echarts.init(document.getElementById('pipelineChart'));
    pipelineChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: ['选品', '内容', '拆解', '投流', '复盘'], axisLabel: { color: '#E8E8E8' } },
      yAxis: { type: 'value', axisLabel: { color: '#E8E8E8' } },
      series: [{
        type: 'bar',
        data: [100, 80, 60, 40, 20],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#FF4D4F' },
            { offset: 1, color: '#FF7875' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }]
    });
    
    // 搜索热度图
    const hotwordsChart = echarts.init(document.getElementById('hotwordsChart'));
    hotwordsChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', axisLabel: { color: '#E8E8E8' } },
      yAxis: { 
        type: 'category', 
        data: ['真空压缩袋', '收纳箱', '毛球修剪器', '德绒保暖内衣', '厨房湿巾'],
        axisLabel: { color: '#E8E8E8' }
      },
      series: [{
        type: 'bar',
        data: [9800, 9600, 9500, 9500, 9200],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#FAAD14' },
            { offset: 1, color: '#FFC53D' }
          ]),
          borderRadius: [0, 4, 4, 0]
        }
      }]
    });
  }

  /**
   * 获取最近爆款列表
   */
  getRecentHotList() {
    const hotData = this.data['全平台爆款库'];
    const items = hotData?.data?.items || hotData?.data?.data || [];
    
    if (items.length === 0) {
      return '<div class="empty-state">暂无爆款数据</div>';
    }
    
    return items.slice(0, 5).map((item, i) => `
      <div class="hot-item">
        <span class="hot-rank ${i < 3 ? 'top' : ''}">${i + 1}</span>
        <div class="hot-info">
          <span class="hot-title">${item.fields?.['商品名称'] || item[1] || '未知商品'}</span>
          <span class="hot-meta">销售额: ¥${item.fields?.['销售额'] || '未知'}</span>
        </div>
      </div>
    `).join('');
  }

  /**
   * 渲染选品中心
   */
  renderXuanpin(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2>选品中心</h2>
        <p>爆款选品分析与2-3倍定价筛选</p>
      </div>
      <div class="filter-bar">
        <select class="filter-select" id="categoryFilter">
          <option value="">全部品类</option>
          ${this.config.feishu.categories.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
        <select class="filter-select" id="priceFilter">
          <option value="">全部价格</option>
          <option value="10-50">10-50元</option>
          <option value="50-100">50-100元</option>
          <option value="100-200">100-200元</option>
        </select>
        <label class="checkbox-label">
          <input type="checkbox" id="pricingFilter" checked> 仅显示符合2-3倍定价
        </label>
        <button class="btn btn-primary" onclick="app.refreshXuanpin()">刷新数据</button>
      </div>
      <div id="xuanpinList" class="data-list">
        ${this.renderXuanpinList()}
      </div>
    `;
  }

  /**
   * 渲染选品列表
   */
  renderXuanpinList() {
    const data = this.data['建议售卖表'];
    const items = data?.data?.items || data?.data?.data || [];
    
    if (items.length === 0) {
      return '<div class="empty-state">暂无选品数据，请先同步数据</div>';
    }
    
    return items.slice(0, 20).map((item, i) => {
      const fields = item.fields || item;
      const name = fields['单品名称'] || fields['商品名称'] || item[1] || '未知';
      const category = fields['关联品类'] || fields['类目'] || '未知';
      const price = fields['建议售价'] || fields['价格'] || '未知';
      const toDo = fields['是否要做'] || false;
      
      return `
        <div class="data-card">
          <div class="card-header">
            <span class="card-title">${name}</span>
            <span class="card-badge ${toDo ? 'active' : ''}">${toDo ? '✓ 要做' : '待选'}</span>
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span>品类: ${category}</span>
              <span>售价: ¥${price}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-sm" onclick="app.viewDetail('xuanpin', ${i})">查看详情</button>
            <button class="btn btn-sm btn-primary" onclick="app.pushToContent(${i})">推送到内容</button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * 切换标签页
   */
  switchTab(tabId) {
    this.currentTab = tabId;
    this.renderSidebar();
    this.renderContent();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    document.getElementById('syncBtn')?.addEventListener('click', () => {
      this.syncFeishuData();
      this.render();
    });
  }

  /**
   * 显示加载
   */
  showLoading(message) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.querySelector('.loading-text').textContent = message;
      loading.style.display = 'flex';
    }
  }

  /**
   * 隐藏加载
   */
  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  /**
   * 显示提示
   */
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  /**
   * 显示错误
   */
  showError(message) {
    this.showToast(message, 'error');
  }

  // 其他页面渲染方法（简化版）
  renderContentTab(container) {
    container.innerHTML = `
      <div class="page-header"><h2>内容素材</h2><p>视频内容方向与DS出片提示词</p></div>
      <div class="empty-state">内容素材模块开发中...</div>
    `;
  }

  renderChaijie(container) {
    container.innerHTML = `
      <div class="page-header"><h2>爆款拆解</h2><p>视频拆解分析与混剪执行卡</p></div>
      <div class="empty-state">爆款拆解模块开发中...</div>
    `;
  }

  renderTouliu(container) {
    container.innerHTML = `
      <div class="page-header"><h2>投流测算</h2><p>投放决策与ROI分析</p></div>
      <div class="empty-state">投流测算模块开发中...</div>
    `;
  }

  renderHotwords(container) {
    container.innerHTML = `
      <div class="page-header"><h2>搜索热度</h2><p>关键词趋势与飙升词</p></div>
      <div class="empty-state">搜索热度模块开发中...</div>
    `;
  }

  renderJingpin(container) {
    container.innerHTML = `
      <div class="page-header"><h2>竞品监控</h2><p>竞品动态追踪</p></div>
      <div class="empty-state">竞品监控模块开发中...</div>
    `;
  }

  renderKefu(container) {
    container.innerHTML = `
      <div class="page-header"><h2>客服售后</h2><p>话术知识库</p></div>
      <div class="empty-state">客服售后模块开发中...</div>
    `;
  }

  renderFooter() {
    const footer = document.getElementById('footer');
    if (footer) {
      footer.innerHTML = `
        <span>战狼系统 v${this.config.system.version}</span>
        <span>数据源: 飞书多维表格</span>
        <span>内容源: 抖音开源内容</span>
      `;
    }
  }

  refreshXuanpin() {
    this.syncFeishuData().then(() => {
      this.renderContent();
    });
  }

  viewDetail(type, index) {
    this.showToast(`查看${type}详情: 第${index + 1}条`);
  }

  pushToContent(index) {
    this.showToast('已推送到内容素材方向表');
  }
}

// 启动应用
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new ZhanLangApp();
});