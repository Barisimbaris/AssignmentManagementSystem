// Performans grafiği için veriler
const labels = ['Öğrenci 1', 'Öğrenci 2', 'Öğrenci 3', 'Öğrenci 4', 'Öğrenci 5'];
const data = [85, 90, 78, 92, 88]; // Öğrencilerin puanları

// Grafik oluşturulması
const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: labels, // Öğrenci isimleri
    datasets: [{
      label: 'Öğrenci Performansı',
      data: data, // Öğrencilerin başarı puanları
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});
