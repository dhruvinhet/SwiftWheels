
const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");
const menuBtnIcon = menuBtn.querySelector("i");

menuBtn.addEventListener("click", (e) => {
  navLinks.classList.toggle("open");

  const isOpen = navLinks.classList.contains("open");
  menuBtnIcon.setAttribute("class", isOpen ? "ri-close-line" : "ri-menu-line");
});

navLinks.addEventListener("click", (e) => {
  navLinks.classList.remove("open");
  menuBtnIcon.setAttribute("class", "ri-menu-line");
});

const scrollRevealOption = {
  origin: "bottom",
  distance: "50px",
  duration: 1000,
};

ScrollReveal().reveal(".header__container h1", {
  ...scrollRevealOption,
});
ScrollReveal().reveal(".header__container form", {
  ...scrollRevealOption,
  delay: 500,
});
ScrollReveal().reveal(".header__container img", {
  ...scrollRevealOption,
  delay: 1000,
});

ScrollReveal().reveal(".range__card", {
  duration: 1000,
  interval: 500,
});

ScrollReveal().reveal(".location__image img", {
  ...scrollRevealOption,
  origin: "right",
});
ScrollReveal().reveal(".location__content .section__header", {
  ...scrollRevealOption,
  delay: 500,
});
ScrollReveal().reveal(".location__content p", {
  ...scrollRevealOption,
  delay: 1000,
});
ScrollReveal().reveal(".location__content .location__btn", {
  ...scrollRevealOption,
  delay: 1500,
});

const selectCards = document.querySelectorAll(".select__card");
selectCards[0].classList.add("show__info");

const price = ["225", "455", "275", "625", "395"];

const priceEl = document.getElementById("select-price");

function updateSwiperImage(eventName, args) {
  if (eventName === "slideChangeTransitionStart") {
    const index = args && args[0].realIndex;
    priceEl.innerText = price[index];
    selectCards.forEach((item) => {
      item.classList.remove("show__info");
    });
    selectCards[index].classList.add("show__info");
  }
}

const swiper = new Swiper(".swiper", {
  loop: true,
  effect: "coverflow",
  grabCursor: true,
  centeredSlides: true,
  slidesPerView: "auto",
  coverflowEffect: {
    rotate: 0,
    depth: 500,
    modifier: 1,
    scale: 0.75,
    slideShadows: false,
    stretch: -100,
  },

  onAny(event, ...args) {
    updateSwiperImage(event, args);
  },
});

ScrollReveal().reveal(".story__card", {
  ...scrollRevealOption,
  interval: 500,
});

const banner = document.querySelector(".banner__wrapper");

const bannerContent = Array.from(banner.children);

bannerContent.forEach((item) => {
  const duplicateNode = item.cloneNode(true);
  duplicateNode.setAttribute("aria-hidden", true);
  banner.appendChild(duplicateNode);
});

ScrollReveal().reveal(".download__image img", {
  ...scrollRevealOption,
  origin: "right",
});
ScrollReveal().reveal(".download__content .section__header", {
  ...scrollRevealOption,
  delay: 500,
});
ScrollReveal().reveal(".download__links", {
  ...scrollRevealOption,
  delay: 1000,
});

function sendMail(event) {
  event.preventDefault(); // Prevent form submission

  const userEmail = document.getElementById("email").value;
  const userName = document.getElementById("name").value;
  const userMessage = document.getElementById("message").value;
  const messageContent = `Hello ${userName},\n\n${userMessage}\n\n, Email ID : ${userEmail},\n\nBest regards,`;
  let params = {
    to_email: userEmail,
    message_content: messageContent,
  };

  emailjs.send("service_hqnu5pi", "template_2d447vn", params)
    .then(() => {
      alert("Email sent to " + "Our Team" + "!");
    })
    .catch(error => {
      console.error("Error sending email:", error);
      alert("Failed to send email. Please try again.");
    });
}


async function loadLocations() {
  try {
    const response = await fetch('http://192.168.0.105:3000/api/locations');
    const locations = await response.json();
    const locationSelect = document.getElementById('location');

    // Clear existing options
    locationSelect.innerHTML = ''; // Reset the dropdown

    // Add new options
    locations.forEach(location => {
      const option = document.createElement('option');
      option.value = location.location_name;
      option.textContent = location.location_name;
      locationSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading locations:", error);
  }
}

document.getElementById('vehicle-search-form').addEventListener('submit', (e) => {
  e.preventDefault(); // Prevent default form submission
  const location = document.getElementById('location').value;
  const vehicleType = document.getElementById('vehicle-type').value;
  const startDate = document.getElementById('start').value;
  const endDate = document.getElementById('stop').value;
  const url = `results.html?location=${location}&vehicleType=${vehicleType}&startDate=${startDate}&endDate=${endDate}`;
  window.location.href = url; // Navigate to the results page
});

window.onload = loadLocations;


window.onload = () => {
  fetch('/api/locations')
    .then(response => response.json())
    .then(locations => {
      const locationSelect = document.getElementById('location');
      locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.location_name;
        option.text = location.location_name;
        locationSelect.add(option);
      });

      // Fetch and display vehicles on location change
      document.getElementById('location-select').addEventListener('change', () => {
        const location = document.getElementById('location-select').value;
        const vehicleType = document.getElementById('vehicle-type').value;
        fetch(`/api/vehicles?location=${location}&vehicleType=${vehicleType}`)
          .then(response => response.json())
          .then(vehicles => {
            // Clear any previous vehicle listings
            document.getElementById('vehicle-listings').innerHTML = '';

            vehicles.forEach(vehicle => {
              // Create HTML elements to display each vehicle
              const vehicleDiv = document.createElement('div');
              vehicleDiv.innerHTML = `
              <h2>${vehicle.car_name}</h2>
              <img src="${vehicle.image_url}" alt="${vehicle.car_name}">
              <p>Transmission: ${vehicle.transmission}</p>
              <p>Fuel Type: ${vehicle.fuel_type}</p>
              <p>Seats: ${vehicle.seats}</p>
              <p>Price per Hour: ${vehicle.price_per_hour}</p>
              <p>Rating: ${vehicle.rating}</p>
              <p>Trips: ${vehicle.trips}</p>
            `;
              document.getElementById('vehicle-listings').appendChild(vehicleDiv);
            });
          });
      });
    })
    .catch(error => console.error('Error fetching locations:', error));
};





