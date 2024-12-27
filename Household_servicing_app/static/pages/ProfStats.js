const ProfessionalStatistics = {
  template: `
    <div class="container mt-4">
        <h2 class="mt-5">Professional Dashboard</h2>

        <div v-if="loading" class="text-center">
            <p>Loading statistics...</p>
        </div>
        <div v-else>
            <div class="row">
                <div class="col-md-4">
                    <div class="card text-center">
                        <div class="card-header bg-dark text-white">
                            Total Service Requests
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">{{ totalServiceRequests }}</h5>
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card text-center">
                        <div class="card-header bg-dark text-white">
                            Completed Service Requests
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">{{ totalCompletedServices }}</h5>
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card text-center">
                        <div class="card-header bg-dark text-white">
                            Average Rating
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">{{ averageRating.toFixed(2) }}</h5>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-5">
                <h5>Service Requests Status Distribution</h5>
                <div class="chart-container">
                    <canvas ref="statusChart"></canvas>
                </div>
            </div>
        </div>
    </div>
  `,

  data() {
    return {
      totalServiceRequests: 0,
      totalCompletedServices: 0,
      averageRating: 0,
      statusData: {
        Pending: 0,
        Accepted: 0,
        Completed: 0,
        Canceled: 0,
      },
      loading: true,
      statusChart: null, // Reference to the chart instance
    };
  },

  methods: {
    async fetchProfessionalStatistics() {
      this.loading = true;
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          alert("You are not logged in. Please log in to continue.");
          return;
        }

        const res = await fetch(`${window.location.origin}/api/professional_statistics`, {
          method: "GET",
          headers: {
            "Authentication-Token": token,
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(`Error fetching statistics: ${errorData.error || res.statusText}`);
        }

        const data = await res.json();
        this.totalServiceRequests = data.totalServiceRequests;
        this.totalCompletedServices = data.totalCompletedServices;
        this.averageRating = data.averageRating;
        this.statusData = data.statusData;

        this.renderCharts(); // Render charts after data is fetched
      } catch (error) {
        console.error(`Error fetching statistics: ${error.message}`);
        alert(`Error fetching statistics. Please try again later. ${error.message}`);
      } finally {
        this.loading = false;
      }
    },

    renderCharts() {
      setTimeout(() => {
        this.renderStatusChart();
      }, 100);
    },

    renderStatusChart() {
      const ctx = this.$refs.statusChart.getContext("2d");

      // Remove any existing chart instance
      if (this.statusChart) {
        this.statusChart.destroy();
      }

      this.statusChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: Object.keys(this.statusData),
          datasets: [
            {
              label: "Number of Requests",
              data: Object.values(this.statusData),
              backgroundColor: [
                "rgba(255, 99, 132, 0.2)",
                "rgba(54, 162, 235, 0.2)",
                "rgba(255, 206, 86, 0.2)",
                "rgba(75, 192, 192, 0.2)"
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)"
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 1,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    },
  },

  mounted() {
    this.fetchProfessionalStatistics();
  },
};

export default ProfessionalStatistics;
