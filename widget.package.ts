import { WidgetPackage } from '@widget-js/core'

export default new WidgetPackage({
  remote: {
    entry: 'https://widgetjs.cn/mindmap',
    hash: true,
    base: '/mindmap',
    hostname: 'widgetjs.cn',
  },
  remoteEntry: 'https://widgetjs.cn/mindmap',
  remotePackage: 'https://widgetjs.cn/mindmap/widget.json',
  name: 'widgetjs.cn.mindmap',
  author: 'Neo Fu',
  homepage: 'https://widgetjs.cn',
  description: {
    'zh-CN': '思维导图',
    'en-US': 'Mind Map',
  },
  zipUrl: 'https://widgetjs.cn/mindmap/widget.zip',
  entry: 'index.html',
  title: { 'zh-CN': '思维导图', 'en-US': 'Mind Map' },
  hash: true,
  requiredAppVersion: '26.1.1',
  devOptions: {
    folder: './src/widgets/',
    route: true,
    devUrl: 'http://localhost:5173/clock',
  },
  widgets: [],
  permissions: [],
})
