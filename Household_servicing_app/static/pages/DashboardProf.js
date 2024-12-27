const DashboardProf = {
  template: `
    <div class="container mt-4">
      <!-- New Service Requests Section -->
      <h2 class="mt-5">Service Requests</h2>
      <div v-if="serviceRequests.length === 0">
        <p>No service requests available.</p>
      </div>
      <div v-else class="table-responsive">
        <table class="table table-bordered table-striped">
          <thead class="thead-dark">
            <tr>
              <th>Request ID</th>
              <th>Customer Full Name</th>
              <th>Customer Location</th>
              <th>Customer mobile num</th>
              <th>Date of Request</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in serviceRequests" :key="request.id">
              <td>{{ request.id }}</td>
              <td>{{ request.customer_full_name || 'N/A' }}</td>
              <td>{{ request.customer_location || 'N/A' }}</td>
              <td>{{ request.customer_mobile || 'N/A' }}</td>
              <td>{{ new Date(request.date_of_request).toLocaleString() }}</td>
              <td>{{ request.service_status }}</td>
              <td>{{ request.remarks || 'N/A' }}</td>
              <td>
                <button v-if="request.service_status === 'Pending'" class="btn btn-success btn-sm" @click="acceptRequest(request.id)">Accept</button>
                <button v-if="request.service_status === 'Pending'" class="btn btn-danger btn-sm" @click="rejectRequest(request.id)">Reject</button>
                <button v-if="request.service_status === 'Accepted'" class="btn btn-warning btn-sm" @click="closeRequest(request.id)">Complete</button>
                <button v-if="request.service_status === 'Accepted'" class="btn btn-danger btn-sm" @click="cancelRequest(request.id)">Cancel</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,

  data() {
    return {
      serviceRequests: [], // Array to hold service requests for the professional
    };
  },

  methods: {
    async fetchServiceRequests() {
      try {
        const res = await fetch(`${window.location.origin}/api/professional/requests`, {
          method: 'GET',
          headers: {
            "Authentication-Token": sessionStorage.getItem("token"),
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(`Error fetching service requests: ${errorData.error || res.statusText}`);
        }

        this.serviceRequests = await res.json();
      } catch (error) {
        console.error(`Error fetching service requests: ${error.message}`);
        alert("Error fetching service requests. Please try again later.");
      }
    },

    async acceptRequest(requestId) {
      const token = sessionStorage.getItem("token");

      if (!token) {
        alert("You must be logged in to accept this request.");
        this.$router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${window.location.origin}/api/professional/requests/${requestId}/accept`, {
          method: 'PATCH',
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": token,
          },
        });

        if (res.ok) {
          alert("Request accepted successfully!");
          await this.fetchServiceRequests(); // Refresh the list of requests
        } else {
          const errorData = await res.json();
          alert(`Error accepting request: ${errorData.error}`);
        }
      } catch (error) {
        console.error(`Error accepting request: ${error.message}`);
        alert("Error accepting request. Please try again later.");
      }
    },

    async rejectRequest(requestId) {
      const token = sessionStorage.getItem("token");

      if (!token) {
        alert("You must be logged in to reject this request.");
        this.$router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${window.location.origin}/api/professional/requests/${requestId}/reject`, {
          method: 'PATCH',
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": token,
          },
        });

        if (res.ok) {
          alert("Request rejected successfully!");
          await this.fetchServiceRequests(); // Refresh the list of requests
        } else {
          const errorData = await res.json();
          alert(`Error rejecting request: ${errorData.error}`);
        }
      } catch (error) {
        console.error(`Error rejecting request: ${error.message}`);
        alert("Error rejecting request. Please try again later.");
      }
    },

    async closeRequest(requestId) {
      const token = sessionStorage.getItem("token");

      if (!token) {
        alert("You must be logged in to close this request.");
        this.$router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${window.location.origin}/api/professional/requests/${requestId}/close`, {
          method: 'PATCH',
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": token,
          },
        });

        if (res.ok) {
          alert("Request completed successfully!");
          await this.fetchServiceRequests(); // Refresh the list of requests
        } else {
          const errorData = await res.json();
          alert(`Error closing request: ${errorData.error}`);
        }
      } catch (error) {
        console.error(`Error closing request: ${error.message}`);
        alert("Error closing request. Please try again later.");
      }
    },

    async cancelRequest(requestId) {
      const token = sessionStorage.getItem("token");

      if (!token) {
        alert("You must be logged in to cancel this request.");
        this.$router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${window.location.origin}/api/professional/requests/${requestId}/cancel`, {
          method: 'PATCH',
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": token,
          },
        });

        if (res.ok) {
          alert("Request cancelled successfully!");
          await this.fetchServiceRequests(); // Refresh the list of requests
        } else {
          const errorData = await res.json();
          alert(`Error cancelling request: ${errorData.error}`);
        }
      } catch (error) {
        console.error(`Error cancelling request: ${error.message}`);
        alert("Error cancelling request. Please try again later.");
      }
    },
  },

  async created() {
    // Fetch service requests on component creation
    await this.fetchServiceRequests();
  },
};

export default DashboardProf;
