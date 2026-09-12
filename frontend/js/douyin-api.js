/**
 * 战狼系统 - 抖音开源内容API封装
 * 调用抖音开源内容，获取爆款视频、热搜榜单等
 */

class DouyinAPI {
  constructor(config) {
    this.apiBase = config.apiBase || '/api/douyin';
    this.endpoints = config.endpoints;
    this.searchTemplates = config.searchTemplates;
    this.videoUrlPatterns = config.videoUrlPatterns;
    this.cache = new Map();
    this.cacheTTL = 300000; // 5分钟缓存
  }

  /**
   * 搜索爆款带货视频
   */
  async searchHotVideos(product, type = '爆款带货') {
    const cacheKey = `search:${product}:${type}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.time < this.cacheTTL) {
        return cached.data;
      }
    }

    const template = this.searchTemplates[type] || this.searchTemplates['爆款带货'];
    const keyword = template.replace('{product}', product);

    try {
      const response = await fetch(
        `${this.apiBase}${this.endpoints.search}?keyword=${encodeURIComponent(keyword)}`,
        { method: 'GET' }
      );
      
      const result = await response.json();
      this.cache.set(cacheKey, { time: Date.now(), data: result });
      
      return result;
    } catch (error) {
      console.error(`搜索${product}视频失败:`, error);
      return this.getFallbackVideos(product);
    }
  }

  /**
   * 获取热门视频榜单
   */
  async getHotVideos(category = 'all', limit = 50) {
    const cacheKey = `hot:${category}:${limit}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.time < this.cacheTTL) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(
        `${this.apiBase}${this.endpoints.hotVideos}?category=${category}&limit=${limit}`,
        { method: 'GET' }
      );
      
      const result = await response.json();
      this.cache.set(cacheKey, { time: Date.now(), data: result });
      
      return result;
    } catch (error) {
      console.error('获取热门视频失败:', error);
      return { data: [], total: 0 };
    }
  }

  /**
   * 获取视频详情
   */
  async getVideoDetail(videoId) {
    try {
      const response = await fetch(
        `${this.apiBase}${this.endpoints.videoDetail}?video_id=${videoId}`,
        { method: 'GET' }
      );
      return await response.json();
    } catch (error) {
      console.error(`获取视频详情失败:`, error);
      return null;
    }
  }

  /**
   * 获取视频评论
   */
  async getVideoComments(videoId, limit = 100) {
    try {
      const response = await fetch(
        `${this.apiBase}${this.endpoints.comments}?video_id=${videoId}&limit=${limit}`,
        { method: 'GET' }
      );
      return await response.json();
    } catch (error) {
      console.error(`获取视频评论失败:`, error);
      return { data: [], total: 0 };
    }
  }

  /**
   * 提取真实抖音视频链接
   */
  extractVideoUrls(searchResults) {
    const urls = [];
    
    if (!searchResults || !searchResults.data) return urls;
    
    for (const item of searchResults.data) {
      if (item.url) {
        // 验证是否为抖音链接
        const isDouyinUrl = this.videoUrlPatterns.some(pattern => 
          item.url.includes(pattern)
        );
        if (isDouyinUrl) {
          urls.push({
            url: item.url,
            title: item.title,
            author: item.author,
            diggCount: item.digg_count,
            commentCount: item.comment_count,
            shareCount: item.share_count
          });
        }
      }
    }
    
    // 按点赞数排序
    return urls.sort((a, b) => (b.diggCount || 0) - (a.diggCount || 0));
  }

  /**
   * 分析视频爆款要素
   */
  analyzeVideo(videoData) {
    if (!videoData) return null;
    
    return {
      title: videoData.title,
      duration: videoData.duration,
      author: videoData.author,
      stats: {
        diggCount: videoData.digg_count,
        commentCount: videoData.comment_count,
        shareCount: videoData.share_count,
        playCount: videoData.play_count
      },
      hotScore: this.calculateHotScore(videoData),
      sellingPoints: this.extractSellingPoints(videoData.title || ''),
      scriptPattern: this.analyzeScriptPattern(videoData),
      recommendedFor: this.matchCategory(videoData)
    };
  }

  /**
   * 计算爆款指数
   */
  calculateHotScore(videoData) {
    const digg = videoData.digg_count || 0;
    const comment = videoData.comment_count || 0;
    const share = videoData.share_count || 0;
    const play = videoData.play_count || 0;
    
    // 加权计算
    const score = (digg * 1 + comment * 3 + share * 5 + play * 0.01) / 100;
    return Math.min(100, Math.round(score));
  }

  /**
   * 提取卖点关键词
   */
  extractSellingPoints(title) {
    const keywords = [
      '便宜', '划算', '好用', '实用', '方便', '安全', '耐用',
      '高颜值', '可爱', '舒适', '保暖', '清洁', '去污', '收纳',
      '送礼', '自用', '囤货', '限时', '秒杀', '买一送一'
    ];
    
    return keywords.filter(k => title.includes(k));
  }

  /**
   * 分析脚本模式
   */
  analyzeScriptPattern(videoData) {
    const title = videoData.title || '';
    
    if (title.includes('看过来') || title.includes('姐妹')) {
      return '痛点开场型';
    } else if (title.includes('别再') || title.includes('不要')) {
      return '反常识型';
    } else if (title.includes('多少钱') || title.includes('价格')) {
      return '价格冲击型';
    } else if (title.includes('测评') || title.includes('对比')) {
      return '测评对比型';
    } else {
      return '常规展示型';
    }
  }

  /**
   * 匹配品类
   */
  matchCategory(videoData) {
    const title = (videoData.title || '').toLowerCase();
    const categories = {
      '日用百货': ['收纳', '整理', '置物', '衣架', '收纳箱', '收纳袋', '真空'],
      '家清类': ['清洁', '去污', '洗碗', '拖把', '湿巾', '洗衣液', '油污'],
      '五金件': ['工具', '螺丝刀', '扳手', '五金', '维修', 'DIY'],
      '滋补类': ['滋补', '养生', '阿胶', '燕窝', '黑芝麻', '红枣', '枸杞'],
      '茶叶类': ['茶叶', '茶', '铁观音', '龙井', '普洱', '红茶', '绿茶']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(k => title.includes(k))) {
        return category;
      }
    }
    
    return '日用百货'; // 默认
  }

  /**
   * 获取备用视频数据（API不可用时）
   */
  getFallbackVideos(product) {
    return {
      data: [
        {
          url: `https://www.iesdouyin.com/share/video/fallback_${product}_1`,
          title: `${product}爆款带货视频 - 痛点开场型`,
          author: '战狼系统',
          digg_count: 10000,
          comment_count: 500,
          share_count: 200
        }
      ],
      total: 1,
      fallback: true,
      message: 'API不可用，返回示例数据'
    };
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DouyinAPI;
}