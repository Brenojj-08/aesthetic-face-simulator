const buttons = document.querySelectorAll(".area-button");
const selectedArea = document.getElementById("selected-area");
const intensity = document.getElementById("intensity");
const intensityValue = document.getElementById("intensity-value");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const overlay = document.getElementById("face-overlay");

overlay.className = "face-overlay";

if (button.dataset.area === "Forehead") {
  overlay.classList.add("forehead");
}

if (button.dataset.area === "Glabella") {
  overlay.classList.add("glabella");
}

if (button.dataset.area === "Eye Area") {
  overlay.classList.add("eye-area");
}

    selectedArea.textContent = `Selected area: ${button.dataset.area}`;
  });
});

intensity.addEventListener("input", () => {
  intensityValue.textContent = `Simulation intensity: ${intensity.value}%`;

  const overlay = document.getElementById("face-overlay");
  const opacity = Number(intensity.value) / 250;

  overlay.style.opacity = opacity;
});
