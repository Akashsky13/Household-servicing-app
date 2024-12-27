const CustomerDashboard = {
  template: `
    <div class="container mt-4">
      <h2 class="mt-5">Customer Dashboard</h2>

      <div v-if="loading" class="text-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Loading...</span>
        </div>
        <p>Loading dashboard...</p>
      </div>

      <div v-else>
        <div class="row">
          <div class="col-md-4" v-for="(card, index) in dashboardCards" :key="index">
            <div class="card text-center">
              <div class="card-header bg-dark text-white">
                {{ card.title }}
              </div>
              <div class="card-body">
                <h5 class="card-title">{{ card.value }}</h5>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5">
          <h5>Most Requested Service</h5>
          <h6>{{ mostRequestedService }}</h6>
        </div>

        <div class="mt-5">
          <h5>Last Service Request Date</h5>
          <h6>{{ lastServiceRequestDate }}</h6>
        </div>

        <div class="mt-5">
          <h5>Total Service Professionals Engaged</h5>
          <h6>{{ totalProfessionalsEngaged }}</h6>
        </div>

        <div v-if="spendingByService && Object.keys(spendingByService).length" class="mt-5">
          <canvas id="spendingChart" style="max-width: 100%; height: auto;" width="400" height="200"></canvas>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      totalServiceRequests: 0,
      pendingRequests: 0,
      completedRequests: 0,
      cancelledRequests: 0,
      averageRating: 0,
      totalSpending: 0,
      spendingByService: null,
      mostRequestedService: '',
      lastServiceRequestDate: '',
      totalProfessionalsEngaged: 0,
      loading: true,
      spendingChart: null,
    };
  },

  computed: {
    dashboardCards() {
      return [
        { title: 'Total Service Requests', value: this.totalServiceRequests },
        { title: 'Pending Service Requests', value: this.pendingRequests },
        { title: 'Completed Service Requests', value: this.completedRequests },
        { title: 'Cancelled Service Requests', value: this.cancelledRequests },
        { title: 'Average Rating of Services', value: this.averageRating.toFixed(2) },
        { title: 'Total Spending', value: this.totalSpending.toFixed(2) },
      ];
    },
  },

  methods: {
    async fetchDashboardData() {
      this.loading = true;
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          this.showError('You are not logged in. Please log in to continue.');
          return;
        }

        const res = await fetch(`${window.location.origin}/api/customer/statistics`, {
          method: 'GET',
          headers: {
            'Authentication-Token': token,
          },
        });

        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`Error fetching dashboard data: ${errorData.error || res.statusText}`);
          }

          const data = await res.json();
          this.totalServiceRequests = data.totalServiceRequests;
          this.pendingRequests = data.pendingRequests;
          this.completedRequests = data.completedRequests;
          this.cancelledRequests = data.cancelledRequests;
          this.averageRating = data.averageRating;
          this.spendingByService = data.spendingByService;
          this.totalSpending = data.totalSpending;
          this.mostRequestedService = data.mostRequestedService;
          this.lastServiceRequestDate = data.lastServiceRequestDate;
          this.totalProfessionalsEngaged = data.totalProfessionalsEngaged;

          // Use nextTick to ensure the DOM is fully updated before creating the chart
          this.$nextTick(() => {
            this.createSpendingChart();
          });
        } else {
          const errorText = await res.text();
          console.error(`Non-JSON response received: ${errorText}`);
          throw new Error('Received an unexpected response format. Please check your request.');
        }
      } catch (error) {
        console.error(`Error fetching dashboard data: ${error.message}`);
        this.showError(`Error fetching dashboard data. Please try again later. ${error.message}`);
      } finally {
        this.loading = false;
      }
    },


    createSpendingChart() {
      const ctx = document.getElementById('spendingChart');
      console.log('Canvas element:', ctx); // Add this line to check if the canvas is found
      
      // Check if spendingByService has data
      if (!ctx) {
        console.error('Canvas element not found');
        return; // Exit if the canvas is not found
      }
    
      if (!this.spendingByService || Object.keys(this.spendingByService).length === 0) {
        console.error('No spending data available to render the chart');
        return;
      }
    
      // Destroy previous chart instance if exists
      if (this.spendingChart) {
        this.spendingChart.destroy();
      }
    
      const context = ctx.getContext('2d');
      const labels = Object.keys(this.spendingByService);
      const data = Object.values(this.spendingByService);
    
      this.spendingChart = new Chart(context, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Spending by Service',
            data: data,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          },
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
    

  },

  mounted() {
    this.fetchDashboardData();
  },
};

export default CustomerDashboard;
