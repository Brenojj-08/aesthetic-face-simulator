const buttons = document.querySelectorAll(".area-button");
const selectedArea = document.getElementById("selected-area");
const intensity = document.getElementById("intensity");
const intensityValue = document.getElementById("intensity-value");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    selectedArea.textContent = `Selected area: ${button.dataset.area}`;
  });
});

intensity.addEventListener("input", () => {
  intensityValue.textContent = `Simulation intensity: ${intensity.value}%`;
});
