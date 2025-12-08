// Grafik için veri oluşturma
function generateChartData(labels, data) {
    return {
      labels: labels,
      datasets: [{
        label: 'Öğrenci Performansı',
        data: data,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    };
  }
  