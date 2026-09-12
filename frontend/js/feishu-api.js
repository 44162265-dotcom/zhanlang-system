/**
 * 战狼系统 - 飞书多维表格API封装
 * 作为数据源基座，与前端系统强关联，数据完全同步
 */

class FeishuAPI {
  constructor(config) {
    this.baseToken = config.baseToken;
    this.apiBase = config.apiBase || '/api/feishu';
    this.tables = config.tables;
    this.cache = new Map();
    this.cacheTTL = 60000; // 1分钟缓存
  }

  /**
   * 获取表记录列表
   */
  async getRecords(tableName, options = {}) {
    const tableId = this.tables[tableName] || tableName;
    const cacheKey = `records:${tableId}:${JSON.stringify(options)}`;
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.time < this.cacheTTL) {
        return cached.data;
      }
    }

    try {
      const params = new URLSearchParams({
        page_size: options.pageSize || 200,
        ...options
      });
      
      const response = await fetch(
        `${this.apiBase}/base/${this.baseToken}/tables/${tableId}/records?${params}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      const result = await response.json();
      
      // 写入缓存
      this.cache.set(cacheKey, { time: Date.now(), data: result });
      
      return result;
    } catch (error) {
      console.error(`获取${tableName}记录失败:`, error);
      return this.getLocalData(tableName);
    }
  }

  /**
   * 批量创建记录
   */
  async batchCreateRecords(tableName, records) {
    const tableId = this.tables[tableName] || tableName;
    
    try {
      const response = await fetch(
        `${this.apiBase}/base/${this.baseToken}/tables/${tableId}/records/batch_create`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records })
        }
      );
      
      // 清除相关缓存
      this.clearCache(tableName);
      
      return await response.json();
    } catch (error) {
      console.error(`批量创建${tableName}记录失败:`, error);
      return null;
    }
  }

  /**
   * 批量更新记录
   */
  async batchUpdateRecords(tableName, records) {
    const tableId = this.tables[tableName] || tableName;
    
    try {
      const response = await fetch(
        `${this.apiBase}/base/${this.baseToken}/tables/${tableId}/records/batch_update`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records })
        }
      );
      
      // 清除相关缓存
      this.clearCache(tableName);
      
      return await response.json();
    } catch (error) {
      console.error(`批量更新${tableName}记录失败:`, error);
      return null;
    }
  }

  /**
   * 删除记录
   */
  async deleteRecord(tableName, recordId) {
    const tableId = this.tables[tableName] || tableName;
    
    try {
      const response = await fetch(
        `${this.apiBase}/base/${this.baseToken}/tables/${tableId}/records/${recordId}`,
        { method: 'DELETE' }
      );
      
      this.clearCache(tableName);
      return await response.json();
    } catch (error) {
      console.error(`删除${tableName}记录失败:`, error);
      return null;
    }
  }

  /**
   * 获取表字段列表
   */
  async getFields(tableName) {
    const tableId = this.tables[tableName] || tableName;
    
    try {
      const response = await fetch(
        `${this.apiBase}/base/${this.baseToken}/tables/${tableId}/fields`,
        { method: 'GET' }
      );
      return await response.json();
    } catch (error) {
      console.error(`获取${tableName}字段失败:`, error);
      return null;
    }
  }

  /**
   * 获取视图列表
   */
  async getViews(tableName) {
    const tableId = this.tables[tableName] || tableName;
    
    try {
      const response = await fetch(
        `${this.apiBase}/base/${this.baseToken}/tables/${tableId}/views`,
        { method: 'GET' }
      );
      return await response.json();
    } catch (error) {
      console.error(`获取${tableName}视图失败:`, error);
      return null;
    }
  }

  /**
   * 全链路数据同步
   */
  async syncAllData() {
    const tables = Object.keys(this.tables);
    const results = {};
    
    for (const tableName of tables) {
      try {
        const data = await this.getRecords(tableName);
        results[tableName] = {
          success: true,
          count: data?.data?.items?.length || 0,
          timestamp: new Date().toISOString()
        };
        
        // 保存到本地缓存
        this.saveLocalData(tableName, data);
      } catch (error) {
        results[tableName] = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }
    
    return results;
  }

  /**
   * 保存数据到本地（离线可用）
   */
  saveLocalData(tableName, data) {
    try {
      const key = `feishu_${tableName}`;
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('保存本地数据失败:', error);
    }
  }

  /**
   * 从本地获取数据
   */
  getLocalData(tableName) {
    try {
      const key = `feishu_${tableName}`;
      const cached = localStorage.getItem(key);
      if (cached) {
        return JSON.parse(cached).data;
      }
    } catch (error) {
      console.error('读取本地数据失败:', error);
    }
    return null;
  }

  /**
   * 清除缓存
   */
  clearCache(tableName) {
    for (const key of this.cache.keys()) {
      if (key.includes(tableName)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取数据同步状态
   */
  getSyncStatus() {
    const status = {
      lastSync: localStorage.getItem('feishu_lastSync'),
      tables: {}
    };
    
    for (const tableName of Object.keys(this.tables)) {
      const cached = localStorage.getItem(`feishu_${tableName}`);
      if (cached) {
        status.tables[tableName] = JSON.parse(cached).timestamp;
      }
    }
    
    return status;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeishuAPI;
}