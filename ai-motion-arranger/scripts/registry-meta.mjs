// 此文件由 sync-runtime-registry.mjs 从运行时 registry.ts 自动生成。
// 不要手改；请修改真实组件定义后运行 npm.cmd run sync:registry。
export const RUNTIME_COMPONENT_COUNT = 29;
export const REGISTERED_CARDS = [
  {
    "id": "Countdown",
    "name": "倒计时",
    "description": "倒计时和阶段切换 · 工作台内置模板",
    "category": "metric",
    "catalogGroup": "数字与指标",
    "glyph": "03",
    "placement": "left",
    "durationInFrames": 120,
    "bounds": {
      "x": 0,
      "y": 0,
      "width": 700,
      "height": 340
    },
    "defaultPosition": {
      "x": 70,
      "y": 380,
      "scale": 1
    },
    "defaultProps": {
      "title": "倒计时",
      "subtitle": "MOTION COMPONENT",
      "value": "03",
      "item1": "关键节点一",
      "item2": "关键节点二",
      "item3": "关键节点三",
      "accentColor": "#d7d7d7",
      "secondaryColor": "#7a7d84",
      "animationSeconds": 1.2
    },
    "propsSchema": {
      "title": {
        "type": "text",
        "label": "主标题"
      },
      "subtitle": {
        "type": "text",
        "label": "副标题"
      },
      "value": {
        "type": "text",
        "label": "核心数值"
      },
      "item1": {
        "type": "text",
        "label": "内容一"
      },
      "item2": {
        "type": "text",
        "label": "内容二"
      },
      "item3": {
        "type": "text",
        "label": "内容三"
      },
      "animationSeconds": {
        "type": "number",
        "label": "动画时长(秒)",
        "min": 0.2,
        "max": 8,
        "step": 0.1
      },
      "accentColor": {
        "type": "color",
        "label": "强调色"
      },
      "secondaryColor": {
        "type": "color",
        "label": "辅助色"
      }
    }
  },
  {
    "id": "SegmentedMeter",
    "name": "分段能量条",
    "description": "分段式容量、性能和能量指示 · 工作台内置模板",
    "category": "metric",
    "catalogGroup": "数字与指标",
    "glyph": "▮▮▮",
    "placement": "left",
    "durationInFrames": 120,
    "bounds": {
      "x": 0,
      "y": 0,
      "width": 700,
      "height": 340
    },
    "defaultPosition": {
      "x": 70,
      "y": 380,
      "scale": 1
    },
    "defaultProps": {
      "title": "分段能量条",
      "subtitle": "MOTION COMPONENT",
      "value": "75%",
      "item1": "关键节点一",
      "item2": "关键节点二",
      "item3": "关键节点三",
      "accentColor": "#d7d7d7",
      "secondaryColor": "#7a7d84",
      "animationSeconds": 1.2
    },
    "propsSchema": {
      "title": {
        "type": "text",
        "label": "主标题"
      },
      "subtitle": {
        "type": "text",
        "label": "副标题"
      },
      "value": {
        "type": "text",
        "label": "核心数值"
      },
      "item1": {
        "type": "text",
        "label": "内容一"
      },
      "item2": {
        "type": "text",
        "label": "内容二"
      },
      "item3": {
        "type": "text",
        "label": "内容三"
      },
      "animationSeconds": {
        "type": "number",
        "label": "动画时长(秒)",
        "min": 0.2,
        "max": 8,
        "step": 0.1
      },
      "accentColor": {
        "type": "color",
        "label": "强调色"
      },
      "secondaryColor": {
        "type": "color",
        "label": "辅助色"
      }
    }
  },
  {
    "id": "DualMetricBar",
    "name": "双向指标差异",
    "description": "双向指标差异和竞争关系 · 工作台内置模板",
    "category": "metric",
    "catalogGroup": "数字与指标",
    "glyph": "⇆",
    "placement": "left",
    "durationInFrames": 120,
    "bounds": {
      "x": 0,
      "y": 0,
      "width": 700,
      "height": 340
    },
    "defaultPosition": {
      "x": 70,
      "y": 380,
      "scale": 1
    },
    "defaultProps": {
      "title": "双向指标差异",
      "subtitle": "MOTION COMPONENT",
      "value": "+42%",
      "item1": "关键节点一",
      "item2": "关键节点二",
      "item3": "关键节点三",
      "accentColor": "#d7d7d7",
      "secondaryColor": "#7a7d84",
      "animationSeconds": 1.2
    },
    "propsSchema": {
      "title": {
        "type": "text",
        "label": "主标题"
      },
      "subtitle": {
        "type": "text",
        "label": "副标题"
      },
      "value": {
        "type": "text",
        "label": "核心数值"
      },
      "item1": {
        "type": "text",
        "label": "内容一"
      },
      "item2": {
        "type": "text",
        "label": "内容二"
      },
      "item3": {
        "type": "text",
        "label": "内容三"
      },
      "animationSeconds": {
        "type": "number",
        "label": "动画时长(秒)",
        "min": 0.2,
        "max": 8,
        "step": 0.1
      },
      "accentColor": {
        "type": "color",
        "label": "强调色"
      },
      "secondaryColor": {
        "type": "color",
        "label": "辅助色"
      }
    }
  },
  {
    "id": "WaveformMetric",
    "name": "波形指标",
    "description": "连续波形和实时吞吐读数 · 工作台内置模板",
    "category": "metric",
    "catalogGroup": "数字与指标",
    "glyph": "∿",
    "placement": "left",
    "durationInFrames": 120,
    "bounds": {
      "x": 0,
      "y": 0,
      "width": 700,
      "height": 340
    },
    "defaultPosition": {
      "x": 70,
      "y": 380,
      "scale": 1
    },
    "defaultProps": {
      "title": "波形指标",
      "subtitle": "MOTION COMPONENT",
      "value": "128/s",
      "item1": "关键节点一",
      "item2": "关键节点二",
      "item3": "关键节点三",
      "accentColor": "#d7d7d7",
      "secondaryColor": "#7a7d84",
      "animationSeconds": 1.2
    },
    "propsSchema": {
      "title": {
        "type": "text",
        "label": "主标题"
      },
      "subtitle": {
        "type": "text",
        "label": "副标题"
      },
      "value": {
        "type": "text",
        "label": "核心数值"
      },
      "item1": {
        "type": "text",
        "label": "内容一"
      },
      "item2": {
        "type": "text",
        "label": "内容二"
      },
      "item3": {
        "type": "text",
        "label": "内容三"
      },
      "animationSeconds": {
        "type": "number",
        "label": "动画时长(秒)",
        "min": 0.2,
        "max": 8,
        "step": 0.1
      },
      "accentColor": {
        "type": "color",
        "label": "强调色"
      },
      "secondaryColor": {
        "type": "color",
        "label": "辅助色"
      }
    }
  },
  {
    "id": "LiquidGauge",
    "name": "液态仪表",
    "description": "液态填充式完成率仪表 · 工作台内置模板",
    "category": "metric",
    "catalogGroup": "数字与指标",
    "glyph": "≈",
    "placement": "left",
    "durationInFrames": 120,
    "bounds": {
      "x": 0,
      "y": 0,
      "width": 700,
      "height": 340
    },
    "defaultPosition": {
      "x": 70,
      "y": 380,
      "scale": 1
    },
    "defaultProps": {
      "title": "液态仪表",
      "subtitle": "MOTION COMPONENT",
      "value": "68%",
      "item1": "关键节点一",
      "item2": "关键节点二",
      "item3": "关键节点三",
      "accentColor": "#d7d7d7",
      "secondaryColor": "#7a7d84",
      "animationSeconds": 1.2
    },
    "propsSchema": {
      "title": {
        "type": "text",
        "label": "主标题"
      },
      "subtitle": {
        "type": "text",
        "label": "副标题"
      },
      "value": {
        "type": "text",
        "label": "核心数值"
      },
      "item1": {
        "type": "text",
        "label": "内容一"
      },
      "item2": {
        "type": "text",
        "label": "内容二"
      },
      "item3": {
        "type": "text",
        "label": "内容三"
      },
      "animationSeconds": {
        "type": "number",
        "label": "动画时长(秒)",
        "min": 0.2,
        "max": 8,
        "step": 0.1
      },
      "accentColor": {
        "type": "color",
        "label": "强调色"
      },
      "secondaryColor": {
        "type": "color",
        "label": "辅助色"
      }
    }
  },
  {
    "id": "RadialTicks",
    "name": "HUD 刻度环",
    "description": "科技 HUD 刻度与中心读数 · 工作台内置模板",
    "category": "metric",
    "catalogGroup": "数字与指标",
    "glyph": "◎",
    "placement": "left",
    "durationInFrames": 120,
    "bounds": {
      "x": 0,
      "y": 0,
      "width": 700,
      "height": 340
    },
    "defaultPosition": {
      "x": 70,
      "y": 380,
      "scale": 1
    },
    "defaultProps": {
      "title": "HUD 刻度环",
      "subtitle": "MOTION COMPONENT",
      "value": "92%",
      "item1": "关键节点一",
      "item2": "关键节点二",
      "item3": "关键节点三",
      "accentColor": "#d7d7d7",
      "secondaryColor": "#7a7d84",
      "animationSeconds": 1.2
    },
    "propsSchema": {
      "title": {
        "type": "text",
        "label": "主标题"
      },
      "subtitle": {
        "type": "text",
        "label": "副标题"
      },
      "value": {
        "type": "text",
        "label": "核心数值"
      },
      "item1": {
        "type": "text",
        "label": "内容一"
      },
      "item2": {
        "type": "text",
        "label": "内容二"
      },
      "item3": {
        "type": "text",
        "label": "内容三"
      },
      "animationSeconds": {
        "type": "number",
        "label": "动画时长(秒)",
        "min": 0.2,
        "max": 8,
        "step": 0.1
      },
      "accentColor": {
        "type": "color",
        "label": "强调色"
      },
      "secondaryColor": {
        "type": "color",
        "label": "辅助色"
      }
    }
  }
];
