const areaButtons = document.querySelectorAll(".area-button");
const selectedArea = document.getElementById("selected-area");
const areaDescription = document.getElementById("area-description");
const resetButton = document.getElementById("reset-button");

const addAreaButton = document.getElementById("add-area-button");
const deleteAreaButton = document.getElementById("delete-area-button");
const previewResultButton = document.getElementById("preview-result-button");
const editResultButton = document.getElementById("edit-result-button");
const downloadResultButton = document.getElementById("download-result-button");

const intensity = document.getElementById("intensity");
const intensityValue = document.getElementById("intensity-value");

const photoUpload = document.getElementById("photo-upload");
const photoStatus = document.getElementById("photo-status");
const faceImage = document.getElementById("face-image");
const faceContainer = document.querySelector(".face-container");

const smoothingCanvas = document.getElementById("smoothing-canvas");
const smoothingContext = smoothingCanvas.getContext("2d");

const areaDescriptions = {
  Forehead: "Testa: cria uma nova área ajustável próxima à testa.",
  Glabella: "Glabela: cria uma nova área ajustável entre as sobrancelhas.",
  "Eye Area": "Área dos olhos: cria uma nova área ajustável ao redor dos olhos."
};

let selectedPhotoUrl = "";
let selectedAreaId = null;
let interaction = null;
let nextAreaId = 1;
let isPreviewing = false;
let isShowingBefore = false;
let treatmentAreas = [];

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getSelectedTreatmentArea() {
  return treatmentAreas.find((area) => area.id === selectedAreaId) || null;
}

function pointerToPercent(event) {
  const rect = faceContainer.getBoundingClientRect();

  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100
  };
}

function createTreatmentArea(config = {}) {
  const area = {
    id: nextAreaId,
    x: config.x ?? 30,
    y: config.y ?? 25,
    width: config.width ?? 40,
    height: config.height ?? 24,
    intensity: config.intensity ?? 0
  };

  nextAreaId += 1;
  treatmentAreas.push(area);
  selectedAreaId = area.id;

  updateSimulation();
}

function deleteSelectedTreatmentArea() {
  if (!selectedAreaId || isPreviewing) {
    return;
  }

  treatmentAreas = treatmentAreas.filter((area) => area.id !== selectedAreaId);

  selectedAreaId = treatmentAreas.length
    ? treatmentAreas[treatmentAreas.length - 1].id
    : null;

  updateSimulation();
}

function renderTreatmentAreas() {
  faceContainer
    .querySelectorAll(".treatment-area")
    .forEach((element) => element.remove());

  treatmentAreas.forEach((area) => {
    const element = document.createElement("div");

    element.className = "treatment-area";

    if (area.id === selectedAreaId) {
      element.classList.add("is-selected");
    }

    element.style.left = `${area.x}%`;
    element.style.top = `${area.y}%`;
    element.style.width = `${area.width}%`;
    element.style.height = `${area.height}%`;

    element.innerHTML = `
      <button
        class="resize-handle resize-handle-both"
        type="button"
        aria-label="Redimensionar área de tratamento"
      ></button>
    `;

    const resizeHandle = element.querySelector(".resize-handle-both");

    element.addEventListener("pointerdown", (event) => {
      if (isPreviewing || event.target === resizeHandle) {
        return;
      }

      event.preventDefault();
      element.setPointerCapture(event.pointerId);

      selectedAreaId = area.id;

      const pointer = pointerToPercent(event);

      interaction = {
        type: "move",
        pointerId: event.pointerId,
        areaId: area.id,
        offsetX: pointer.x - area.x,
        offsetY: pointer.y - area.y
      };

      updateSimulation();
    });

    resizeHandle.addEventListener("pointerdown", (event) => {
      if (isPreviewing) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      resizeHandle.setPointerCapture(event.pointerId);

      selectedAreaId = area.id;

      interaction = {
        type: "resize-both",
        pointerId: event.pointerId,
        areaId: area.id,
        startWidth: area.width,
        startHeight: area.height,
        pointerStart: pointerToPercent(event)
      };

      updateSimulation();
    });

    faceContainer.appendChild(element);
  });
}

function drawSmoothingOn(context, width, height) {
  treatmentAreas.forEach((area) => {
    if (area.intensity === 0) {
      return;
    }

    const centerX = width * ((area.x + area.width / 2) / 100);
    const centerY = height * ((area.y + area.height / 2) / 100);
    const radiusX = width * (area.width / 200) * 0.84;
    const radiusY = height * (area.height / 200) * 0.84;

    const blurAmount = 0.25 + (area.intensity / 100) * 1.7;
    const effectOpacity = 0.12 + (area.intensity / 100) * 0.32;

    context.save();

    context.beginPath();
    context.ellipse(
      centerX,
      centerY,
      radiusX,
      radiusY,
      0,
      0,
      Math.PI * 2
    );
    context.clip();

    context.filter = `blur(${blurAmount}px)`;
    context.globalAlpha = effectOpacity;

    context.drawImage(
      faceImage,
      0,
      0,
      faceImage.naturalWidth,
      faceImage.naturalHeight,
      0,
      0,
      width,
      height
    );

    context.restore();
  });
}

function drawSmoothing() {
  if (!faceImage.complete || !faceImage.naturalWidth) {
    return;
  }

  const width = faceImage.clientWidth;
  const height = faceImage.clientHeight;

  if (!width || !height) {
    return;
  }

  smoothingCanvas.width = width;
  smoothingCanvas.height = height;

  smoothingContext.clearRect(0, 0, width, height);
  drawSmoothingOn(smoothingContext, width, height);
}

function downloadEditedImage() {
  if (!faceImage.complete || !faceImage.naturalWidth) {
    return;
  }

  const exportCanvas = document.createElement("canvas");
  const exportContext = exportCanvas.getContext("2d");

  exportCanvas.width = faceImage.naturalWidth;
  exportCanvas.height = faceImage.naturalHeight;

  exportContext.drawImage(
    faceImage,
    0,
    0,
    exportCanvas.width,
    exportCanvas.height
  );

  drawSmoothingOn(
    exportContext,
    exportCanvas.width,
    exportCanvas.height
  );

  exportCanvas.toBlob((blob) => {
    if (!blob) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "simulacao-estetica-facial.png";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }, "image/png");
}
function showBeforeImage() {
  if (!isPreviewing) {
    return;
  }

  isShowingBefore = true;
  smoothingCanvas.style.opacity = "0";
  previewResultButton.textContent = "Solte para ver o depois";
}

function showAfterImage() {
  if (!isPreviewing) {
    return;
  }

  isShowingBefore = false;
  smoothingCanvas.style.opacity = "1";
  previewResultButton.textContent = "Segure para ver o antes";
}
function setPreviewMode(previewing) {
  isPreviewing = previewing;
  faceContainer.classList.toggle("is-previewing", previewing);

  previewResultButton.hidden = previewing;
  editResultButton.hidden = !previewing;

  addAreaButton.disabled = previewing;
  deleteAreaButton.disabled = previewing;
  intensity.disabled = previewing;
  photoUpload.disabled = previewing;
  resetButton.disabled = previewing;

  areaButtons.forEach((button) => {
    button.disabled = previewing;
  });

  if (previewing) {
  isShowingBefore = false;
  smoothingCanvas.style.opacity = "1";

  previewResultButton.hidden = false;
  previewResultButton.textContent = "Segure para ver o antes";

  intensityValue.textContent =
    "Segure o botão para comparar a imagem antes e depois.";
} else {
  isShowingBefore = false;
  smoothingCanvas.style.opacity = "1";

  previewResultButton.textContent = "Ver resultado";
  updateSimulation();
}
}

function updateSimulation() {
  const area = getSelectedTreatmentArea();

  renderTreatmentAreas();
  drawSmoothing();

  if (!area) {
    intensity.disabled = true;
    deleteAreaButton.disabled = true;
    intensity.value = "0";
    intensityValue.textContent = "Nenhuma área de tratamento selecionada.";
    return;
  }

  if (!isPreviewing) {
    intensity.disabled = false;
    deleteAreaButton.disabled = false;
    intensity.value = String(area.intensity);
    intensityValue.textContent =
  `Intensidade da área ${area.id}: ${area.intensity}%`;
  }
}

function selectAreaPreset(button) {
  if (isPreviewing) {
    return;
  }

  const areaName = button.dataset.area;
const areaNamesInPortuguese = {
  Forehead: "Testa",
  Glabella: "Glabela",
  "Eye Area": "Área dos olhos"
};

selectedArea.textContent =
  `Área selecionada: ${areaNamesInPortuguese[areaName]}`;
  areaButtons.forEach((areaButton) => {
    const isSelected = areaButton === button;

    areaButton.classList.toggle("active", isSelected);
    areaButton.setAttribute("aria-pressed", String(isSelected));
  });

  const areaNamesInPortuguese = {
  Forehead: "Testa",
  Glabella: "Glabela",
  "Eye Area": "Área dos olhos"
};

selectedArea.textContent =
  `Área selecionada: ${areaNamesInPortuguese[areaName]}`;
  areaDescription.textContent = areaDescriptions[areaName];

  if (areaName === "Forehead") {
    createTreatmentArea({ x: 27, y: 18, width: 46, height: 28 });
  }

  if (areaName === "Glabella") {
    createTreatmentArea({ x: 35, y: 31, width: 30, height: 16 });
  }

  if (areaName === "Eye Area") {
    createTreatmentArea({ x: 22, y: 35, width: 56, height: 24 });
  }
}

document.addEventListener("pointermove", (event) => {
  if (isPreviewing || !interaction || event.pointerId !== interaction.pointerId) {
    return;
  }

  const area = treatmentAreas.find(
    (treatmentArea) => treatmentArea.id === interaction.areaId
  );

  if (!area) {
    interaction = null;
    return;
  }

  const pointer = pointerToPercent(event);

  if (interaction.type === "move") {
    area.x = clamp(pointer.x - interaction.offsetX, 0, 100 - area.width);
    area.y = clamp(pointer.y - interaction.offsetY, 0, 100 - area.height);
  }

  if (interaction.type === "resize-width") {
  const pointer = pointerToPercent(event);
  const deltaX = pointer.x - interaction.pointerStart.x;

  area.width = Math.max(
    4,
    Math.min(100 - area.x, interaction.startWidth + deltaX)
  );
}

if (interaction.type === "resize-height") {
  const pointer = pointerToPercent(event);
  const deltaY = pointer.y - interaction.pointerStart.y;

  area.height = Math.max(
    4,
    Math.min(100 - area.y, interaction.startHeight + deltaY)
  );
}

if (interaction.type === "resize-both") {
  const pointer = pointerToPercent(event);
  const deltaX = pointer.x - interaction.pointerStart.x;
  const deltaY = pointer.y - interaction.pointerStart.y;

  area.width = Math.max(
    4,
    Math.min(100 - area.x, interaction.startWidth + deltaX)
  );

  area.height = Math.max(
    4,
    Math.min(100 - area.y, interaction.startHeight + deltaY)
  );
}

  updateSimulation();
});

document.addEventListener("pointerup", (event) => {
  if (interaction && event.pointerId === interaction.pointerId) {
    interaction = null;
  }
});

areaButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectAreaPreset(button);
  });
});

addAreaButton.addEventListener("click", () => {
  if (!isPreviewing) {
    createTreatmentArea();
  }
});

deleteAreaButton.addEventListener("click", deleteSelectedTreatmentArea);

previewResultButton.addEventListener("click", () => {
  setPreviewMode(true);
});

previewResultButton.addEventListener("pointerdown", (event) => {
  if (!isPreviewing) {
    return;
  }

  event.preventDefault();
  previewResultButton.setPointerCapture(event.pointerId);
  showBeforeImage();
});

previewResultButton.addEventListener("pointerup", () => {
  showAfterImage();
});

previewResultButton.addEventListener("pointercancel", () => {
  showAfterImage();
});

previewResultButton.addEventListener("lostpointercapture", () => {
  showAfterImage();
});

previewResultButton.addEventListener("keydown", (event) => {
  if (
    isPreviewing &&
    (event.key === " " || event.key === "Enter") &&
    !event.repeat
  ) {
    event.preventDefault();
    showBeforeImage();
  }
});

previewResultButton.addEventListener("keyup", (event) => {
  if (event.key === " " || event.key === "Enter") {
    showAfterImage();
  }
});
editResultButton.addEventListener("click", () => {
  setPreviewMode(false);
});

downloadResultButton.addEventListener("click", downloadEditedImage);

intensity.addEventListener("input", () => {
  const area = getSelectedTreatmentArea();

  if (!area || isPreviewing) {
    return;
  }

  area.intensity = Number(intensity.value);
  updateSimulation();
});

resetButton.addEventListener("click", () => {
  if (isPreviewing) {
    return;
  }

  treatmentAreas = [];
  selectedAreaId = null;
  nextAreaId = 1;

  areaButtons.forEach((button, index) => {
    const isForehead = index === 0;

    button.classList.toggle("active", isForehead);
    button.setAttribute("aria-pressed", String(isForehead));
  });

  selectedArea.textContent = "Área selecionada: Testa";
areaDescription.textContent =
  "Testa: esta demonstração visual destaca uma área comum de expressão facial.";

  createTreatmentArea({ x: 27, y: 18, width: 46, height: 28 });
});

photoUpload.addEventListener("change", (event) => {
  const file = event.target.files?.[0];

  if (!file || isPreviewing) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    photoStatus.textContent = "Escolha um arquivo de imagem válido.";
    photoUpload.value = "";
    return;
  }

  if (selectedPhotoUrl) {
    URL.revokeObjectURL(selectedPhotoUrl);
  }

  const imageUrl = URL.createObjectURL(file);

  faceImage.onload = () => {
    selectedPhotoUrl = imageUrl;
    photoStatus.textContent = `Exibindo sua foto: ${file.name}`;
    updateSimulation();
  };

  faceImage.onerror = () => {
   photoStatus.textContent = "Não foi possível carregar a imagem selecionada.";
    URL.revokeObjectURL(imageUrl);
  };

  faceImage.src = imageUrl;
  faceImage.alt = `Foto selecionada: ${file.name}`;
});

window.addEventListener("resize", updateSimulation);

resetButton.click();