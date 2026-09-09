import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  HelpCircle, 
  Edit3, 
  CheckSquare, 
  BookOpen, 
  Clock, 
  Save, 
  Eye, 
  Send, 
  FileText, 
  AlertCircle, 
  FileUp, 
  ChevronDown, 
  Sparkles,
  Check,
  X,
  GraduationCap,
  Layers,
  FileCode
} from 'lucide-react';

export interface Question {
  id: string;
  type: string; // 'Trắc nghiệm' | 'Đúng/Sai' | 'Điền đáp án' | 'Tự luận'
  content: string;
  options?: string[];
  correctAnswer: any;
  difficulty: 'recognition' | 'understanding' | 'application';
}

export interface Exam {
  id: string;
  title: string;
  className: string;
  duration: number;
  category: string;
  questions: Question[];
  createdAt: number;
  teacherId?: string;
  description?: string;
}

interface TeacherExamBuilderProps {
  categories: string[];
  initialExam?: Exam | null;
  teacherId?: string;
  onSave: (exam: Exam, assignNow?: boolean) => void;
  onCancel?: () => void;
  onPreview: (exam: Exam) => void;
  onOpenWordImporter?: () => void;
}

const DEFAULT_CATEGORIES = [
  'Toán', 'Tiếng Việt', 'Tiếng Anh', 'Tự nhiên & Xã hội', 'Đạo đức', 
  'Âm nhạc', 'Mỹ thuật', 'Tin học', 'Khoa học', 'Lịch sử & Địa lý'
];

const GRADE_LEVELS = [
  'Khối lớp 1', 'Khối lớp 2', 'Khối lớp 3', 'Khối lớp 4', 'Khối lớp 5',
  'Khối lớp 6', 'Khối lớp 7', 'Khối lớp 8', 'Khối lớp 9'
];

export function TeacherExamBuilder({
  categories = DEFAULT_CATEGORIES,
  initialExam,
  onSave,
  onCancel,
  onPreview,
  onOpenWordImporter
}: TeacherExamBuilderProps) {
  // General exam information
  const [title, setTitle] = useState(initialExam?.title || '');
  const [className, setClassName] = useState(initialExam?.className || 'Khối lớp 1');
  const [category, setCategory] = useState(initialExam?.category || 'Toán');
  const [duration, setDuration] = useState(initialExam?.duration || 15);
  const [description, setDescription] = useState(initialExam?.description || '');

  // Questions list
  const [questions, setQuestions] = useState<Question[]>(() => {
    if (initialExam && initialExam.questions && initialExam.questions.length > 0) {
      return initialExam.questions;
    }
    // Default initial template questions to help teacher get started
    return [
      {
        id: 'q_' + Date.now() + '_1',
        type: 'Trắc nghiệm',
        content: 'Ví dụ: Kết quả của phép tính 5 + 3 là bao nhiêu?',
        options: ['6', '7', '8', '9'],
        correctAnswer: '8',
        difficulty: 'recognition'
      },
      {
        id: 'q_' + Date.now() + '_2',
        type: 'Đúng/Sai',
        content: 'Mặt trời mọc ở hướng Đông và lặn ở hướng Tây.',
        options: ['Đúng', 'Sai'],
        correctAnswer: 'Đúng',
        difficulty: 'understanding'
      }
    ];
  });

  // Modal for quick text import
  const [showQuickImport, setShowQuickImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  // When initialExam changes, reset form
  useEffect(() => {
    if (initialExam) {
      setTitle(initialExam.title);
      setClassName(initialExam.className);
      setCategory(initialExam.category);
      setDuration(initialExam.duration);
      setDescription(initialExam.description || '');
      setQuestions(initialExam.questions || []);
    }
  }, [initialExam]);

  // Statistics
  const recognitionCount = questions.filter(q => q.difficulty === 'recognition').length;
  const understandingCount = questions.filter(q => q.difficulty === 'understanding').length;
  const applicationCount = questions.filter(q => q.difficulty === 'application').length;

  // Add Question Helpers
  const handleAddMultipleChoice = () => {
    const newQ: Question = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'Trắc nghiệm',
      content: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      difficulty: 'recognition'
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const handleAddTrueFalse = () => {
    const newQ: Question = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'Đúng/Sai',
      content: '',
      options: ['Đúng', 'Sai'],
      correctAnswer: 'Đúng',
      difficulty: 'understanding'
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const handleAddFillBlank = () => {
    const newQ: Question = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'Điền đáp án',
      content: '',
      correctAnswer: '',
      difficulty: 'recognition'
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const handleAddEssay = () => {
    const newQ: Question = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'Tự luận',
      content: '',
      correctAnswer: '',
      difficulty: 'application'
    };
    setQuestions(prev => [...prev, newQ]);
  };

  // Question editing handlers
  const handleUpdateQuestion = (index: number, updated: Partial<Question>) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updated };
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
        // If this was the correct answer, update correctAnswer value as well
        let newCorrect = q.correctAnswer;
        if (q.correctAnswer === oldVal) {
          newCorrect = value;
        }
        copy[qIndex] = { ...q, options: newOptions, correctAnswer: newCorrect };
      }
      return copy;
    });
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert('Đề kiểm tra cần có ít nhất 1 câu hỏi.');
      return;
    }
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleDuplicateQuestion = (index: number) => {
    const original = questions[index];
    const duplicated: Question = {
      ...original,
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      content: original.content + ' (Bản sao)',
      options: original.options ? [...original.options] : undefined
    };
    setQuestions(prev => {
      const next = [...prev];
      next.splice(index + 1, 0, duplicated);
      return next;
    });
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    setQuestions(prev => {
      const next = [...prev];
      const item = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = item;
      return next;
    });
  };

  // Quick text parser for teacher test imports
  const handleParseImport = () => {
    if (!importText.trim()) {
      setImportError('Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    try {
      const lines = importText.split('\n');
      const parsedQuestions: Question[] = [];
      let currentQ: {
        content: string;
        options: string[];
        correctAnswer: string;
        type: string;
        difficulty: 'recognition' | 'understanding' | 'application';
      } | null = null;

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i].trim();
        if (!rawLine) continue;

        // Check if line starts a new question (e.g. "Câu 1:", "1.", "Bài 1:", "Câu 1.")
        const qMatch = rawLine.match(/^(?:câu|bài|\d+)\s*(\d+)?[.:)]\s*(.*)/i);
        if (qMatch) {
          // Save previous question
          if (currentQ && currentQ.content) {
            parsedQuestions.push({
              id: 'q_import_' + Date.now() + '_' + parsedQuestions.length,
              type: currentQ.options.length > 0 ? 'Trắc nghiệm' : 'Tự luận',
              content: currentQ.content,
              options: currentQ.options.length > 0 ? currentQ.options : undefined,
              correctAnswer: currentQ.correctAnswer || (currentQ.options[0] || ''),
              difficulty: currentQ.difficulty
            });
          }

          currentQ = {
            content: qMatch[2] || rawLine,
            options: [],
            correctAnswer: '',
            type: 'Trắc nghiệm',
            difficulty: 'understanding'
          };
          continue;
        }

        // Check if line is an option (e.g. "A. ...", "A) ...", "[*] A. ...")
        const optMatch = rawLine.match(/^[\[(]?([A-Da-d])[\]).:]\s*(.*)/);
        if (optMatch && currentQ) {
          let optText = optMatch[2].trim();
          const isMarkedCorrect = optText.includes('*') || rawLine.includes('(*)');
          optText = optText.replace(/\*/g, '').trim();

          currentQ.options.push(optText);
          if (isMarkedCorrect) {
            currentQ.correctAnswer = optText;
          }
          continue;
        }

        // Check if line is answer indicator (e.g. "Đáp án: A" or "Đáp án: B")
        const ansMatch = rawLine.match(/^(?:đáp án|đáp án đúng|key)\s*[:=]\s*([A-Da-d])/i);
        if (ansMatch && currentQ) {
          const letter = ansMatch[1].toUpperCase();
          const idx = letter.charCodeAt(0) - 65;
          if (currentQ.options[idx]) {
            currentQ.correctAnswer = currentQ.options[idx];
          }
          continue;
        }

        // Otherwise append to current question content if exists
        if (currentQ) {
          currentQ.content += ' ' + rawLine;
        }
      }

      // Add the last question
      if (currentQ && currentQ.content) {
        parsedQuestions.push({
          id: 'q_import_' + Date.now() + '_' + parsedQuestions.length,
          type: currentQ.options.length > 0 ? 'Trắc nghiệm' : 'Tự luận',
          content: currentQ.content,
          options: currentQ.options.length > 0 ? currentQ.options : undefined,
          correctAnswer: currentQ.correctAnswer || (currentQ.options[0] || ''),
          difficulty: currentQ.difficulty
        });
      }

      if (parsedQuestions.length === 0) {
        setImportError('Không tìm thấy câu hỏi hợp lệ. Hãy kiểm tra định dạng mẫu!');
        return;
      }

      setQuestions(prev => [...prev, ...parsedQuestions]);
      setShowQuickImport(false);
      setImportText('');
      setImportError('');
      alert(`Đã trích xuất và thêm thành công ${parsedQuestions.length} câu hỏi!`);
    } catch (err) {
      setImportError('Đã có lỗi khi phân tích văn bản. Vui lòng kiểm tra lại.');
    }
  };

  // Build the complete Exam object
  const buildExamObject = (): Exam | null => {
    if (!title.trim()) {
      alert('Vui lòng nhập tên bài tập / đề kiểm tra!');
      return null;
    }

    if (questions.length === 0) {
      alert('Vui lòng soạn ít nhất 1 câu hỏi.');
      return null;
    }

    // Check for empty questions or missing correct answers
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) {
        alert(`Câu hỏi số ${i + 1} chưa có nội dung!`);
        return null;
      }

      if (q.type === 'Trắc nghiệm') {
        const hasEmptyOption = q.options?.some(opt => !opt.trim());
        if (hasEmptyOption) {
          alert(`Câu hỏi số ${i + 1} có lựa chọn đang bị để trống!`);
          return null;
        }
        if (!q.correctAnswer) {
          alert(`Câu hỏi số ${i + 1} chưa được chọn đáp án đúng! Hãy bấm chọn vào chữ cái A, B, C hoặc D.`);
          return null;
        }
      } else if (q.type === 'Điền đáp án' || q.type === 'Đúng/Sai') {
        if (!q.correctAnswer || !String(q.correctAnswer).trim()) {
          alert(`Câu hỏi số ${i + 1} chưa có đáp án chính xác!`);
          return null;
        }
      }
    }

    return {
      id: initialExam?.id || Date.now().toString(),
      title: title.trim(),
      className,
      category,
      duration: Math.max(1, Number(duration) || 15),
      questions,
      createdAt: initialExam?.createdAt || Date.now(),
      teacherId: initialExam?.teacherId,
      description: description.trim()
    };
  };

  const handleSaveOnly = () => {
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

  const handleTriggerPreview = () => {
    const exam = buildExamObject();
    if (exam) {
      onPreview(exam);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Top Banner / Header */}
      <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[3rem] border-2 border-white/40 shadow-xl shadow-slate-100/40 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.8rem] flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Edit3 size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                Giáo viên tự soạn
              </span>
              {initialExam && (
                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  Chế độ chỉnh sửa
                </span>
              )}
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              {initialExam ? 'Chỉnh sửa bài tập' : 'Soạn bài tập & Đề kiểm tra'}
            </h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
              Tự thiết kế nội dung bài tập chuẩn xác, phong phú theo giáo trình của bạn
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest active:scale-95"
            >
              Hủy bỏ
            </button>
          )}

          {onOpenWordImporter && (
            <button
              type="button"
              onClick={onOpenWordImporter}
              className="px-6 py-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-black rounded-2xl transition-all text-xs uppercase tracking-widest flex items-center gap-2 border border-emerald-200 active:scale-95"
            >
              <FileUp size={16} /> Tải đề từ Word (.docx)
            </button>
          )}

          <button
            onClick={() => setShowQuickImport(true)}
            className="px-6 py-4 bg-slate-100 text-slate-700 hover:bg-slate-200 font-black rounded-2xl transition-all text-xs uppercase tracking-widest flex items-center gap-2 border border-slate-200 active:scale-95"
          >
            <FileText size={16} /> Nhập nhanh từ văn bản
          </button>

          <button
            onClick={handleTriggerPreview}
            className="px-6 py-4 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-black rounded-2xl transition-all text-xs uppercase tracking-widest flex items-center gap-2 border border-indigo-200 active:scale-95"
          >
            <Eye size={16} /> Xem trước
          </button>

          <button
            onClick={handleSaveOnly}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-500/25 text-xs uppercase tracking-widest flex items-center gap-2 active:scale-95"
          >
            <Save size={18} /> Lưu bài tập
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content: Questions Builder (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Section: General Details */}
          <section className="bg-white/70 backdrop-blur-xl p-8 md:p-10 rounded-[3rem] border-2 border-white/40 shadow-xl shadow-slate-100/30 space-y-8">
            <h3 className="font-black text-slate-900 text-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpen size={20} />
              </div>
              Thông tin tổng quát
            </h3>

            <div className="space-y-6">
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">
                  Tên bài tập / Đề kiểm tra <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn tập phép cộng trong phạm vi 10, Bài kiểm tra 15 phút tuần 3..."
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-900 text-base transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">
                    Khối lớp
                  </label>
                  <div className="relative">
                    <select
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-900 appearance-none cursor-pointer text-sm"
                    >
                      {GRADE_LEVELS.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">
                    Thời gian làm bài (Phút)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 15)}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-900 text-sm"
                    />
                    <Clock size={18} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-4">
                  Môn học
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2 ${
                        category === cat
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20 scale-105'
                          : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">
                  Ghi chú / Lời dặn dò của thầy cô (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Các em đọc kĩ đề trước khi làm bài, làm xong nhớ kiểm tra lại nhé."
                  className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700 text-sm"
                />
              </div>
            </div>
          </section>

          {/* Section: Questions List */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <div>
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  Danh sách câu hỏi
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-black">
                    {questions.length} câu
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Thêm, xóa, chỉnh sửa nội dung và lựa chọn đáp án chuẩn
                </p>
              </div>

              {/* Quick Add Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddMultipleChoice}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  <Plus size={16} /> + Trắc nghiệm (4 đáp án)
                </button>
                <button
                  type="button"
                  onClick={handleAddTrueFalse}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Plus size={16} /> + Đúng / Sai
                </button>
                <button
                  type="button"
                  onClick={handleAddFillBlank}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Plus size={16} /> + Điền đáp án
                </button>
                <button
                  type="button"
                  onClick={handleAddEssay}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 active:scale-95 transition-all"
                >
                  <Plus size={16} /> + Tự luận
                </button>
              </div>
            </div>

            {/* Questions Cards */}
            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={q.id}
                  className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border-2 border-slate-100/80 shadow-lg shadow-slate-100/50 relative group transition-all hover:border-blue-200"
                >
                  {/* Question Header Card */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20">
                        {qIdx + 1}
                      </span>
                      
                      {/* Type selector */}
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          if (newType === 'Trắc nghiệm') {
                            handleUpdateQuestion(qIdx, {
                              type: newType,
                              options: q.options && q.options.length === 4 ? q.options : ['', '', '', ''],
                              correctAnswer: ''
                            });
                          } else if (newType === 'Đúng/Sai') {
                            handleUpdateQuestion(qIdx, {
                              type: newType,
                              options: ['Đúng', 'Sai'],
                              correctAnswer: 'Đúng'
                            });
                          } else if (newType === 'Điền đáp án' || newType === 'Tự luận') {
                            handleUpdateQuestion(qIdx, {
                              type: newType,
                              options: undefined,
                              correctAnswer: ''
                            });
                          }
                        }}
                        className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl font-black text-xs text-slate-800 outline-none cursor-pointer"
                      >
                        <option value="Trắc nghiệm">Trắc nghiệm (4 lựa chọn)</option>
                        <option value="Đúng/Sai">Đúng / Sai</option>
                        <option value="Điền đáp án">Điền từ / Điền đáp án</option>
                        <option value="Tự luận">Tự luận / Câu hỏi mở</option>
                      </select>

                      {/* Difficulty selector */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                        {[
                          { key: 'recognition', label: 'Nhận biết', color: 'text-emerald-700 bg-emerald-100' },
                          { key: 'understanding', label: 'Thông hiểu', color: 'text-blue-700 bg-blue-100' },
                          { key: 'application', label: 'Vận dụng', color: 'text-purple-700 bg-purple-100' }
                        ].map(lvl => (
                          <button
                            key={lvl.key}
                            type="button"
                            onClick={() => handleUpdateQuestion(qIdx, { difficulty: lvl.key as any })}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                              q.difficulty === lvl.key
                                ? `${lvl.color} shadow-xs font-black`
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {lvl.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Question Controls */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(qIdx, 'up')}
                        disabled={qIdx === 0}
                        title="Di chuyển lên"
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl disabled:opacity-20 transition-all"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(qIdx, 'down')}
                        disabled={qIdx === questions.length - 1}
                        title="Di chuyển xuống"
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl disabled:opacity-20 transition-all"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateQuestion(qIdx)}
                        title="Nhân bản câu hỏi"
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(qIdx)}
                        title="Xóa câu hỏi"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Question Content Input */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Nội dung câu hỏi <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={q.content}
                        onChange={(e) => handleUpdateQuestion(qIdx, { content: e.target.value })}
                        placeholder={
                          q.type === 'Điền đáp án'
                            ? 'Ví dụ: Thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam là (...)'
                            : 'Nhập nội dung đề bài câu hỏi tại đây...'
                        }
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-800 text-sm leading-relaxed transition-all"
                      />
                    </div>

                    {/* Multiple Choice Options Builder */}
                    {q.type === 'Trắc nghiệm' && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Các đáp án lựa chọn (Bấm vào chữ cái để chọn đáp án đúng):
                          </span>
                          <span className="text-[10px] font-bold text-blue-600">
                            Đáp án đang chọn:{' '}
                            <strong className="font-black">
                              {q.correctAnswer ? q.correctAnswer : 'Chưa chọn'}
                            </strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                            const optionValue = q.options?.[optIdx] || '';
                            const isCorrect = Boolean(optionValue) && q.correctAnswer === optionValue;

                            return (
                              <div
                                key={letter}
                                className={`flex items-center gap-3 p-2.5 rounded-2xl border-2 transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-100'
                                    : 'bg-slate-50/80 border-slate-200 focus-within:border-blue-400'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (optionValue.trim()) {
                                      handleUpdateQuestion(qIdx, { correctAnswer: optionValue });
                                    } else {
                                      alert('Vui lòng nhập nội dung đáp án trước khi bấm chọn đáp án đúng!');
                                    }
                                  }}
                                  title={`Chọn ${letter} làm đáp án đúng`}
                                  className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-all ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                                      : 'bg-white text-slate-500 hover:bg-slate-200 border border-slate-300'
                                  }`}
                                >
                                  {isCorrect ? <Check size={18} strokeWidth={3} /> : letter}
                                </button>

                                <input
                                  type="text"
                                  value={optionValue}
                                  onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                  placeholder={`Nội dung lựa chọn ${letter}...`}
                                  className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-slate-800 placeholder:text-slate-400"
                                />

                                {isCorrect && (
                                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 font-black text-[9px] uppercase tracking-wider rounded-md mr-1">
                                    Đúng
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* True/False Builder */}
                    {q.type === 'Đúng/Sai' && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Chọn đáp án đúng của nhận định:
                        </span>
                        <div className="flex gap-4">
                          {['Đúng', 'Sai'].map(val => {
                            const isCorrect = q.correctAnswer === val;
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleUpdateQuestion(qIdx, { correctAnswer: val })}
                                className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider transition-all border-2 flex items-center justify-center gap-2 ${
                                  isCorrect
                                    ? val === 'Đúng'
                                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                                      : 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/20'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                {isCorrect && <CheckCircle2 size={18} />}
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Fill in the blank Builder */}
                    {q.type === 'Điền đáp án' && (
                      <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Từ / Cụm từ hoặc số chính xác học sinh cần điền: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={q.correctAnswer || ''}
                          onChange={(e) => handleUpdateQuestion(qIdx, { correctAnswer: e.target.value })}
                          placeholder="Ví dụ: Hà Nội (hoặc: 10, hình tròn, nước Việt Nam...)"
                          className="w-full px-5 py-3.5 bg-emerald-50/50 border-2 border-emerald-200 rounded-2xl focus:border-emerald-500 outline-none font-black text-emerald-800 text-sm transition-all"
                        />
                        <p className="text-[10px] text-slate-400 font-medium">
                          Hệ thống sẽ tự động so khớp không phân biệt chữ hoa/thường để học sinh dễ làm bài.
                        </p>
                      </div>
                    )}

                    {/* Essay Builder */}
                    {q.type === 'Tự luận' && (
                      <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Gợi ý đáp án / Tiêu chí chấm điểm (Để giáo viên tham khảo khi chấm bài):
                        </label>
                        <textarea
                          rows={2}
                          value={q.correctAnswer || ''}
                          onChange={(e) => handleUpdateQuestion(qIdx, { correctAnswer: e.target.value })}
                          placeholder="Nhập các ý chính học sinh cần trả lời hoặc thang điểm gợi ý..."
                          className="w-full px-5 py-3.5 bg-purple-50/40 border border-purple-200 rounded-2xl focus:border-purple-500 outline-none font-medium text-purple-900 text-sm leading-relaxed"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom Add Question Button */}
            <div className="p-8 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-[2.5rem] bg-white/40 flex flex-col sm:flex-row items-center justify-center gap-4 text-center transition-all">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Thêm câu hỏi mới vào bài:
              </span>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleAddMultipleChoice}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Plus size={14} /> Trắc nghiệm
                </button>
                <button
                  type="button"
                  onClick={handleAddTrueFalse}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Plus size={14} /> Đúng / Sai
                </button>
                <button
                  type="button"
                  onClick={handleAddFillBlank}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Plus size={14} /> Điền từ
                </button>
                <button
                  type="button"
                  onClick={handleAddEssay}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Plus size={14} /> Tự luận
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Summary & Save Actions (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Matrix Card */}
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] border-2 border-white/40 shadow-xl shadow-slate-100/30 space-y-6 sticky top-8">
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <Layers size={20} className="text-blue-600" />
              Ma trận & Cấu trúc bài tập
            </h4>

            {/* Total count badge */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tổng số câu hỏi
                </p>
                <p className="text-3xl font-black text-slate-900">{questions.length} <span className="text-xs text-slate-400 font-bold uppercase">câu</span></p>
              </div>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black">
                {questions.length}
              </div>
            </div>

            {/* Level Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="flex items-center gap-2 text-emerald-700 font-black">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Nhận biết
                </span>
                <span className="font-black text-slate-900">{recognitionCount} câu</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(recognitionCount / Math.max(questions.length, 1)) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold pt-2">
                <span className="flex items-center gap-2 text-blue-700 font-black">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Thông hiểu
                </span>
                <span className="font-black text-slate-900">{understandingCount} câu</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(understandingCount / Math.max(questions.length, 1)) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold pt-2">
                <span className="flex items-center gap-2 text-purple-700 font-black">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Vận dụng
                </span>
                <span className="font-black text-slate-900">{applicationCount} câu</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${(applicationCount / Math.max(questions.length, 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Summary Details */}
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs font-medium space-y-1.5">
              <p className="text-slate-600">
                <strong className="text-slate-900 font-bold">Môn học:</strong> {category}
              </p>
              <p className="text-slate-600">
                <strong className="text-slate-900 font-bold">Lớp:</strong> {className}
              </p>
              <p className="text-slate-600">
                <strong className="text-slate-900 font-bold">Thời gian:</strong> {duration} phút
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleSaveOnly}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Save size={18} /> Lưu vào kho bài thi
              </button>

              <button
                type="button"
                onClick={handleSaveAndAssign}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Send size={18} /> Lưu & Giao bài ngay
              </button>

              <button
                type="button"
                onClick={handleTriggerPreview}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Eye size={16} /> Xem trước đề thi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Import Modal */}
      <AnimatePresence>
        {showQuickImport && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] p-8 md:p-10 shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      Nhập nhanh câu hỏi từ văn bản
                    </h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                      Dán văn bản có sẵn từ Word hoặc ghi chú để trích xuất tự động
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQuickImport(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Word upload recommendation banner */}
              {onOpenWordImporter && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileUp size={24} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-black text-xs text-emerald-900">Bạn đã có sẵn file Word (.docx)?</p>
                      <p className="text-[11px] font-semibold text-emerald-700">Tải cả file lên để hệ thống tự nhận diện tiêu đề, môn học và toàn bộ đề thi.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickImport(false);
                      onOpenWordImporter();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all shadow-md shadow-emerald-500/20"
                  >
                    Tải file Word ngay
                  </button>
                </div>
              )}

              {/* Sample format explanation */}
              <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2 text-slate-600">
                <p className="font-bold text-slate-800">Định dạng mẫu được hỗ trợ:</p>
                <pre className="font-mono text-[11px] bg-white p-3 rounded-xl border border-slate-200 text-slate-700 leading-relaxed overflow-x-auto">
{`Câu 1: Thủ đô của Việt Nam là gì?
A. Hà Nội*
B. Đà Nẵng
C. TP Hồ Chí Minh
D. Cần Thơ

Câu 2: Phép tính 5 + 7 có kết quả là:
A. 11
B. 12*
C. 13
D. 14`}
                </pre>
                <p className="text-[10px] text-slate-400">
                  Mẹo: Đặt dấu hoa thị <code className="text-emerald-600 font-bold">*</code> sau đáp án đúng (ví dụ: <code className="text-emerald-600 font-bold">B. 12*</code>) hoặc ghi dòng <code className="text-emerald-600 font-bold">Đáp án: B</code>.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Dán nội dung vào đây:
                </label>
                <textarea
                  rows={8}
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    setImportError('');
                  }}
                  placeholder="Dán các câu hỏi trắc nghiệm vào đây..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 outline-none font-mono text-xs leading-relaxed"
                />
                {importError && (
                  <p className="text-xs text-rose-500 font-bold mt-2 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {importError}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickImport(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-600 font-black rounded-xl text-xs uppercase tracking-wider hover:bg-slate-200"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleParseImport}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 flex items-center gap-2"
                >
                  <Check size={16} /> Phân tích & Thêm vào đề
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
