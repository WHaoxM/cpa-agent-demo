// D3 图表数据类型

export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface LineChartData {
  x: string | number
  y: number
  series?: string
}

export interface PieChartData {
  name: string
  value: number
}

export interface RadarChartData {
  axis: string
  value: number
}
