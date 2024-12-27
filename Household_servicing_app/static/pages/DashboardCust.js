const DashboardCust = {
  template: `
        <div class="container mt-4">
          <!-- Active Professionals Section -->
          <h3 class="mt-5">Active Professionals</h3>
          <!-- Search Bar Section -->
              <div class="search-bar">
                <input type="text" v-model="search.location" placeholder="Location" />
                <input type="text" v-model="search.service" placeholder="Service Type" />
                <button class="btn btn-primary" @click="fetchActiveProfessionals">Search</button>
              </div>
          <div v-if="activeProfessionals.length === 0">
            <p>No active professionals found.</p>
          </div>
          <div v-else class="table-responsive">
            <table class="table table-bordered table-striped">
              <thead class="thead-dark">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Service Type</th>
                  <th>Experience</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="prof in activeProfessionals" :key="prof.id">
                  <td>{{ prof.full_name }}</td>
                  <td>{{ prof.email }}</td>
                  <td>{{ prof.mobile || 'N/A' }}</td>
                  <td>{{ prof.service_type || 'N/A' }}</td>
                  <td>{{ prof.experience_years || 'N/A' }} years</td>
                  <td>
                  <div class="star-rating" v-html="renderStars(prof.average_rating)"></div>{{ prof.average_rating ? prof.average_rating : 'N/A' }}
                   </td>

                  <td>
                    <textarea v-model="remarks[prof.id]" class="small-textarea" placeholder="Enter your remarks"></textarea>

                    <button class="btn btn-success btn-sm" @click="requestService(prof)" style="margin-bottom:32px;">Request</button>
                  </td>

                </tr>
              </tbody>
            </table>
          </div>

          <!-- Service Request History Section -->
          <h3 class="mt-5">Service Request History</h3>
          <div v-if="serviceRequests.length === 0">
            <p>You did not request any service yet</p>
          </div>
          <div v-else class="table-responsive">
            <table class="table table-bordered table-striped">
              <thead class="thead-dark">
                <tr>
                  <th>Professional Name</th>
                  <th>Service Type</th>
                  <th>Date of Request</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="request in serviceRequests" :key="request.id">
                  <td>{{ request.professional.full_name }}</td>
                  <td>{{ request.service.name }}</td>
                  <td>{{ new Date(request.date_of_request).toLocaleString() }}</td>
                  <td>{{ request.service_status }}</td>
                  <td>{{ request.remarks || 'N/A' }}</td>
                  <td>
                    <!-- Change Close button to Complete -->
                    <button v-if="request.service_status === 'Accepted'" class="btn btn-success btn-sm" @click="completeServiceRequest(request.id)">Completed</button>
                    
                    <!-- New Cancel button -->
                    <button v-if="request.service_status !== 'Completed'" class="btn btn-danger btn-sm" @click="cancelServiceRequest(request.id)">Cancel</button>
                    
                    <button v-if="request.service_status === 'Completed' || request.service_status === 'Accepted'" class="btn btn-info btn-sm" @click="openReviewForm(request)" style="background-color:#9b62ff;">Review</button>

                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Review Form Modal -->
          <div v-if="showReviewForm" class="modal">
            <div class="modal-content">
              <span class="close" @click="closeReviewForm">&times;</span>
              <h2>Submit Review for {{ currentProfessional?.full_name }}</h2>
              <div>
                <label for="rating">Rating (1-5):</label>
                <input type="number" v-model="review.rating" min="1" max="5" required />
              </div>
              <div>
                <label for="reviewText">Review:</label>
                <textarea v-model="review.text" required></textarea>
              </div>
              <button @click="submitReview">Submit Review</button>
            </div>
          </div>
        </div>
      `,

  data() {
    return {
      activeProfessionals: [],
      serviceRequests: [],
      showReviewForm: false,
      currentProfessional: null,
      currentRequestId: null,
      review: {
        rating: null,
        text: "",
      },
      search: {
        location: "",
        service: "",
      },
      remarks: {}
    };
  },
  methods: {
    async completeServiceRequest(requestId) {
      const token = sessionStorage.getItem("token");

      if (!token) {
        alert("You must be logged in to complete this request.");
        this.$router.push("/login");
        return;
      }

      try {
        const res = await fetch(
          `${window.location.origin}/api/service_requests/complete/${requestId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Authentication-Token": token,
            },
            body: JSON.stringify({
              service_status: "Completed",
            }),
          }
        );

        if (res.ok) {
          alert("Service request completed successfully!");
          await this.fetchServiceRequestHistory(); // Refresh the request history
        } else {
          const errorData = await res.json();
          alert(`Error completing service request: ${errorData.error}`);
        }
      } catch (error) {
        console.error("Error completing service request:", error);
        alert("Error completing service request. Please try again later.");
      }
    },

    async cancelServiceRequest(requestId) {
      const token = sessionStorage.getItem("token");

      if (!token) {
        alert("You must be logged in to cancel this request.");
        this.$router.push("/login");
        return;
      }

      try {
        const res = await fetch(
          `${window.location.origin}/api/service_requests/cancel/${requestId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Authentication-Token": token,
            },
            body: JSON.stringify({
              service_status: "Canceled",
            }),
          }
        );

        if (res.ok) {
          alert("Service request canceled successfully!");
          await this.fetchServiceRequestHistory(); // Refresh the request history
        } else {
          const errorData = await res.json();
          alert(`Error canceling service request: ${errorData.error}`);
        }
      } catch (error) {
        console.error("Error canceling service request:", error);
        alert("Error canceling service request. Please try again later.");
      }
    },
    async fetchActiveProfessionals() {
      try {
        const params = new URLSearchParams();
        if (this.search.location) {
          params.append("location", this.search.location);
        }
        if (this.search.service) {
          params.append("service", this.search.service);
        }

        const res = await fetch(
          `${window.location.origin}/active_professional?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Authentication-Token": sessionStorage.getItem("token"),
            },
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            `Error fetching active professionals: ${
              errorData.error || res.statusText
            }`
          );
        }

        this.activeProfessionals = await res.json();
        console.log("Active Professionals Data:", this.activeProfessionals);
      } catch (error) {
        console.error(`Error fetching active professionals: ${error.message}`);
        alert("Error fetching active professionals. Please try again later.");
      }
    },

    async fetchServiceRequestHistory() {
      try {
        const res = await fetch(
          `${window.location.origin}/api/service_requests/history`,
          {
            method: "GET",
            headers: {
              "Authentication-Token": sessionStorage.getItem("token"),
            },
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            `Error fetching service request history: ${
              errorData.error || res.statusText
            }`
          );
        }

        this.serviceRequests = await res.json();
        console.log("Fetched service requests:", this.serviceRequests);
      } catch (error) {
        console.error(
          `Error fetching service request history: ${error.message}`
        );
        alert(
          "Error fetching service request history. Please try again later."
        );
      }
    },

    async requestService(professional) {
      const token = sessionStorage.getItem("token");
    
      if (!token) {
        alert("You must be logged in to make this request.");
        this.$router.push("/login");
        return;
      }
    
      if (!professional.service_ids || professional.service_ids.length === 0) {
        alert(`No service IDs available for ${professional.full_name}.`);
        return;
      }
    
      const serviceId = professional.service_ids[0]; // Use the first service_id
      const professionalId = professional.id; // Get the professional ID
    
      try {
        const res = await fetch(
          `${window.location.origin}/api/service_requests`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authentication-Token": token,
            },
            body: JSON.stringify({
              professional_id: professionalId,
              service_id: serviceId,
              remarks: this.remarks[professional.id] || "No specific remarks" // Pass the customer remarks
            }),
          }
        );
    
        if (res.ok) {
          alert("Service request submitted successfully!");
          await this.fetchServiceRequestHistory(); // Refresh the request history
        } else {
          const errorData = await res.json();
          if (res.status === 401) {
            alert("Session expired. Please log in again.");
            this.$router.push("/login");
          } else {
            alert(`Error requesting service: ${errorData.error}`);
          }
        }
      } catch (error) {
        console.error("Error requesting service:", error);
        alert("Error requesting service. Please try again later.");
      }
    },
    

    async closeServiceRequest(requestId) {
      const token = sessionStorage.getItem("token");

      if (!token) {
        alert("You must be logged in to close this request.");
        this.$router.push("/login");
        return;
      }

      try {
        const res = await fetch(
          `${window.location.origin}/api/service_requests/close/${requestId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Authentication-Token": token,
            },
            body: JSON.stringify({
              service_status: "Canceled",
            }),
          }
        );

        if (res.ok) {
          alert("Service request canceled successfully!");
          await this.fetchServiceRequestHistory(); // Refresh the request history
        } else {
          const errorData = await res.json();
          alert(`Error closing service request: ${errorData.error}`);
        }
      } catch (error) {
        console.error("Error closing service request:", error);
        alert("Error closing service request. Please try again later.");
      }
    },

    openReviewForm(request) {
      console.log("Opening review form for request:", request);
      this.currentProfessional = request.professional;
      this.currentRequestId = request.id; // Set the current service request ID
      this.showReviewForm = true; // Show the review form
      this.review = { rating: null, text: "" }; // Reset review data
    },

    closeReviewForm() {
      this.showReviewForm = false; // Hide the review form
      this.currentProfessional = null; // Clear current professional
    },

    async submitReview() {
      const token = sessionStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to submit a review.");
        this.$router.push("/login");
        return;
      }

      const rating = parseInt(this.review.rating, 10);
      console.log("Rating being submitted:", rating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        alert("Rating must be a number between 1 and 5.");
        return;
      }

      if (!this.currentRequestId) {
        alert("Service request ID is missing.");
        return;
      }

      try {
        const res = await fetch(
          `${window.location.origin}/api/service_requests/${this.currentRequestId}/review`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authentication-Token": token,
            },
            body: JSON.stringify({
              rating: rating,
              review_text: this.review.text,
            }),
          }
        );

        if (res.ok) {
          alert("Review submitted successfully!");
          await this.fetchServiceRequestHistory(); // Refresh service request history
          this.closeReviewForm(); // Close form on success
        } else {
          const errorData = await res.json();
          console.log("Error data:", errorData); // Log for debugging
          alert(`Error submitting review: ${errorData.error}`);
        }
      } catch (error) {
        console.error("Error submitting review:", error); // Log error details
        alert("Error submitting review. Please try again later.");
      }
    },
    renderStars(rating) {
      if (!rating) {
        return ""; // Return 'No rating' if not available
      }

      const fullStars = Math.floor(rating); // Full stars
      const halfStar = rating % 1 !== 0; // Half star
      const emptyStars = 5 - fullStars - (halfStar ? 1 : 0); // Empty stars

      let stars = "";

      // Add full stars
      stars += "★".repeat(fullStars);

      // Add half star if needed
      if (halfStar) {
        stars += '<span class="half-star">★</span>';
      }

      // Add empty stars
      stars += "☆".repeat(emptyStars);

      return stars;
    },
  },

  async created() {
    // Fetch Active Professionals and Service Request History on component creation
    await this.fetchActiveProfessionals();
    await this.fetchServiceRequestHistory();
  },
};

export default DashboardCust;
