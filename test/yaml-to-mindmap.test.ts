import { describe, expect, it } from 'vitest'
import { parseYamlToMindMap } from '../src/lib/yaml-to-mindmap'

describe('parseYamlToMindMap', () => {
  it('should return null for empty input', () => {
    expect(parseYamlToMindMap('')).toBeNull()
  })

  it('should parse simple implicit structure', () => {
    const yaml = `
Root:
  - Child 1
  - Child 2
`
    const result = parseYamlToMindMap(yaml)
    expect(result).not.toBeNull()
    expect(result?.topic).toBe('Root')
    expect(result?.mindmap.name).toBe('Root')
    expect(result?.mindmap.children).toHaveLength(2)
    expect(result?.mindmap.children?.[0].name).toBe('Child 1')
    expect(result?.mindmap.children?.[1].name).toBe('Child 2')
  })

  it('should parse nested implicit structure', () => {
    const yaml = `
Root:
  - Child 1:
      - Grandchild 1
  - Child 2
`
    const result = parseYamlToMindMap(yaml)
    expect(result?.mindmap.children?.[0].children).toHaveLength(1)
    expect(result?.mindmap.children?.[0].children?.[0].name).toBe('Grandchild 1')
  })

  it('should parse explicit structure', () => {
    const yaml = `
name: Root
children:
  - name: Child 1
    url: https://example.com
  - name: Child 2
    collapsed: true
`
    const result = parseYamlToMindMap(yaml)
    expect(result?.topic).toBe('Root')
    expect(result?.mindmap.name).toBe('Root')
    expect(result?.mindmap.children).toHaveLength(2)
    expect(result?.mindmap.children?.[0].url).toBe('https://example.com')
    expect(result?.mindmap.children?.[1].collapsed).toBe(true)
  })

  it('should handle multiple roots by wrapping them', () => {
    const yaml = `
- Root 1
- Root 2
`
    const result = parseYamlToMindMap(yaml)
    expect(result?.topic).toBe('Mind Map')
    expect(result?.mindmap.name).toBe('Mind Map')
    expect(result?.mindmap.children).toHaveLength(2)
    expect(result?.mindmap.children?.[0].name).toBe('Root 1')
    expect(result?.mindmap.children?.[1].name).toBe('Root 2')
  })

  it('should handle mixed types in implicit structure', () => {
    const yaml = `
Root:
  - 123
  - true
  - "quoted string"
`
    const result = parseYamlToMindMap(yaml)
    expect(result?.mindmap.children?.[0].name).toBe('123')
    expect(result?.mindmap.children?.[1].name).toBe('true')
    expect(result?.mindmap.children?.[2].name).toBe('quoted string')
  })

  it('should parse explicit structure with React example', () => {
    const yaml = `
topic: React
emoji: 🧠
children:
  组件:
    函数组件:
    类组件:
  状态管理:
    useState:
    useEffect:
  生命周期:
  事件处理:
  Hooks:
    useState:
    useEffect:
`
    const result = parseYamlToMindMap(yaml)
    expect(result?.topic).toBe('React')
    expect(result?.mindmap.name).toBe('React')
    // 检查顶级子节点数量 (组件, 状态管理, 生命周期, 事件处理, Hooks)
    expect(result?.mindmap.children).toHaveLength(5)

    // 检查具体子节点
    const components = result?.mindmap.children?.find(c => c.name === '组件')
    expect(components?.children).toHaveLength(2)
    expect(components?.children?.[0].name).toBe('函数组件')

    const hooks = result?.mindmap.children?.find(c => c.name === 'Hooks')
    expect(hooks?.children).toHaveLength(2)
  })

  it('should parse complex "Mouse" mind map correctly', () => {
    const yaml = `
topic: 鼠标
emoji: 🖱️
children:
  类型:
    有线鼠标:
    无线鼠标:
      蓝牙:
      2.4GHz:
    游戏鼠标:
    轨迹球:
    垂直鼠标:
  结构:
    外壳:
      材质:
      人体工学设计:
    按键:
      左键:
      右键:
      滚轮:
      侧键:
    传感器:
      光学传感器:
      激光传感器:
    连接接口:
      USB:
      PS/2:
  工作原理:
    移动检测:
      光学定位:
      激光定位:
    信号传输:
      有线传输:
      无线传输:
  主要品牌:
    Logitech:
    Razer:
    Microsoft:
    SteelSeries:
  选购要点:
    用途:
      办公:
      游戏:
      设计:
    手感:
      大小:
      重量:
      材质:
    性能:
      DPI:
      回报率:
      响应速度:
    价格区间:
      入门级:
      中端:
      高端:
`
    const result = parseYamlToMindMap(yaml)
    expect(result?.topic).toBe('鼠标')
    expect(result?.mindmap.name).toBe('鼠标')

    // 检查顶级子节点数量 (类型, 结构, 工作原理, 主要品牌, 选购要点)
    expect(result?.mindmap.children).toHaveLength(5)

    // 检查 "类型" 下的子节点
    const types = result?.mindmap.children?.find(c => c.name === '类型')
    expect(types?.children).toHaveLength(5)

    // 检查 "无线鼠标" 下的孙节点
    const wirelessMouse = types?.children?.find(c => c.name === '无线鼠标')
    expect(wirelessMouse?.children).toHaveLength(2)
    expect(wirelessMouse?.children?.map(c => c.name)).toContain('蓝牙')
    expect(wirelessMouse?.children?.map(c => c.name)).toContain('2.4GHz')

    // 检查 "选购要点" -> "性能"
    const selectionPoints = result?.mindmap.children?.find(c => c.name === '选购要点')
    const performance = selectionPoints?.children?.find(c => c.name === '性能')
    expect(performance?.children).toHaveLength(3)
    expect(performance?.children?.map(c => c.name)).toContain('DPI')
  })
})
