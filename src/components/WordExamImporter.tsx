import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileUp, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Save, 
  Send, 
  X, 
  ArrowLeft, 
  HelpCircle, 
  CheckSquare, 
  BookOpen, 
  Clock, 
  Download, 
  Plus,
  RefreshCw,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { parseWordDocument, getSampleWordExamContent, ParsedWordExam } from '../utils/docxParser';
import { Question, Exam } from './TeacherExamBuilder';

interface WordExamImporterProps {
  categories: string[];
  onSave: (exam: Exam, assignNow?: boolean) => void;
  onEditInBuilder: (exam: Exam) => void;
  onCancel: () => void;
  teacherId?: string;
}

const GRADE_LEVELS = [
  'Khối lớp 1', 'Khối lớp 2', 'Khối lớp 3', 'Khối lớp 4', 'Khối lớp 5',
  'Khối lớp 6', 'Khối lớp 7', 'Khối lớp 8', 'Khối lớp 9'
];

export function WordExamImporter({
  categories,
  onSave,
  onEditInBuilder,
  onCancel,
  teacherId
}: WordExamImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // Parsed exam state for editing before saving
  const [title, setTitle] = useState('');
  const [className, setClassName] = useState('Khối lớp 1');
  const [category, setCategory] = useState(categories[0] || 'Toán');
  const [duration, setDuration] = useState(15);
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [rawText, setRawText] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection and parsing
  const processFile = async (selectedFile: File) => {
    // Check file extension
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith('.docx') && !name.endsWith('.doc') && !name.endsWith('.txt')) {
      setParseError('Hệ thống hỗ trợ file Word (.docx) hoặc file văn bản (.txt). Vui lòng chọn đúng định dạng.');
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);

    try {
      let parsed: ParsedWordExam;
      if (name.endsWith('.txt')) {
        // Plain text fallback parser
        const text = await selectedFile.text();
        // Create mock parsed result
        parsed = await parseWordDocument(selectedFile);
      } else {
        // Docx parser using mammoth
        parsed = await parseWordDocument(selectedFile);
      }

      if (parsed.questions.length === 0) {
        setParseError('Không tìm thấy câu hỏi nào trong file. Vui lòng kiểm tra lại định dạng câu hỏi (Ví dụ: "Câu 1: ... A. ... B. ...").');
        setIsParsing(false);
        return;
      }

      setTitle(parsed.title || selectedFile.name.replace(/\.[^/.]+$/, ''));
      setClassName(parsed.className || 'Khối lớp 1');
      setCategory(parsed.category || categories[0] || 'Toán');
      setDuration(parsed.duration || 15);
      setDescription(parsed.description || '');
      setQuestions(parsed.questions);
      setWarnings(parsed.warnings);
      setRawText(parsed.rawText);
    } catch (err: any) {
      console.error('Word parsing error:', err);
      setParseError('Không thể đọc file Word này. Đảm bảo file không bị khóa mật khẩu hoặc hư hỏng.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    if (chosen) {
      processFile(chosen);
    }
  };

  // Download Sample Document Guide
  const handleDownloadSample = () => {
    const content = getSampleWordExamContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'De_Thi_Mau_Chuan_De_Tai_Len.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Question editing handlers
  const handleUpdateQuestion = (qIndex: number, updated: Partial<Question>) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], ...updated };
      return copy;
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      const q = copy[qIndex];
      if (q.options) {
        const newOptions = [...q.options];
        const oldVal = newOptions[optIndex];
        newOptions[optIndex] = value;
        let newCorrect = q.correctAnswer;
        if (q.correctAnswer === oldVal) {
          newCorrect = value;
        }
        copy[qIndex] = { ...q, options: newOptions, correctAnswer: newCorrect };
      }
      return copy;
    });
  };

  const handleDeleteQuestion = (qIndex: number) => {
    if (questions.length <= 1) {
      alert('Đề kiểm tra cần ít nhất 1 câu hỏi.');
      return;
    }
    setQuestions(prev => prev.filter((_, i) => i !== qIndex));
  };

  // Build the complete Exam object
  const buildExamObject = (): Exam | null => {
    if (!title.trim()) {
      alert('Vui lòng nhập tên đề thi!');
      return null;
    }

    if (questions.length === 0) {
      alert('Đề thi chưa có câu hỏi nào!');
      return null;
    }

    return {
      id: 'exam_word_' + Date.now(),
      title: title.trim(),
      className,
      duration: Number(duration) || 15,
      category,
      questions,
      createdAt: Date.now(),
      teacherId,
      description: description.trim() || `Đề thi nhập tự động từ file Word: ${file?.name || ''}`
    };
  };

  const handleSaveToBank = () => {
    const exam = buildExamObject();
    if (exam) {
      onSave(exam, false);
    }
  };

  const handleSaveAndAssign = () => {
    const exam = buildExamObject();
    if (exam) {
      onSave(exam, true);
    }
  };

  const handleOpenInBuilder = () => {
    const exam = buildExamObject();
    if (exam) {
      onEditInBuilder(exam);
    }
  };

  const resetAll = () => {
    setFile(null);
    setQuestions([]);
    setTitle('');
    setWarnings([]);
    setParseError(null);
  };

  // Statistics
  const multipleChoiceCount = questions.filter(q => q.type === 'Trắc nghiệm').length;
  const trueFalseCount = questions.filter(q => q.type === 'Đúng/Sai').length;
  const fillBlankCount = questions.filter(q => q.type === 'Điền đáp án').length;
  const essayCount = questions.filter(q => q.type === 'Tự luận').length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] border-2 border-white/40 shadow-xl shadow-slate-100/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button
            onClick={onCancel}
            className="w-14 h-14 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl flex items-center justify-center transition-all active:scale-95"
            title="Quay lại"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-3.5 py-1 bg-blue-100 text-blue-700 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                <FileUp size={13} /> Nhập đề từ Word
              </span>
              <span className="text-xs font-bold text-slate-400">Định dạng .docx / .doc / .txt</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Tải file đề thi Word & Tự động tạo bài kiểm tra
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl transition-all flex items-center gap-2 uppercase tracking-wider"
          >
            <HelpCircle size={18} className="text-blue-600" /> Hướng dẫn định dạng
          </button>
          <button
            onClick={handleDownloadSample}
            className="px-5 py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xs rounded-2xl transition-all flex items-center gap-2 uppercase tracking-wider"
          >
            <Download size={18} /> Tải đề mẫu
          </button>
        </div>
      </div>

      {/* Guide Accordion / Modal */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50/70 border-2 border-blue-200/60 rounded-[2.5rem] p-8 space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-blue-900 text-lg flex items-center gap-3">
                <FileText size={22} className="text-blue-600" />
                Quy tắc nhận diện file Word tự động
              </h3>
              <button 
                onClick={() => setShowGuide(false)}
                className="p-2 text-blue-400 hover:text-blue-700 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700 leading-relaxed font-semibold">
              <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm space-y-2">
                <p className="font-black text-blue-800 uppercase tracking-wider text-[11px]">1. Tiêu đề & Thông tin đầu file</p>
                <p>Hệ thống tự nhận diện thông tin nếu có:</p>
                <code className="block bg-slate-50 p-2.5 rounded-xl font-mono text-[11px] text-slate-800">
                  ĐỀ KIỂM TRA MÔN TOÁN<br/>
                  Môn: Toán - Khối lớp 3<br/>
                  Thời gian: 35 phút
                </code>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm space-y-2">
                <p className="font-black text-blue-800 uppercase tracking-wider text-[11px]">2. Định dạng câu hỏi & Đáp án</p>
                <p>Mỗi câu bắt đầu bằng <b>Câu 1:</b> hoặc <b>1.</b> hoặc <b>Bài 1:</b></p>
                <code className="block bg-slate-50 p-2.5 rounded-xl font-mono text-[11px] text-slate-800">
                  Câu 1: 5 + 3 = ?<br/>
                  A. 6<br/>
                  B. 8* (đánh dấu sao)<br/>
                  C. 9<br/>
                  D. 7
                </code>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm space-y-2">
                <p className="font-black text-blue-800 uppercase tracking-wider text-[11px]">3. Cách đánh dấu đáp án đúng</p>
                <p>Thầy cô có thể chọn 1 trong các cách sau:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Thêm dấu sao: <b className="text-blue-600">B. 8*</b> hoặc <b className="text-blue-600">*B. 8</b></li>
                  <li>Gạch chân / in đậm đáp án trong Word</li>
                  <li>Ghi <b className="text-blue-600">Đáp án: B</b> ở cuối câu</li>
                  <li>Hoặc để bảng đáp án ở cuối file (1.B 2.C 3.A)</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Upload Zone (Shown if no file or parsing) */}
      {!file || questions.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl p-12 rounded-[3.5rem] border-2 border-white/40 shadow-xl shadow-slate-100/50 space-y-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-[3rem] p-12 text-center transition-all border-3 border-dashed ${
              isDragging 
                ? 'border-blue-500 bg-blue-50/70 scale-[1.01]' 
                : 'border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".docx,.doc,.txt"
              className="hidden"
            />
            <div className="max-w-md mx-auto space-y-5">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/20 group-hover:scale-110 transition-transform">
                {isParsing ? (
                  <RefreshCw className="animate-spin" size={44} />
                ) : (
                  <FileUp size={44} />
                )}
              </div>

              {isParsing ? (
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">Đang phân tích file Word...</h3>
                  <p className="text-sm font-bold text-slate-500">Hệ thống đang trích xuất câu hỏi, đáp án đúng và thời gian làm bài</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">
                    Kéo thả file Word vào đây hoặc bấm để chọn
                  </h3>
                  <p className="text-sm font-bold text-slate-400 leading-relaxed">
                    Hỗ trợ định dạng tài liệu <b>Microsoft Word (.docx)</b> và file văn bản (.txt)
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-center gap-4 text-xs font-black text-slate-500 uppercase tracking-wider">
                <span className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">.DOCX</span>
                <span className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">.DOC</span>
                <span className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">.TXT</span>
              </div>
            </div>
          </div>

          {parseError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl flex items-start gap-4 text-rose-800"
            >
              <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={24} />
              <div>
                <p className="font-black text-sm mb-1">Không thể phân tích file Word</p>
                <p className="text-xs font-semibold leading-relaxed">{parseError}</p>
                <div className="mt-3">
                  <button
                    onClick={handleDownloadSample}
                    className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-rose-700 transition-all"
                  >
                    Xem file mẫu chuẩn để chỉnh lại
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        /* Parsed Result & Exam Configuration */
        <div className="space-y-8">
          {/* File summary & Quick Actions */}
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] border-2 border-white/40 shadow-xl shadow-slate-100/50 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Đã đọc thành công</span>
                    <span className="text-xs text-slate-400 font-bold">• {file?.name}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    Tìm thấy {questions.length} câu hỏi sẵn sàng đưa vào đề thi
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={resetAll}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-2xl transition-all flex items-center gap-2 uppercase tracking-wider"
                >
                  <RefreshCw size={16} /> Đổi file khác
                </button>
                <button
                  onClick={handleOpenInBuilder}
                  className="px-5 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xs rounded-2xl transition-all flex items-center gap-2 uppercase tracking-wider"
                >
                  <Edit3 size={16} /> Mở trong bộ soạn bài
                </button>
                <button
                  onClick={handleSaveToBank}
                  className="px-6 py-3.5 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-2xl transition-all shadow-lg flex items-center gap-2 uppercase tracking-wider"
                >
                  <Save size={16} /> Lưu vào kho đề
                </button>
                <button
                  onClick={handleSaveAndAssign}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2 uppercase tracking-wider"
                >
                  <Send size={16} /> Lưu & Giao bài ngay
                </button>
              </div>
            </div>

            {/* Warnings list if any */}
            {warnings.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1 text-amber-800 text-xs font-bold">
                <div className="flex items-center gap-2 text-amber-900 font-black uppercase tracking-wider text-[11px]">
                  <AlertTriangle size={16} /> Lưu ý cần rà soát lại:
                </div>
                {warnings.map((w, idx) => (
                  <p key={idx} className="ml-6 list-disc">• {w}</p>
                ))}
              </div>
            )}

            {/* Exam Metadata Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">
                  Tên bài tập / Đề kiểm tra
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-900 text-base transition-all"
                  placeholder="VD: Kiểm tra giữa kỳ 1 Môn Toán"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">
                  Môn học
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-900 text-sm appearance-none cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">
                    Khối lớp
                  </label>
                  <div className="relative">
                    <select
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-900 text-xs appearance-none cursor-pointer"
                    >
                      {GRADE_LEVELS.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">
                    Thời gian
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 15)}
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-900 text-xs"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">Phút</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider">
                Tổng cộng: {questions.length} câu
              </span>
              {multipleChoiceCount > 0 && (
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-black uppercase tracking-wider">
                  Trắc nghiệm: {multipleChoiceCount}
                </span>
              )}
              {trueFalseCount > 0 && (
                <span className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-black uppercase tracking-wider">
                  Đúng / Sai: {trueFalseCount}
                </span>
              )}
              {fillBlankCount > 0 && (
                <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-wider">
                  Điền khuyết: {fillBlankCount}
                </span>
              )}
              {essayCount > 0 && (
                <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-black uppercase tracking-wider">
                  Tự luận: {essayCount}
                </span>
              )}
            </div>
          </div>

          {/* Question List Review and Tuning */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <BookOpen size={24} className="text-blue-600" />
                Danh sách câu hỏi đã trích xuất từ file Word ({questions.length})
              </h3>
              <p className="text-xs font-bold text-slate-400">
                Thầy cô có thể nhấp vào đáp án để đổi đáp án đúng trước khi lưu
              </p>
            </div>

            <div className="space-y-5">
              {questions.map((q, qIndex) => {
                const isMultipleChoice = q.type === 'Trắc nghiệm';
                const isTrueFalse = q.type === 'Đúng/Sai';
                const isFillBlank = q.type === 'Điền đáp án';
                const isEssay = q.type === 'Tự luận';

                return (
                  <motion.div
                    key={q.id || qIndex}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] border-2 border-white/60 shadow-lg shadow-slate-100/30 space-y-6 relative group"
                  >
                    {/* Question Header & Type & Difficulty */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
                          {qIndex + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            isMultipleChoice ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            isTrueFalse ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            isFillBlank ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {q.type}
                          </span>
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {q.difficulty === 'recognition' ? 'Nhận biết' : q.difficulty === 'understanding' ? 'Thông hiểu' : 'Vận dụng'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Change Difficulty */}
                        <select
                          value={q.difficulty}
                          onChange={(e) => handleUpdateQuestion(qIndex, { difficulty: e.target.value as any })}
                          className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 outline-none cursor-pointer"
                        >
                          <option value="recognition">Mức độ: Nhận biết</option>
                          <option value="understanding">Mức độ: Thông hiểu</option>
                          <option value="application">Mức độ: Vận dụng</option>
                        </select>

                        {/* Delete Question */}
                        <button
                          onClick={() => handleDeleteQuestion(qIndex)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Xóa câu hỏi này"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Question Content Input */}
                    <div className="space-y-1.5">
                      <textarea
                        value={q.content}
                        onChange={(e) => handleUpdateQuestion(qIndex, { content: e.target.value })}
                        rows={2}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-400 focus:bg-white rounded-2xl outline-none font-bold text-slate-900 text-sm leading-relaxed transition-all"
                        placeholder="Nội dung câu hỏi..."
                      />
                    </div>

                    {/* Options / Answers according to type */}
                    {isMultipleChoice && q.options && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const label = String.fromCharCode(65 + optIdx);
                          const isCorrect = q.correctAnswer === opt;

                          return (
                            <div
                              key={optIdx}
                              onClick={() => handleUpdateQuestion(qIndex, { correctAnswer: opt })}
                              className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                                isCorrect 
                                  ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-sm' 
                                  : 'bg-slate-50/70 border-slate-100 hover:border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                isCorrect ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {label}
                              </div>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleUpdateOption(qIndex, optIdx, e.target.value);
                                }}
                                className="flex-1 bg-transparent outline-none font-bold text-sm"
                                placeholder={`Lựa chọn ${label}...`}
                              />
                              {isCorrect && (
                                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-100 px-2.5 py-1 rounded-lg shrink-0">
                                  Đáp án đúng
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isTrueFalse && (
                      <div className="flex items-center gap-4 pt-1">
                        {['Đúng', 'Sai'].map((val) => {
                          const isCorrect = q.correctAnswer === val;
                          return (
                            <button
                              key={val}
                              onClick={() => handleUpdateQuestion(qIndex, { correctAnswer: val })}
                              className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all border-2 flex items-center justify-center gap-2 ${
                                isCorrect
                                  ? val === 'Đúng'
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                    : 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20'
                                  : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {val === 'Đúng' ? 'Đúng (Đ)' : 'Sai (S)'}
                              {isCorrect && ' ✓ (Đáp án chuẩn)'}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {isFillBlank && (
                      <div className="p-4 bg-emerald-50/60 border-2 border-emerald-100 rounded-2xl space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                          Từ / Cụm từ cần điền chính xác:
                        </label>
                        <input
                          type="text"
                          value={q.correctAnswer || ''}
                          onChange={(e) => handleUpdateQuestion(qIndex, { correctAnswer: e.target.value })}
                          className="w-full px-5 py-3 bg-white border border-emerald-200 rounded-xl font-bold text-emerald-700 outline-none text-sm focus:border-emerald-500"
                          placeholder="Nhập từ cần điền vào chỗ trống..."
                        />
                      </div>
                    )}

                    {isEssay && (
                      <div className="p-4 bg-purple-50/60 border-2 border-purple-100 rounded-2xl space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-purple-800">
                          Gợi ý đáp án / Biểu điểm tự luận:
                        </label>
                        <textarea
                          rows={2}
                          value={q.correctAnswer || ''}
                          onChange={(e) => handleUpdateQuestion(qIndex, { correctAnswer: e.target.value })}
                          className="w-full px-5 py-3 bg-white border border-purple-200 rounded-xl font-bold text-purple-900 outline-none text-sm focus:border-purple-500"
                          placeholder="Hướng dẫn chấm và câu trả lời mẫu..."
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom Floating/Sticky Action Bar */}
            <div className="sticky bottom-6 z-20 bg-slate-900/90 backdrop-blur-xl p-5 rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <CheckSquare size={20} />
                </div>
                <div>
                  <p className="text-sm font-black">{title || 'Đề kiểm tra'}</p>
                  <p className="text-xs text-slate-400 font-bold">{questions.length} câu hỏi • {duration} phút • {category}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleSaveToBank}
                  className="flex-1 sm:flex-initial px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-2xl transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Lưu vào kho đề
                </button>
                <button
                  onClick={handleSaveAndAssign}
                  className="flex-1 sm:flex-initial px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl transition-all shadow-xl shadow-blue-500/30 uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
                >
                  <Send size={16} /> Lưu & Giao bài ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
