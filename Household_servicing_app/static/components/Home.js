const Home = {
  template: `
    <div class="home">
      <!-- Banner Section -->
      <section class="banner">
        <img src="static/images/design.jpeg" alt="HomeServicePro Banner">
        <div class="banner-content">
          
          <router-link to="/signup">
            <button class="cta-button">Get Started</button>
          </router-link>
        </div>
      </section>

      <!-- Services Section -->
      <section class="services">
        <h2>Our Top Services</h2>
        <div class="service-list">
          <div class="service-item">
            <img src="static/images/claning.png" alt="Cleaning Service">
            <h3>Cleaning</h3>
            <p>Book professional home cleaning services anytime.</p>
          </div>
          <div class="service-item">
            <img src="static/images/plumber.png" alt="Plumbing Service">
            <h3>Plumbing</h3>
            <p>Get expert plumbers for repairs and installations.</p>
          </div>
          <div class="service-item">
            <img src="static/images/electrician.png" alt="Electrical Service">
            <h3>Electrical</h3>
            <p>Fix electrical issues quickly with our certified technicians.</p>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="how-it-works">
        <h2>How It Works</h2>
        <div class="steps">
          <div class="step">
            <h3>Step 1</h3>
            <p>Choose a service and book a time slot.</p>
          </div>
          <div class="step">
            <h3>Step 2</h3>
            <p>A professional will come to your location.</p>
          </div>
          <div class="step">
            <h3>Step 3</h3>
            <p>Sit back and enjoy a well-maintained home!</p>
          </div>
        </div>
      </section>

      <!-- Testimonials Section -->
      <section class="testimonials">
        <h2>What Our Customers Say</h2>
        <div class="testimonial-item">
          <p>"Amazing service! My house has never been this clean."</p>
          <h4>- Akash M.</h4>
        </div>
        <div class="testimonial-item">
          <p>"Quick and efficient repair of my kitchen sink."</p>
          <h4>- Sachin G.</h4>
        </div>
      </section>

      <!-- Footer Section -->
      <footer>
        <p>Contact us: 9696601137 | support@householdservice.com</p>
      </footer>
    </div>
  `,
};

export default Home;
