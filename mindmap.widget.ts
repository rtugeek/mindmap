import { BackgroundWidget, WidgetKeyword } from '@widget-js/core'

// 组件关键词
const keywords = [WidgetKeyword.RECOMMEND]
const ClockWidgetDefine = new BackgroundWidget({
  path: '/',
  name: '.default',
  title: { 'zh-CN': '思维导图', 'en-US': 'Mind Map' },
  description: { 'zh-CN': '帮助你整理知识碎片与思绪', 'en-US': 'Help you organize knowledge fragments and thoughts' },
  keywords,
  backgroundThrottling: false,
  categories: ['ai', 'utilities'],
  lang: 'zh-CN',
  previewImage: '/images/preview_clock.png',
  socialLinks: [
    { name: 'github', link: 'https://github.com/rtugeek/mindmap' },
  ],
  browserWindowOptions: {
    transparent: false,
    frame: true,
    skipTaskbar: false,
    width: 1200,
    height: 800,
    titleBarStyle: 'hidden',
    backgroundThrottling: false,
  },
})
export default ClockWidgetDefine
