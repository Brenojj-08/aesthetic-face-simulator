 const areaButtons = document.querySelectorAll(".area-button");
const selectedArea = document.getElementById("selected-area");
const areaDescription = document.getElementById("area-description");

const addAreaButton = document.getElementById("add-area-button");
const duplicateAreaButton = document.getElementById("duplicate-area-button");
const deleteAreaButton = document.getElementById("delete-area-button");
const clearAreasButton = document.getElementById("clear-areas-button");
const resetButton = document.getElementById("reset-button");
const undoButton = document.getElementById("undo-button");
const redoButton = document.getElementById("redo-button");

const generatePreviewButton = document.getElementById("generate-preview-button");
const editResultButton = document.getElementById("edit-result-button");
const downloadResultButton = document.getElementById("download-result-button");
const generationStatus = document.getElementById("generation-status");

const intensity = document.getElementById("intensity");
const intensityValue = document.getElementById("intensity-value");
const intensityOutput = document.getElementById("intensity-output");

const texture = document.getElementById("texture");
const textureValue = document.getElementById("texture-value");
const textureOutput = document.getElementById("texture-output");
const smoothingPresetButtons = document.querySelectorAll(".smoothing-preset");

const photoUpload = document.getElementById("photo-upload");
const photoStatus = document.getElementById("photo-status");
const faceImage = document.getElementById("face-image");
const faceContainer = document.getElementById("face-container");

const smoothingCanvas = document.getElementById("smoothing-canvas");
const smoothingContext = smoothingCanvas.getContext("2d");

const comparisonMask = document.getElementById("comparison-mask");
const comparisonCanvas = document.getElementById("comparison-canvas");
const comparisonContext = comparisonCanvas.getContext("2d");
const comparisonDivider = document.getElementById("comparison-divider");
const comparisonControl = document.getElementById("comparison-control");
const comparisonRange = document.getElementById("comparison-range");

const STORAGE_KEY = "visualiza-simulator-settings-v2";

const areaDescriptions = {
  Forehead: "Testa: cria uma nova área ajustável próxima à testa.",
  Glabella: "Glabela: cria uma nova área ajustável entre as sobrancelhas.",
  "Eye Area": "Área dos olhos: cria uma nova área ajustável ao redor dos olhos."
};

const areaNamesInPortuguese = {
  Forehead: "Testa",
  Glabella: "Glabela",
  "Eye Area": "Área dos olhos"
};

let selectedPhotoUrl = "";
let selectedAreaId = null;
let interaction = null;
let nextAreaId = 1;
let isPreviewing = false;
let treatmentAreas = [];
let history = [];
let historyIndex = -1;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function cloneAreas(areas) {
  return areas.map((area) => ({ ...area }));
}

function createSnapshot() {
  return {
    treatmentAreas: cloneAreas(treatmentAreas),
    selectedAreaId,
    nextAreaId
  };
}

function normalizeArea(area) {
  return {
    ...area,
    intensity: Number(area.intensity ?? 0),
    texture: Number(area.texture ?? 65)
  };
}

function persistSettings() {
  const settings = {
    treatmentAreas,
    selectedAreaId,
    nextAreaId,
    comparisonPosition: comparisonRange.value
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function restorePersistedSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!saved || !Array.isArray(saved.treatmentAreas)) {
      return false;
    }

    treatmentAreas = saved.treatmentAreas.map(normalizeArea);
    selectedAreaId = saved.selectedAreaId;
    nextAreaId = saved.nextAreaId || treatmentAreas.length + 1;
    comparisonRange.value = saved.comparisonPosition || "50";

    return treatmentAreas.length > 0;
  } catch {
    return false;
  }
}

function updateHistoryButtons() {
  undoButton.disabled = isPreviewing || historyIndex <= 0;
  redoButton.disabled = isPreviewing || historyIndex >= history.length - 1;
}

function saveHistory() {
  const snapshot = createSnapshot();
  const lastSnapshot = history[historyIndex];

  if (JSON.stringify(snapshot) === JSON.stringify(lastSnapshot)) {
    return;
  }

  history = history.slice(0, historyIndex + 1);
  history.push(snapshot);

  if (history.length > 40) {
    history.shift();
  }

  historyIndex = history.length - 1;
  updateHistoryButtons();
  persistSettings();
}

function restoreSnapshot(snapshot) {
  treatmentAreas = cloneAreas(snapshot.treatmentAreas).map(normalizeArea);
  selectedAreaId = snapshot.selectedAreaId;
  nextAreaId = snapshot.nextAreaId;

  updateSimulation();
}

function undo() {
  if (isPreviewing || historyIndex <= 0) {
    return;
  }

  historyIndex -= 1;
  restoreSnapshot(history[historyIndex]);
  updateHistoryButtons();
  persistSettings();
}

function redo() {
  if (isPreviewing || historyIndex >= history.length - 1) {
    return;
  }

  historyIndex += 1;
  restoreSnapshot(history[historyIndex]);
  updateHistoryButtons();
  persistSettings();
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

function createTreatmentArea(config = {}, recordHistory = true) {
  const area = {
    id: nextAreaId,
    x: config.x ?? 30,
    y: config.y ?? 25,
    width: config.width ?? 40,
    height: config.height ?? 24,
    intensity: config.intensity ?? 55,
texture: config.texture ?? 68
  };

  nextAreaId += 1;
  treatmentAreas.push(area);
  selectedAreaId = area.id;

  updateSimulation();

  if (recordHistory) {
    saveHistory();
  }
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
  saveHistory();
}

function duplicateSelectedArea() {
  const area = getSelectedTreatmentArea();

  if (!area || isPreviewing) {
    return;
  }

  createTreatmentArea({
    x: clamp(area.x + 4, 0, 100 - area.width),
    y: clamp(area.y + 4, 0, 100 - area.height),
    width: area.width,
    height: area.height,
    intensity: area.intensity,
    texture: area.texture
  });
}

function clearAreas() {
  if (isPreviewing || !treatmentAreas.length) {
    return;
  }

  treatmentAreas = [];
  selectedAreaId = null;

  updateSimulation();
  saveHistory();
}

function renderTreatmentAreas() {
  faceContainer
    .querySelectorAll(".treatment-area")
    .forEach((element) => element.remove());

  if (isPreviewing) {
    return;
  }

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
        aria-label="Redimensionar área de visualização"
      ></button>
    `;

    const resizeHandle = element.querySelector(".resize-handle-both");

    element.addEventListener("pointerdown", (event) => {
      if (event.target === resizeHandle) {
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

function drawSoftMask(context, centerX, centerY, radiusX, radiusY) {
  const gradient = context.createRadialGradient(
    centerX,
    centerY,
    Math.min(radiusX, radiusY) * 0.42,
    centerX,
    centerY,
    Math.max(radiusX, radiusY)
  );

  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.65, "rgba(255, 255, 255, 0.92)");
  gradient.addColorStop(0.86, "rgba(255, 255, 255, 0.35)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  context.save();
  context.translate(centerX, centerY);
  context.scale(1, radiusY / radiusX);
  context.beginPath();
  context.arc(0, 0, radiusX, 0, Math.PI * 2);
  context.closePath();
  context.fillStyle = gradient;
  context.fill();
  context.restore();
}

function drawSmoothingOn(context, width, height) {
  treatmentAreas.forEach((area) => {
    if (area.intensity === 0) {
      return;
    }

    const centerX = width * ((area.x + area.width / 2) / 100);
    const centerY = height * ((area.y + area.height / 2) / 100);
    const radiusX = width * (area.width / 200) * 0.92;
    const radiusY = height * (area.height / 200) * 0.92;

    const smoothStrength = area.intensity / 100;
    const textureRetention = area.texture / 100;

    /*
      Mais intensidade = mais blur e mais opacidade.
      Mais textura = menos opacidade, mas sem anular o efeito.
    */
    const blurAmount = 0.8 + smoothStrength * 5.2;
const effectOpacity =
  (0.10 + smoothStrength * 0.30) *
  (1 - textureRetention * 0.42);

    const effectCanvas = document.createElement("canvas");
    const effectContext = effectCanvas.getContext("2d");

    effectCanvas.width = width;
    effectCanvas.height = height;

    effectContext.save();
    effectContext.filter = `blur(${blurAmount}px)`;

    effectContext.drawImage(
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

    effectContext.restore();

    const maskCanvas = document.createElement("canvas");
    const maskContext = maskCanvas.getContext("2d");

    maskCanvas.width = width;
    maskCanvas.height = height;

    maskContext.save();
    maskContext.translate(centerX, centerY);
    maskContext.scale(1, radiusY / radiusX);

    const gradient = maskContext.createRadialGradient(
      0,
      0,
      radiusX * 0.28,
      0,
      0,
      radiusX
    );

    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.58, "rgba(255, 255, 255, 0.98)");
    gradient.addColorStop(0.78, "rgba(255, 255, 255, 0.72)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    maskContext.fillStyle = gradient;
    maskContext.beginPath();
    maskContext.arc(0, 0, radiusX, 0, Math.PI * 2);
    maskContext.fill();
    maskContext.restore();

    effectContext.save();
    effectContext.globalCompositeOperation = "destination-in";
    effectContext.drawImage(maskCanvas, 0, 0);
    effectContext.restore();

    context.save();
    context.globalAlpha = effectOpacity;
    context.drawImage(effectCanvas, 0, 0);
    context.restore();
  });
}

function drawCanvas(targetCanvas, targetContext) {
  if (!faceImage.complete || !faceImage.naturalWidth) {
    return;
  }

  const width = faceImage.clientWidth;
  const height = faceImage.clientHeight;

  if (!width || !height) {
    return;
  }

  targetCanvas.width = width;
  targetCanvas.height = height;

  targetContext.clearRect(0, 0, width, height);
  drawSmoothingOn(targetContext, width, height);
}

function drawSmoothing() {
  drawCanvas(smoothingCanvas, smoothingContext);

  if (isPreviewing) {
    drawCanvas(comparisonCanvas, comparisonContext);
    updateComparisonPosition(false);
  }
}

function updateComparisonPosition(shouldPersist = true) {
  const position = Number(comparisonRange.value);

  comparisonMask.style.clipPath = `inset(0 ${100 - position}% 0 0)`;
  comparisonDivider.style.left = `${position}%`;

  if (shouldPersist) {
    persistSettings();
  }
}

function updatePresetButtons(area) {
  smoothingPresetButtons.forEach((button) => {
    const matchesPreset =
      area &&
      Number(button.dataset.intensity) === area.intensity &&
      Number(button.dataset.texture) === area.texture;

    button.classList.toggle("active", matchesPreset);
  });
}

function updateSimulation() {
  const area = getSelectedTreatmentArea();

  renderTreatmentAreas();
  drawSmoothing();

  const hasArea = Boolean(area);

  intensity.disabled = !hasArea || isPreviewing;
  texture.disabled = !hasArea || isPreviewing;
  deleteAreaButton.disabled = !hasArea || isPreviewing;
  duplicateAreaButton.disabled = !hasArea || isPreviewing;
  clearAreasButton.disabled = !treatmentAreas.length || isPreviewing;

  smoothingPresetButtons.forEach((button) => {
    button.disabled = !hasArea || isPreviewing;
  });

  if (!area) {
    intensity.value = "0";
    texture.value = "65";
    intensityOutput.textContent = "0%";
    textureOutput.textContent = "65%";
    intensityValue.textContent = "Nenhuma área de visualização selecionada.";
    textureValue.textContent =
      "Quanto maior o valor, mais detalhes originais são preservados.";

    updatePresetButtons(null);
    updateHistoryButtons();
    return;
  }

  intensity.value = String(area.intensity);
  texture.value = String(area.texture);
  intensityOutput.textContent = `${area.intensity}%`;
  textureOutput.textContent = `${area.texture}%`;
  intensityValue.textContent =
    `Suavização da área ${area.id}: ${area.intensity}%.`;
  textureValue.textContent =
    `${area.texture}% de textura natural preservada.`;

  updatePresetButtons(area);
  updateHistoryButtons();
}

function setEditorDisabled(disabled) {
  addAreaButton.disabled = disabled;
  duplicateAreaButton.disabled = disabled || !getSelectedTreatmentArea();
  deleteAreaButton.disabled = disabled || !getSelectedTreatmentArea();
  clearAreasButton.disabled = disabled || !treatmentAreas.length;
  intensity.disabled = disabled || !getSelectedTreatmentArea();
  texture.disabled = disabled || !getSelectedTreatmentArea();
  photoUpload.disabled = disabled;
  resetButton.disabled = disabled;

  areaButtons.forEach((button) => {
    button.disabled = disabled;
  });

  smoothingPresetButtons.forEach((button) => {
    button.disabled = disabled || !getSelectedTreatmentArea();
  });

  updateHistoryButtons();
}

function setPreviewMode(previewing) {
  isPreviewing = previewing;

  faceContainer.classList.toggle("is-previewing", previewing);

  comparisonControl.hidden = !previewing;
  generatePreviewButton.hidden = previewing;
  editResultButton.hidden = !previewing;

  smoothingCanvas.style.opacity = previewing ? "0" : "1";
  comparisonMask.hidden = !previewing;
  comparisonDivider.hidden = !previewing;

  setEditorDisabled(previewing);

  if (previewing) {
    drawSmoothing();
    updateComparisonPosition();

    generationStatus.textContent =
      "Prévia gerada. Arraste o controle abaixo da imagem para comparar antes e depois.";
  } else {
    generationStatus.textContent = "";
    updateSimulation();
  }
}

async function generateLocalPreview() {
  if (!faceImage.complete || !faceImage.naturalWidth) {
    generationStatus.textContent = "A imagem ainda está sendo carregada.";
    return;
  }

  generatePreviewButton.disabled = true;
  generatePreviewButton.textContent = "Gerando visualização...";
  generationStatus.textContent =
    "Processando a visualização localmente no seu dispositivo...";

  await new Promise((resolve) => window.setTimeout(resolve, 350));

  setPreviewMode(true);

  generatePreviewButton.disabled = false;
  generatePreviewButton.textContent = "Gerar visualização local";
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
    link.download = "edicao-facial-suave.png";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }, "image/png");
}

function selectAreaPreset(button) {
  if (isPreviewing) {
    return;
  }

  const areaName = button.dataset.area;

  areaButtons.forEach((areaButton) => {
    const isSelected = areaButton === button;

    areaButton.classList.toggle("active", isSelected);
    areaButton.setAttribute("aria-pressed", String(isSelected));
  });

  selectedArea.textContent =
    `Área selecionada: ${areaNamesInPortuguese[areaName]}`;
  areaDescription.textContent = areaDescriptions[areaName];

  if (areaName === "Forehead") {
    createTreatmentArea({
      x: 27,
      y: 18,
      width: 46,
      height: 28
    });
  }

  if (areaName === "Glabella") {
    createTreatmentArea({
      x: 35,
      y: 31,
      width: 30,
      height: 16
    });
  }

  if (areaName === "Eye Area") {
    createTreatmentArea({
      x: 22,
      y: 35,
      width: 56,
      height: 24
    });
  }
}

function resetToDefault() {
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
    "Testa: cria uma nova área ajustável próxima à testa.";

  createTreatmentArea(
    {
      x: 27,
      y: 18,
      width: 46,
      height: 28,
      intensity: 55,
      texture: 68
    },
    false
  );

  updateSimulation();
  saveHistory();
}

document.addEventListener("pointermove", (event) => {
  if (!interaction || event.pointerId !== interaction.pointerId) {
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

  if (interaction.type === "resize-both") {
    const deltaX = pointer.x - interaction.pointerStart.x;
    const deltaY = pointer.y - interaction.pointerStart.y;

    area.width = clamp(
      interaction.startWidth + deltaX,
      4,
      100 - area.x
    );

    area.height = clamp(
      interaction.startHeight + deltaY,
      4,
      100 - area.y
    );
  }

  updateSimulation();
});

document.addEventListener("pointerup", (event) => {
  if (interaction && event.pointerId === interaction.pointerId) {
    interaction = null;
    saveHistory();
  }
});

areaButtons.forEach((button) => {
  button.addEventListener("click", () => selectAreaPreset(button));
});

smoothingPresetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const area = getSelectedTreatmentArea();

    if (!area || isPreviewing) {
      return;
    }

    area.intensity = Number(button.dataset.intensity);
    area.texture = Number(button.dataset.texture);

    updateSimulation();
    saveHistory();
  });
});

addAreaButton.addEventListener("click", () => createTreatmentArea());
duplicateAreaButton.addEventListener("click", duplicateSelectedArea);
deleteAreaButton.addEventListener("click", deleteSelectedTreatmentArea);
clearAreasButton.addEventListener("click", clearAreas);
resetButton.addEventListener("click", resetToDefault);

undoButton.addEventListener("click", undo);
redoButton.addEventListener("click", redo);

generatePreviewButton.addEventListener("click", generateLocalPreview);

editResultButton.addEventListener("click", () => setPreviewMode(false));
downloadResultButton.addEventListener("click", downloadEditedImage);

comparisonRange.addEventListener("input", () => {
  updateComparisonPosition();
});

intensity.addEventListener("input", () => {
  const area = getSelectedTreatmentArea();

  if (!area || isPreviewing) {
    return;
  }

  area.intensity = Number(intensity.value);
  updateSimulation();
});

intensity.addEventListener("change", saveHistory);

texture.addEventListener("input", () => {
  const area = getSelectedTreatmentArea();

  if (!area || isPreviewing) {
    return;
  }

  area.texture = Number(texture.value);
  updateSimulation();
});

texture.addEventListener("change", saveHistory);

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

document.addEventListener("keydown", (event) => {
  const target = event.target;

  const isTyping =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement;

  if (
    isTyping &&
    target !== intensity &&
    target !== texture &&
    target !== comparisonRange
  ) {
    return;
  }

  const isModifier = event.ctrlKey || event.metaKey;

  if (isModifier && event.key.toLowerCase() === "z") {
    event.preventDefault();

    if (event.shiftKey) {
      redo();
    } else {
      undo();
    }
  }

  if (isModifier && event.key.toLowerCase() === "y") {
    event.preventDefault();
    redo();
  }

  if (
    !isPreviewing &&
    (event.key === "Delete" || event.key === "Backspace") &&
    selectedAreaId
  ) {
    event.preventDefault();
    deleteSelectedTreatmentArea();
  }
});

window.addEventListener("resize", updateSimulation);

window.addEventListener("beforeunload", () => {
  if (selectedPhotoUrl) {
    URL.revokeObjectURL(selectedPhotoUrl);
  }
});

const restored = restorePersistedSettings();

if (restored) {
  updateSimulation();
  saveHistory();
} else {
  resetToDefault();
}
