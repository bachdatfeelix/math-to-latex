/**
 * Math2LaTeX Studio PRO - Core Engine & Interactive UI Logic
 * Vanguard UI Choreography, Micro-interactions, KaTeX Typesetting & Multi-Engine OCR
 */

// Application State
const state = {
  activeEngine: localStorage.getItem('math2latex_engine') || 'gemini',
  currentImageBase64: null,
  cropper: null,
  activeTab: 'code', // 'code', 'preview', 'split'
  fontSize: 16.5,
  isConverting: false
};

// High-DPI Preset Math Exam Canvas Generators
const SAMPLE_PRESETS = {
  'trac-nghiem': {
    title: 'Đề trắc nghiệm THPT Quốc gia',
    render: (ctx, width, height) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Header
      ctx.fillStyle = '#1e1b4b';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('ĐỀ THI THỬ TỐT NGHIỆP THPT — MÔN TOÁN HỌC', 35, 40);
      
      ctx.fillStyle = '#334155';
      ctx.fillRect(35, 52, width - 70, 1.5);

      // Question 1
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Câu 1.', 35, 85);
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Cho hàm số y = f(x) có đạo hàm f\'(x) = (x - 1)(x + 2)^2. Số điểm cực trị của hàm số là:', 90, 85);
      
      ctx.font = '500 13.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('A. 2', 90, 118);
      ctx.fillText('B. 1', 230, 118);
      ctx.fillText('C. 0', 370, 118);
      ctx.fillText('D. 3', 510, 118);

      // Question 2
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Câu 2.', 35, 165);
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Tập nghiệm S của bất phương trình log_2(2x - 1) ≤ 3 là:', 90, 165);

      ctx.font = '500 13.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('A. S = (1/2; 9/2]', 90, 198);
      ctx.fillText('B. S = (-∞; 9/2]', 230, 198);
      ctx.fillText('C. S = [1/2; 9/2]', 370, 198);
      ctx.fillText('D. S = (0; 9/2]', 510, 198);
    }
  },
  'tich-phan': {
    title: 'Tích phân & Đạo hàm đa cấp',
    render: (ctx, width, height) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#1e1b4b';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('TÍNH TÍCH PHÂN VÀ GIỚI HẠN GIẢI TÍCH', 35, 40);
      
      ctx.fillStyle = '#334155';
      ctx.fillRect(35, 52, width - 70, 1.5);

      ctx.fillStyle = '#0f172a';
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('1) Tính tích phân:  I = ∫ (từ 0 đến π/2) [ (2*sin(x) + 1) / (cos(x) + 3) ] dx', 40, 90);
      ctx.fillText('2) Tìm giới hạn:    L = lim (x → 0) [ (√(1 + 3x) - ∛(1 + 2x)) / x² ]', 40, 140);
      ctx.fillText('3) Tìm nguyên hàm:  F(x) = ∫ (3x² - 2x + 5) * e^(2x) dx', 40, 190);
    }
  },
  'he-phuong-trinh': {
    title: 'Hệ phương trình & Ma trận',
    render: (ctx, width, height) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#1e1b4b';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('BÀI TOÁN HỆ PHƯƠNG TRÌNH ĐẠI SỐ', 35, 40);
      
      ctx.fillStyle = '#334155';
      ctx.fillRect(35, 52, width - 70, 1.5);

      ctx.fillStyle = '#0f172a';
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Giải hệ phương trình sau trên tập số thực ℝ:', 40, 85);
      
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.fillText('⎧ 2x² - y² + xy - 4x + 2y = 0', 70, 120);
      ctx.fillText('⎩ √(3x - 2y + 1) + √(x + y - 1) = 4', 70, 150);
      
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Tìm điều kiện của tham số m để phương trình có đúng 2 nghiệm phân biệt.', 40, 195);
    }
  },
  'hinh-hoc': {
    title: 'Hình học Không gian Oxyz',
    render: (ctx, width, height) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#1e1b4b';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('HÌNH HỌC KHÔNG GIAN TỌA ĐỘ Oxyz', 35, 40);
      
      ctx.fillStyle = '#334155';
      ctx.fillRect(35, 52, width - 70, 1.5);

      ctx.fillStyle = '#0f172a';
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Trong không gian Oxyz, cho 3 điểm A(1; 2; -1), B(2; -1; 3) và C(-3; 5; 1).', 40, 85);
      ctx.fillText('a) Tính toạ độ vector AB, AC và cosin góc giữa hai vector đó.', 40, 125);
      ctx.fillText('b) Viết phương trình mặt phẳng (P) đi qua A và vuông góc với đường thẳng BC.', 40, 160);
      ctx.fillText('c) Tính khoảng cách từ điểm M(0; 1; 2) đến mặt phẳng (P).', 40, 195);
    }
  }
};

let el = {};

document.addEventListener('DOMContentLoaded', () => {
  initElements();
  loadSettings();
  setupEventListeners();
  updateEngineUI();
  updateWorkspaceView();
  updateApiStatusIndicator();
  renderLatexPreview();
});

function initElements() {
  el = {
    // Engine Tabs
    engineGeminiBtn: document.getElementById('engineGeminiBtn'),
    engineTesseractBtn: document.getElementById('engineTesseractBtn'),
    engineOllamaBtn: document.getElementById('engineOllamaBtn'),
    docTypeSelect: document.getElementById('docTypeSelect'),
    apiStatusDot: document.getElementById('apiStatusDot'),

    // Dropzone & Image
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    uploadPrompt: document.getElementById('uploadPrompt'),
    imagePreviewContainer: document.getElementById('imagePreviewContainer'),
    previewImg: document.getElementById('previewImg'),
    imageToolsBar: document.getElementById('imageToolsBar'),
    cropToggleBtn: document.getElementById('cropToggleBtn'),
    cropApplyBtn: document.getElementById('cropApplyBtn'),
    cropCancelBtn: document.getElementById('cropCancelBtn'),
    rotateBtn: document.getElementById('rotateBtn'),
    clearImageBtn: document.getElementById('clearImageBtn'),
    customNotes: document.getElementById('customNotes'),

    // Convert Trigger
    convertBtn: document.getElementById('convertBtn'),
    convertBtnText: document.getElementById('convertBtnText'),
    convertBtnIcon: document.getElementById('convertBtnIcon'),
    convertSpinner: document.getElementById('convertSpinner'),

    // Code & Preview Tabs
    tabCodeBtn: document.getElementById('tabCodeBtn'),
    tabPreviewBtn: document.getElementById('tabPreviewBtn'),
    tabSplitBtn: document.getElementById('tabSplitBtn'),
    codeViewContainer: document.getElementById('codeViewContainer'),
    previewViewContainer: document.getElementById('previewViewContainer'),
    workspaceArea: document.getElementById('workspaceArea'),
    latexEditor: document.getElementById('latexEditor'),
    renderOutput: document.getElementById('renderOutput'),
    charCount: document.getElementById('charCount'),

    // Export & Quick Buttons
    copyLatexBtn: document.getElementById('copyLatexBtn'),
    copyBtnText: document.getElementById('copyBtnText'),
    downloadTexBtn: document.getElementById('downloadTexBtn'),
    openOverleafBtn: document.getElementById('openOverleafBtn'),
    clearCodeBtn: document.getElementById('clearCodeBtn'),
    zoomInBtn: document.getElementById('zoomInBtn'),
    zoomOutBtn: document.getElementById('zoomOutBtn'),
    printPreviewBtn: document.getElementById('printPreviewBtn'),
    overleafForm: document.getElementById('overleafForm'),
    overleafSnipInput: document.getElementById('overleafSnipInput'),

    // Modals & Settings
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    geminiApiKeyInput: document.getElementById('geminiApiKeyInput'),
    geminiModelSelect: document.getElementById('geminiModelSelect'),
    ollamaUrlInput: document.getElementById('ollamaUrlInput'),
    ollamaModelInput: document.getElementById('ollamaModelInput'),
    customApiUrlInput: document.getElementById('customApiUrlInput'),

    // Guide Modal
    openGuideBtn: document.getElementById('openGuideBtn'),
    closeGuideBtn: document.getElementById('closeGuideBtn'),
    guideModal: document.getElementById('guideModal'),
    guideGotItBtn: document.getElementById('guideGotItBtn'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
  };
}

function loadSettings() {
  const savedKey = localStorage.getItem('math2latex_gemini_key') || '';
  const savedModel = localStorage.getItem('math2latex_gemini_model') || 'gemini-3.7-flash';
  const savedOllamaUrl = localStorage.getItem('math2latex_ollama_url') || 'http://localhost:11434';
  const savedOllamaModel = localStorage.getItem('math2latex_ollama_model') || 'llava';
  const savedCustomUrl = localStorage.getItem('math2latex_custom_url') || '';

  if (el.geminiApiKeyInput) el.geminiApiKeyInput.value = savedKey;
  if (el.geminiModelSelect) el.geminiModelSelect.value = savedModel;
  if (el.ollamaUrlInput) el.ollamaUrlInput.value = savedOllamaUrl;
  if (el.ollamaModelInput) el.ollamaModelInput.value = savedOllamaModel;
  if (el.customApiUrlInput) el.customApiUrlInput.value = savedCustomUrl;
}

function updateApiStatusIndicator() {
  const savedKey = localStorage.getItem('math2latex_gemini_key') || '';
  if (el.apiStatusDot) {
    if (savedKey.length > 5) {
      el.apiStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30';
      el.apiStatusDot.title = 'Gemini API Key đã sẵn sàng';
    } else {
      el.apiStatusDot.className = 'w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/30';
      el.apiStatusDot.title = 'Chưa cấu hình Gemini API Key';
    }
  }
}

function setupEventListeners() {
  // Engine switchers
  el.engineGeminiBtn?.addEventListener('click', () => setEngine('gemini'));
  el.engineTesseractBtn?.addEventListener('click', () => setEngine('tesseract'));
  el.engineOllamaBtn?.addEventListener('click', () => setEngine('ollama'));

  // File Upload Handlers
  el.fileInput?.addEventListener('change', handleFileSelect);

  // Drag & Drop Handling
  ['dragenter', 'dragover'].forEach(eventName => {
    el.dropZone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    el.dropZone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.dropZone.classList.remove('drag-over');
    });
  });

  el.dropZone?.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  });

  // Global Clipboard Paste (Ctrl + V)
  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        processImageFile(blob);
        showToast('Đã dán ảnh từ bộ nhớ tạm (Clipboard)!', 'success');
        break;
      }
    }
  });

  // Crop & Image Manipulation Tools
  el.cropToggleBtn?.addEventListener('click', startCropping);
  el.cropApplyBtn?.addEventListener('click', applyCrop);
  el.cropCancelBtn?.addEventListener('click', cancelCrop);
  el.rotateBtn?.addEventListener('click', rotateImage);
  el.clearImageBtn?.addEventListener('click', clearImage);

  // Preset Sample Cards
  document.querySelectorAll('.sample-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sampleKey = btn.dataset.sample;
      loadSamplePreset(sampleKey);
    });
  });

  // Math Toolbar Fast Insertion Buttons
  document.querySelectorAll('.math-tool-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const latex = btn.dataset.latex;
      insertLatexAtCursor(latex);
    });
  });

  // Convert Trigger
  el.convertBtn?.addEventListener('click', handleConvert);

  // Tab View Switcher
  el.tabCodeBtn?.addEventListener('click', () => switchTab('code'));
  el.tabPreviewBtn?.addEventListener('click', () => switchTab('preview'));
  el.tabSplitBtn?.addEventListener('click', () => switchTab('split'));

  // Live Editor Event
  el.latexEditor?.addEventListener('input', () => {
    updateEditorStats();
    renderLatexPreview();
  });

  // Export Actions
  el.copyLatexBtn?.addEventListener('click', copyLatexCode);
  el.downloadTexBtn?.addEventListener('click', downloadTexFile);
  el.openOverleafBtn?.addEventListener('click', openInOverleaf);
  el.clearCodeBtn?.addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ mã LaTeX?')) {
      el.latexEditor.value = '';
      updateEditorStats();
      renderLatexPreview();
    }
  });

  // Zoom & Print Controls
  el.zoomInBtn?.addEventListener('click', () => {
    state.fontSize = Math.min(26, state.fontSize + 2);
    el.renderOutput.style.fontSize = `${state.fontSize}px`;
  });
  el.zoomOutBtn?.addEventListener('click', () => {
    state.fontSize = Math.max(13, state.fontSize - 2);
    el.renderOutput.style.fontSize = `${state.fontSize}px`;
  });
  el.printPreviewBtn?.addEventListener('click', () => window.print());

  // Settings Modal Handlers
  el.openSettingsBtn?.addEventListener('click', () => el.settingsModal.classList.remove('hidden'));
  el.closeSettingsBtn?.addEventListener('click', () => el.settingsModal.classList.add('hidden'));
  el.settingsModal?.addEventListener('click', (e) => {
    if (e.target === el.settingsModal) el.settingsModal.classList.add('hidden');
  });
  el.saveSettingsBtn?.addEventListener('click', saveSettings);

  // Guide Modal Handlers
  el.openGuideBtn?.addEventListener('click', () => el.guideModal.classList.remove('hidden'));
  el.closeGuideBtn?.addEventListener('click', () => el.guideModal.classList.add('hidden'));
  el.guideGotItBtn?.addEventListener('click', () => el.guideModal.classList.add('hidden'));
  el.guideModal?.addEventListener('click', (e) => {
    if (e.target === el.guideModal) el.guideModal.classList.add('hidden');
  });
}

function setEngine(engineName) {
  state.activeEngine = engineName;
  localStorage.setItem('math2latex_engine', engineName);
  updateEngineUI();
}

function updateEngineUI() {
  const btns = [
    { name: 'gemini', btn: el.engineGeminiBtn },
    { name: 'tesseract', btn: el.engineTesseractBtn },
    { name: 'ollama', btn: el.engineOllamaBtn }
  ];

  btns.forEach(item => {
    if (item.btn) {
      if (item.name === state.activeEngine) {
        item.btn.classList.add('active');
        item.btn.classList.remove('text-slate-400');
      } else {
        item.btn.classList.remove('active');
        item.btn.classList.add('text-slate-400');
      }
    }
  });
}

function saveSettings() {
  const geminiKey = el.geminiApiKeyInput.value.trim();
  const geminiModel = el.geminiModelSelect?.value || 'gemini-3.6-flash';
  const ollamaUrl = el.ollamaUrlInput.value.trim();
  const ollamaModel = el.ollamaModelInput.value.trim();
  const customUrl = el.customApiUrlInput.value.trim();

  localStorage.setItem('math2latex_gemini_key', geminiKey);
  localStorage.setItem('math2latex_gemini_model', geminiModel);
  localStorage.setItem('math2latex_ollama_url', ollamaUrl);
  localStorage.setItem('math2latex_ollama_model', ollamaModel);
  localStorage.setItem('math2latex_custom_url', customUrl);

  updateApiStatusIndicator();
  el.settingsModal.classList.add('hidden');
  showToast('Đã lưu cấu hình API thành công!', 'success');
}

// File handling
function handleFileSelect(e) {
  const files = e.target.files;
  if (files && files.length > 0) {
    processImageFile(files[0]);
  }
}

function processImageFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)!', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    setImageSrc(event.target.result);
  };
  reader.readAsDataURL(file);
}

function setImageSrc(dataUrl) {
  state.currentImageBase64 = dataUrl;
  el.previewImg.src = dataUrl;
  el.uploadPrompt.classList.add('hidden');
  el.imagePreviewContainer.classList.remove('hidden');
  el.imageToolsBar.classList.remove('hidden');

  if (state.cropper) {
    state.cropper.destroy();
    state.cropper = null;
  }
  resetCropUI();
  showToast('Đã nạp ảnh bài toán.', 'info');
}

function clearImage() {
  if (state.cropper) {
    state.cropper.destroy();
    state.cropper = null;
  }
  state.currentImageBase64 = null;
  el.previewImg.src = '';
  el.fileInput.value = '';
  el.uploadPrompt.classList.remove('hidden');
  el.imagePreviewContainer.classList.add('hidden');
  el.imageToolsBar.classList.add('hidden');
  resetCropUI();
}

// Cropping
function startCropping() {
  if (state.cropper) return;
  state.cropper = new Cropper(el.previewImg, {
    viewMode: 1,
    autoCropArea: 0.9,
    responsive: true,
    background: false
  });

  el.cropToggleBtn.classList.add('hidden');
  el.cropApplyBtn.classList.remove('hidden');
  el.cropCancelBtn.classList.remove('hidden');
}

function applyCrop() {
  if (!state.cropper) return;
  const croppedCanvas = state.cropper.getCroppedCanvas({
    maxWidth: 2048,
    maxHeight: 2048
  });
  const croppedDataUrl = croppedCanvas.toDataURL('image/jpeg', 0.95);
  state.cropper.destroy();
  state.cropper = null;

  setImageSrc(croppedDataUrl);
  showToast('Đã cắt vùng chọn bài toán!', 'success');
}

function cancelCrop() {
  if (state.cropper) {
    state.cropper.destroy();
    state.cropper = null;
  }
  resetCropUI();
}

function resetCropUI() {
  el.cropToggleBtn?.classList.remove('hidden');
  el.cropApplyBtn?.classList.add('hidden');
  el.cropCancelBtn?.classList.add('hidden');
}

function rotateImage() {
  if (!state.currentImageBase64) return;
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.height;
    canvas.height = img.width;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((90 * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    setImageSrc(canvas.toDataURL('image/jpeg', 0.95));
  };
  img.src = state.currentImageBase64;
}

function loadSamplePreset(presetKey) {
  const preset = SAMPLE_PRESETS[presetKey];
  if (!preset) return;

  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  preset.render(ctx, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/png');
  setImageSrc(dataUrl);
  showToast(`Đã nạp đề mẫu: ${preset.title}`, 'info');
}

// Convert Processing
async function handleConvert() {
  if (!state.currentImageBase64) {
    showToast('Vui lòng tải hoặc dán ảnh đề toán trước khi chuyển đổi!', 'error');
    return;
  }

  if (state.isConverting) return;
  state.isConverting = true;
  setConvertingState(true);

  const isFullDocument = el.docTypeSelect.value === 'full';
  const customNotes = el.customNotes.value.trim();

  try {
    let resultLatex = '';

    if (state.activeEngine === 'tesseract') {
      resultLatex = await runTesseractOCR(state.currentImageBase64, isFullDocument);
    } else {
      const apiKey = localStorage.getItem('math2latex_gemini_key') || '';
      const geminiModel = localStorage.getItem('math2latex_gemini_model') || 'gemini-3.6-flash';
      const ollamaUrl = localStorage.getItem('math2latex_ollama_url') || 'http://localhost:11434';
      const ollamaModel = localStorage.getItem('math2latex_ollama_model') || 'llava';
      const customApiUrl = localStorage.getItem('math2latex_custom_url') || '';

      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: state.currentImageBase64,
          engine: state.activeEngine,
          isFullDocument: isFullDocument,
          customNotes: customNotes,
          apiKey: apiKey,
          geminiModel: geminiModel,
          ollamaUrl: ollamaUrl,
          ollamaModel: ollamaModel,
          customApiUrl: customApiUrl
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Lỗi không xác định khi chuyển đổi.');
      }
      resultLatex = data.latex;
    }

    el.latexEditor.value = resultLatex;
    updateEditorStats();
    renderLatexPreview();

    showToast('Chuyển đổi sang LaTeX hoàn tất!', 'success');
  } catch (error) {
    console.error('Conversion error:', error);
    showToast(`Lỗi: ${error.message}`, 'error');
    if (error.message.includes('API Key') || error.message.includes('GEMINI_API_KEY')) {
      el.settingsModal.classList.remove('hidden');
    }
  } finally {
    state.isConverting = false;
    setConvertingState(false);
  }
}

// In-Browser Tesseract OCR (100% Offline & Free)
async function runTesseractOCR(base64Image, isFullDocument) {
  showToast('Đang nhận diện bằng Tesseract Offline trong trình duyệt...', 'info');
  
  const worker = await Tesseract.createWorker('vie+eng');
  const ret = await worker.recognize(base64Image);
  await worker.terminate();

  const rawText = ret.data.text || '';
  
  let processed = rawText
    .replace(/Câu\s*(\d+)[:.]?/gi, '\n\\textbf{Câu $1.} ')
    .replace(/Bài\s*(\d+)[:.]?/gi, '\n\\textbf{Bài $1.} ')
    .replace(/([A-D])\s*[\.\)]\s*/g, '\\textbf{$1.} ')
    .replace(/(\d+)\/(\d+)/g, '\\dfrac{$1}{$2}')
    .replace(/sqrt\(([^)]+)\)/gi, '\\sqrt{$1}')
    .replace(/int_([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/gi, '\\int_{$1}^{$2}')
    .replace(/lim_([a-zA-Z0-9\s->]+)/gi, '\\lim_{$1}')
    .replace(/<=/g, '\\le ')
    .replace(/>=/g, '\\ge ')
    .replace(/!=/g, '\\ne ')
    .replace(/<=>/g, '\\Leftrightarrow ')
    .replace(/=>/g, '\\Rightarrow ');

  if (isFullDocument) {
    return `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{geometry}
\\geometry{a4paper, top=2cm, bottom=2cm, left=2cm, right=2cm}

\\begin{document}

${processed.trim()}

\\end{document}`;
  }

  return processed.trim();
}

function setConvertingState(isLoading) {
  if (isLoading) {
    el.convertBtn.disabled = true;
    el.convertBtnText.textContent = 'Đang nhận diện & tạo LaTeX...';
    el.convertBtnIcon.classList.add('hidden');
    el.convertSpinner.classList.remove('hidden');
  } else {
    el.convertBtn.disabled = false;
    el.convertBtnText.textContent = 'Chuyển Đổi Thành LaTeX Ngay';
    el.convertBtnIcon.classList.remove('hidden');
    el.convertSpinner.classList.add('hidden');
  }
}

function switchTab(tab) {
  state.activeTab = tab;
  [el.tabCodeBtn, el.tabPreviewBtn, el.tabSplitBtn].forEach(btn => btn?.classList.remove('active'));

  if (tab === 'code') {
    el.tabCodeBtn?.classList.add('active');
    el.codeViewContainer.classList.remove('hidden');
    el.previewViewContainer.classList.add('hidden');
    el.workspaceArea.className = 'flex-1 grid grid-cols-1 gap-3 min-h-[480px]';
  } else if (tab === 'preview') {
    el.tabPreviewBtn?.classList.add('active');
    el.codeViewContainer.classList.add('hidden');
    el.previewViewContainer.classList.remove('hidden');
    el.previewViewContainer.classList.add('flex');
    el.workspaceArea.className = 'flex-1 grid grid-cols-1 gap-3 min-h-[480px]';
    renderLatexPreview();
  } else if (tab === 'split') {
    el.tabSplitBtn?.classList.add('active');
    el.codeViewContainer.classList.remove('hidden');
    el.previewViewContainer.classList.remove('hidden');
    el.previewViewContainer.classList.add('flex');
    el.workspaceArea.className = 'flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-[480px]';
    renderLatexPreview();
  }
}

function updateWorkspaceView() {
  switchTab(state.activeTab);
}

function updateEditorStats() {
  const text = el.latexEditor.value || '';
  const charCount = text.length;
  const lineCount = text ? text.split('\n').length : 0;
  el.charCount.textContent = `${charCount} ký tự | ${lineCount} dòng`;
}

function insertLatexAtCursor(snippet) {
  const editor = el.latexEditor;
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const text = editor.value;

  editor.value = text.substring(0, start) + snippet + text.substring(end);
  editor.selectionStart = editor.selectionEnd = start + snippet.length;
  editor.focus();

  updateEditorStats();
  renderLatexPreview();
}

// Live KaTeX & Document Rendering Engine
function renderLatexPreview() {
  const rawLatex = el.latexEditor.value.trim();
  if (!rawLatex) {
    el.renderOutput.innerHTML = `
      <div class="text-slate-400 text-center italic mt-16 flex flex-col items-center gap-2">
        <i class="fa-solid fa-file-circle-question text-3xl text-slate-300"></i>
        <span>Chưa có nội dung hiển thị. Hãy chuyển đổi ảnh hoặc nhập mã LaTeX ở khung soạn thảo.</span>
      </div>
    `;
    return;
  }

  // Extract body between \begin{document} and \end{document}
  let bodyContent = rawLatex;
  const docMatch = rawLatex.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/i);
  if (docMatch) {
    bodyContent = docMatch[1];
  }

  // Clean LaTeX comments
  bodyContent = bodyContent.replace(/(^|[^\\])%.*$/gm, '$1');

  // Convert standard LaTeX formatting to clean HTML tags
  let html = bodyContent
    // Bold / Italic / Underline
    .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
    .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
    .replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>')
    // Section headers
    .replace(/\\section\*?\{([^}]+)\}/g, '<h2 class="text-xl font-bold mt-4 mb-2 text-indigo-900 border-b pb-1">$1</h2>')
    .replace(/\\subsection\*?\{([^}]+)\}/g, '<h3 class="text-lg font-bold mt-3 mb-1 text-indigo-800">$1</h3>')
    // Question Cards (Câu X.)
    .replace(/<strong>(Câu\s*\d+[^<]*)<\/strong>/gi, '<div class="question-card"><strong class="text-indigo-700">$1</strong>')
    // Task lists / Choices
    .replace(/\\begin\{tasks\}\(?\d*\)?/g, '<div class="choice-grid">')
    .replace(/\\end\{tasks\}/g, '</div></div>')
    .replace(/\\task/g, '<div class="choice-item">')
    // Lists
    .replace(/\\begin\{enumerate\}(\[[^\]]*\])?/g, '<ol class="list-decimal list-inside my-2 space-y-1">')
    .replace(/\\end\{enumerate\}/g, '</ol>')
    .replace(/\\begin\{itemize\}/g, '<ul class="list-disc list-inside my-2 space-y-1">')
    .replace(/\\end\{itemize\}/g, '</ul>')
    .replace(/\\item\s*/g, '<li>')
    // Spacing
    .replace(/\\quad/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
    .replace(/\\qquad/g, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')
    .replace(/\\\\/g, '<br>')
    .replace(/\n\n+/g, '</p><p class="mb-3">');

  html = `<p class="mb-3">${html}</p>`;

  el.renderOutput.innerHTML = html;

  // Run KaTeX Auto-Render
  if (window.renderMathInElement) {
    try {
      window.renderMathInElement(el.renderOutput, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    } catch (e) {
      console.warn('KaTeX rendering notice:', e);
    }
  }
}

// Copy LaTeX
async function copyLatexCode() {
  const code = el.latexEditor.value;
  if (!code) {
    showToast('Chưa có mã LaTeX để sao chép!', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(code);
    el.copyBtnText.textContent = 'Đã chép!';
    showToast('Đã sao chép toàn bộ mã LaTeX vào Clipboard!', 'success');
    setTimeout(() => {
      el.copyBtnText.textContent = 'Sao chép';
    }, 2000);
  } catch (err) {
    showToast('Vui lòng bấm Ctrl+C trong khung soạn thảo để sao chép.', 'error');
  }
}

// Download .tex file
function downloadTexFile() {
  const latex = el.latexEditor.value;
  if (!latex) {
    showToast('Không có mã LaTeX để tải về!', 'error');
    return;
  }

  const blob = new Blob([latex], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `de_toan_${new Date().toISOString().slice(0, 10)}.tex`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Đã tải tệp .tex về máy thành công!', 'success');
}

// Open directly in Overleaf
function openInOverleaf() {
  const latex = el.latexEditor.value;
  if (!latex) {
    showToast('Vui lòng tạo hoặc dán mã LaTeX trước khi mở Overleaf!', 'error');
    return;
  }

  let fullLatex = latex;
  if (!latex.includes('\\documentclass')) {
    fullLatex = `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{geometry}
\\geometry{a4paper, top=2cm, bottom=2cm, left=2cm, right=2cm}

\\begin{document}
${latex}
\\end{document}`;
  }

  el.overleafSnipInput.value = fullLatex;
  el.overleafForm.submit();
  showToast('Đang mở dự án mới trên Overleaf...', 'info');
}

// Toast Notifications System
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-solid fa-circle-info';
  if (type === 'success') icon = 'fa-solid fa-circle-check';
  if (type === 'error') icon = 'fa-solid fa-circle-exclamation';

  toast.innerHTML = `<i class="${icon}"></i><span>${message}</span>`;
  el.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
