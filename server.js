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
 */
const SYSTEM_PROMPT = `Bạn là một chuyên gia chuyển đổi đề thi Toán học từ hình ảnh sang mã nguồn LaTeX chất lượng cao, chuẩn xác 100%.

Nhiệm vụ của bạn:
1. Đọc và phân tích toàn bộ văn bản tiếng Việt và công thức toán học trong hình ảnh.
2. Chuyển đổi chính xác sang mã LaTeX chuẩn đẹp, có thể biên dịch ngay trên Overleaf/TeXmaker/TeXstudio.
3. Quy tắc dịch công thức & đề thi:
   - Các công thức toán đặt trong cặp dấu $...$ (nội dòng) hoặc $$...$$ / \\[...\\] / equation (khối công thức).
   - Dùng \\dfrac thay cho \\frac để phân số hiển thị to rõ.
   - Sử dụng các ký hiệu chuẩn: \\mathbb{R}, \\mathbb{N}, \\mathbb{Z}, \\mathbb{C}, \\vec{a}, \\overrightarrow{AB}, \\angle ABC, \\int_{a}^{b}, \\lim_{x \\to x_0}, \\sum, \\sqrt[n]{x}, \\ge, \\le, \\ne, \\approx, \\in, \\subset, \\cup, \\cap, \\emptyset.
   - Bảng biến thiên, hệ phương trình dùng \\begin{cases} ... \\end{cases} hoặc ma trận \\begin{pmatrix} ... \\end{pmatrix}.
   - Nếu là đề trắc nghiệm có 4 đáp án A, B, C, D:
     Trình bày rõ ràng, ví dụ:
     \\textbf{Câu 1.} Cho hàm số $y = f(x)$...
     \\begin{tasks}(4) % hoặc dùng bảng/khoảng cách \quad
     \\task \\textbf{A.} $y = 2x + 1$
     \\task \\textbf{B.} $y = x^2 - 3$
     \\task \\textbf{C.} $y = \\dfrac{x+1}{x-2}$
     \\task \\textbf{D.} $y = \\sqrt{x-1}$
     \\end{tasks}
     (hoặc dùng \\textbf{A.} ... \\quad \\textbf{B.} ... \\quad \\textbf{C.} ... \\quad \\textbf{D.} ...)
   - Nếu hình ảnh có hình vẽ hình học hoặc đồ thị:
     Tạo mã TikZ tương ứng hoặc chèn ghi chú hình vẽ bằng \\begin{tikzpicture} ... \\end{tikzpicture} khi có thể.
   - Giữ nguyên cấu trúc Câu 1, Câu 2, Bài 1, Bài 2, I, II, III.

Định dạng trả về:
Trả về mã LaTeX sạch. Nếu người dùng chọn tạo toàn bộ tài liệu (Full Document), hãy bao bọc trong:
\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath,amssymb,amsfonts,mathrsfs}
\\usepackage{geometry}
\\usepackage{graphicx,tikz}
\\usepackage{enumitem}
\\geometry{a4paper, top=2cm, bottom=2cm, left=2cm, right=2cm}
\\begin{document}
...
\\end{document}
Nếu người dùng chỉ cần công thức/đoạn trích (Snippet), chỉ trả về nội dung bên trong.`;

/**
 * Gemini Vision API handler with Self-Healing Multi-Model Fallback (Google AI Studio)
 */
async function callGeminiVision(apiKey, base64Image, mimeType, isFullDocument = true, customNotes = '', requestedModel = 'gemini-3.7-flash') {
  // Candidate models priority list with Gemini 3.7 Flash as top priority
  const candidateModels = [
    requestedModel,
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash'
  ].filter((v, i, a) => v && a.indexOf(v) === i); // remove duplicates

  const promptText = `${SYSTEM_PROMPT}

Yêu cầu cụ thể cho ảnh này:
- Chế độ đầu ra: ${isFullDocument ? 'Tạo toàn bộ file tài liệu LaTeX hoàn chỉnh (Full Document có đầy đủ \\documentclass, packages, \\begin{document}...)' : 'Chỉ xuất phần thân LaTeX (Snippet/Body Only)'}
${customNotes ? `- Lưu ý thêm từ người dùng: ${customNotes}` : ''}

Hãy phân tích hình ảnh đính kèm và xuất mã LaTeX chính xác nhất. KHÔNG thêm giải thích dài dòng ở đầu hay cuối, chỉ xuất mã LaTeX.`;

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

  for (const modelName of candidateModels) {
    try {
      const cleanModel = modelName.replace(/^models\//, '');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;

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
        
        // If model is deprecated or not found, proceed to next candidate in fallback chain
        if (response.status === 404 || msg.includes('no longer available') || msg.includes('not found') || msg.includes('is not supported')) {
          console.warn(`[Gemini OCR] Model "${cleanModel}" không khả dụng (${msg}). Đang tự động chuyển sang model dự phòng...`);
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

      return cleanLatex.trim();
    } catch (err) {
      lastError = err;
      if (!err.message.includes('no longer available') && !err.message.includes('not found')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Không thể kết nối với Gemini API. Vui lòng kiểm tra lại API Key.');
}

/**
 * Ollama Local Vision handler
 */
async function callOllamaVision(ollamaUrl, model, base64Image, isFullDocument = true) {
  const targetUrl = `${ollamaUrl.replace(/\/$/, '')}/api/generate`;
  const prompt = `${SYSTEM_PROMPT}\nConvert this math image to clean LaTeX. Output format: ${isFullDocument ? 'Full LaTeX document' : 'Latex snippet only'}. Output only the LaTeX code.`;

  const payload = {
    model: model || 'llava',
    prompt: prompt,
    images: [base64Image],
    stream: false
  };

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Ollama Error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  let cleanLatex = (data.response || '').trim();
  if (cleanLatex.startsWith('```latex')) {
    cleanLatex = cleanLatex.replace(/^```latex\s*/i, '').replace(/```\s*$/i, '');
  } else if (cleanLatex.startsWith('```')) {
    cleanLatex = cleanLatex.replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  }
  return cleanLatex.trim();
}

/**
 * OpenAI / Custom Vision API handler
 */
async function callCustomVision(apiUrl, apiKey, model, base64Image, mimeType, isFullDocument = true) {
  const targetUrl = apiUrl || 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: model || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Chuyển toàn bộ nội dung đề toán trong ảnh sang mã LaTeX. Định dạng: ${isFullDocument ? 'Full compilable Document' : 'Snippet Body'}. Chỉ trả về mã LaTeX.`
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType || 'image/jpeg'};base64,${base64Image}`
            }
          }
        ]
      }
    ],
    temperature: 0.1
  };

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Vision API Error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  let cleanLatex = data?.choices?.[0]?.message?.content || '';
  if (cleanLatex.startsWith('```latex')) {
    cleanLatex = cleanLatex.replace(/^```latex\s*/i, '').replace(/```\s*$/i, '');
  } else if (cleanLatex.startsWith('```')) {
    cleanLatex = cleanLatex.replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  }
  return cleanLatex.trim();
}

/**
 * API Route: Convert Image to LaTeX
 */
app.post('/api/convert', upload.single('image'), async (req, res) => {
  try {
    let base64Image = '';
    let mimeType = 'image/jpeg';

    if (req.file) {
      base64Image = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype || 'image/jpeg';
    } else if (req.body.imageBase64) {
      const match = req.body.imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Image = match[2];
      } else {
        base64Image = req.body.imageBase64;
      }
    }

    if (!base64Image) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp hình ảnh đề toán (Upload hoặc Base64)!' });
    }

    const engine = req.body.engine || 'gemini';
    const isFullDocument = req.body.isFullDocument !== 'false' && req.body.isFullDocument !== false;
    const customNotes = req.body.customNotes || '';

    let latexResult = '';

    if (engine === 'gemini') {
      const apiKey = req.body.apiKey || process.env.GEMINI_API_KEY;
      const geminiModel = req.body.geminiModel || process.env.GEMINI_MODEL || 'gemini-3.7-flash';
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'Chưa có Gemini API Key! Hãy nhập API Key miễn phí từ Google AI Studio (aistudio.google.com) ở mục Cài đặt, hoặc cấu hình GEMINI_API_KEY trong file .env.'
        });
      }
      latexResult = await callGeminiVision(apiKey, base64Image, mimeType, isFullDocument, customNotes, geminiModel);
    } else if (engine === 'ollama') {
      const ollamaUrl = req.body.ollamaUrl || 'http://localhost:11434';
      const model = req.body.ollamaModel || 'llava';
      latexResult = await callOllamaVision(ollamaUrl, model, base64Image, isFullDocument);
    } else if (engine === 'custom') {
      const apiUrl = req.body.customApiUrl;
      const apiKey = req.body.apiKey || '';
      const model = req.body.customModel || 'gpt-4o-mini';
      latexResult = await callCustomVision(apiUrl, apiKey, model, base64Image, mimeType, isFullDocument);
    } else {
      return res.status(400).json({ success: false, error: `Engine "${engine}" không hợp lệ.` });
    }

    return res.json({
      success: true,
      latex: latexResult,
      engine: engine,
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
app.post('/api/export-tex', (req, res) => {
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
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    app: 'Math2LaTeX Studio PRO',
    version: '1.0.0',
    defaultModel: 'gemini-3.6-flash',
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
