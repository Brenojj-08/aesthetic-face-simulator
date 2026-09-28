const buttons = document.querySelectorAll(".area-button");
const selectedArea = document.getElementById("selected-area");
const intensity = document.getElementById("intensity");
const intensityValue = document.getElementById("intensity-value");
const areaDescription = document.getElementById("area-description");
const overlay = document.getElementById("face-overlay");
const overlayLabel = document.getElementById("overlay-label");
const resetButton = document.getElementById("reset-button");

const descriptions = {
  Forehead: "Forehead: this visual demo highlights a common facial expression area.",
  Glabella: "Glabella: this visual demo highlights the area between the eyebrows.",
  "Eye Area": "Eye area: this visual demo highlights the area around the eyes."
};

function updateInterface() {
  const activeButton = document.querySelector(".area-button.active");
  const area = activeButton.dataset.area;
  const value = Number(intensity.value);

  selectedArea.textContent = `Selected area: ${area}`;
  intensityValue.textContent = `Simulation intensity: ${value}%`;
  overlayLabel.textContent = `Preview: ${value}%`;

  overlay.className = "face-overlay";

  if (area === "Forehead") {
    overlay.classList.add("forehead");
  }

  if (area === "Glabella") {
    overlay.classList.add("glabella");
  }

  if (area === "Eye Area") {
    overlay.classList.add("eye-area");
  }

  overlay.style.opacity = value / 143;

  if (value === 0) {
    areaDescription.textContent = descriptions[area];
  } else if (value <= 30) {
    areaDescription.textContent =
      "Low intensity preview: a subtle visual highlight.";
  } else if (value <= 70) {
    areaDescription.textContent =
      "Moderate intensity preview: a more visible visual highlight.";
  } else {
    areaDescription.textContent =
      "High intensity preview: the strongest visual highlight.";
  }
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-pressed", "false");
    });

    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");

    updateInterface();
  });
});

intensity.addEventListener("input", updateInterface);

resetButton.addEventListener("click", () => {
  buttons.forEach((button) => {
    button.classList.remove("active");
    button.setAttribute("aria-pressed", "false");
  });

  buttons[0].classList.add("active");
  buttons[0].setAttribute("aria-pressed", "true");

  intensity.value = 0;

  updateInterface();
});

updateInterface();
