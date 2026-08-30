/**
 * MiDaTeX PRO - Core Engine & Interactive UI Logic
 * Vanguard UI, KaTeX Typesetting, PDF.js Multi-Page OCR & Self-Healing Multi-Key Gemini Engine
 */

// Application State
const state = {
  mode: localStorage.getItem('math2latex_mode') || 'standard', // 'standard' | 'pro'
  activeEngine: localStorage.getItem('math2latex_engine') || 'gemini',
  currentImageBase64: null,
  currentFileName: 'de_toan',
  cropper: null,
  activeTab: 'code', // 'code', 'preview', 'split'
  fontSize: 16.5,
  isConverting: false,
  theme: localStorage.getItem('math2latex_theme') || 'dark',

  // PDF.js State for Pro Mode
  pdfDoc: null,
  pdfTotalPages: 0,
  pdfCurrentPage: 1,
  pdfPageRendering: false,
  pdfPendingPage: null,
  pdfScale: 2.2,
  pdfFile: null
};

// Application Elements Map
let el = {};

document.addEventListener('DOMContentLoaded', () => {
  initElements();
  loadSettings();
  setupEventListeners();
  applyModeUI();
  updateWorkspaceView();
  updateApiStatusIndicator();
  renderMathToolbarSymbols();
  renderLatexPreview();
  initTheme();
});

function initElements() {
  el = {
    // Mode Switcher
    modeStandardBtn: document.getElementById('modeStandardBtn'),
    modeProBtn: document.getElementById('modeProBtn'),
    leftPanelTitle: document.getElementById('leftPanelTitle'),
    pasteHintChip: document.getElementById('pasteHintChip'),
    docTypeSelect: document.getElementById('docTypeSelect'),
    apiStatusDot: document.getElementById('apiStatusDot'),

    // Dropzone & File Input
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    uploadPrompt: document.getElementById('uploadPrompt'),
    uploadPromptText: document.getElementById('uploadPromptText'),
    uploadPromptSub: document.getElementById('uploadPromptSub'),
    uploadMainIcon: document.getElementById('uploadMainIcon'),

    // Standard Image Preview & Tools
    imagePreviewContainer: document.getElementById('imagePreviewContainer'),
    previewImg: document.getElementById('previewImg'),
    imageToolsBar: document.getElementById('imageToolsBar'),
    cropToggleBtn: document.getElementById('cropToggleBtn'),
    cropApplyBtn: document.getElementById('cropApplyBtn'),
    cropCancelBtn: document.getElementById('cropCancelBtn'),
    rotateBtn: document.getElementById('rotateBtn'),
    clearImageBtn: document.getElementById('clearImageBtn'),
    samplePresetsContainer: document.getElementById('samplePresetsContainer'),
    customNotes: document.getElementById('customNotes'),

    // Pro PDF Viewer & Controls
    pdfViewerContainer: document.getElementById('pdfViewerContainer'),
    pdfFileName: document.getElementById('pdfFileName'),
    pdfPageStats: document.getElementById('pdfPageStats'),
    removePdfBtn: document.getElementById('removePdfBtn'),
    pdfPrevPageBtn: document.getElementById('pdfPrevPageBtn'),
    pdfNextPageBtn: document.getElementById('pdfNextPageBtn'),
    pdfPageInput: document.getElementById('pdfPageInput'),
    pdfTotalPagesLabel: document.getElementById('pdfTotalPagesLabel'),
    pdfCanvas: document.getElementById('pdfCanvas'),
    convertCurrentPageBtn: document.getElementById('convertCurrentPageBtn'),
    convertAllPdfBtn: document.getElementById('convertAllPdfBtn'),

    // Main Convert Trigger (Standard Mode)
    convertBtn: document.getElementById('convertBtn'),
    convertBtnText: document.getElementById('convertBtnText'),
    convertBtnIcon: document.getElementById('convertBtnIcon'),
    convertSpinner: document.getElementById('convertSpinner'),

    // Progress Bar
    progressContainer: document.getElementById('progressContainer'),
    progressStatus: document.getElementById('progressStatus'),
    progressPercent: document.getElementById('progressPercent'),
    progressBar: document.getElementById('progressBar'),
    progressIcon: document.getElementById('progressIcon'),
    step1: document.getElementById('step1'),
    step2: document.getElementById('step2'),
    step3: document.getElementById('step3'),
    step4: document.getElementById('step4'),

    // Quick Insert Toolbar
    quickInsertToolbar: document.getElementById('quickInsertToolbar'),

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
    texFileNameInput: document.getElementById('texFileNameInput'),

    // Export & Action Buttons
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

    // Settings Modal
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    geminiKeysContainer: document.getElementById('geminiKeysContainer'),
    addApiKeyBtn: document.getElementById('addApiKeyBtn'),
    geminiModelSelect: document.getElementById('geminiModelSelect'),


    // Guide Modal
    openGuideBtn: document.getElementById('openGuideBtn'),
    closeGuideBtn: document.getElementById('closeGuideBtn'),
    guideModal: document.getElementById('guideModal'),
    guideGotItBtn: document.getElementById('guideGotItBtn'),

    // Toast
    toastContainer: document.getElementById('toastContainer'),

    // Theme Toggle
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon')
  };
}

// ==========================================================================
// Mode Switcher (Standard vs Pro)
// ==========================================================================
function setMode(mode) {
  state.mode = mode;
  localStorage.setItem('math2latex_mode', mode);
  applyModeUI();
  showToast(`Đã chuyển sang chế độ ${mode === 'pro' ? 'Pro (Hỗ trợ PDF & Tài liệu)' : 'Standard (Ảnh đề toán)'}`, 'info');
}

function applyModeUI() {
  const isPro = state.mode === 'pro';
  setFilePickerEnabled(!(isPro && state.pdfDoc));

  if (isPro) {
    el.modeProBtn?.classList.add('active');
    el.modeStandardBtn?.classList.remove('active');
    if (el.fileInput) el.fileInput.accept = '.pdf,image/*';
    if (el.leftPanelTitle) el.leftPanelTitle.textContent = 'Nạp tài liệu & đề thi (PDF / Ảnh)';
    if (el.uploadMainIcon) el.uploadMainIcon.className = 'fa-solid fa-file-pdf text-xl text-pen';
    if (el.uploadPromptText) {
      el.uploadPromptText.innerHTML = 'Kéo &amp; thả tệp <strong class="text-pen font-bold">PDF</strong> hoặc ảnh đề thi vào đây, hoặc <span class="text-gold underline decoration-gold/40 underline-offset-4 group-hover:decoration-gold">chọn tệp</span>';
    }
    if (el.uploadPromptSub) {
      el.uploadPromptSub.textContent = 'Hỗ trợ tệp PDF nhiều trang & ảnh độ phân giải cao';
    }

    if (state.pdfDoc) {
      el.pdfViewerContainer?.classList.remove('hidden');
      el.pdfViewerContainer?.classList.add('flex');
      el.uploadPrompt?.classList.add('hidden');
      el.imagePreviewContainer?.classList.add('hidden');
      el.imageToolsBar?.classList.add('hidden');
      el.convertBtn?.classList.add('hidden');
    }
  } else {
    el.modeStandardBtn?.classList.add('active');
    el.modeProBtn?.classList.remove('active');
    if (el.fileInput) el.fileInput.accept = 'image/*';
    if (el.leftPanelTitle) el.leftPanelTitle.textContent = 'Nạp ảnh đề toán';
    if (el.uploadMainIcon) el.uploadMainIcon.className = 'fa-solid fa-cloud-arrow-up text-xl text-gold';
    if (el.uploadPromptText) {
      el.uploadPromptText.innerHTML = 'Kéo &amp; thả ảnh đề thi vào đây, hoặc <span class="text-gold underline decoration-gold/40 underline-offset-4 group-hover:decoration-gold">chọn tệp</span>';
    }
    if (el.uploadPromptSub) {
      el.uploadPromptSub.textContent = 'PNG, JPG, JPEG, WEBP — kể cả ảnh chụp màn hình';
    }

    el.pdfViewerContainer?.classList.add('hidden');
    el.pdfViewerContainer?.classList.remove('flex');
    el.convertBtn?.classList.remove('hidden');

    if (state.currentImageBase64) {
      el.imagePreviewContainer?.classList.remove('hidden');
      el.imageToolsBar?.classList.remove('hidden');
      el.uploadPrompt?.classList.add('hidden');
    } else {
      el.uploadPrompt?.classList.remove('hidden');
    }
  }
}

// The upload input is layered over the drop zone. Disable it while a PDF is
// open so it cannot intercept clicks intended for the PDF controls beneath it.
function setFilePickerEnabled(isEnabled) {
  const fileInput = el.fileInput;
  if (!fileInput) return;

  fileInput.disabled = !isEnabled;
  fileInput.classList.toggle('is-inactive', !isEnabled);
  fileInput.tabIndex = isEnabled ? 0 : -1;
  fileInput.setAttribute('aria-hidden', String(!isEnabled));
}

// ==========================================================================
// Settings Modal & Dynamic Multi-API Key Management
// ==========================================================================
function loadSettings() {
  let keys = [];
  try {
    const raw = localStorage.getItem('math2latex_gemini_keys');
    if (raw) {
      keys = JSON.parse(raw);
    }
  } catch (_) {}

  // Fallback to legacy single key if array is empty
  if (!Array.isArray(keys) || keys.length === 0) {
    const legacyKey = localStorage.getItem('math2latex_gemini_key');
    const legacyBackup = localStorage.getItem('math2latex_gemini_backup_key');
    if (legacyKey) keys.push(legacyKey);
    if (legacyBackup && legacyBackup !== legacyKey) keys.push(legacyBackup);
  }

  // Ensure default backup key exists if nothing configured
  if (keys.length === 0) {
    keys.push('');
  }

  renderApiKeyInputs(keys);

  const savedModel = localStorage.getItem('math2latex_gemini_model') || 'gemini-2.5-flash';
  if (el.geminiModelSelect) el.geminiModelSelect.value = savedModel;
}

function renderApiKeyInputs(keysArray) {
  if (!el.geminiKeysContainer) return;
  el.geminiKeysContainer.innerHTML = '';

  const list = keysArray.length > 0 ? keysArray : [''];
  list.forEach((keyVal, idx) => {
    addApiKeyRow(keyVal, idx, list.length);
  });
}

function addApiKeyRow(value = '', index = 0, totalCount = 1) {
  if (!el.geminiKeysContainer) return;

  const row = document.createElement('div');
  row.className = 'api-key-row flex items-center gap-2 p-1.5 rounded-lg';

  const isPrimary = index === 0;
  const badgeClass = isPrimary ? 'key-badge key-badge-primary' : 'key-badge key-badge-backup';
  const badgeText = isPrimary ? 'Key #1 (Chính)' : `Key #${index + 1} (Dự phòng)`;

  row.innerHTML = `
    <span class="${badgeClass}">${badgeText}</span>
    <div class="relative flex-1">
      <input type="password" class="gemini-key-input field font-mono pr-8 text-xs py-1.5" placeholder="${isPrimary ? 'AIzaSy... (Khóa chính)' : 'AIzaSy... hoặc AQ.Ab8... (Khóa dự phòng)'}" value="${value || ''}">
      <button type="button" class="toggle-pwd-btn absolute right-2 top-1/2 -translate-y-1/2 text-chalk-faint hover:text-gold text-xs transition-colors" title="Hiện/Ẩn Key">
        <i class="fa-solid fa-eye-slash"></i>
      </button>
    </div>
    <button type="button" class="delete-key-btn icon-btn text-xs text-pen hover:text-pen-600 ${totalCount <= 1 && isPrimary ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}" title="Xóa API Key này">
      <i class="fa-regular fa-trash-can"></i>
    </button>
  `;

  // Password visibility toggle
  const pwdInput = row.querySelector('.gemini-key-input');
  const toggleBtn = row.querySelector('.toggle-pwd-btn');
  toggleBtn?.addEventListener('click', () => {
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
      toggleBtn.innerHTML = '<i class="fa-solid fa-eye text-gold"></i>';
    } else {
      pwdInput.type = 'password';
      toggleBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    }
  });

  // Delete row button
  const delBtn = row.querySelector('.delete-key-btn');
  delBtn?.addEventListener('click', () => {
    row.remove();
    reindexApiKeyRows();
  });

  el.geminiKeysContainer.appendChild(row);
}

function reindexApiKeyRows() {
  if (!el.geminiKeysContainer) return;
  const rows = el.geminiKeysContainer.querySelectorAll('.api-key-row');
  
  if (rows.length === 0) {
    addApiKeyRow('', 0, 1);
    return;
  }

  rows.forEach((r, idx) => {
    const isPrimary = idx === 0;
    const badge = r.querySelector('.key-badge');
    const delBtn = r.querySelector('.delete-key-btn');

    if (badge) {
      badge.className = isPrimary ? 'key-badge key-badge-primary' : 'key-badge key-badge-backup';
      badge.textContent = isPrimary ? 'Key #1 (Chính)' : `Key #${idx + 1} (Dự phòng)`;
    }

    if (delBtn) {
      if (rows.length === 1) {
        delBtn.classList.add('opacity-30', 'cursor-not-allowed', 'pointer-events-none');
      } else {
        delBtn.classList.remove('opacity-30', 'cursor-not-allowed', 'pointer-events-none');
      }
    }
  });
}

function getSavedApiKeys() {
  if (!el.geminiKeysContainer) return [];
  const inputs = el.geminiKeysContainer.querySelectorAll('.gemini-key-input');
  const keys = [];
  inputs.forEach(inp => {
    const val = inp.value.trim();
    if (val) keys.push(val);
  });
  return keys;
}

function saveSettings() {
  const keys = getSavedApiKeys();
  const geminiModel = el.geminiModelSelect?.value || 'gemini-2.5-flash';

  localStorage.setItem('math2latex_gemini_keys', JSON.stringify(keys));
  localStorage.setItem('math2latex_gemini_key', keys[0] || '');
  localStorage.setItem('math2latex_gemini_backup_key', keys[1] || '');
  localStorage.setItem('math2latex_gemini_model', geminiModel);

  updateApiStatusIndicator();
  el.settingsModal?.classList.add('hidden');
  showToast(`Đã lưu cấu hình với ${keys.length} API Key sẵn sàng!`, 'success');
}

function updateApiStatusIndicator() {
  const keys = getSavedApiKeys();
  const legacyKey = localStorage.getItem('math2latex_gemini_key') || '';
  const hasKey = keys.length > 0 || legacyKey.length > 5;

  if (el.apiStatusDot) {
    if (hasKey) {
      el.apiStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30';
      el.apiStatusDot.title = `Đã cấu hình ${keys.length || 1} Gemini API Key`;
    } else {
      el.apiStatusDot.className = 'w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/30';
      el.apiStatusDot.title = 'Chưa cấu hình Gemini API Key';
    }
  }
}

// ==========================================================================
// Setup Event Listeners
// ==========================================================================
function setupEventListeners() {
  // Mode Switcher
  el.modeStandardBtn?.addEventListener('click', () => setMode('standard'));
  el.modeProBtn?.addEventListener('click', () => setMode('pro'));

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
      processSelectedFile(files[0]);
    }
  });

  // Global Clipboard Paste (Ctrl + V)
  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let item of items) {
      if (item.kind === 'file') {
        const blob = item.getAsFile();
        if (blob) {
          processSelectedFile(blob);
          showToast('Đã dán ảnh từ Clipboard!', 'success');
          break;
        }
      }
    }
  });

  // Image Manipulation Tools (Standard mode)
  el.cropToggleBtn?.addEventListener('click', startCropping);
  el.cropApplyBtn?.addEventListener('click', applyCrop);
  el.cropCancelBtn?.addEventListener('click', cancelCrop);
  el.rotateBtn?.addEventListener('click', rotateImage);
  el.clearImageBtn?.addEventListener('click', clearLoadedMedia);

  // PDF Viewer Navigation (Pro mode)
  el.removePdfBtn?.addEventListener('click', clearLoadedMedia);
  el.pdfPrevPageBtn?.addEventListener('click', () => {
    if (state.pdfDoc && state.pdfCurrentPage > 1) {
      state.pdfCurrentPage--;
      renderPdfPage(state.pdfCurrentPage);
    }
  });
  el.pdfNextPageBtn?.addEventListener('click', () => {
    if (state.pdfDoc && state.pdfCurrentPage < state.pdfTotalPages) {
      state.pdfCurrentPage++;
      renderPdfPage(state.pdfCurrentPage);
    }
  });
  el.pdfPageInput?.addEventListener('change', (e) => {
    let val = parseInt(e.target.value, 10);
    if (state.pdfDoc && !isNaN(val)) {
      val = Math.max(1, Math.min(state.pdfTotalPages, val));
      state.pdfCurrentPage = val;
      renderPdfPage(val);
    }
  });

  // Pro PDF Conversion Triggers
  el.convertCurrentPageBtn?.addEventListener('click', handleConvertPdfCurrentPage);
  el.convertAllPdfBtn?.addEventListener('click', handleConvertPdfAllPages);

  // Math Toolbar Fast Insertion Buttons
  document.querySelectorAll('.math-tool-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const latex = btn.dataset.latex;
      if (latex) insertLatexAtCursor(latex);
    });
  });

  // Convert Trigger (Standard mode)
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

  // Filename input
  el.texFileNameInput?.addEventListener('input', (e) => {
    state.currentFileName = e.target.value.trim() || 'de_toan';
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
  el.openSettingsBtn?.addEventListener('click', () => el.settingsModal?.classList.remove('hidden'));
  el.closeSettingsBtn?.addEventListener('click', () => el.settingsModal?.classList.add('hidden'));
  el.settingsModal?.addEventListener('click', (e) => {
    if (e.target === el.settingsModal) el.settingsModal?.classList.add('hidden');
  });
  el.saveSettingsBtn?.addEventListener('click', saveSettings);
  el.addApiKeyBtn?.addEventListener('click', () => {
    const count = el.geminiKeysContainer?.querySelectorAll('.api-key-row').length || 0;
    addApiKeyRow('', count, count + 1);
    reindexApiKeyRows();
  });

  // Guide Modal Handlers
  el.openGuideBtn?.addEventListener('click', () => el.guideModal?.classList.remove('hidden'));
  el.closeGuideBtn?.addEventListener('click', () => el.guideModal?.classList.add('hidden'));
  el.guideGotItBtn?.addEventListener('click', () => el.guideModal?.classList.add('hidden'));
  el.guideModal?.addEventListener('click', (e) => {
    if (e.target === el.guideModal) el.guideModal?.classList.add('hidden');
  });

  // Theme Toggle
  el.themeToggleBtn?.addEventListener('click', toggleTheme);
}

// Render Math Symbols in Toolbar using KaTeX
function renderMathToolbarSymbols() {
  if (window.renderMathInElement && el.quickInsertToolbar) {
    try {
      window.renderMathInElement(el.quickInsertToolbar, {
        delimiters: [
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    } catch (e) {
      console.warn('Toolbar KaTeX notice:', e);
    }
  }
}

// ==========================================================================
// Theme Toggle (Light / Dark Mode)
// ==========================================================================
function initTheme() {
  applyTheme(state.theme);
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('math2latex_theme', state.theme);
  applyTheme(state.theme);
}

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
    if (el.themeIcon) el.themeIcon.className = 'fa-solid fa-moon text-sm';
  } else {
    html.classList.remove('dark');
    if (el.themeIcon) el.themeIcon.className = 'fa-solid fa-sun text-sm';
  }
}

// ==========================================================================
// File Selection & Media Processing (Image & PDF)
// ==========================================================================
function handleFileSelect(e) {
  const files = e.target.files;
  if (files && files.length > 0) {
    processSelectedFile(files[0]);
  }
}

function processSelectedFile(file) {
  // Extract filename
  const rawName = file.name || 'de_toan';
  const cleanName = rawName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  state.currentFileName = cleanName || 'de_toan';
  if (el.texFileNameInput) el.texFileNameInput.value = state.currentFileName;

  if (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
    // Switch to Pro mode automatically if user dropped a PDF
    if (state.mode !== 'pro') {
      setMode('pro');
    }
    loadPdfDocument(file);
  } else if (file.type.startsWith('image/')) {
    processImageFile(file);
  } else {
    showToast('Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP) hoặc tệp PDF!', 'error');
  }
}

function processImageFile(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    setImageSrc(event.target.result);
  };
  reader.readAsDataURL(file);
}

function setImageSrc(dataUrl) {
  state.currentImageBase64 = dataUrl;
  state.pdfDoc = null;
  state.pdfFile = null;
  setFilePickerEnabled(true);

  el.previewImg.src = dataUrl;
  el.uploadPrompt?.classList.add('hidden');
  el.pdfViewerContainer?.classList.add('hidden');
  el.pdfViewerContainer?.classList.remove('flex');
  el.imagePreviewContainer?.classList.remove('hidden');
  el.imageToolsBar?.classList.remove('hidden');
  el.convertBtn?.classList.remove('hidden');

  if (state.cropper) {
    state.cropper.destroy();
    state.cropper = null;
  }
  resetCropUI();
  showToast('Đã nạp ảnh bài toán.', 'info');
}

// ==========================================================================
// PDF.js Integration for Pro Mode
// ==========================================================================
async function loadPdfDocument(file) {
  state.pdfFile = file;
  state.currentImageBase64 = null;

  if (typeof pdfjsLib === 'undefined') {
    showToast('Thư viện PDF.js đang được tải, vui lòng thử lại sau giây lát!', 'error');
    return;
  }

  showToast('Đang tải và dựng cấu trúc tài liệu PDF...', 'info');

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    state.pdfDoc = pdf;
    state.pdfTotalPages = pdf.numPages;
    state.pdfCurrentPage = 1;
    setFilePickerEnabled(false);

    if (el.pdfFileName) el.pdfFileName.textContent = file.name;
    if (el.pdfPageStats) el.pdfPageStats.textContent = `Tổng số ${pdf.numPages} trang`;
    if (el.pdfPageInput) {
      el.pdfPageInput.max = pdf.numPages;
      el.pdfPageInput.value = 1;
    }
    if (el.pdfTotalPagesLabel) el.pdfTotalPagesLabel.textContent = `/ ${pdf.numPages}`;

    // Switch view to PDF inspector
    el.uploadPrompt?.classList.add('hidden');
    el.imagePreviewContainer?.classList.add('hidden');
    el.imageToolsBar?.classList.add('hidden');
    el.convertBtn?.classList.add('hidden');
    el.pdfViewerContainer?.classList.remove('hidden');
    el.pdfViewerContainer?.classList.add('flex');

    await renderPdfPage(1);
    showToast(`Đã nạp tệp PDF: ${file.name} (${pdf.numPages} trang)`, 'success');
  } catch (err) {
    console.error('Error loading PDF:', err);
    showToast(`Không thể đọc tệp PDF: ${err.message}`, 'error');
  }
}

async function renderPdfPage(pageNum) {
  if (!state.pdfDoc) return;

  if (state.pdfPageRendering) {
    state.pdfPendingPage = pageNum;
    return;
  }

  state.pdfPageRendering = true;
  if (el.pdfPageInput) el.pdfPageInput.value = pageNum;

  try {
    const page = await state.pdfDoc.getPage(pageNum);
    const canvas = el.pdfCanvas;
    const ctx = canvas.getContext('2d');

    const viewport = page.getViewport({ scale: state.pdfScale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    await page.render(renderContext).promise;
    state.pdfPageRendering = false;

    if (state.pdfPendingPage !== null) {
      const next = state.pdfPendingPage;
      state.pdfPendingPage = null;
      renderPdfPage(next);
    }
  } catch (err) {
    console.error('Error rendering PDF page:', err);
    state.pdfPageRendering = false;
  }
}

// Convert a single PDF page to high-res data URL
async function getPdfPageDataUrl(pageNum, scale = 2.4) {
  if (!state.pdfDoc) throw new Error('Chưa có tệp PDF nào được nạp!');
  const page = await state.pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: scale });

  const offCanvas = document.createElement('canvas');
  offCanvas.width = viewport.width;
  offCanvas.height = viewport.height;
  const ctx = offCanvas.getContext('2d');

  await page.render({ canvasContext: ctx, viewport: viewport }).promise;
  return offCanvas.toDataURL('image/jpeg', 0.95);
}

// ==========================================================================
// Image Manipulation (Crop & Rotate)
// ==========================================================================
function startCropping() {
  if (state.cropper) return;
  state.cropper = new Cropper(el.previewImg, {
    viewMode: 1,
    autoCropArea: 0.9,
    responsive: true,
    background: false
  });

  el.cropToggleBtn?.classList.add('hidden');
  el.cropApplyBtn?.classList.remove('hidden');
  el.cropCancelBtn?.classList.remove('hidden');
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

function clearLoadedMedia() {
  if (state.cropper) {
    state.cropper.destroy();
    state.cropper = null;
  }
  state.currentImageBase64 = null;
  state.pdfDoc = null;
  state.pdfFile = null;
  setFilePickerEnabled(true);

  el.previewImg.src = '';
  el.fileInput.value = '';
  el.uploadPrompt?.classList.remove('hidden');
  el.imagePreviewContainer?.classList.add('hidden');
  el.imageToolsBar?.classList.add('hidden');
  el.pdfViewerContainer?.classList.add('hidden');
  el.pdfViewerContainer?.classList.remove('flex');
  el.convertBtn?.classList.remove('hidden');
  resetCropUI();

  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  el.progressContainer?.classList.add('hidden');
  el.progressContainer?.classList.remove('flex');
}

// ==========================================================================
// Progress Bar Controller
// ==========================================================================
let progressInterval = null;

function startProgress(engine) {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }

  el.progressContainer?.classList.remove('hidden');
  el.progressContainer?.classList.add('flex');

  if (el.progressBar) {
    el.progressBar.style.width = '0%';
    el.progressBar.className = 'h-full rounded-full bg-gradient-to-r from-gold via-pen-400 to-gold transition-all duration-300 relative progress-bar-animated';
  }

  if (el.progressIcon) {
    el.progressIcon.className = 'fa-solid fa-circle-notch fa-spin text-gold text-sm';
  }

  updateProgressUI(8, 'Đang tiền xử lý & tối ưu hóa tài liệu...', 1);

  let currentPercent = 8;
  const stepMessages = [
    { threshold: 25, step: 1, text: 'Đang chuẩn bị trang tài liệu...' },
    { threshold: 50, step: 2, text: 'Đang phân tích hình ảnh & bóc tách ký hiệu toán...' },
    { threshold: 75, step: 3, text: 'Đang biên dịch cấu trúc đề thi & cú pháp LaTeX...' },
    { threshold: 92, step: 3, text: 'Đang kiểm tra chuẩn cú pháp Overleaf/KaTeX...' }
  ];

  progressInterval = setInterval(() => {
    if (currentPercent < 92) {
      const increment = currentPercent < 30 ? Math.floor(Math.random() * 4) + 3 :
                        currentPercent < 60 ? Math.floor(Math.random() * 3) + 2 :
                        currentPercent < 80 ? Math.floor(Math.random() * 2) + 1 : 1;
      currentPercent = Math.min(93, currentPercent + increment);

      let currentMsg = 'Đang chuyển đổi mã LaTeX...';
      let currentStep = 2;
      for (const item of stepMessages) {
        if (currentPercent <= item.threshold) {
          currentMsg = item.text;
          currentStep = item.step;
          break;
        }
      }
      updateProgressUI(currentPercent, currentMsg, currentStep);
    }
  }, 220);
}

function updateProgressUI(percent, statusText, stepNumber = 1) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  if (el.progressBar) el.progressBar.style.width = `${clamped}%`;
  if (el.progressPercent) el.progressPercent.textContent = `${clamped}%`;
  if (el.progressStatus && statusText) el.progressStatus.textContent = statusText;

  const steps = [el.step1, el.step2, el.step3, el.step4];
  steps.forEach((stepEl, idx) => {
    if (!stepEl) return;
    if (idx + 1 <= stepNumber) {
      stepEl.classList.remove('text-chalk-faint');
      stepEl.classList.add('text-gold', 'font-semibold');
    } else {
      stepEl.classList.remove('text-gold', 'font-semibold', 'text-emerald-400');
      stepEl.classList.add('text-chalk-faint');
    }
  });
}

function finishProgress(success = true, message = '') {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }

  if (success) {
    updateProgressUI(100, message || 'Chuyển đổi hoàn tất 100%!', 4);
    if (el.progressBar) el.progressBar.className = 'h-full rounded-full progress-success transition-all duration-300 relative';
    if (el.progressIcon) el.progressIcon.className = 'fa-solid fa-circle-check text-emerald-400 text-sm';
    if (el.step4) {
      el.step4.classList.remove('text-chalk-faint');
      el.step4.classList.add('text-emerald-400', 'font-semibold');
    }

    setTimeout(() => {
      if (!state.isConverting && el.progressContainer) {
        el.progressContainer.classList.add('hidden');
        el.progressContainer.classList.remove('flex');
      }
    }, 2800);
  } else {
    if (el.progressBar) el.progressBar.className = 'h-full rounded-full progress-error transition-all duration-300 relative';
    if (el.progressIcon) el.progressIcon.className = 'fa-solid fa-triangle-exclamation text-rose-400 text-sm';
    if (el.progressStatus) el.progressStatus.textContent = message || 'Chuyển đổi thất bại!';
    if (el.progressPercent) el.progressPercent.textContent = 'Lỗi';

    setTimeout(() => {
      if (!state.isConverting && el.progressContainer) {
        el.progressContainer.classList.add('hidden');
        el.progressContainer.classList.remove('flex');
      }
    }, 4500);
  }
}

// ==========================================================================
// Convert Request Execution (Standard & Pro Modes)
// ==========================================================================
async function callConvertApi(base64Image, isFullDoc = true, customNotes = '') {
  let keys = getSavedApiKeys();
  const legacyKey = localStorage.getItem('math2latex_gemini_key') || '';
  if (legacyKey && !keys.includes(legacyKey)) {
    keys.unshift(legacyKey);
  }
  const primaryKey = keys[0] || legacyKey || '';
  const geminiModel = localStorage.getItem('math2latex_gemini_model') || 'gemini-2.5-flash';

  const response = await fetch('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: base64Image,
      isFullDocument: isFullDoc,
      customNotes: customNotes,
      apiKey: primaryKey,
      apiKeys: keys,
      geminiModel: geminiModel
    })
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Lỗi không xác định khi chuyển đổi.');
  }

  if (data.switchedKey && data.fallbackNotice) {
    showToast(data.fallbackNotice, 'info');
  }

  return data.latex;
}

// Convert Single Image (Standard Mode)
async function handleConvert() {
  if (!state.currentImageBase64) {
    showToast('Vui lòng tải hoặc dán ảnh đề toán trước khi chuyển đổi!', 'error');
    return;
  }

  if (state.isConverting) return;
  state.isConverting = true;
  setConvertingState(true);
  startProgress();

  const isFullDocument = el.docTypeSelect?.value === 'full';
  const customNotes = el.customNotes?.value.trim() || '';

  try {
    const resultLatex = await callConvertApi(state.currentImageBase64, isFullDocument, customNotes);

    el.latexEditor.value = resultLatex;
    updateEditorStats();
    renderLatexPreview();

    finishProgress(true, 'Chuyển đổi sang LaTeX hoàn tất 100%!');
    showToast('Chuyển đổi sang LaTeX thành công!', 'success');
  } catch (error) {
    console.error('Conversion error:', error);
    finishProgress(false, error.message || 'Chuyển đổi thất bại');
    showToast(`Lỗi: ${error.message}`, 'error');
    if (error.message.includes('API Key') || error.message.includes('GEMINI_API_KEY')) {
      el.settingsModal?.classList.remove('hidden');
    }
  } finally {
    state.isConverting = false;
    setConvertingState(false);
  }
}

// Convert Current PDF Page (Pro Mode)
async function handleConvertPdfCurrentPage() {
  if (!state.pdfDoc) {
    showToast('Chưa có tệp PDF nào được nạp!', 'error');
    return;
  }

  if (state.isConverting) return;
  state.isConverting = true;
  setConvertingState(true);
  startProgress('gemini');

  const isFullDocument = el.docTypeSelect?.value === 'full';
  const customNotes = el.customNotes?.value.trim() || '';

  try {
    updateProgressUI(20, `Đang kết xuất trang ${state.pdfCurrentPage} chất lượng cao...`, 1);
    const pageImageBase64 = await getPdfPageDataUrl(state.pdfCurrentPage, 2.4);

    updateProgressUI(40, `Đang gửi trang ${state.pdfCurrentPage} tới AI OCR...`, 2);
    const resultLatex = await callConvertApi(pageImageBase64, isFullDocument, customNotes);

    el.latexEditor.value = resultLatex;
    updateEditorStats();
    renderLatexPreview();

    finishProgress(true, `Đã chuyển đổi thành công trang ${state.pdfCurrentPage}!`);
    showToast(`Chuyển đổi trang ${state.pdfCurrentPage} hoàn tất!`, 'success');
  } catch (error) {
    console.error('PDF Conversion error:', error);
    finishProgress(false, error.message || 'Chuyển đổi thất bại');
    showToast(`Lỗi: ${error.message}`, 'error');
  } finally {
    state.isConverting = false;
    setConvertingState(false);
  }
}

// Convert ALL PDF Pages Sequentially (Pro Mode Batch)
async function handleConvertPdfAllPages() {
  if (!state.pdfDoc) {
    showToast('Chưa có tệp PDF nào được nạp!', 'error');
    return;
  }

  const total = state.pdfTotalPages;
  if (!confirm(`Bạn có muốn chuyển đổi toàn bộ ${total} trang PDF sang một tài liệu LaTeX hoàn chỉnh không?`)) {
    return;
  }

  if (state.isConverting) return;
  state.isConverting = true;
  setConvertingState(true);
  startProgress('gemini');

  const isFullDocument = el.docTypeSelect?.value === 'full';
  const customNotes = el.customNotes?.value.trim() || '';
  const pageLatexResults = [];

  try {
    for (let p = 1; p <= total; p++) {
      const percent = Math.round(((p - 1) / total) * 90) + 5;
      updateProgressUI(percent, `Đang xử lý trang ${p}/${total}...`, 2);

      const pageImageBase64 = await getPdfPageDataUrl(p, 2.4);
      const pageLatex = await callConvertApi(pageImageBase64, false, customNotes); // get snippets for each page

      pageLatexResults.push({ page: p, latex: pageLatex });

      // Live update intermediate progress
      if (pageLatexResults.length > 0) {
        let combinedDraft = pageLatexResults.map(item => `% ==================== TRANG ${item.page} ====================\n${item.latex}`).join('\n\n\\newpage\n\n');
        el.latexEditor.value = combinedDraft;
        updateEditorStats();
      }
    }

    let finalCombinedLatex = '';
    const bodyContent = pageLatexResults.map(item => `\\section*{Trang ${item.page}}\n${item.latex}`).join('\n\n\\newpage\n\n');

    if (isFullDocument) {
      finalCombinedLatex = `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath,amssymb,amsfonts,mathrsfs}
\\usepackage{geometry}
\\usepackage{graphicx,tikz}
\\usepackage{enumitem}
\\geometry{a4paper, top=2cm, bottom=2cm, left=2cm, right=2cm}

\\begin{document}

${bodyContent}

\\end{document}`;
    } else {
      finalCombinedLatex = bodyContent;
    }

    el.latexEditor.value = finalCombinedLatex;
    updateEditorStats();
    renderLatexPreview();

    finishProgress(true, `Hoàn thành chuyển đổi toàn bộ ${total} trang PDF!`);
    showToast(`Đã chuyển đổi thành công cả ${total} trang PDF sang LaTeX!`, 'success');
  } catch (error) {
    console.error('Batch PDF error:', error);
    finishProgress(false, error.message || 'Chuyển đổi thất bại');
    showToast(`Lỗi tại trang: ${error.message}`, 'error');
  } finally {
    state.isConverting = false;
    setConvertingState(false);
  }
}


function setConvertingState(isLoading) {
  if (isLoading) {
    if (el.convertBtn) el.convertBtn.disabled = true;
    if (el.convertBtnText) el.convertBtnText.textContent = 'Đang nhận diện & tạo LaTeX...';
    if (el.convertBtnIcon) el.convertBtnIcon.classList.add('hidden');
    if (el.convertSpinner) el.convertSpinner.classList.remove('hidden');

    if (el.convertCurrentPageBtn) el.convertCurrentPageBtn.disabled = true;
    if (el.convertAllPdfBtn) el.convertAllPdfBtn.disabled = true;
  } else {
    if (el.convertBtn) el.convertBtn.disabled = false;
    if (el.convertBtnText) el.convertBtnText.textContent = 'Chuyển Đổi Thành LaTeX Ngay';
    if (el.convertBtnIcon) el.convertBtnIcon.classList.remove('hidden');
    if (el.convertSpinner) el.convertSpinner.classList.add('hidden');

    if (el.convertCurrentPageBtn) el.convertCurrentPageBtn.disabled = false;
    if (el.convertAllPdfBtn) el.convertAllPdfBtn.disabled = false;
  }
}

// ==========================================================================
// Tabs & Workspace View
// ==========================================================================
function switchTab(tab) {
  state.activeTab = tab;
  [el.tabCodeBtn, el.tabPreviewBtn, el.tabSplitBtn].forEach(btn => btn?.classList.remove('active'));

  if (tab === 'code') {
    el.tabCodeBtn?.classList.add('active');
    el.codeViewContainer?.classList.remove('hidden');
    el.previewViewContainer?.classList.add('hidden');
    if (el.workspaceArea) el.workspaceArea.className = 'flex-1 grid grid-cols-1 gap-3 min-h-[480px]';
  } else if (tab === 'preview') {
    el.tabPreviewBtn?.classList.add('active');
    el.codeViewContainer?.classList.add('hidden');
    el.previewViewContainer?.classList.remove('hidden');
    el.previewViewContainer?.classList.add('flex');
    if (el.workspaceArea) el.workspaceArea.className = 'flex-1 grid grid-cols-1 gap-3 min-h-[480px]';
    renderLatexPreview();
  } else if (tab === 'split') {
    el.tabSplitBtn?.classList.add('active');
    el.codeViewContainer?.classList.remove('hidden');
    el.previewViewContainer?.classList.remove('hidden');
    el.previewViewContainer?.classList.add('flex');
    if (el.workspaceArea) el.workspaceArea.className = 'flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-[480px]';
    renderLatexPreview();
  }
}

function updateWorkspaceView() {
  switchTab(state.activeTab);
}

function updateEditorStats() {
  const text = el.latexEditor?.value || '';
  const charCount = text.length;
  const lineCount = text ? text.split('\n').length : 0;
  if (el.charCount) el.charCount.textContent = `${charCount} ký tự | ${lineCount} dòng`;
}

function insertLatexAtCursor(snippet) {
  const editor = el.latexEditor;
  if (!editor) return;
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
  if (!el.renderOutput) return;
  const rawLatex = el.latexEditor?.value.trim() || '';
  if (!rawLatex) {
    el.renderOutput.innerHTML = `
      <div class="text-paper-ink/40 text-center italic mt-16 flex flex-col items-center gap-2">
        <i class="fa-solid fa-file-circle-question text-3xl text-paper-ink/20"></i>
        <span>Chưa có nội dung hiển thị. Hãy chuyển đổi ảnh/PDF hoặc nhập mã LaTeX ở khung soạn thảo.</span>
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
    .replace(/\\section\*?\{([^}]+)\}/g, '<h2 class="text-xl font-bold mt-4 mb-2 text-pen border-b pb-1">$1</h2>')
    .replace(/\\subsection\*?\{([^}]+)\}/g, '<h3 class="text-lg font-bold mt-3 mb-1 text-pen-600">$1</h3>')
    // Question Cards (Câu X.)
    .replace(/<strong>(Câu\s*\d+[^<]*)<\/strong>/gi, '<div class="question-card"><strong class="text-pen">$1</strong>')
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
    .replace(/\\newpage/g, '<hr class="my-6 border-pen/20 border-dashed">')
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

// ==========================================================================
// Copy & Custom Filename Export
// ==========================================================================
async function copyLatexCode() {
  const code = el.latexEditor?.value || '';
  if (!code) {
    showToast('Chưa có mã LaTeX để sao chép!', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(code);
    if (el.copyBtnText) el.copyBtnText.textContent = 'Đã chép!';
    showToast('Đã sao chép toàn bộ mã LaTeX vào Clipboard!', 'success');
    setTimeout(() => {
      if (el.copyBtnText) el.copyBtnText.textContent = 'Sao chép';
    }, 2000);
  } catch (err) {
    showToast('Vui lòng bấm Ctrl+C trong khung soạn thảo để sao chép.', 'error');
  }
}

function downloadTexFile() {
  const latex = el.latexEditor?.value || '';
  if (!latex) {
    showToast('Không có mã LaTeX để tải về!', 'error');
    return;
  }

  let fileName = (el.texFileNameInput?.value.trim() || state.currentFileName || 'de_toan');
  if (!fileName.endsWith('.tex')) fileName += '.tex';

  const blob = new Blob([latex], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Đã tải tệp ${fileName} về máy thành công!`, 'success');
}

function openInOverleaf() {
  const latex = el.latexEditor?.value || '';
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

  if (el.overleafSnipInput) el.overleafSnipInput.value = fullLatex;
  el.overleafForm?.submit();
  showToast('Đang mở dự án mới trên Overleaf...', 'info');
}

// Toast Notifications System
function showToast(message, type = 'info') {
  if (!el.toastContainer) return;
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
