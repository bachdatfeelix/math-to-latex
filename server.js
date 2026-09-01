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
 * System prompt for Vietnamese & International Math Exam / Formula Extraction
 * Strict raw-LaTeX-only output enforcement — no markdown fences, no explanations
 */
const SYSTEM_PROMPT = `Bạn là hệ thống chuyển đổi ảnh đề thi Toán học sang mã nguồn LaTeX chất lượng cao với độ chuẩn xác tuyệt đối so với ảnh gốc.

QUAN TRỌNG NHẤT — ĐỊNH DẠNG ĐẦU RA:
- Chỉ trả về MÃ LATEX THUẦN TÚY. KHÔNG bao giờ bọc trong \`\`\`latex ... \`\`\` hay bất kỳ markdown code fence nào.
- KHÔNG viết bất kỳ lời giải thích, ghi chú, nhận xét nào trước hoặc sau mã LaTeX.
- Output phải bắt đầu bằng \\documentclass và kết thúc bằng \\end{document}. Không có gì khác.
- Luôn bao gồm đầy đủ các gói: inputenc (utf8), babel (vietnamese), amsmath, amssymb, tikz, geometry, enumitem.

QUY TẮC CỐT LÕI:
1. BỐ CỤC VĂN BẢN VÀ MINIPAGE:
   - Nếu có hình vẽ/bảng biến thiên bên phải, sử dụng tỷ lệ chuẩn:
     \\begin{minipage}[c]{0.58\\textwidth} ... \\end{minipage}%
     \\hfill
     \\begin{minipage}[c]{0.40\\textwidth} ... \\end{minipage}
   - VĂN BẢN TỰ ĐỘNG DÀN DÒNG: Để LaTeX tự ngắt dòng tự nhiên, KHÔNG chèn ngắt dòng thủ công (\\\\) giữa câu văn. Viết liền các biểu thức ngắn như $y=f(x)$.

2. QUY CHUẨN DỰNG BẢNG BIẾN THIÊN (Tránh co cụm, đè vạch):
   - MỞ RỘNG CHIỀU NGANG: Mỗi khoảng giá trị phải có chiều rộng tối thiểu 2.0cm - 2.5cm.
   - VẠCH ĐÔI KHÔNG XÁC ĐỊNH (||): Vẽ bằng 2 đường thẳng song song cách nhau 2pt.
   - MŨI TÊN BIẾN THIÊN: Điểm đầu và cuối có khoảng đệm (shorten >= 3pt, shorten <= 3pt).
   - NÉT BẢNG: Đường kẻ ngang phân cách hàng x, f'(x), f(x) dùng nét \\draw[thick].

3. QUY CHUẨN ĐỒ THỊ TIKZ:
   - Trục Ox vẽ dài qua mốc cuối cùng 0.6 đơn vị.
   - Tên trục y (node[right] {$y$}) tách biệt hoàn toàn với tên hàm số.
   - Đồ thị vẽ bằng \\draw plot (\\x, {công thức giải tích}).

4. ĐỘ CHÍNH XÁC:
   - Sao chép chính xác 100% mọi con số, công thức, ký hiệu, dấu từ ảnh gốc.
   - Giữ đúng thứ tự câu hỏi, đáp án, cấu trúc đề thi.
   - Nếu có nhiều cột đáp án (A/B/C/D), dùng \\begin{tasks}(4) hoặc minipage.`;

/**
 * Robust LaTeX extractor — handles all Gemini response variations:
 * 1. Response wrapped in ```latex / ```tex / ``` code fences
 * 2. Multiple code blocks (joins them)
 * 3. Raw LaTeX without fences
 * 4. LaTeX mixed with explanation text
 */
function extractLatexFromResponse(rawText) {
  if (!rawText || !rawText.trim()) return '';

  let text = rawText.trim();

  // Strategy 1: Extract content from markdown code fences
  // Matches ```latex, ```tex, ```LaTeX, ``` (with or without language tag)
  const codeFenceRegex = /```(?:latex|tex|LaTeX|Latex)?\s*\n?([\s\S]*?)```/gi;
  const fenceMatches = [...text.matchAll(codeFenceRegex)];

  if (fenceMatches.length > 0) {
    // Join all code blocks (some models split across multiple fences)
    const extracted = fenceMatches.map(m => m[1].trim()).join('\n\n');
    if (extracted.length > 50) {
      return extracted;
    }
  }

  // Strategy 2: Extract from \documentclass to \end{document}
  const docMatch = text.match(/(\\documentclass[\s\S]*\\end\{document\})/i);
  if (docMatch) {
    return docMatch[1].trim();
  }

  // Strategy 3: Strip any remaining code fence markers and surrounding text
  text = text.replace(/^```[a-zA-Z]*\s*/gm, '').replace(/^```\s*$/gm, '');

  // Remove common Gemini explanation patterns before/after LaTeX
  text = text.replace(/^(Here is|Here's|Đây là|Dưới đây|Below is|The following)[^\n]*\n+/i, '');
  text = text.replace(/\n+(Note:|Lưu ý:|Explanation:|Giải thích:)[^\n]*/gi, '');

  return text.trim();
}

/**
 * Gemini Vision API handler with Self-Healing Multi-Key & Multi-Model Instant Fallback
 */
async function callGeminiVision(apiKeys, base64Image, mimeType, isFullDocument = true, customNotes = '', requestedModel = 'gemini-3.7-flash') {
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

  // Candidate models priority list: gemini-3.7-flash first, then fallbacks
  const candidateModels = [
    requestedModel,
    'gemini-3.7-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
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
      maxOutputTokens: 65536
    }
  };

  let lastError = null;
  let hasSwitchedKey = false;
  const startTime = Date.now();

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

        // Check for blocked/empty responses
        const candidate = data?.candidates?.[0];
        const finishReason = candidate?.finishReason;
        const rawText = candidate?.content?.parts?.[0]?.text || '';

        if (!rawText && finishReason === 'SAFETY') {
          throw new Error('Gemini đã từ chối xử lý ảnh do chính sách an toàn. Vui lòng thử ảnh khác hoặc đổi model.');
        }

        if (!rawText) {
          const blockReason = data?.promptFeedback?.blockReason;
          if (blockReason) {
            throw new Error(`Gemini đã chặn yêu cầu (${blockReason}). Vui lòng thử ảnh khác.`);
          }
          console.warn(`[Gemini OCR] Empty response with finishReason=${finishReason}. Trying next model...`);
          lastError = new Error('Gemini trả về kết quả rỗng. Đang thử model khác...');
          continue;
        }

        // Robust LaTeX extraction — handle all Gemini output variations
        let cleanLatex = extractLatexFromResponse(rawText);

        // Warn if output appears truncated (has \documentclass but no \end{document})
        if (cleanLatex.includes('\\documentclass') && !cleanLatex.includes('\\end{document}')) {
          console.warn('[Gemini OCR] Output appears truncated (missing \\end{document}). Appending closure.');
          cleanLatex += '\n\n\\end{document}';
        }

        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[Gemini OCR] ✅ Hoàn thành bằng model "${cleanModel}" trong ${elapsedSec}s (${cleanLatex.length} ký tự)`);

        return {
          latex: cleanLatex.trim(),
          usedModel: cleanModel,
          usedKeyIndex: keyIdx,
          switchedKey: hasSwitchedKey || keyIdx > 0,
          usedKeyPreview: keyPreview,
          elapsedSeconds: parseFloat(elapsedSec)
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
    const geminiModel = req.body.geminiModel || process.env.GEMINI_MODEL || 'gemini-3.7-flash';

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
      engine: 'gemini',
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
    defaultModel: 'gemini-3.7-flash',
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
