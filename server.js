import express from 'express';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Set up Multer for handling file uploads (stored in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

/**
 * System prompt specialized in Vietnamese & International Math Exam / Formula Extraction
 * (Preserved 100% untouched from GitHub repository)
 */
const SYSTEM_PROMPT = `Bạn là hệ thống chuyển đổi ảnh đề thi Toán học sang mã nguồn LaTeX chất lượng cao với độ chuẩn xác tuyệt đối so với ảnh gốc.

QUY TẮC CỐT LÕI:
1. BỐ CỤC VĂN BẢN VÀ MINIPAGE:
   - Nếu có hình vẽ/bảng biến thiên bên phải, sử dụng tỷ lệ chuẩn:
     \\begin{minipage}[c]{0.58\\textwidth} ... \\end{minipage}%
     \\hfill
     \\begin{minipage}[c]{0.40\\textwidth} ... \\end{minipage}
   - VĂN BẢN TỰ ĐỘNG DÀN DÒNG: Để LaTeX tự ngắt dòng tự nhiên, KHÔNG chèn ngắt dòng thủ công (\\\\) giữa câu văn. Viết liền các biểu thức ngắn như $y=f(x)$.

2. QUY CHUẨN DỰNG BẢNG BIẾN THIÊN (Tránh co cụm, đè vạch):
   - MỞ RỘNG CHIỀU NGANG: Mỗi khoảng giá trị (ví dụ từ -∞ đến số mốc, và từ mốc đến +∞) phải có chiều rộng tối thiểu 2.0cm - 2.5cm để bảng thoáng đãng.
   - VẠCH ĐÔI KHÔNG XÁC ĐỊNH (||): Vẽ bằng 2 đường thẳng song song cách nhau 2pt, cách xa chữ số mốc ở hàng x và các ký tự -∞, +∞ ở hàng f(x) ít nhất 0.3cm (không để dính hoặc đè nét).
   - MŨI TÊN BIẾN THIÊN: Vẽ nghiêng thoáng, điểm đầu và điểm cuối mũi tên có khoảng đệm (shorten >= 3pt, shorten <= 3pt) để không đè vào số 1 hay ký tự vô cùng.
   - NÉT BẢNG: Đường kẻ ngang phân cách hàng x, f'(x), f(x) dùng nét \\draw[thick].

3. QUY CHUẨN ĐỒ THỊ TIKZ:
   - Trục Ox vẽ dài qua mốc cuối cùng 0.6 đơn vị (không để số đè vào chữ x mũi tên).
   - Tên trục y (node[right] {$y$}) tách biệt hoàn toàn với tên hàm số (ví dụ $y=f'(x)$).
   - Đồ thị vẽ bằng \\draw plot (\\x, {công thức giải tích}).

4. ĐỊNH DẠNG ĐẦU RA:
   - Chỉ xuất duy nhất mã LaTeX hoàn chỉnh trong khối \`\`\`latex ... \`\`\` (chứa đầy đủ các gói: babel vietnamese, amsmath, amssymb, tikz, geometry).`;

/**
 * Gemini Vision API handler with Self-Healing Multi-Key & Multi-Model Instant Fallback
 */
async function callGeminiVision(apiKeys, base64Image, mimeType, isFullDocument = true, customNotes = '', requestedModel = 'gemini-2.5-flash') {
  let rawKeys = [];
  if (Array.isArray(apiKeys)) {
    rawKeys = apiKeys;
  } else if (typeof apiKeys === 'string') {
    rawKeys = apiKeys.split(/[,;\n]+/).map(k => k.trim());
  }

  // Include environment backup keys if configured in .env
  if (process.env.GEMINI_BACKUP_KEY) {
    rawKeys.push(...process.env.GEMINI_BACKUP_KEY.split(/[,;\n]+/).map(k => k.trim()));
  }
  if (process.env.GEMINI_API_KEY) {
    rawKeys.push(...process.env.GEMINI_API_KEY.split(/[,;\n]+/).map(k => k.trim()));
  }

  const keysList = rawKeys
    .map(key => typeof key === 'string' ? key.trim() : '')
    .filter((key, index, keys) => key.length > 10 && keys.indexOf(key) === index);

  if (keysList.length === 0) {
    throw new Error('Chưa có Gemini API Key hợp lệ! Hãy bấm vào biểu tượng Cài đặt (⚙) ở góc phải để nhập Gemini API Key miễn phí từ Google AI Studio (aistudio.google.com).');
  }

  // Candidate models priority list: gemini-2.5-flash is stable, fast and reliable
  const candidateModels = [
    requestedModel,
    'gemini-2.5-flash',
    'gemini-3.7-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash'
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  const promptText = `${SYSTEM_PROMPT}${customNotes ? `\n\n- Lưu ý thêm từ người dùng: ${customNotes}` : ''}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Image
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.95,
      maxOutputTokens: 8192
    }
  };

  let lastError = null;
  let hasSwitchedKey = false;

  for (let keyIdx = 0; keyIdx < keysList.length; keyIdx++) {
    const currentKey = keysList[keyIdx];
    const keyPreview = `${currentKey.substring(0, 6)}...${currentKey.slice(-4)}`;

    for (const modelName of candidateModels) {
      try {
        const cleanModel = modelName.replace(/^models\//, '');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${currentKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          let parsed;
          try { parsed = JSON.parse(errorText); } catch (_) {}
          const msg = parsed?.error?.message || `Gemini API Error (${response.status}): ${errorText}`;

          const isOverloadedOrUnavailable = response.status === 503 ||
            response.status === 408 ||
            response.status === 500 ||
            response.status === 502 ||
            response.status === 504 ||
            /\bUNAVAILABLE\b|high demand|overloaded|temporarily/i.test(msg);

          if (isOverloadedOrUnavailable) {
            console.warn(`[Gemini OCR] Model "${cleanModel}" đang quá tải (HTTP ${response.status}). Đang tự động chuyển ngay sang model dự phòng...`);
            lastError = new Error(msg);
            continue; // Instantly advance to next model in candidateModels
          }

          const isRateLimitOrQuota = response.status === 429 || 
                                     msg.includes('RESOURCE_EXHAUSTED') || 
                                     msg.includes('quota') || 
                                     msg.includes('Quota exceeded') || 
                                     msg.includes('Rate limit') || 
                                     msg.includes('Too Many Requests');

          if (isRateLimitOrQuota) {
            console.warn(`[Gemini OCR] ⚠️ API Key #${keyIdx + 1} (${keyPreview}) bị giới hạn Quota / Rate Limit (HTTP ${response.status}: ${msg}).`);
            if (keyIdx < keysList.length - 1) {
              const nextKeyPreview = `${keysList[keyIdx + 1].substring(0, 6)}...${keysList[keyIdx + 1].slice(-4)}`;
              console.log(`[Gemini OCR] 🔄 Đang tự động chuyển sang API Key dự phòng #${keyIdx + 2} (${nextKeyPreview})...`);
              hasSwitchedKey = true;
            }
            lastError = new Error(`API Key #${keyIdx + 1} bị quá tải/hết quota (${msg})`);
            break; // Advance to next key
          }

          if (response.status === 404 || msg.includes('no longer available') || msg.includes('not found') || msg.includes('is not supported')) {
            console.warn(`[Gemini OCR] Model "${cleanModel}" không khả dụng (${msg}). Đang chuyển sang model dự phòng...`);
            lastError = new Error(msg);
            continue;
          }

          throw new Error(msg);
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Clean Markdown code fence if present
        let cleanLatex = rawText.trim();
        if (cleanLatex.startsWith('```latex')) {
          cleanLatex = cleanLatex.replace(/^```latex\s*/i, '').replace(/```\s*$/i, '');
        } else if (cleanLatex.startsWith('```tex')) {
          cleanLatex = cleanLatex.replace(/^```tex\s*/i, '').replace(/```\s*$/i, '');
        } else if (cleanLatex.startsWith('```')) {
          cleanLatex = cleanLatex.replace(/^```\s*/i, '').replace(/```\s*$/i, '');
        }

        return {
          latex: cleanLatex.trim(),
          usedKeyIndex: keyIdx,
          switchedKey: hasSwitchedKey || keyIdx > 0,
          usedKeyPreview: keyPreview
        };
      } catch (err) {
        lastError = err;
        const msg = err.message || '';
        const isRateLimit = msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('Rate limit') || msg.includes('429');
        if (isRateLimit) {
          break; // Advance to next key
        }
        if (!msg.includes('no longer available') && !msg.includes('not found') && !msg.includes('high demand') && !msg.includes('503')) {
          throw err;
        }
      }
    }
  }

  throw lastError || new Error('Không thể kết nối với Gemini API. Tất cả API Key đều bị giới hạn hạn ngạch hoặc không khả dụng.');
}

/**
 * API Route: Convert Image / PDF to LaTeX (Dual path for Localhost & Vercel)
 */
app.post(['/api/convert', '/convert'], upload.single('image'), async (req, res) => {
  try {
    let base64Image = '';
    let mimeType = 'image/jpeg';

    if (req.file) {
      base64Image = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype || 'image/jpeg';
    } else if (req.body.imageBase64) {
      const match = req.body.imageBase64.match(/^data:(image\/[a-zA-Z+]+|application\/pdf);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Image = match[2];
      } else {
        base64Image = req.body.imageBase64;
      }
    }

    if (!base64Image) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp hình ảnh hoặc tệp đề toán (Upload hoặc Base64)!' });
    }

    const isFullDocument = req.body.isFullDocument !== 'false' && req.body.isFullDocument !== false;
    const customNotes = req.body.customNotes || '';

    let candidateKeys = [];
    if (req.body.apiKeys) {
      if (Array.isArray(req.body.apiKeys)) {
        candidateKeys.push(...req.body.apiKeys);
      } else if (typeof req.body.apiKeys === 'string') {
        candidateKeys.push(...req.body.apiKeys.split(/[,;\n]+/).map(k => k.trim()));
      }
    }
    if (req.body.apiKey) candidateKeys.push(req.body.apiKey);
    if (req.body.backupApiKey) candidateKeys.push(req.body.backupApiKey);
    if (process.env.GEMINI_API_KEY) candidateKeys.push(process.env.GEMINI_API_KEY);
    if (process.env.GEMINI_BACKUP_KEY) candidateKeys.push(process.env.GEMINI_BACKUP_KEY);

    candidateKeys = candidateKeys.filter((v, i, a) => v && a.indexOf(v) === i);
    const geminiModel = req.body.geminiModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (candidateKeys.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Chưa có Gemini API Key! Hãy nhập API Key miễn phí từ Google AI Studio (aistudio.google.com) ở mục Cài đặt, hoặc cấu hình GEMINI_API_KEY trong file .env.'
      });
    }

    const result = await callGeminiVision(candidateKeys, base64Image, mimeType, isFullDocument, customNotes, geminiModel);
    const latexResult = result.latex;
    const switchedKey = result.switchedKey;
    let fallbackNotice = null;
    if (switchedKey) {
      fallbackNotice = `Đã tự động chuyển sang API Key #${result.usedKeyIndex + 1} (${result.usedKeyPreview}) do Key trước bị giới hạn hạn ngạch (Rate Limit)!`;
    }

    return res.json({
      success: true,
      latex: latexResult,
      engine: engine,
      switchedKey: switchedKey,
      fallbackNotice: fallbackNotice,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error converting image to LaTeX:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Đã xảy ra lỗi khi chuyển đổi ảnh sang LaTeX.'
    });
  }
});

/**
 * API Route: Export LaTeX to .tex file download
 */
app.post(['/api/export-tex', '/export-tex'], (req, res) => {
  try {
    const { latex, filename = 'de_toan.tex' } = req.body;
    if (!latex) {
      return res.status(400).send('Không có nội dung LaTeX để xuất.');
    }

    const safeFilename = filename.endsWith('.tex') ? filename : `${filename}.tex`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);
    return res.send(latex);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

/**
 * Health check & App status
 */
app.get(['/api/status', '/status'], (req, res) => {
  res.json({
    status: 'online',
    app: 'Math2LaTeX Studio PRO',
    version: '1.0.0',
    defaultModel: 'gemini-2.5-flash',
    hasEnvKey: !!process.env.GEMINI_API_KEY
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Math2LaTeX Studio PRO đang chạy tại: http://localhost:${PORT}`);
    console.log(`💡 Mở trình duyệt và truy cập http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

export default app;
