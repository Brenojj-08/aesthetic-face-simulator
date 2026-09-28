const buttons = document.querySelectorAll(".area-button");
const selectedArea = document.getElementById("selected-area");
const intensity = document.getElementById("intensity");
const intensityValue = document.getElementById("intensity-value");
const areaDescription = document.getElementById("area-description");
const overlay = document.getElementById("face-overlay");
const overlayLabel = document.getElementById("overlay-label");
const resetButton = document.getElementById("reset-button");
const defaultDescription =
  "Forehead: this visual demo highlights a common facial expression area.";

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach((item) => {
  item.classList.remove("active");
  item.setAttribute("aria-pressed", "false");
});

button.classList.add("active");
button.setAttribute("aria-pressed", "true");

    overlay.className = "face-overlay";

    if (button.dataset.area === "Forehead") {
      overlay.classList.add("forehead");
      areaDescription.textContent =
        "Forehead: this visual demo highlights a common facial expression area.";
    }

    if (button.dataset.area === "Glabella") {
      overlay.classList.add("glabella");
      areaDescription.textContent =
        "Glabella: this visual demo highlights the area between the eyebrows.";
    }

    if (button.dataset.area === "Eye Area") {
      overlay.classList.add("eye-area");
      areaDescription.textContent =
        "Eye area: this visual demo highlights the area around the eyes.";
    }

    selectedArea.textContent = `Selected area: ${button.dataset.area}`;

    areaDescription.style.animation = "none";
    areaDescription.offsetHeight;
    areaDescription.style.animation = "fade-in 0.35s ease";
  });
});

intensity.addEventListener("input", () => {
  const value = Number(intensity.value);

  intensityValue.textContent = `Simulation intensity: ${value}%`;
  overlayLabel.textContent = `Preview: ${value}%`;

  if (value === 0) {
    areaDescription.textContent = defaultDescription;
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

  const opacity = value / 250;
  overlay.style.opacity = opacity;
});
});
resetButton.addEventListener("click", () => {
  buttons.forEach((button) => {
  button.classList.remove("active");
  button.setAttribute("aria-pressed", "false");
});

buttons[0].classList.add("active");
buttons[0].setAttribute("aria-pressed", "true");

  selectedArea.textContent = "Selected area: Forehead";
  areaDescription.textContent = defaultDescription;

  intensity.value = 0;
  intensityValue.textContent = "Simulation intensity: 0%";

  overlay.className = "face-overlay forehead";
  overlay.style.opacity = 0;

  overlayLabel.textContent = "Preview: 0%";
});
