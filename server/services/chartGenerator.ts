import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import type { ChartConfiguration } from 'chart.js';

const width = 800;
const height = 400;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });

export interface MetricData {
  label: string;
  value: number;
  unit?: string;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

export interface RiskItem {
  category: string;
  likelihood: number;
  impact: number;
}

export async function generateBarChart(
  title: string,
  metrics: MetricData[],
  color: string = '#0066CC'
): Promise<Buffer> {
  const configuration: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: metrics.map(m => m.label),
      datasets: [{
        label: title,
        data: metrics.map(m => m.value),
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 18,
            weight: 'bold'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: 12
            }
          }
        },
        x: {
          ticks: {
            font: {
              size: 12
            }
          }
        }
      }
    }
  };

  return chartJSNodeCanvas.renderToBuffer(configuration);
}

export async function generateLineChart(
  title: string,
  data: TimeSeriesData
): Promise<Buffer> {
  const configuration: ChartConfiguration = {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: data.datasets.map(ds => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.color,
        backgroundColor: ds.color + '20',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }))
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 18,
            weight: 'bold'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: 12
            }
          }
        },
        x: {
          ticks: {
            font: {
              size: 12
            }
          }
        }
      }
    }
  };

  return chartJSNodeCanvas.renderToBuffer(configuration);
}

export async function generateRiskMatrix(risks: RiskItem[]): Promise<Buffer> {
  const bubbleData = risks.map(risk => ({
    x: risk.likelihood,
    y: risk.impact,
    r: 15,
    label: risk.category
  }));

  const configuration: ChartConfiguration = {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Risk Assessment',
        data: bubbleData.map(b => ({ x: b.x, y: b.y })),
        backgroundColor: risks.map(r => {
          if (r.likelihood > 7 && r.impact > 7) return '#DC2626';
          if (r.likelihood > 5 || r.impact > 5) return '#F59E0B';
          return '#10B981';
        }),
        borderColor: '#333',
        borderWidth: 2,
        pointRadius: 12,
        pointHoverRadius: 15
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Risk Assessment Matrix',
          font: {
            size: 18,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const index = context.dataIndex;
              return risks[index]?.category || 'Risk';
            }
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 10,
          title: {
            display: true,
            text: 'Likelihood',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          ticks: {
            font: {
              size: 12
            }
          }
        },
        y: {
          min: 0,
          max: 10,
          title: {
            display: true,
            text: 'Impact',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          ticks: {
            font: {
              size: 12
            }
          }
        }
      }
    }
  };

  return chartJSNodeCanvas.renderToBuffer(configuration);
}

export async function generateDonutChart(
  title: string,
  data: { label: string; value: number; color: string }[]
): Promise<Buffer> {
  const configuration: ChartConfiguration = {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => d.value),
        backgroundColor: data.map(d => d.color),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 18,
            weight: 'bold'
          }
        }
      }
    }
  };

  return chartJSNodeCanvas.renderToBuffer(configuration);
}
