/**
 * Chart.js utility functions for analytics visualization
 */

// Store chart instances to prevent duplicates
const chartInstances = {};

export function createLineChart(canvasId, labels, datasets, title = '') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.warn(`Canvas element with id "${canvasId}" not found`);
    return null;
  }
  
  // Destroy existing chart if it exists
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }
  
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets.map((dataset, index) => ({
        label: dataset.label,
        data: dataset.data,
        borderColor: dataset.borderColor || getChartColor(index),
        backgroundColor: (dataset.borderColor || getChartColor(index)) + '15',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: dataset.borderColor || getChartColor(index),
        pointBorderWidth: 0,
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 12, weight: '500' }
          }
        },
        title: {
          display: !!title,
          text: title,
          font: { size: 14, weight: 'bold' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
  
  chartInstances[canvasId] = chart;
  return chart;
}

export function createBarChart(canvasId, labels, datasets, title = '') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.warn(`Canvas element with id "${canvasId}" not found`);
    return null;
  }
  
  // Destroy existing chart if it exists
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }
  
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets.map((dataset, index) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: dataset.backgroundColor || getChartColor(index),
        borderColor: (dataset.backgroundColor || getChartColor(index)) + 'dd',
        borderWidth: 1,
        borderRadius: 8,
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 12, weight: '500' }
          }
        },
        title: {
          display: !!title,
          text: title,
          font: { size: 14, weight: 'bold' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
  
  chartInstances[canvasId] = chart;
  return chart;
}

export function createPieChart(canvasId, labels, data, title = '') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.warn(`Canvas element with id "${canvasId}" not found`);
    return null;
  }
  
  // Destroy existing chart if it exists
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }
  
  const chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#ec4899',
          '#06b6d4',
          '#f97316'
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 12, weight: '500' }
          }
        },
        title: {
          display: !!title,
          text: title,
          font: { size: 14, weight: 'bold' }
        }
      }
    }
  });
  
  chartInstances[canvasId] = chart;
  return chart;
}

export function createDoughnutChart(canvasId, labels, data, title = '') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.warn(`Canvas element with id "${canvasId}" not found`);
    return null;
  }
  
  // Destroy existing chart if it exists
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }
  
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#ec4899',
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 12, weight: '500' }
          }
        },
        title: {
          display: !!title,
          text: title,
          font: { size: 14, weight: 'bold' }
        }
      }
    }
  });
  
  chartInstances[canvasId] = chart;
  return chart;
}

function getChartColor(index) {
  const colors = [
    '#3b82f6',  // blue
    '#10b981',  // green
    '#f59e0b',  // amber
    '#ef4444',  // red
    '#8b5cf6',  // purple
    '#ec4899',  // pink
    '#06b6d4',  // cyan
    '#f97316',  // orange
  ];
  return colors[index % colors.length];
}

/**
 * Parse Firebase data into chart-friendly format
 */
export function parseHealthMetrics(data) {
  const metrics = {
    labels: [],
    datasets: []
  };
  
  if (!data) return metrics;
  
  // Extract numeric values for line chart
  const numericData = {};
  
  for (const key in data) {
    if (typeof data[key] === 'number') {
      numericData[key] = data[key];
    }
  }
  
  metrics.labels = Object.keys(numericData);
  metrics.datasets = [{
    label: 'Health Metrics',
    data: Object.values(numericData),
  }];
  
  return metrics;
}

export function parseActivityData(data) {
  if (!data) return { labels: [], datasets: [] };
  
  // Group data by type and count occurrences
  const activityMap = {};
  
  function countEntries(obj, prefix = '') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          countEntries(obj[key], fullKey);
        } else {
          activityMap[fullKey] = (activityMap[fullKey] || 0) + 1;
        }
      }
    }
  }
  
  countEntries(data);
  
  return {
    labels: Object.keys(activityMap).slice(0, 8),
    datasets: [{
      label: 'Data Points',
      data: Object.values(activityMap).slice(0, 8),
    }]
  };
}
