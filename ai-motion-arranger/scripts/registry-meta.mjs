// 此文件由 sync-runtime-registry.mjs 从运行时 registry.ts 自动生成。
// 不要手改；请修改真实组件定义后运行 npm.cmd run sync:registry。
export const RUNTIME_COMPONENT_COUNT = 52;
export const REGISTERED_CARDS = [
  {
    "id": "SegmentedMeter",
    "name": "分段能量条",
    "description": "分段式容量、性能和能量指示 · 工作台内置模板",
    "category": "metric",
    "catalogGroup": "数字",
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
      "enterAnimation": "auto",
      "exitAnimation": "auto",
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
      "enterAnimation": {
        "type": "select",
        "label": "入场动画",
        "default": "auto",
        "options": [
          {
            "label": "保持组件原有",
            "value": "auto"
          },
          {
            "label": "淡入",
            "value": "fade"
          },
          {
            "label": "向上滑入",
            "value": "slide-up"
          },
          {
            "label": "向左滑入",
            "value": "slide-left"
          },
          {
            "label": "缩放进入",
            "value": "zoom"
          },
          {
            "label": "3D 倾斜进入",
            "value": "tilt"
          }
        ]
      },
      "exitAnimation": {
        "type": "select",
        "label": "出场动画",
        "default": "auto",
        "options": [
          {
            "label": "保持组件原有",
            "value": "auto"
          },
          {
            "label": "淡出",
            "value": "fade"
          },
          {
            "label": "向下滑出",
            "value": "slide-up"
          },
          {
            "label": "向右滑出",
            "value": "slide-left"
          },
          {
            "label": "缩放退出",
            "value": "zoom"
          },
          {
            "label": "3D 倾斜退出",
            "value": "tilt"
          }
        ]
      },
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
    },
    "semantic": {
      "primaryIntent": "metric",
      "secondaryIntents": [
        "process",
        "list",
        "emphasis"
      ],
      "contentKinds": [
        "metric",
        "process"
      ],
      "keywords": [
        "容量",
        "阶段",
        "进度",
        "性能",
        "分段"
      ],
      "orientation": "any",
      "density": "medium",
      "durationSeconds": {
        "min": 1.5,
        "max": 6
      }
    }
  }
];
