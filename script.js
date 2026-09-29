const areaButtons = document.querySelectorAll(".area-button");
const selectedArea = document.getElementById("selected-area");
const areaDescription = document.getElementById("area-description");
const faceOverlay = document.getElementById("face-overlay");
const overlayLabel = document.getElementById("overlay-label");
const resizeHandle = document.getElementById("resize-handle");
const resetButton = document.getElementById("reset-button");
const intensity = document.getElementById("intensity");
const intensityValue = document.getElementById("intensity-value");

const photoUpload = document.getElementById("photo-upload");
const photoStatus = document.getElementById("photo-status");
const faceImage = document.getElementById("face-image");
const faceContainer = document.querySelector(".face-container");

const smoothingCanvas = document.getElementById("smoothing-canvas");
const smoothingContext = smoothingCanvas.getContext("2d");

const areaDescriptions = {
  Forehead: "Forehead: this visual demo highlights a common facial expression area.",
  Glabella: "Glabella: this visual demo highlights the area between the eyebrows.",
  "Eye Area": "Eye Area: this visual demo highlights the area around the eyes."
};

let selectedPhotoUrl = "";

const treatmentArea = {
  x: 27,
  y: 18,
  width: 46,
  height: 28
};

let interaction = null;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function applyTreatmentArea() {
  faceOverlay.style.left = `${treatmentArea.x}%`;
  faceOverlay.style.top = `${treatmentArea.y}%`;
  faceOverlay.style.width = `${treatmentArea.width}%`;
  faceOverlay.style.height = `${treatmentArea.height}%`;
}

function getSmoothingArea(displayWidth, displayHeight) {
  return {
    centerX: displayWidth * ((treatmentArea.x + treatmentArea.width / 2) / 100),
    centerY: displayHeight * ((treatmentArea.y + treatmentArea.height / 2) / 100),
    radiusX: displayWidth * (treatmentArea.width / 200),
    radiusY: displayHeight * (treatmentArea.height / 200)
  };
}

function drawSmoothing() {
  if (!faceImage.complete || !faceImage.naturalWidth) {
    return;
  }

  const displayWidth = faceImage.clientWidth;
  const displayHeight = faceImage.clientHeight;

  if (!displayWidth || !displayHeight) {
    return;
  }

  smoothingCanvas.width = displayWidth;
  smoothingCanvas.height = displayHeight;

  smoothingContext.clearRect(0, 0, displayWidth, displayHeight);

  const value = Number(intensity.value);

  if (value === 0) {
    return;
  }

  const { centerX, centerY, radiusX, radiusY } = getSmoothingArea(
    displayWidth,
    displayHeight
  );

  const blurAmount = 0.35 + (value / 100) * 1.65;
  const effectOpacity = 0.16 + (value / 100) * 0.38;
  const innerRadiusX = radiusX * 0.86;
  const innerRadiusY = radiusY * 0.86;

  smoothingContext.save();

  smoothingContext.beginPath();
  smoothingContext.ellipse(
    centerX,
    centerY,
    innerRadiusX,
    innerRadiusY,
    0,
    0,
    Math.PI * 2
  );
  smoothingContext.clip();

  smoothingContext.filter = `blur(${blurAmount}px)`;
  smoothingContext.globalAlpha = effectOpacity;

  smoothingContext.drawImage(
    faceImage,
    0,
    0,
    faceImage.naturalWidth,
    faceImage.naturalHeight,
    0,
    0,
    displayWidth,
    displayHeight
  );

  smoothingContext.restore();

}

function updateSimulation() {
  const value = Number(intensity.value);
  const opacity = 0.2 + (value / 100) * 0.3;

  intensityValue.textContent = `Simulation intensity: ${value}%`;
  overlayLabel.textContent = `Preview: ${value}%`;

  faceOverlay.style.opacity = String(opacity);

  applyTreatmentArea();
  drawSmoothing();
}

function selectArea(button) {
  const area = button.dataset.area;

  areaButtons.forEach((areaButton) => {
    const isSelected = areaButton === button;

    areaButton.classList.toggle("active", isSelected);
    areaButton.setAttribute("aria-pressed", String(isSelected));
  });

  selectedArea.textContent = `Selected area: ${area}`;
  areaDescription.textContent = areaDescriptions[area];

  faceOverlay.classList.remove("forehead", "glabella", "eye-area");

  if (area === "Forehead") {
    Object.assign(treatmentArea, {
      x: 27,
      y: 18,
      width: 46,
      height: 28
    });

    faceOverlay.classList.add("forehead");
  }

  if (area === "Glabella") {
    Object.assign(treatmentArea, {
      x: 35,
      y: 31,
      width: 30,
      height: 16
    });

    faceOverlay.classList.add("glabella");
  }

  if (area === "Eye Area") {
    Object.assign(treatmentArea, {
      x: 22,
      y: 35,
      width: 56,
      height: 24
    });

    faceOverlay.classList.add("eye-area");
  }

  updateSimulation();
}

function pointerToPercent(event) {
  const rect = faceContainer.getBoundingClientRect();

  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100
  };
}

faceOverlay.addEventListener("pointerdown", (event) => {
  if (event.target === resizeHandle) {
    return;
  }

  event.preventDefault();
  faceOverlay.setPointerCapture(event.pointerId);

  const pointer = pointerToPercent(event);

  interaction = {
    type: "move",
    pointerId: event.pointerId,
    offsetX: pointer.x - treatmentArea.x,
    offsetY: pointer.y - treatmentArea.y
  };
});

resizeHandle.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();
  resizeHandle.setPointerCapture(event.pointerId);

  interaction = {
    type: "resize",
    pointerId: event.pointerId,
    startX: treatmentArea.x,
    startY: treatmentArea.y,
    startWidth: treatmentArea.width,
    startHeight: treatmentArea.height,
    pointerStart: pointerToPercent(event)
  };
});

document.addEventListener("pointermove", (event) => {
  if (!interaction || event.pointerId !== interaction.pointerId) {
    return;
  }

  const pointer = pointerToPercent(event);

  if (interaction.type === "move") {
    treatmentArea.x = clamp(
      pointer.x - interaction.offsetX,
      0,
      100 - treatmentArea.width
    );

    treatmentArea.y = clamp(
      pointer.y - interaction.offsetY,
      0,
      100 - treatmentArea.height
    );
  }

  if (interaction.type === "resize") {
    const changeX = pointer.x - interaction.pointerStart.x;
    const changeY = pointer.y - interaction.pointerStart.y;
    const change = Math.max(changeX, changeY);

    treatmentArea.width = clamp(interaction.startWidth + change, 12, 80);

    const ratio = interaction.startHeight / interaction.startWidth;

    treatmentArea.height = clamp(
      treatmentArea.width * ratio,
      10,
      70
    );

    treatmentArea.width = Math.min(
      treatmentArea.width,
      100 - treatmentArea.x
    );

    treatmentArea.height = Math.min(
      treatmentArea.height,
      100 - treatmentArea.y
    );
  }

  updateSimulation();
});

document.addEventListener("pointerup", (event) => {
  if (!interaction || event.pointerId !== interaction.pointerId) {
    return;
  }

  interaction = null;
});

areaButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectArea(button);
  });
});

intensity.addEventListener("input", updateSimulation);

resetButton.addEventListener("click", () => {
  intensity.value = "0";
  selectArea(areaButtons[0]);
  updateSimulation();
});

photoUpload.addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    photoStatus.textContent = "Please choose a valid image file.";
    photoUpload.value = "";
    return;
  }

  if (selectedPhotoUrl) {
    URL.revokeObjectURL(selectedPhotoUrl);
  }

  const newPhotoUrl = URL.createObjectURL(file);

  faceImage.onload = () => {
    selectedPhotoUrl = newPhotoUrl;
    updateSimulation();
  };

  faceImage.onerror = () => {
    photoStatus.textContent = "The selected image could not be loaded.";
    URL.revokeObjectURL(newPhotoUrl);
  };

  faceImage.src = newPhotoUrl;
  faceImage.alt = `Selected photo: ${file.name}`;
  photoStatus.textContent = `Showing your photo: ${file.name}`;
});

window.addEventListener("resize", updateSimulation);

updateSimulation();