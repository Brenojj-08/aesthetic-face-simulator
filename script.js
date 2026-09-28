const buttons = document.querySelectorAll(".area-button");
const selectedArea = document.getElementById("selected-area");
const intensity = document.getElementById("intensity");
const intensityValue = document.getElementById("intensity-value");
const areaDescription = document.getElementById("area-description");
const areaDescription = document.getElementById("area-description");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    const overlay = document.getElementById("face-overlay");

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
    overlayLabel.textContent = `Preview: ${intensity.value}%`;
  });
});

intensity.addEventListener("input", () => {
  intensityValue.textContent = `Simulation intensity: ${intensity.value}%`;

  const overlay = document.getElementById("face-overlay");
  const opacity = Number(intensity.value) / 250;

  overlay.style.opacity = opacity;
});
