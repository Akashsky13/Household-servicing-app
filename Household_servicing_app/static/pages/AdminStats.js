const Statistics = {
  template: `
          <div class="container mt-4">
              <h2 class="mt-5">Statistics Overview</h2>
  
              <div v-if="loading" class="text-center">
                  <p>Loading statistics...</p>
              </div>
              <div v-else>
                  <div class="row">
                      <div class="col-md-4">
                          <div class="card text-center">
                              <div class="card-header bg-dark text-white">
                                  Total Active Professionals
                              </div>
                              <div class="card-body">
                                  <h5 class="card-title">{{ totalActiveProfessionals }}</h5>
                              </div>
                          </div>
                      </div>
  
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
                                  Total Blocked Users
                              </div>
                              <div class="card-body">
                                  <h5 class="card-title">{{ totalBlockedUser }}</h5>
                              </div>
                          </div>
                      </div>
  
                      <div class="col-md-4">
                          <div class="card text-center">
                              <div class="card-header bg-dark text-white">
                                  Total Customers
                              </div>
                              <div class="card-body">
                                  <h5 class="card-title">{{ totalCustomers }}</h5>
                              </div>
                          </div>
                      </div>
  
                      <div class="col-md-4">
                          <div class="card text-center">
                              <div class="card-header bg-dark text-white">
                                  Total Professionals
                              </div>
                              <div class="card-body">
                                  <h5 class="card-title">{{ totalProfessionals }}</h5>
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
                      <h5>Customer and Professional Counts</h5>
                      <div class="chart-container">
                          <canvas ref="customerProfessionalChart"></canvas>
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
      totalActiveProfessionals: 0,
      totalServiceRequests: 0,
      totalBlockedUser: 0,
      totalCustomers: 0,
      totalProfessionals: 0,
      averageRating: 0,
      statusData: {
        Pending: 0,
        Accepted: 0,
        Completed: 0,
      },
      loading: true,
      customerProfessionalChart: null, // New property for the chart instance
    };
  },

  methods: {
    async fetchStatistics() {
      this.loading = true;
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          alert("You are not logged in. Please log in to continue.");
          return;
        }

        const res = await fetch(`${window.location.origin}/api/statistics`, {
          method: "GET",
          headers: {
            "Authentication-Token": token,
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            `Error fetching statistics: ${errorData.error || res.statusText}`
          );
        }

        const data = await res.json();
        this.totalActiveProfessionals = data.totalActiveProfessionals;
        this.totalServiceRequests = data.totalServiceRequests;
        this.totalBlockedUser = data.totalBlockedUser;
        this.totalCustomers = data.totalCustomers;
        this.totalProfessionals = data.totalProfessionals;
        this.averageRating = data.averageRating;
        this.statusData = data.statusData;

        this.renderCharts(); // Call to render charts
      } catch (error) {
        console.error(`Error fetching statistics: ${error.message}`);
        alert(
          `Error fetching statistics. Please try again later. ${error.message}`
        );
      } finally {
        this.loading = false;
      }
    },

    renderCharts() {
      // Delay rendering to ensure DOM is fully loaded
      setTimeout(() => {
        this.renderCustomerProfessionalChart();
        this.renderStatusChart();
      }, 100); // Adjust the delay as necessary
    },

    renderCustomerProfessionalChart() {
      const ctx = this.$refs.customerProfessionalChart.getContext("2d");
      console.log(ctx); // Debugging log

      // Remove any existing chart instance if it exists
      if (this.customerProfessionalChart) {
        this.customerProfessionalChart.destroy();
      }

      this.customerProfessionalChart = new Chart(ctx, {
        type: "pie", // Change the type to 'pie'
        data: {
          labels: ["Total Customers", "Total Professionals"],
          datasets: [
            {
              label: "Count",
              data: [this.totalCustomers, this.totalProfessionals],
              backgroundColor: [
                "rgba(75, 192, 192, 0.6)", // Color for Total Customers
                "rgba(153, 102, 255, 0.6)", // Color for Total Professionals
              ],
              borderColor: [
                "rgba(75, 192, 192, 1)", // Border color for Total Customers
                "rgba(153, 102, 255, 1)", // Border color for Total Professionals
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 1, // Optional: control the aspect ratio (1:1 for square)
          plugins: {
            legend: {
              position: "top",
            },
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  return `${tooltipItem.label}: ${tooltipItem.raw}`;
                },
              },
            },
          },
        },
      });
    },

    renderStatusChart() {
      const ctx = this.$refs.statusChart.getContext("2d");
      console.log(ctx); // Debugging log

      // Remove any existing chart instance if it exists
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
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 1, // Optional: control the aspect ratio (1:1 for square)
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
    this.fetchStatistics(); // Call to fetch statistics once the component is mounted
  },
};

export default Statistics;
