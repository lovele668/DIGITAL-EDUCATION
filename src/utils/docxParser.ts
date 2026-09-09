import mammoth from 'mammoth';
import { Question, Exam } from '../components/TeacherExamBuilder';

export interface ParsedWordExam {
  title: string;
  className: string;
  category: string;
  duration: number;
  description: string;
  questions: Question[];
  rawText: string;
  warnings: string[];
}

/**
 * Normalizes text lines and trims spaces
 */
function cleanLine(text: string): string {
  return text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Detects exam metadata (title, subject, grade, duration) from the header lines of the Word document
 */
function extractExamMetadata(lines: string[], fileName: string): {
  title: string;
  className: string;
  category: string;
  duration: number;
  headerLineCount: number;
} {
  let title = '';
  let className = 'Khối lớp 1';
  let category = 'Toán';
  let duration = 15;
  let headerLineCount = 0;

  // Scan up to first 25 lines for metadata before questions start
  const headerLines = lines.slice(0, 25);

  // Common subjects in Vietnam curriculum
  const categoryKeywords: { [key: string]: string } = {
    'toán': 'Toán',
    'math': 'Toán',
    'tiếng việt': 'Tiếng Việt',
    'ngữ văn': 'Tiếng Việt',
    'tiếng anh': 'Tiếng Anh',
    'english': 'Tiếng Anh',
    'tự nhiên': 'Tự nhiên & Xã hội',
    'tnxh': 'Tự nhiên & Xã hội',
    'khoa học': 'Khoa học',
    'lịch sử': 'Lịch sử & Địa lý',
    'địa lý': 'Lịch sử & Địa lý',
    'đạo đức': 'Đạo đức',
    'tin học': 'Tin học',
    'âm nhạc': 'Âm nhạc',
    'mỹ thuật': 'Mỹ thuật'
  };

  // Grade keywords
  const gradeKeywords: { [key: string]: string } = {
    'lớp 1': 'Khối lớp 1',
    'khối 1': 'Khối lớp 1',
    'lớp 2': 'Khối lớp 2',
    'khối 2': 'Khối lớp 2',
    'lớp 3': 'Khối lớp 3',
    'khối 3': 'Khối lớp 3',
    'lớp 4': 'Khối lớp 4',
    'khối 4': 'Khối lớp 4',
    'lớp 5': 'Khối lớp 5',
    'khối 5': 'Khối lớp 5',
    'lớp 6': 'Khối lớp 6',
    'khối 6': 'Khối lớp 6',
    'lớp 7': 'Khối lớp 7',
    'khối 7': 'Khối lớp 7',
    'lớp 8': 'Khối lớp 8',
    'khối 8': 'Khối lớp 8',
    'lớp 9': 'Khối lớp 9',
    'khối 9': 'Khối lớp 9'
  };

  for (let i = 0; i < headerLines.length; i++) {
    const line = headerLines[i].toLowerCase();

    // Check if question started, stop header parsing
    if (/^(câu|bài|question)\s*\d+[:.]/i.test(headerLines[i])) {
      headerLineCount = i;
      break;
    }

    // Check for Subject (Môn / Subject)
    for (const [kw, cat] of Object.entries(categoryKeywords)) {
      if (line.includes(kw)) {
        category = cat;
        break;
      }
    }

    // Check for Grade
    for (const [kw, gr] of Object.entries(gradeKeywords)) {
      if (line.includes(kw)) {
        className = gr;
        break;
      }
    }

    // Check for Duration (Thời gian: ... phút / ...)
    const durationMatch = line.match(/(?:thời gian|thời gian làm bài|time)\s*[:=]?\s*(\d+)\s*(?:phút|'|m)/i);
    if (durationMatch) {
      const parsedMin = parseInt(durationMatch[1], 10);
      if (parsedMin >= 5 && parsedMin <= 180) {
        duration = parsedMin;
      }
    }

    // Check for Exam Title (Đề kiểm tra..., Bài kiểm tra..., Phiếu bài tập...)
    if (!title && /(đề kiểm tra|bài kiểm tra|đề thi|phiếu bài tập|đề ôn tập|bài tập cuối tuần|kiểm tra định kỳ)/i.test(headerLines[i])) {
      title = cleanLine(headerLines[i]);
    }
  }

  // Fallback title from file name if not detected
  if (!title) {
    const cleanFileName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    title = cleanFileName.charAt(0).toUpperCase() + cleanFileName.slice(1);
  }

  return { title, className, category, duration, headerLineCount };
}

/**
 * Splits lines that may contain multiple options on a single line,
 * e.g.: "A. 10 cm    B. 15 cm    C. 20 cm    D. 25 cm"
 */
function expandMultiOptionLines(lines: string[]): string[] {
  const expanded: string[] = [];

  for (const line of lines) {
    const trimmed = cleanLine(line);
    if (!trimmed) continue;

    // Detect if line has 2 or more options like "A. ... B. ..." or "A) ... B) ..."
    // Match A, B, C, D tokens
    const optionMatches = [...trimmed.matchAll(/(?:^|\s{2,}|\t|\s+)([A-D])[.):]\s*/g)];

    if (optionMatches.length >= 2) {
      // Split the line into individual options
      let lastIndex = 0;
      for (let i = 0; i < optionMatches.length; i++) {
        const match = optionMatches[i];
        const nextMatch = optionMatches[i + 1];
        const startIndex = match.index! + match[0].indexOf(match[1]);
        const endIndex = nextMatch ? nextMatch.index! : trimmed.length;

        const optStr = trimmed.substring(startIndex, endIndex).trim();
        if (optStr) {
          expanded.push(optStr);
        }
        lastIndex = endIndex;
      }
    } else {
      expanded.push(trimmed);
    }
  }

  return expanded;
}

/**
 * Extracts end-of-file answer keys if available, e.g.:
 * "ĐÁP ÁN: 1.A  2.B  3.C  4.D"
 * "BẢNG ĐÁP ÁN: 1-A, 2-B, 3-C, 4-D"
 */
function extractAnswerKeysSection(lines: string[]): {
  keyMap: Map<number, string>;
  contentLines: string[];
} {
  const keyMap = new Map<number, string>();
  let answerKeyStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (
      line.includes('bảng đáp án') ||
      line.includes('đáp án trắc nghiệm') ||
      line.includes('hướng dẫn chấm') ||
      line.includes('đáp án & biểu điểm') ||
      line.includes('answer key') ||
      (line.startsWith('đáp án') && lines.length - i <= 15)
    ) {
      answerKeyStartIndex = i;
      break;
    }
  }

  if (answerKeyStartIndex !== -1) {
    const keyLines = lines.slice(answerKeyStartIndex);
    const contentLines = lines.slice(0, answerKeyStartIndex);

    const fullKeyText = keyLines.join(' ');
    // Match patterns like "1.A", "1:A", "1-A", "1. A", "Câu 1: A", "1/A"
    const keyRegex = /(?:câu\s*)?(\d+)\s*[:.\-\/]\s*([A-D]|đúng|sai|đ|s)/gi;
    let match;
    while ((match = keyRegex.exec(fullKeyText)) !== null) {
      const qNum = parseInt(match[1], 10);
      let val = match[2].toUpperCase();
      if (val === 'Đ') val = 'Đúng';
      if (val === 'S') val = 'Sai';
      keyMap.set(qNum, val);
    }

    return { keyMap, contentLines };
  }

  return { keyMap, contentLines: lines };
}

/**
 * Parse docx ArrayBuffer or HTML/text into a full structured exam
 */
export async function parseWordDocument(file: File): Promise<ParsedWordExam> {
  const arrayBuffer = await file.arrayBuffer();

  // Extract raw text and HTML representation
  const [rawTextResult, htmlResult] = await Promise.all([
    mammoth.extractRawText({ arrayBuffer }),
    mammoth.convertToHtml({ arrayBuffer })
  ]);

  const rawText = rawTextResult.value;
  const htmlContent = htmlResult.value;

  // Pre-find bold/underlined texts in HTML which often indicate correct answers
  const markedCorrectInHtml = new Set<string>();
  const htmlUnderlineMatches = [
    ...htmlContent.matchAll(/<u>(.*?)<\/u>/gi),
    ...htmlContent.matchAll(/<strong>(.*?)<\/strong>/gi),
    ...htmlContent.matchAll(/<b>(.*?)<\/b>/gi)
  ];

  for (const m of htmlUnderlineMatches) {
    const innerText = m[1].replace(/<[^>]*>/g, '').trim().toLowerCase();
    if (innerText.length > 0 && innerText.length < 100) {
      markedCorrectInHtml.add(innerText);
    }
  }

  const allLines = rawText.split(/\r?\n/).map(l => cleanLine(l)).filter(Boolean);

  const warnings: string[] = [];
  const metadata = extractExamMetadata(allLines, file.name);

  // Extract answer keys if placed at the end of document
  const { keyMap, contentLines } = extractAnswerKeysSection(allLines);

  // Expand single-line options into separate lines
  const lines = expandMultiOptionLines(contentLines);

  const parsedQuestions: Question[] = [];
  let currentQ: {
    num: number;
    content: string;
    options: string[];
    correctAnswer: string;
    type: string;
    difficulty: 'recognition' | 'understanding' | 'application';
  } | null = null;

  let questionCounter = 0;

  const finalizeCurrentQuestion = () => {
    if (!currentQ || !currentQ.content.trim()) return;

    let finalType = currentQ.type;
    let finalOptions = currentQ.options.length > 0 ? [...currentQ.options] : undefined;
    let finalCorrect = currentQ.correctAnswer;

    // Check if answer key map provided an answer for this question number
    if (currentQ.num && keyMap.has(currentQ.num)) {
      const keyVal = keyMap.get(currentQ.num)!;
      if (['A', 'B', 'C', 'D'].includes(keyVal)) {
        const optIdx = keyVal.charCodeAt(0) - 65;
        if (finalOptions && finalOptions[optIdx]) {
          finalCorrect = finalOptions[optIdx];
        }
      } else if (keyVal === 'Đúng' || keyVal === 'Sai') {
        finalCorrect = keyVal;
      }
    }

    // Auto-detect True/False
    const isTrueFalseText = 
      currentQ.content.toLowerCase().includes('đúng ghi đ') || 
      currentQ.content.toLowerCase().includes('đúng ghi đúng') ||
      currentQ.content.toLowerCase().includes('đ/s') ||
      (finalOptions && finalOptions.length === 2 && 
        ((finalOptions[0].toLowerCase().includes('đúng') && finalOptions[1].toLowerCase().includes('sai')) ||
         (finalOptions[0].toLowerCase().includes('true') && finalOptions[1].toLowerCase().includes('false'))));

    if (isTrueFalseText) {
      finalType = 'Đúng/Sai';
      finalOptions = ['Đúng', 'Sai'];
      if (!finalCorrect || (finalCorrect !== 'Đúng' && finalCorrect !== 'Sai')) {
        finalCorrect = 'Đúng';
      }
    }

    // Auto-detect Fill in the blanks
    const isFillBlank = 
      (currentQ.content.includes('...') || currentQ.content.includes('___') || currentQ.content.includes('(...)')) &&
      (!finalOptions || finalOptions.length === 0);

    if (isFillBlank && finalType !== 'Tự luận') {
      finalType = 'Điền đáp án';
    }

    // Default multiple choice options if missing but type is multiple choice
    if (finalType === 'Trắc nghiệm') {
      if (!finalOptions || finalOptions.length === 0) {
        // Switch to essay or fill-blank
        finalType = isFillBlank ? 'Điền đáp án' : 'Tự luận';
      } else {
        // If no correct answer set, fallback to first option and add warning
        if (!finalCorrect) {
          finalCorrect = finalOptions[0];
          warnings.push(`Câu ${parsedQuestions.length + 1}: Chưa phát hiện rõ đáp án đúng trong file Word, đã tạm chọn đáp án (A).`);
        }
      }
    }

    parsedQuestions.push({
      id: 'q_word_' + Date.now() + '_' + parsedQuestions.length,
      type: finalType,
      content: cleanLine(currentQ.content),
      options: finalOptions,
      correctAnswer: finalCorrect,
      difficulty: currentQ.difficulty
    });

    currentQ = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Filter out page headers or footers
    if (/^(trang\s*\d+|\d+\/\d+|---)/i.test(line)) continue;
    if (/^(lưu ý|chú ý)\s*:/i.test(line)) continue;

    // Detect new question header, e.g.:
    // "Câu 1:", "Câu 1.", "Câu 1 (1.5 điểm):", "Bài 1:", "Question 1:", "1."
    const qMatch = line.match(/^(?:câu|bài|question)\s*(\d+)?\s*(?:\([^\)]*\))?\s*[:.]\s*(.*)/i) ||
                   line.match(/^(\d+)\s*[.:)]\s+(.*)/);

    if (qMatch) {
      finalizeCurrentQuestion();
      questionCounter++;

      const detectedNum = qMatch[1] ? parseInt(qMatch[1], 10) : questionCounter;
      const questionText = qMatch[2] ? qMatch[2].trim() : '';

      // Determine difficulty based on text keywords
      let diff: 'recognition' | 'understanding' | 'application' = 'understanding';
      const lower = questionText.toLowerCase();
      if (lower.includes('nhận biết') || lower.includes('chữ số') || lower.includes('kết quả của') || lower.includes('đọc số')) {
        diff = 'recognition';
      } else if (lower.includes('tính nhanh') || lower.includes('giải bài toán') || lower.includes('tìm x') || lower.includes('em hãy')) {
        diff = 'application';
      }

      currentQ = {
        num: detectedNum,
        content: questionText,
        options: [],
        correctAnswer: '',
        type: 'Trắc nghiệm',
        difficulty: diff
      };
      continue;
    }

    // Detect options, e.g.: "A. ...", "A) ...", "[A] ...", "A: ..."
    const optMatch = line.match(/^[\[(]?([A-Da-d])[\]).:]\s*(.*)/);
    if (optMatch && currentQ) {
      let optText = optMatch[2].trim();
      let isCorrect = false;

      // Check asterisk marking
      if (optText.includes('*') || line.includes('(*)')) {
        isCorrect = true;
        optText = optText.replace(/\*/g, '').trim();
      }

      // Check if option was underlined or bolded in the Word file
      const optClean = optText.toLowerCase();
      if (
        markedCorrectInHtml.has(optClean) ||
        markedCorrectInHtml.has(optMatch[1].toLowerCase() + '. ' + optClean) ||
        markedCorrectInHtml.has(optMatch[1].toLowerCase() + ') ' + optClean)
      ) {
        isCorrect = true;
      }

      currentQ.options.push(optText);
      if (isCorrect) {
        currentQ.correctAnswer = optText;
      }
      continue;
    }

    // Detect inline answer line, e.g. "Đáp án: A" or "Đáp án đúng: C" or "Key: B"
    const ansMatch = line.match(/^(?:đáp án|đáp án đúng|key|trả lời)\s*[:=]\s*([A-Da-d]|đúng|sai|.+)/i);
    if (ansMatch && currentQ) {
      const ansVal = ansMatch[1].trim();
      if (['A', 'B', 'C', 'D'].includes(ansVal.toUpperCase())) {
        const idx = ansVal.toUpperCase().charCodeAt(0) - 65;
        if (currentQ.options[idx]) {
          currentQ.correctAnswer = currentQ.options[idx];
        }
      } else {
        currentQ.correctAnswer = ansVal;
      }
      continue;
    }

    // If we're inside a question, append additional lines of description/question text
    if (currentQ) {
      // If we haven't started options yet, it's part of the question content
      if (currentQ.options.length === 0) {
        currentQ.content += (currentQ.content ? ' ' : '') + line;
      } else {
        // If we already had options, this might be a continuation of the last option
        const lastOptIdx = currentQ.options.length - 1;
        currentQ.options[lastOptIdx] += ' ' + line;
      }
    }
  }

  // Finish last question
  finalizeCurrentQuestion();

  // If no questions were parsed with "Câu X:", fallback to separating by double line breaks or numbering
  if (parsedQuestions.length === 0 && allLines.length > 0) {
    warnings.push('Không nhận diện được định dạng "Câu 1, Câu 2...". Đang cố gắng phân tích theo từng đoạn.');
    // Emergency simple fallback: treat each non-empty block as a question
    const simpleBlocks = rawText.split(/\n\s*\n/).filter(b => cleanLine(b).length > 10);
    for (let i = 0; i < simpleBlocks.length; i++) {
      parsedQuestions.push({
        id: 'q_word_' + Date.now() + '_' + i,
        type: 'Tự luận',
        content: cleanLine(simpleBlocks[i]),
        correctAnswer: '',
        difficulty: 'understanding'
      });
    }
  }

  return {
    title: metadata.title,
    className: metadata.className,
    category: metadata.category,
    duration: metadata.duration,
    description: `Đề thi nhập tự động từ file Word "${file.name}".`,
    questions: parsedQuestions,
    rawText,
    warnings
  };
}

/**
 * Creates a sample Word (.txt or docx compatible text) guide so teachers know the optimal layout
 */
export function getSampleWordExamContent(): string {
  return `TRƯỜNG TIỂU HỌC NGUYỄN DU
ĐỀ KIỂM TRA ĐỊNH KỲ HỌC KỲ I
Môn: Toán - Khối lớp 3
Thời gian làm bài: 35 phút

Câu 1: Kết quả của phép tính 25 + 37 là:
A. 52
B. 62*
C. 72
D. 60

Câu 2: Số lớn nhất có ba chữ số khác nhau là:
A. 999
B. 987*
C. 989
D. 897

Câu 3: Đúng ghi Đ, sai ghi S:
1m = 100cm
A. Đúng*
B. Sai

Câu 4: Điền số thích hợp vào chỗ trống:
4 x (...) = 36
Đáp án: 9

Câu 5: Một cửa hàng buổi sáng bán được 45kg gạo, buổi chiều bán được nhiều hơn buổi sáng 15kg. Hỏi cả hai buổi cửa hàng bán được bao nhiêu ki-lô-gam gạo?
Đáp án: Buổi chiều bán được 60kg gạo. Cả hai buổi bán được 105kg gạo.

BẢNG ĐÁP ÁN:
1.B  2.B  3.A  4.9
`;
}
