/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, useEffect, Dispatch, SetStateAction } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { TeacherExamBuilder } from './components/TeacherExamBuilder';
import { WordExamImporter } from './components/WordExamImporter';
import { Fireworks } from './components/Fireworks';
import { 
  BarChart3, 
  Calendar, 
  ChevronRight, 
  ChevronDown,
  GraduationCap, 
  LayoutDashboard, 
  LogOut, 
  MessageSquare, 
  Search, 
  Settings, 
  Users,
  Bell,
  Plus,
  FilePlus,
  FileText,
  ClipboardCheck,
  BookOpen,
  Rocket,
  Trash2,
  FileUp,
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  Filter,
  ArrowLeft,
  X,
  PlusCircle,
  Clock,
  Edit3,
  CheckSquare,
  HelpCircle,
  ShieldCheck,
  Image as ImageIcon,
  Zap,
  Loader2,
  BarChart,
  Target,
  Send,
  Save,
  Trophy,
  Medal,
  Star,
  Stars,
  Hash,
  Check,
  ArrowRight,
  Key,
  Eye,
  Info,
  Shield,
  User
} from 'lucide-react';

type LoginRole = 'student' | 'teacher';

// Types for management
interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

const BADGES: Badge[] = [
  { id: 'first_step', name: 'Khởi Đầu Nan', icon: '🌱', description: 'Hoàn thành bài tập đầu tiên', color: 'bg-emerald-50 text-emerald-600' },
  { id: 'perfect_score', name: 'Điểm Tuyệt Đối', icon: '💎', description: 'Đạt điểm 10 trong một bài kiểm tra', color: 'bg-amber-50 text-amber-600' },
  { id: 'fast_learner', name: 'Học Nhanh', icon: '⚡', description: 'Hoàn thành bài thi trong dưới 5 phút', color: 'bg-blue-50 text-blue-600' },
  { id: 'consistency', name: 'Chuyên Cần', icon: '📅', description: 'Hoàn thành 5 bài tập', color: 'bg-blue-50 text-blue-600' },
  { id: 'math_wizard', name: 'Phù Thủy Toán Học', icon: '🧙‍♂️', description: 'Đạt điểm 10 môn Toán', color: 'bg-blue-50 text-blue-600' },
];

interface Student {
  id: string;
  name: string;
  username: string;
  password: string;
  points: number;
  badges: string[]; // IDs of earned badges
  avatar?: string; // Base64 image
}

interface Teacher {
  id: string;
  fullName: string;
  workUnit: string;
  teachingClasses: string;
  username: string;
  password: string;
  email: string;
}

interface SchoolClass {
  id: string;
  name: string;
  students: Student[];
  teacherId?: string;
}

interface Question {
  id: string;
  type: string;
  content: string;
  options?: string[];
  correctAnswer: any;
  difficulty: 'recognition' | 'understanding' | 'application';
}

interface Exam {
  id: string;
  title: string;
  className: string;
  duration: number;
  category: string;
  questions: Question[];
  createdAt: number;
  teacherId?: string;
}

interface Assignment {
  id: string;
  examId: string;
  classId: string;
  targetType: 'class' | 'specific_students';
  studentIds?: string[];
  dueDate: string;
  attempts: number;
  assignedAt: number;
  teacherId?: string;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  answers: any[];
  score: number;
  submittedAt: number;
  startedAt: number;
}

const AppFooter = ({ onAuthor, onTerms, className }: { onAuthor: () => void, onTerms: () => void, className?: string }) => (
  <footer className={`w-full py-8 text-center mt-auto ${className || ''}`}>
    <div className="flex items-center justify-center gap-8 mb-4">
      <button 
        onClick={onAuthor}
        className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-2 bg-transparent border-none cursor-pointer"
      >
        <User size={12} /> Thông tin tác giả
      </button>
      <button 
        onClick={onTerms}
        className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-2 bg-transparent border-none cursor-pointer"
      >
        <Shield size={12} /> About & Điều khoản
      </button>
    </div>
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">
      &copy; 2026 EduVision - Build with Love ❤️
    </p>
  </footer>
);

// Dashboard Component for Teachers
function TeacherDashboard({ 
  onLogout, 
  classes, 
  setClasses,
  exams,
  setExams,
  assignments,
  setAssignments,
  submissions,
  setSubmissions,
  loggedInTeacher,
  teachers,
  setTeachers,
  onAuthor,
  onTerms
}: { 
  onLogout: () => void, 
  classes: SchoolClass[], 
  setClasses: Dispatch<SetStateAction<SchoolClass[]>>,
  exams: Exam[],
  setExams: Dispatch<SetStateAction<Exam[]>>,
  assignments: Assignment[],
  setAssignments: Dispatch<SetStateAction<Assignment[]>>,
  submissions: Submission[],
  setSubmissions: Dispatch<SetStateAction<Submission[]>>,
  loggedInTeacher: Teacher | null,
  teachers: Teacher[],
  setTeachers: Dispatch<SetStateAction<Teacher[]>>,
  onAuthor: () => void,
  onTerms: () => void
}) {
  // Filter data based on teacher role and ownership
  const isAdmin = loggedInTeacher?.username === 'admin';
  const myClasses = isAdmin 
    ? classes 
    : classes.filter(c => c.teacherId === loggedInTeacher?.id);
  const myExams = isAdmin 
    ? exams 
    : exams.filter(e => e.teacherId === loggedInTeacher?.id);
  const myAssignments = isAdmin 
    ? assignments 
    : assignments.filter(a => a.teacherId === loggedInTeacher?.id);
  const mySubmissions = isAdmin 
    ? submissions 
    : submissions.filter(s => {
        const assignment = assignments.find(a => a.id === s.assignmentId);
        return assignment && (isAdmin || assignment.teacherId === loggedInTeacher?.id);
      });

  const [activeMenu, setActiveMenu] = useState('overview');
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  
  // Navigation for class details
  const [viewingClassId, setViewingClassId] = useState<string | null>(null);
  
  // Student form state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [addMode, setAddMode] = useState<'single' | 'batch'>('single');
  const [newStudent, setNewStudent] = useState({ name: '', username: '', password: '', avatar: '' });
  const [batchInput, setBatchInput] = useState('');
  
  // Custom confirmation state
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'class' | 'student' | 'exam', id: string, secondaryId?: string } | null>(null);

  // Exam viewing state
  const [viewingExamId, setViewingExamId] = useState<string | null>(null);
  const viewingExam = myExams.find(e => e.id === viewingExamId);

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = [
    { id: '1', title: 'Học sinh mới!', message: 'Em Nguyễn Văn A vừa gia nhập lớp 2B3.', time: '5 phút trước', icon: '🌟', color: 'bg-amber-100 text-amber-600' },
    { id: '2', title: 'Bài tập hoàn thành', message: '15 học sinh đã nộp bài kiểm tra Toán.', time: '2 giờ trước', icon: '📝', color: 'bg-blue-100 text-blue-600' },
    { id: '3', title: 'Cập nhật hệ thống', message: 'EduVision vừa cập nhật tính năng mới.', time: '1 ngày trước', icon: '🚀', color: 'bg-emerald-100 text-emerald-600' }
  ];

  // Category filtering state
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  
  // Assignment state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningExamId, setAssigningExamId] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({
    classId: '',
    targetType: 'class' as 'class' | 'specific_students',
    studentIds: [] as string[],
    dueDate: '',
    attempts: 1
  });

  // Results viewing state
  const [viewingAssignmentResultsId, setViewingAssignmentResultsId] = useState<string | null>(null);
  
  // Detail submission viewing
  const [viewingSpecificSubmissionId, setViewingSpecificSubmissionId] = useState<string | null>(null);

  // Password reset state for admin
  const [editingTeacherPasswordId, setEditingTeacherPasswordId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // Manual Exam Authoring & Editing State
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [previewExam, setPreviewExam] = useState<Exam | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  const categories = ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Tự nhiên & Xã hội', 'Đạo đức', 'Âm nhạc', 'Mỹ thuật', 'Tin học', 'Vật lý', 'Sinh học', 'Lịch sử & Địa lý', 'Khoa học'];

  const handleDeleteExam = (id: string) => {
    setExams(exams.filter(e => e.id !== id));
    setConfirmDelete(null);
  };

  const handleAssignExam = () => {
    if (!assigningExamId) {
      alert('Lỗi: Không xác định được đề thi đang giao. Vui lòng thử lại.');
      return;
    }
    if (!assignForm.classId) {
      alert('Vui lòng chọn lớp học để giao bài!');
      return;
    }
    if (!assignForm.dueDate) {
      alert('Vui lòng chọn hạn nộp bài!');
      return;
    }
    if (assignForm.targetType === 'specific_students' && assignForm.studentIds.length === 0) {
      alert('Vui lòng chọn ít nhất một học sinh để giao bài!');
      return;
    }

    const newAssignment: Assignment = {
      id: Date.now().toString(),
      examId: assigningExamId,
      classId: assignForm.classId,
      targetType: assignForm.targetType,
      studentIds: assignForm.targetType === 'specific_students' ? assignForm.studentIds : undefined,
      dueDate: assignForm.dueDate,
      attempts: assignForm.attempts || 1,
      assignedAt: Date.now(),
      teacherId: loggedInTeacher?.id
    };

    setAssignments(prev => [...(prev || []), newAssignment]);
    setShowAssignModal(false);
    setAssigningExamId(null);
    setAssignForm({ classId: '', targetType: 'class', studentIds: [], dueDate: '', attempts: 1 });
    alert('Giao bài thành công!');
  };

  const handleSaveExam = () => {
    if (previewExam) {
      if (exams.some(e => e.id === previewExam.id)) {
        setExams(exams.map(e => e.id === previewExam.id ? previewExam : e));
      } else {
        const newExam: Exam = {
          ...previewExam,
          teacherId: loggedInTeacher?.id
        };
        setExams([newExam, ...exams]);
      }
      setSaveStatus('success');
      alert('Đã lưu bài tập thành công!');
      
      // Auto close preview and navigate after a short delay
      setTimeout(() => {
        setSaveStatus('idle');
        setActiveMenu('tests');
        setPreviewExam(null);
        setShowPreview(false);
      }, 500);
    }
  };

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    const newClass: SchoolClass = {
      id: Date.now().toString(),
      name: newClassName,
      students: [],
      teacherId: loggedInTeacher?.id
    };
    setClasses([...classes, newClass]);
    setNewClassName('');
    setShowAddClass(false);
  };

  const handleAddStudentsBatch = () => {
    if (!viewingClassId) return;

    const lines = batchInput.split('\n');
    const newStudents: Student[] = [];
    for (const line of lines) {
      const [name, username, password] = line.split(',').map(s => s.trim());
      if (name && username && password) {
        newStudents.push({
          id: Date.now().toString() + Math.random(),
          name,
          username,
          password,
          points: 0,
          badges: []
        });
      }
    }

    if (newStudents.length === 0) {
      alert("Vui lòng kiểm tra định dạng dữ liệu (Tên, Tên đăng nhập, Mật khẩu trên mỗi dòng)");
      return;
    }

    setClasses(classes.map(c => {
      if (c.id === viewingClassId) {
        return {
          ...c,
          students: [...c.students, ...newStudents]
        };
      }
      return c;
    }));
    setBatchInput('');
    setShowAddStudent(false);
    setAddMode('single');
  };

  const handleAddStudent = () => {
    if (addMode === 'batch') {
      handleAddStudentsBatch();
      return;
    }
    if (!viewingClassId || !newStudent.name || !newStudent.username || !newStudent.password) return;
    
    setClasses(classes.map(c => {
      if (c.id === viewingClassId) {
        return {
          ...c,
          students: [...c.students, { 
            ...newStudent, 
            id: Date.now().toString(), 
            points: 0, 
            badges: [],
            avatar: newStudent.avatar || undefined 
          }]
        };
      }
      return c;
    }));
    setNewStudent({ name: '', username: '', password: '', avatar: '' });
    setShowAddStudent(false);
  };

  const handleDeleteClass = (classId: string) => {
    setClasses(classes.filter(c => c.id !== classId));
    setConfirmDelete(null);
    if (viewingClassId === classId) setViewingClassId(null);
  };

  const handleDeleteStudent = (classId: string, studentId: string) => {
    setClasses(classes.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          students: c.students.filter(s => s.id !== studentId)
        };
      }
      return c;
    }));
    setConfirmDelete(null);
  };

  const handleDeleteSubmission = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa kết quả này không? Thao tác này không thể hoàn tác.')) {
      setSubmissions(submissions.filter(s => s.id !== id));
    }
  };

  const selectedClass = myClasses.find(c => c.id === viewingClassId);

  const stats = [
    { label: 'Tổng Học Sinh', value: myClasses.reduce((acc, c) => acc + c.students.length, 0).toString(), icon: <Users className="w-6 h-6" />, color: 'bg-blue-100 text-blue-600', trend: '+12% tháng này', emoji: '🎒' },
    { label: 'Lớp Đang Dạy', value: myClasses.length.toString(), icon: <GraduationCap className="w-6 h-6" />, color: 'bg-blue-100 text-blue-600', trend: 'Tất cả lớp', emoji: '🏫' },
    { label: 'Thông Báo Mới', value: '24', icon: <Bell className="w-6 h-6" />, color: 'bg-blue-100 text-blue-600', trend: 'Thông báo', emoji: '🔔' },
    { label: 'Lịch Hẹn', value: '08', icon: <Calendar className="w-6 h-6" />, color: 'bg-blue-100 text-blue-600', trend: 'Sắp tới', emoji: '📅' },
  ];

  return (
    <div 
      className="min-h-screen flex font-sans bg-cover bg-center bg-no-repeat bg-fixed relative"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      {/* Sidebar - Modern & Sleek with frosted glass */}
      <aside className="w-72 bg-white/92 backdrop-blur-xl border-r border-white/60 flex flex-col p-6 fixed h-full z-20 shadow-md">
        <div className="flex items-center gap-3.5 mb-8 px-1">
          <div className="w-11 h-11 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <GraduationCap size={22} />
          </div>
          <div>
            <span className="block text-slate-900 font-extrabold text-base tracking-tight leading-none uppercase">Digital Edu</span>
            <span className="block text-slate-400 font-semibold text-[11px] tracking-normal mt-1">Cổng Dạy & Học Số</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
          {[
            { id: 'overview', label: 'Tổng quan', icon: <LayoutDashboard size={18} /> },
            { id: 'import_word', label: 'Tải đề từ Word', icon: <FileUp size={18} />, badge: 'Mới', isEmerald: true },
            { id: 'create_test', label: 'Soạn bài tập', icon: <Edit3 size={18} /> },
            { id: 'tests', label: 'Kho bài thi', icon: <BookOpen size={18} /> },
            { id: 'students', label: 'Học sinh', icon: <Users size={18} /> },
            { id: 'classes', label: 'Lớp học', icon: <GraduationCap size={18} /> },
            { id: 'results', label: 'Bảng điểm', icon: <BarChart3 size={18} /> },
            { id: 'notifications', label: 'Thông báo', icon: <Bell size={18} />, count: 24 },
          ].map((item) => {
            const isActive = (activeMenu === item.id) || (item.id === 'notifications' && showNotifications);
            return (
              <button 
                key={item.id}
                onClick={() => {
                  if (item.id === 'notifications') {
                    setShowNotifications(!showNotifications);
                  } else {
                    setActiveMenu(item.id as any);
                    setShowNotifications(false);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-150 ${
                  isActive
                    ? item.isEmerald
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : item.isEmerald ? 'text-emerald-600' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span className="tracking-tight">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.count && (
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="pt-4 mt-auto border-t border-slate-200/80 space-y-2">
          <button 
            onClick={() => setActiveMenu('account')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors ${
              activeMenu === 'account' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
              {loggedInTeacher.fullName.charAt(0)}
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{loggedInTeacher.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">
                {loggedInTeacher.username === 'admin' ? 'Quản trị viên' : 'Giáo viên'}
              </p>
            </div>
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs transition-colors"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-8 lg:p-10 flex flex-col min-h-screen relative bg-slate-900/5 backdrop-blur-[2px]">
        <AnimatePresence>
          {saveStatus === 'success' && (
            <motion.div 
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 20, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-3 font-bold text-xs uppercase tracking-wider border border-emerald-500"
            >
              <CheckCircle2 size={18} />
              Đã lưu bài tập thành công!
            </motion.div>
          )}
        </AnimatePresence>

        <header className="flex justify-between items-center mb-8 sticky top-0 z-[100] bg-white/85 backdrop-blur-xl -mx-8 lg:-mx-10 px-8 lg:px-10 py-4 border-b border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold uppercase tracking-wider">Hệ thống giáo dục</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 text-xs font-medium">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeMenu === 'overview' ? 'Tổng quan giảng dạy' : 
               activeMenu === 'students' ? 'Quản lý học sinh' : 
               activeMenu === 'create_test' ? 'Soạn bài tập' :
               activeMenu === 'import_word' ? 'Tải bài tập từ file Word (.docx)' :
               activeMenu === 'tests' ? 'Kho bài tập' :
               activeMenu === 'results' ? 'Bảng điểm & Thống kê' :
               activeMenu === 'classes' ? 'Danh sách lớp học' :
               activeMenu === 'account' ? 'Cài đặt tài khoản' : 'Khu vực học tập'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Quick Action: Import Word */}
            <button
              onClick={() => setActiveMenu('import_word')}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              <FileUp size={15} />
              <span>Tải bài tập Word</span>
            </button>

            {/* Quick Action: Create Exam */}
            <button
              onClick={() => {
                setEditingExam(null);
                setActiveMenu('create_test');
              }}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              <Plus size={15} />
              <span>Tạo bài tập mới</span>
            </button>

            <div className="relative group hidden md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Tìm bài tập, lớp..." 
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl w-52 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-xs text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer relative hover:bg-slate-50 transition-colors"
            >
              <Bell size={18} className={showNotifications ? 'text-indigo-600' : ''} />
              <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></div>
              
              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-[calc(100%+0.75rem)] right-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-5 z-[200] cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                     <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Thông báo mới</h3>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Cập nhật hôm nay</p>
                        </div>
                        <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold">{notifications.length} mới</div>
                     </div>
                     <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                        {notifications.map((n) => (
                          <div key={n.id} className="flex gap-3 p-3 bg-slate-50/70 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer group/item">
                             <div className={`w-10 h-10 shrink-0 rounded-xl ${n.color} flex items-center justify-center text-lg`}>
                                {n.icon}
                             </div>
                             <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 text-xs truncate mb-0.5">{n.title}</h4>
                                <p className="text-[11px] text-slate-600 font-normal line-clamp-2 leading-relaxed">{n.message}</p>
                                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                                  <Clock size={10} /> {n.time}
                                </span>
                             </div>
                          </div>
                        ))}
                     </div>
                     <div className="mt-4 pt-3 border-t border-slate-100">
                        <button className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-indigo-600 transition-colors">Đóng thông báo</button>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {activeMenu === 'account' && loggedInTeacher && (
          <div className="max-w-6xl w-full">
            <div className="mb-8">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                {isAdmin ? 'Hệ thống & Cài đặt ⚙️' : 'Cơ sở & Thông tin cá nhân 👤'}
              </h1>
              <p className="text-slate-500 font-bold mt-2">
                {isAdmin ? 'Quản trị viên: Kiểm soát toàn bộ tài nguyên và hoạt động của hệ thống.' : 'Quản lý thông tin tài khoản và kết quả giảng dạy của bạn.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-12">
              {isAdmin ? (
                <div className="bg-white/60 backdrop-blur-xl rounded-[40px] p-10 shadow-xl shadow-slate-200/5 border border-white/20">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900">Danh sách Giáo viên đăng ký</h2>
                      <p className="text-slate-500 font-medium">Quản lý và phê duyệt thông tin các giáo viên trong hệ thống.</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="px-6 py-3 bg-white/40 backdrop-blur-sm text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest border border-white/10">
                          Tổng số: {teachers.length} thành viên
                       </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-50 text-left">
                          <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Thông tin giáo viên</th>
                          <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn vị / Lớp dạy</th>
                          <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tài khoản / Email</th>
                          <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {teachers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-20 text-center text-slate-400 font-bold">Chưa có giáo viên nào đăng ký ngoài tài khoản admin.</td>
                          </tr>
                        ) : (
                          teachers.map(teacher => (
                            <tr key={teacher.id} className="group hover:bg-white/40 backdrop-blur-sm transition-colors">
                              <td className="py-6 pl-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl">
                                    {teacher.fullName.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-black text-slate-900 text-lg">{teacher.fullName}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Ngày tham gia: {new Date(parseInt(teacher.id)).toLocaleDateString('vi-VN')}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-6">
                                <p className="font-bold text-slate-800">{teacher.workUnit}</p>
                                <p className="text-xs text-indigo-600 font-bold">Lớp: {teacher.teachingClasses}</p>
                              </td>
                              <td className="py-6">
                                <p className="font-mono text-sm text-slate-600">{teacher.username}</p>
                                <p className="text-xs text-slate-400 font-medium">{teacher.email}</p>
                              </td>
                              <td className="py-6">
                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                  <button 
                                    onClick={() => {
                                      setEditingTeacherPasswordId(teacher.id);
                                      setNewPasswordValue('');
                                    }}
                                    className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                    title="Đổi mật khẩu"
                                  >
                                    <Key size={18} />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if(confirm(`Bạn có chắc chắn muốn xóa tài khoản của ${teacher.fullName}?`)) {
                                        setTeachers(teachers.filter(t => t.id !== teacher.id));
                                      }
                                    }}
                                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                    title="Xóa tài khoản"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
              <div className="bg-white/60 backdrop-blur-xl rounded-[48px] border border-white/20 shadow-xl overflow-hidden">
                <div className="h-48 bg-blue-600 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                  <div className="absolute -bottom-16 left-12">
                     <div className="w-32 h-32 rounded-[40px] bg-white/80 backdrop-blur-md p-2 shadow-2xl">
                        <div className="w-full h-full rounded-[32px] bg-indigo-500 overflow-hidden flex items-center justify-center text-white text-4xl font-black">
                           {loggedInTeacher.fullName.charAt(0)}
                        </div>
                     </div>
                  </div>
                </div>

                <div className="pt-24 px-12 pb-12">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <h2 className="text-4xl font-black text-slate-900 mb-1">{loggedInTeacher.fullName}</h2>
                      <p className="text-indigo-600 font-bold uppercase tracking-widest text-xs">Giáo viên xác thực • ID: {loggedInTeacher.username}</p>
                    </div>
                    <div className="px-5 py-2 bg-white/40 backdrop-blur-sm text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest border border-white/20">
                      Trạng thái: Hoạt động
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-white/40 backdrop-blur-sm rounded-[32px] border border-white/10 space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn vị công tác</p>
                      <p className="text-xl font-black text-slate-900">{loggedInTeacher.workUnit}</p>
                    </div>
                    <div className="p-8 bg-white/40 backdrop-blur-sm rounded-[32px] border border-white/10 space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email liên hệ: gvlequihoi@gmail.com</p>
                      <p className="text-xl font-black text-slate-900">{loggedInTeacher.email}</p>
                    </div>
                    <div className="p-8 bg-white/40 backdrop-blur-sm rounded-[32px] border border-white/10 space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lớp đang giảng dạy</p>
                      <p className="text-xl font-black text-slate-900">{loggedInTeacher.teachingClasses}</p>
                    </div>
                    <div className="p-8 bg-blue-50/40 backdrop-blur-md rounded-[32px] border border-blue-100 space-y-2">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Vai trò hệ thống</p>
                      <p className="text-xl font-black text-blue-700">Giáo viên chuyên môn</p>
                    </div>
                  </div>

                  <div className="mt-12 p-8 border-2 border-dashed border-white/20 bg-white/10 backdrop-blur-sm rounded-[32px] flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-slate-400 border border-white/10">
                           <ShieldCheck size={32} />
                        </div>
                        <div>
                           <h4 className="font-black text-slate-900">Bảo mật tài khoản</h4>
                           <p className="text-sm text-slate-500 font-medium">Bạn có thể thay đổi mật khẩu hoặc cập nhật thông tin trong cài đặt.</p>
                        </div>
                     </div>
                     <button className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-indigo-600 transition-all uppercase tracking-widest text-xs">
                        Đến cài đặt
                     </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {activeMenu === 'overview' && (
          <div className="space-y-8">
            {/* Modern Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {stats.map((stat: any, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  onClick={() => {
                    if (stat.label === 'Thông Báo Mới') {
                      setShowNotifications(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-105 ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {stat.trend}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">{stat.value}</h3>
                    <p className="text-slate-500 font-medium text-xs">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <Calendar size={18} className="text-indigo-600" />
                      Lịch giảng dạy & Tiết học
                    </h3>
                    <p className="text-xs text-slate-400 font-normal mt-0.5">Thời khóa biểu các lớp được phân công</p>
                  </div>
                  <button 
                    onClick={() => setActiveMenu('classes')}
                    className="text-indigo-600 font-bold text-xs hover:text-indigo-700 transition-colors"
                  >
                    Xem tất cả
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {(myClasses.length > 0 ? myClasses.slice(0, 3).map((c, idx) => ({
                    id: c.id,
                    title: `Tiết học: ${c.name}`,
                    time: idx === 0 ? '08:00 AM - 09:30 AM' : idx === 1 ? '10:00 AM - 11:30 AM' : '01:30 PM - 03:00 PM',
                    room: `Phòng học ${idx + 1}`,
                    type: idx === 0 ? 'bg-rose-50 text-rose-600' : idx === 1 ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600',
                    icon: idx === 0 ? '📖' : idx === 1 ? '📐' : '🎨'
                  })) : [
                    { id: '1', title: 'Tiếng Việt - Lớp 1A1', time: '08:00 AM - 09:30 AM', room: 'Phòng 01', type: 'bg-rose-50 text-rose-600', icon: '📖' },
                    { id: '2', title: 'Toán Học - Lớp 2B3', time: '10:00 AM - 11:30 AM', room: 'Phòng 04', type: 'bg-indigo-50 text-indigo-600', icon: '📐' },
                    { id: '3', title: 'Mỹ Thuật - Lớp 1A2', time: '01:30 PM - 03:00 PM', room: 'Phòng 02', type: 'bg-amber-50 text-amber-600', icon: '🎨' }
                  ]).map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        if (myClasses.some(c => c.id === item.id)) {
                          setActiveMenu('classes');
                          setViewingClassId(item.id);
                        } else if (myClasses.length > 0) {
                          setActiveMenu('classes');
                          setViewingClassId(myClasses[0].id);
                        }
                      }}
                      className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/70 transition-all cursor-pointer group"
                    >
                      <div className={`w-11 h-11 ${item.type} rounded-xl flex items-center justify-center text-xl shadow-2xs`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{item.time} • {item.room}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Action Banner */}
              <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 p-6 rounded-2xl text-white shadow-md shadow-indigo-600/15 relative overflow-hidden flex flex-col justify-between">
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center text-2xl mb-4 backdrop-blur-sm">
                       ✍️
                    </div>
                    <h3 className="text-xl font-black leading-snug mb-2 tracking-tight">Soạn & Tải bài tập</h3>
                    <p className="text-indigo-100 text-xs font-normal mb-6 leading-relaxed">
                      Thiết kế bộ câu hỏi thủ công hoặc tải trực tiếp file Word (.docx) để hệ thống tự động bóc tách bài tập nhanh chóng.
                    </p>
                 </div>
                 <div className="relative z-10 flex flex-col gap-2.5 mt-auto">
                    <button 
                      onClick={() => {
                        setActiveMenu('import_word');
                      }}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                       <FileUp size={15} /> Tải đề từ Word (.docx)
                    </button>
                    <button 
                      onClick={() => {
                        setEditingExam(null);
                        setActiveMenu('create_test');
                      }}
                      className="w-full py-3 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                       <Edit3 size={15} /> Tự soạn đề mới
                    </button>
                 </div>
              </section>
            </div>
          </div>
        )}

        {activeMenu === 'students' && (
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
               <motion.div
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
               >
                 <h2 className="text-5xl font-black text-slate-900 leading-tight">Quản lý <br /><span className="text-rose-500 font-serif italic">Học sinh 🏫</span></h2>
                 <p className="text-slate-400 font-extrabold text-xs uppercase tracking-[0.3em] mt-3">Theo dõi tiến trình từng bạn nhỏ</p>
               </motion.div>
               
               {!viewingClassId && (
                 <button 
                   onClick={() => setShowAddClass(true)}
                   className="px-10 py-5 bg-slate-900 text-white font-black rounded-[2rem] hover:bg-rose-500 transition-all shadow-2xl active:scale-95 flex items-center gap-3 uppercase tracking-widest text-xs"
                 >
                   <Plus size={20} /> Thêm lớp học mới
                 </button>
               )}
            </div>

            {!viewingClassId ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {myClasses.map((schoolClass, idx) => {
                  const themes = [
                    { bg: 'bg-rose-50', text: 'text-rose-500', border: 'border-rose-100', icon: '🎒' },
                    { bg: 'bg-blue-50', text: 'text-blue-500', border: 'border-blue-100', icon: '🎨' },
                    { bg: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-100', icon: '🧩' }
                  ];
                  const theme = themes[idx % themes.length];

                  return (
                    <motion.div 
                      key={schoolClass.id} 
                      onClick={() => setViewingClassId(schoolClass.id)}
                      whileHover={{ y: -10 }}
                      className="bg-white/60 backdrop-blur-xl p-10 rounded-[3rem] border-2 border-white/20 shadow-sm hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden flex flex-col items-center text-center"
                    >
                      <div className={`w-24 h-24 ${theme.bg} ${theme.text} rounded-[2rem] flex items-center justify-center text-5xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm`}>
                        {theme.icon}
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 mb-3 group-hover:text-rose-500 transition-colors uppercase tracking-tight">{schoolClass.name}</h3>
                      <div className="px-6 py-2 bg-white/40 backdrop-blur-sm rounded-full">
                         <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">{schoolClass.students.length} Thành viên</p>
                      </div>
                      
                      <div className="mt-8 pt-8 border-t-2 border-dashed border-slate-50 w-full flex justify-center items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                         Xem chi tiết <ChevronRight size={18} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/60 backdrop-blur-2xl rounded-[4rem] border-2 border-white/20 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="p-12 border-b-2 border-white/20 bg-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-8">
                    <button onClick={() => setViewingClassId(null)} className="p-5 bg-white/80 backdrop-blur-md text-slate-900 rounded-[1.5rem] shadow-xl hover:bg-indigo-600 hover:text-white transition-all transform hover:-translate-x-2">
                       <ArrowLeft size={24} />
                    </button>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-4xl font-black text-slate-900">{selectedClass?.name}</h2>
                        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">Đang hoạt động</span>
                      </div>
                      <p className="text-slate-400 font-extrabold text-xs uppercase tracking-[0.2em] mt-2">Dưới đây là những ngôi sao nhí của lớp</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddStudent(true)} className="px-10 py-5 bg-indigo-600 text-white font-black rounded-[2rem] hover:bg-slate-900 transition-all shadow-2xl flex items-center gap-4 uppercase tracking-widest text-xs group">
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Thêm ngôi sao mới
                  </button>
                </div>
                
                <div className="p-12 flex-1">
                   {selectedClass?.students.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-20 opacity-50">
                         <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Users size={40} className="text-slate-200" />
                         </div>
                         <p className="font-black text-slate-300 uppercase tracking-widest text-xs">Chưa có học sinh nào trong lớp này</p>
                      </div>
                   ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {selectedClass?.students.map((student, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={student.id} 
                            className="p-8 bg-white/60 backdrop-blur-xl border-2 border-white/30 rounded-[2.5rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] border-t-white/40 border-l-white/20 flex items-center gap-6 group hover:border-indigo-100 hover:shadow-2xl hover:-translate-y-2 transition-all"
                          >
                             <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-50 overflow-hidden shadow-inner flex-shrink-0 border-4 border-white ring-8 ring-slate-50/50 group-hover:ring-indigo-50/50 transition-all">
                                <img src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.username}`} alt="Avatar" className="w-full h-full object-cover" />
                             </div>
                             <div className="flex-1 min-w-0">
                               <h4 className="font-black text-slate-900 text-xl truncate mb-1">{student.name}</h4>
                               <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                     <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ID:</span>
                                     <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{student.username}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">PASS:</span>
                                     <span className="text-xs font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{student.password}</span>
                                  </div>
                               </div>
                             </div>
                             <button onClick={(e) => {
                               e.stopPropagation();
                               setConfirmDelete({ type: 'student', id: selectedClass.id, secondaryId: student.id });
                             }} className="p-4 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                               <Trash2 size={24} />
                             </button>
                          </motion.div>
                        ))}
                     </div>
                   )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeMenu === 'classes' && (
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
               <motion.div
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
               >
                 <h2 className="text-5xl font-black text-slate-900 leading-tight">Vườn <br /><span className="text-emerald-500 font-serif italic">Lớp học 🌱</span></h2>
                 <p className="text-slate-400 font-extrabold text-xs uppercase tracking-[0.3em] mt-3">Nơi ươm mầm những tài năng nhí</p>
               </motion.div>
               
               {!viewingClassId && (
                 <button 
                   onClick={() => setShowAddClass(true)}
                   className="px-10 py-5 bg-slate-900 text-white font-black rounded-[2rem] hover:bg-emerald-500 transition-all shadow-2xl active:scale-95 flex items-center gap-4 uppercase tracking-widest text-xs group"
                 >
                   <Plus size={24} className="group-hover:rotate-90 transition-transform" /> Tạo vườn mới
                 </button>
               )}
            </div>
            
            {!viewingClassId ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {myClasses.map((schoolClass, idx) => {
                  const icons = ['📖', '📐', '🧪', '🎨', '🎼', '🧩'];
                  return (
                    <motion.div 
                      key={schoolClass.id} 
                      onClick={() => setViewingClassId(schoolClass.id)}
                      whileHover={{ y: -10 }}
                      className="p-10 bg-white/60 backdrop-blur-xl rounded-[4rem] border-2 border-white/30 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] hover:shadow-[0_48px_100px_-16px_rgba(0,0,0,0.2)] border-t-white/50 border-l-white/40 transition-all cursor-pointer group relative overflow-hidden flex flex-col items-center text-center hover:-translate-y-4"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16"></div>
                      
                      <div className="flex flex-col items-center gap-8 relative z-10 w-full">
                         <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all text-5xl shadow-sm">
                           {icons[idx % icons.length]}
                         </div>
                         
                         <div>
                            <h3 className="text-3xl font-black text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{schoolClass.name}</h3>
                            <div className="flex items-center justify-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                               <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">{schoolClass.students.length} Học sinh</p>
                            </div>
                         </div>
 
                         <div className="w-full flex gap-4 mt-4">
                            <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setViewingClassId(schoolClass.id);
                               }}
                               className="flex-1 py-4 bg-white/40 backdrop-blur-sm text-slate-600 font-extrabold rounded-2xl hover:bg-emerald-600 hover:text-white transition-all text-[10px] uppercase tracking-widest"
                            >
                               Quản lý bài
                            </button>
                            <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setConfirmDelete({ type: 'class', id: schoolClass.id });
                               }}
                               className="w-14 h-14 bg-rose-50 text-rose-300 hover:text-rose-500 hover:bg-rose-100 rounded-2xl flex items-center justify-center transition-all border border-transparent hover:border-rose-100"
                            >
                               <Trash2 size={20} />
                            </button>
                         </div>
                      </div>
                    </motion.div>
                  );
                })}
 
                {myClasses.length === 0 && (
                   <div className="col-span-full py-40 text-center bg-white/40 backdrop-blur-md rounded-[4rem] border-4 border-dashed border-white/20 flex flex-col items-center">
                      <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mb-10 text-6xl">✨</div>
                      <h3 className="text-3xl font-black text-slate-900 mb-4 italic font-serif">Khu vườn của bạn đang đợi...</h3>
                      <p className="text-slate-500 font-extrabold max-w-sm mx-auto mb-10 uppercase tracking-widest text-[10px] leading-loose">Hãy bắt đầu tạo những lớp học đầu tiên ngay hôm nay nhé!</p>
                      <button 
                        onClick={() => setShowAddClass(true)}
                        className="px-10 py-5 bg-emerald-600 text-white font-black rounded-[2rem] hover:bg-slate-900 transition-all shadow-2xl flex items-center gap-4 uppercase tracking-widest text-xs"
                      >
                        <Plus size={24} /> Trồng cây mới
                      </button>
                   </div>
                )}
              </div>
            ) : (
              <div className="bg-white/60 backdrop-blur-2xl rounded-[4rem] border-2 border-white/20 shadow-2xl overflow-hidden">
                 <div className="p-12 border-b-2 border-white/10 bg-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-8">
                       <button onClick={() => setViewingClassId(null)} className="p-5 bg-white/80 backdrop-blur-md text-slate-900 rounded-[1.5rem] shadow-xl hover:bg-indigo-600 hover:text-white transition-all transform hover:-translate-x-2">
                          <ArrowLeft size={24} />
                       </button>
                       <div>
                          <h2 className="text-4xl font-black text-slate-900">{selectedClass?.name}</h2>
                          <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest mt-2">{selectedClass?.students.length} Học sinh trong vườn</p>
                       </div>
                    </div>
                    <button onClick={() => setShowAddStudent(true)} className="px-10 py-5 bg-emerald-600 text-white font-black rounded-[2rem] hover:bg-slate-900 transition-all shadow-2xl flex items-center gap-4 uppercase tracking-widest text-xs">
                       <Plus size={24} /> Thêm thành viên mới
                    </button>
                 </div>
                 
                 <div className="p-12 min-h-[500px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                      {selectedClass?.students.map((student, idx) => (
                        <motion.div 
                           initial={{ opacity: 0, scale: 0.9 }}
                           animate={{ opacity: 1, scale: 1 }}
                           transition={{ delay: idx * 0.05 }}
                           key={student.id} 
                           className="p-10 bg-white/60 backdrop-blur-xl border-2 border-white/20 rounded-[3rem] shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center group"
                        >
                           <div className="w-28 h-28 rounded-[2rem] bg-indigo-50 mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all overflow-hidden border-4 border-white shadow-xl">
                              <img src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.username}`} alt="Avatar" className="w-full h-full object-cover" />
                           </div>
                           <h4 className="font-black text-slate-900 text-2xl mb-1 truncate w-full px-2">{student.name}</h4>
                           <p className="text-[10px] text-indigo-600 font-extrabold tracking-[0.2em] uppercase mb-8 italic">@{student.username}</p>
                           
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setConfirmDelete({ type: 'student', id: selectedClass.id, secondaryId: student.id });
                             }} 
                             className="w-full py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-3 border border-transparent hover:border-rose-100"
                           >
                             <Trash2 size={18} /> Loại bỏ khỏi lớp
                           </button>
                        </motion.div>
                      ))}
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}

        {activeMenu === 'create_test' && (
          <TeacherExamBuilder 
            categories={categories}
            initialExam={editingExam}
            onOpenWordImporter={() => setActiveMenu('import_word')}
            onSave={(savedExam, assignNow) => {
              if (exams.some(e => e.id === savedExam.id)) {
                setExams(exams.map(e => e.id === savedExam.id ? savedExam : e));
              } else {
                const withTeacher: Exam = {
                  ...savedExam,
                  teacherId: loggedInTeacher?.id
                };
                setExams([withTeacher, ...exams]);
              }
              alert('Lưu bài tập thành công vào kho bài thi!');
              setEditingExam(null);
              
              if (assignNow) {
                setAssigningExamId(savedExam.id);
                setAssignForm({ classId: '', targetType: 'class', studentIds: [], dueDate: '', attempts: 1 });
                setShowAssignModal(true);
                setActiveMenu('tests');
              } else {
                setActiveMenu('tests');
              }
            }}
            onCancel={() => {
              setEditingExam(null);
              setActiveMenu('tests');
            }}
            onPreview={(examToPreview) => {
              setPreviewExam(examToPreview);
              setShowPreview(true);
            }}
          />
        )}

        {activeMenu === 'import_word' && (
          <WordExamImporter
            categories={categories}
            teacherId={loggedInTeacher?.id}
            onSave={(savedExam, assignNow) => {
              const withTeacher: Exam = {
                ...savedExam,
                teacherId: loggedInTeacher?.id
              };
              setExams([withTeacher, ...exams]);
              alert('Đã thêm bài tập từ file Word vào kho bài tập thành công!');
              
              if (assignNow) {
                setAssigningExamId(withTeacher.id);
                setAssignForm({ classId: '', targetType: 'class', studentIds: [], dueDate: '', attempts: 1 });
                setShowAssignModal(true);
                setActiveMenu('tests');
              } else {
                setActiveMenu('tests');
              }
            }}
            onEditInBuilder={(examToEdit) => {
              setEditingExam(examToEdit);
              setActiveMenu('create_test');
            }}
            onCancel={() => {
              setActiveMenu('tests');
            }}
          />
        )}

        {activeMenu === 'tests' && (
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-5xl font-black text-slate-900 leading-tight">Thư viện <br /><span className="text-blue-600 font-serif italic">Tri thức 📚</span></h2>
                <p className="text-slate-400 font-extrabold text-xs uppercase tracking-[0.3em] mt-3">Kho lưu trữ bài tập cá nhân</p>
              </motion.div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group w-full sm:w-auto">
                   <input 
                     type="text"
                     placeholder="Tìm kiếm đề thi..."
                     className="w-full sm:w-auto pl-12 pr-6 py-4 bg-white/60 backdrop-blur-md border-2 border-white/20 rounded-2xl font-bold focus:border-indigo-500 outline-none min-w-[240px] md:min-w-[280px] shadow-sm transition-all"
                   />
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                </div>
                <button 
                  onClick={() => setActiveMenu('import_word')}
                  className="w-full sm:w-auto px-6 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/20 active:scale-95 uppercase tracking-widest text-xs"
                >
                  <FileUp size={18} /> Tải đề từ Word (.docx)
                </button>
                <button 
                  onClick={() => {
                    setEditingExam(null);
                    setActiveMenu('create_test');
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 group uppercase tracking-widest text-xs"
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Tạo bài tập mới
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-4 py-2 overflow-x-auto no-scrollbar">
               <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-[10px] font-black uppercase text-slate-400 tracking-widest shrink-0">
                  <Filter size={14} /> Lọc theo:
               </div>
               {['Tất cả', ...categories].map(cat => (
                 <button
                   key={cat}
                   onClick={() => setSelectedCategory(cat)}
                   className={`px-8 py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shrink-0 ${
                     selectedCategory === cat 
                     ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 translate-y-[-2px]' 
                     : 'bg-white/40 backdrop-blur-sm text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/40 border-2 border-white/10 hover:border-indigo-100'
                   }`}
                 >
                   {cat}
                 </button>
               ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
              {myExams.filter(e => selectedCategory === 'Tất cả' || e.category === selectedCategory).map((exam, idx) => {
                const colors = [
                  { bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'hover:shadow-indigo-100' },
                  { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'hover:shadow-emerald-100' },
                  { bg: 'bg-rose-50', text: 'text-rose-500', hover: 'hover:shadow-rose-100' },
                  { bg: 'bg-amber-50', text: 'text-amber-500', hover: 'hover:shadow-amber-100' },
                  { bg: 'bg-blue-50', text: 'text-blue-500', hover: 'hover:shadow-blue-100' }
                ];
                const color = colors[idx % colors.length];

                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    key={exam.id} 
                    className={`bg-white/60 backdrop-blur-xl p-10 rounded-[3rem] border-2 border-white/30 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-t-white/50 border-l-white/40 transition-all group relative overflow-hidden flex flex-col ${color.hover} hover:border-indigo-100 hover:shadow-2xl hover:translate-y-[-12px]`}
                  >
                     <div className="absolute top-0 right-0 p-8">
                        <div className={`p-4 ${color.bg} ${color.text} rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm`}>
                          <CheckCircle2 size={24} />
                        </div>
                     </div>
                     
                     <div className={`w-20 h-20 ${color.bg} ${color.text} rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:rotate-6 transition-transform`}>
                        <FileText size={36} />
                     </div>
                     
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                           <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">{exam.category}</span>
                           <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">{exam.className}</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-6 group-hover:text-indigo-600 transition-colors leading-tight">{exam.title}</h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                           <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-50 flex items-center gap-3">
                              <Clock size={16} className="text-slate-300" />
                              <div>
                                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Thời gian</p>
                                 <p className="text-sm font-black text-slate-700">{exam.duration} Phút</p>
                              </div>
                           </div>
                           <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-50 flex items-center gap-3">
                              <LayoutDashboard size={16} className="text-slate-300" />
                              <div>
                                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Câu hỏi</p>
                                 <p className="text-sm font-black text-slate-700">{exam.questions.length} Câu</p>
                              </div>
                           </div>
                        </div>

                        <div className="flex flex-col gap-2 mb-10">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Ma trận độ khó:</p>
                           <div className="flex items-center gap-2">
                              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex">
                                 {(() => {
                                    const rec = exam.questions.filter(q => q.difficulty === 'recognition').length;
                                    const und = exam.questions.filter(q => q.difficulty === 'understanding').length;
                                    const app = exam.questions.filter(q => q.difficulty === 'application').length;
                                    const total = Math.max(exam.questions.length, 1);
                                    
                                    return (
                                       <>
                                          <div title={`Nhận biết: ${rec} câu`} className="h-full bg-emerald-500" style={{ width: `${(rec/total)*100}%` }}></div>
                                          <div title={`Thông hiểu: ${und} câu`} className="h-full bg-blue-500" style={{ width: `${(und/total)*100}%` }}></div>
                                          <div title={`Vận dụng: ${app} câu`} className="h-full bg-purple-500" style={{ width: `${(app/total)*100}%` }}></div>
                                       </>
                                    );
                                 })()}
                              </div>
                           </div>
                           <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-slate-400">
                              <span className="text-emerald-600">NB: {exam.questions.filter(q => q.difficulty === 'recognition').length}</span>
                              <span className="text-blue-600">TH: {exam.questions.filter(q => q.difficulty === 'understanding').length}</span>
                              <span className="text-purple-600">VD: {exam.questions.filter(q => q.difficulty === 'application').length}</span>
                           </div>
                        </div>
                     </div>

                     <div className="mt-auto space-y-4 pt-8 border-t-2 border-dashed border-slate-50">
                       <button 
                         onClick={() => {
                           setAssigningExamId(exam.id);
                           setAssignForm({ classId: '', targetType: 'class', studentIds: [], dueDate: '', attempts: 1 });
                           setShowAssignModal(true);
                         }}
                         className="w-full py-5 bg-indigo-600 text-white font-black rounded-[1.5rem] hover:bg-slate-900 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs shadow-xl shadow-indigo-100"
                       >
                         <Send size={18} /> Giao bài ngay
                       </button>
                       
                       <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-100/60">
                         <button 
                           onClick={() => setConfirmDelete({ type: 'exam', id: exam.id })}
                           className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-all font-black text-[10px] uppercase tracking-widest"
                         >
                           <Trash2 size={15} /> Xóa
                         </button>
                         <div className="flex items-center gap-3">
                           <button 
                             onClick={() => {
                               setEditingExam(exam);
                               setActiveMenu('create_test');
                             }}
                             className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-all font-black text-[10px] uppercase tracking-widest"
                           >
                             <Edit3 size={15} /> Sửa
                           </button>
                           <button 
                             onClick={() => setViewingExamId(exam.id)}
                             className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-black text-xs transition-all uppercase tracking-widest"
                           >
                             Xem <ChevronRight size={16} />
                           </button>
                         </div>
                       </div>
                     </div>
                  </motion.div>
                );
              })}

              {myExams.length === 0 && (
                <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50">
                  <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-10 animate-bounce-slow">
                    <FileText className="w-14 h-14 text-indigo-200" />
                  </div>
                  <h3 className="text-4xl font-black text-slate-900 mb-4 italic font-serif">Thư viện đang vắng lặng...</h3>
                  <p className="text-slate-400 font-extrabold max-w-md mx-auto mb-12 uppercase tracking-widest text-xs leading-loose">
                    Hãy tự tay soạn những bài tập đầu tiên hoặc tải trực tiếp file Word (.docx) để học sinh làm bài ngay nhé!
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={() => {
                        setEditingExam(null);
                        setActiveMenu('create_test');
                      }}
                      className="px-10 py-5 bg-slate-900 text-white font-black rounded-[2rem] hover:bg-indigo-600 transition-all shadow-xl uppercase tracking-widest text-xs flex items-center gap-2 active:scale-95"
                    >
                      <Edit3 size={18} /> Soạn đề mới ngay
                    </button>
                    <button 
                      onClick={() => {
                        setActiveMenu('import_word');
                      }}
                      className="px-10 py-5 bg-emerald-600 text-white font-black rounded-[2rem] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 uppercase tracking-widest text-xs flex items-center gap-2 active:scale-95"
                    >
                      <FileUp size={18} /> Tải đề từ file Word (.docx)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

            {/* Add Class Modal */}
        {showAddClass && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white w-full max-w-md p-10 rounded-[40px] shadow-2xl space-y-8"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                  <GraduationCap size={40} />
                </div>
                <h3 className="text-3xl font-black text-slate-900">Tạo lớp học mới</h3>
                <p className="text-slate-400 font-bold text-sm mt-3 uppercase tracking-widest">Nhập tên lớp để bắt đầu quản lý</p>
              </div>
              
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Chọn khối lớp</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Khối lớp 1', 'Khối lớp 2', 'Khối lớp 3', 'Khối lớp 4', 'Khối lớp 5', 'Khối lớp 6', 'Khối lớp 7', 'Khối lớp 8', 'Khối lớp 9'].map(level => (
                    <button
                      key={level}
                      onClick={() => setNewClassName(level)}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border-2 ${
                        newClassName === level
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                        : 'bg-white border-slate-50 text-slate-400 hover:border-indigo-100'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="pt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tên lớp tùy chỉnh (nếu cần)</label>
                  <input 
                    type="text" 
                    placeholder="Loặc nhấn chọn khối lớp ở trên"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-sm mt-3"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <button 
                  onClick={handleAddClass}
                  className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl transition-all uppercase tracking-widest text-lg"
                >
                  Tạo lớp ngay
                </button>
                <button 
                  onClick={() => setShowAddClass(false)}
                  className="w-full py-5 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest"
                >
                  Hủy bỏ
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Student Modal */}
            {showAddStudent && viewingClassId && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/90 backdrop-blur-3xl w-full max-w-md p-10 rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] space-y-8 border-4 border-white/40 border-t-white/80 border-l-white/60"
                >
                  <div className="text-center">
                    <h3 className="text-3xl font-black text-slate-900">Thêm học sinh</h3>
                    <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">Vào {selectedClass?.name}</p>
                  </div>
                  
                  <div className="space-y-5">
                    {/* Add Mode Toggle */}
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
                      <button onClick={() => setAddMode('single')} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl ${addMode === 'single' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Từng em</button>
                      <button onClick={() => setAddMode('batch')} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl ${addMode === 'batch' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Hàng loạt</button>
                    </div>

                    {addMode === 'single' ? (
                      <>
                        <div className="flex flex-col items-center gap-4 mb-4">
                          <div className="w-24 h-24 bg-slate-100 rounded-full overflow-hidden border-4 border-white shadow-lg relative group">
                            {newStudent.avatar ? (
                              <img src={newStudent.avatar} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Users size={40} />
                              </div>
                            )}
                            <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                              <ImageIcon className="text-white" size={24} />
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setNewStudent({ ...newStudent, avatar: reader.result as string });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ảnh đại diện (Tùy chọn)</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Họ và tên học sinh</label>
                          <input type="text" placeholder="VD: Nguyễn Văn An" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tài khoản đăng nhập</label>
                          <input type="text" placeholder="VD: an_lop1a" value={newStudent.username} onChange={(e) => setNewStudent({...newStudent, username: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mật khẩu</label>
                          <input type="text" placeholder="Nhập mật khẩu..." value={newStudent.password} onChange={(e) => setNewStudent({...newStudent, password: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold" />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Dán danh sách (Tên, Tài khoản, Mật khẩu)</label>
                        <textarea
                          placeholder="Nguyễn Văn An, an123, 123&#10;Trần Thị Bình, binh123, 123"
                          value={batchInput}
                          onChange={(e) => setBatchInput(e.target.value)}
                          className="w-full h-40 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none font-bold text-sm"
                        />
                        <div className="relative">
                          <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            id="excel-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  const data = evt.target?.result;
                                  const workbook = XLSX.read(data, { type: 'binary' });
                                  const sheetName = workbook.SheetNames[0];
                                  const worksheet = workbook.Sheets[sheetName];
                                  const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                                  const batchString = json.slice(1).map((row: any) => row.slice(0, 3).join(',')).join('\n');
                                  setBatchInput(batchString);
                                };
                                reader.readAsBinaryString(file);
                              }
                            }}
                          />
                          <label htmlFor="excel-upload" className="w-full py-4 bg-slate-100 text-slate-600 font-black rounded-2xl flex items-center justify-center gap-3 cursor-pointer hover:bg-slate-200 text-xs uppercase tracking-widest">
                            Tải file Excel (.xlsx)
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 pt-4">
                    <button 
                      onClick={handleAddStudent}
                      className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl transition-all uppercase tracking-widest text-lg"
                    >
                      Xác nhận lưu
                    </button>
                    <button 
                      onClick={() => setShowAddStudent(false)}
                      className="w-full py-5 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
        
        {activeMenu === 'results' && (
          <div className="space-y-12">
            {!viewingAssignmentResultsId ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                   <motion.div
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                   >
                     <h2 className="text-5xl font-black text-slate-900 leading-tight">Thống kê <br /><span className="text-amber-500 font-serif italic">Kết quả 📊</span></h2>
                     <p className="text-slate-400 font-extrabold text-xs uppercase tracking-[0.3em] mt-3">Đèn xanh cho sự tiến bộ của học sinh</p>
                   </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {myAssignments.map((assignment, idx) => {
                    const exam = myExams.find(e => e.id === assignment.examId);
                    const targetClass = myClasses.find(c => c.id === assignment.classId);
                    const classSubmissions = mySubmissions.filter(s => s.assignmentId === assignment.id);
                    const uniqueStudents = new Set(classSubmissions.map(s => s.studentId)).size;
                    const totalStudents = targetClass?.students.length || 1;
                    const percentage = Math.round((uniqueStudents / totalStudents) * 100);

                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={assignment.id} 
                        className="bg-white/60 backdrop-blur-xl p-10 rounded-[3rem] border-2 border-white/20 shadow-sm hover:shadow-2xl transition-all group flex flex-col"
                      >
                         <div className="flex justify-between items-start mb-8">
                            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform">
                               <BarChart3 size={32} />
                            </div>
                            <div className="px-4 py-2 bg-slate-50 rounded-xl">
                               <span className="text-slate-400 font-black text-[9px] uppercase tracking-widest leading-none">Mã: #{assignment.id.slice(-4)}</span>
                            </div>
                         </div>
                         
                         <h3 className="text-2xl font-black text-slate-900 mb-2 truncate group-hover:text-amber-600 transition-colors uppercase tracking-tight">{exam?.title}</h3>
                         <p 
                           onClick={() => {
                             if (targetClass) {
                               setActiveMenu('classes');
                               setViewingClassId(targetClass.id);
                             }
                           }}
                           className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-8 flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors"
                         >
                            <Users size={14} className="text-amber-400" /> Lớp: {targetClass?.name}
                         </p>
                         
                         <div className="space-y-6 mb-10 flex-1">
                            <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                               <div className="flex justify-between items-center text-[10px] font-black mb-3">
                                  <span className="text-slate-400 uppercase tracking-widest">Tỷ lệ hoàn thành</span>
                                  <span className="text-amber-600">{uniqueStudents} / {totalStudents} Học sinh</span>
                               </div>
                               <div className="w-full h-3 bg-white/40 backdrop-blur-sm rounded-full overflow-hidden p-0.5 border border-white/10">
                                  <div 
                                    className="h-full bg-amber-500 transition-all duration-1000 rounded-full" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                               </div>
                            </div>
                         </div>

                         <button 
                           onClick={() => setViewingAssignmentResultsId(assignment.id)}
                           className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-amber-500 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs shadow-xl active:scale-95"
                         >
                           Xem chi tiết báo cáo <ArrowRight size={18} />
                         </button>
                      </motion.div>
                    );
                  })}

                  {myAssignments.length === 0 && (
                    <div className="col-span-full py-32 text-center bg-white/40 backdrop-blur-xl rounded-[4rem] border-4 border-dashed border-white/20 flex flex-col items-center">
                      <div className="w-32 h-32 bg-amber-50 rounded-full flex items-center justify-center mb-10 animate-pulse">
                        <BarChart3 className="w-14 h-14 text-amber-200" />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 mb-4 italic font-serif">Đang chờ những bài tập đầu tiên...</h3>
                      <p className="text-slate-400 font-extrabold max-w-sm mx-auto uppercase tracking-widest text-[10px] leading-loose">Bạn cần giao bài tập cho lớp học trước khi có thể xem báo cáo kết quả chi tiết.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white/60 backdrop-blur-2xl rounded-[4rem] border-2 border-white/20 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
                 <div className="p-12 border-b-2 border-white/10 bg-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-8">
                       <button onClick={() => setViewingAssignmentResultsId(null)} className="p-5 bg-white text-slate-900 rounded-[1.5rem] shadow-xl hover:bg-amber-500 hover:text-white transition-all transform hover:-translate-x-2">
                          <ArrowLeft size={24} />
                       </button>
                       <div>
                          <h2 className="text-4xl font-black text-slate-900">
                            {myExams.find(e => e.id === myAssignments.find(a => a.id === viewingAssignmentResultsId)?.examId)?.title}
                          </h2>
                          <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest mt-2 italic">Phân tích chi tiết từng mục tiêu học tập</p>
                       </div>
                    </div>
                    <div className="px-8 py-4 bg-amber-50 text-amber-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-amber-100 flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                       Dữ liệu thời gian thực
                    </div>
                 </div>

                 <div className="p-12 flex-1 overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b-4 border-slate-50">
                             <th className="pb-8 text-[11px] font-black text-slate-400 uppercase tracking-widest pl-6">Ngôi sao nhí</th>
                             <th className="pb-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Kết quả câu đúng</th>
                             <th className="pb-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Tốc độ hoàn thành</th>
                             <th className="pb-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Điểm số</th>
                             <th className="pb-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Thời gian nộp</th>
                             <th className="pb-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right pr-6">Chi tiết</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y-2 divide-slate-50">
                          {(() => {
                             const assignment = myAssignments.find(a => a.id === viewingAssignmentResultsId);
                             const exam = myExams.find(e => e.id === assignment?.examId);
                             const targetClass = myClasses.find(c => c.id === assignment?.classId);
                             const assignmentSubmissions = submissions
                               .filter(s => s.assignmentId === viewingAssignmentResultsId)
                               .sort((a, b) => b.submittedAt - a.submittedAt);

                             if (assignmentSubmissions.length === 0) {
                               return (
                                 <tr>
                                   <td colSpan={6} className="py-32 text-center">
                                      <div className="flex flex-col items-center opacity-30">
                                         <Users size={48} className="mb-4" />
                                         <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Chưa có ai nộp bài đâu bạn ơi!</p>
                                      </div>
                                   </td>
                                 </tr>
                               );
                             }

                             return assignmentSubmissions.map((submission, sIdx) => {
                               const student = targetClass?.students.find(s => s.id === submission.studentId);
                               const correctCount = submission.answers.filter((ans, idx) => ans === exam?.questions[idx]?.correctAnswer).length;
                               const duration = Math.round((submission.submittedAt - submission.startedAt) / 60000);

                               return (
                                 <motion.tr 
                                   initial={{ opacity: 0, x: -10 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: sIdx * 0.03 }}
                                   key={submission.id} 
                                   className="group hover:bg-slate-50/50 transition-colors"
                                 >
                                    <td className="py-8 pl-6">
                                       <div className="flex items-center gap-5">
                                          <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shadow-inner border-2 border-white ring-4 ring-slate-50 flex-shrink-0 group-hover:ring-indigo-100 transition-all">
                                             <img src={student?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student?.username}`} alt="Student" className="w-full h-full object-cover" />
                                          </div>
                                          <div className="flex flex-col">
                                             <span className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{student?.name || 'N/A'}</span>
                                             <span 
                                               onClick={() => {
                                                 if (targetClass) {
                                                   setActiveMenu('classes');
                                                   setViewingClassId(targetClass.id);
                                                 }
                                               }}
                                               className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic leading-none mt-1 cursor-pointer hover:text-indigo-600 hover:not-italic underline transition-all"
                                             >
                                               Lớp: {targetClass?.name}
                                             </span>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="py-8 text-center text-slate-600 font-black text-sm">
                                       <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs uppercase">
                                          {correctCount} <span className="opacity-40">/</span> {exam?.questions.length}
                                       </span>
                                    </td>
                                    <td className="py-8 text-center text-slate-400 font-bold text-sm">
                                       <div className="flex items-center justify-center gap-2">
                                          <Clock size={14} className="text-amber-400" />
                                          {duration} phút
                                       </div>
                                    </td>
                                    <td className="py-8 text-center">
                                       <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full font-black text-lg shadow-sm border-4 border-white ${
                                         submission.score >= 8 ? 'bg-emerald-100 text-emerald-600 shadow-emerald-100' : 
                                         submission.score >= 5 ? 'bg-amber-100 text-amber-600 shadow-amber-100' : 
                                         'bg-rose-100 text-rose-600 shadow-rose-100'
                                       }`}>
                                          {submission.score.toFixed(1)}
                                       </div>
                                    </td>
                                    <td className="py-8 text-center text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                       {new Date(submission.submittedAt).toLocaleDateString('vi-VN')} <br />
                                       <span className="opacity-50 text-[9px]">{new Date(submission.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </td>
                                    <td className="py-8 pr-6 text-right">
                                       <div className="flex items-center justify-end gap-3">
                                          <button 
                                            onClick={() => setViewingSpecificSubmissionId(submission.id)}
                                            className="px-6 py-2.5 bg-white border-2 border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                                          >
                                            Chi tiết
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteSubmission(submission.id)}
                                            className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                            title="Xóa kết quả"
                                          >
                                            <Trash2 size={20} />
                                          </button>
                                       </div>
                                    </td>
                                 </motion.tr>
                               );
                             });
                          })()}
                       </tbody>
                    </table>
                 </div>
              </div>
            )}
          </div>
        )}

        {/* Update menu for assign and essays if needed */}
        {['assign', 'essays'].includes(activeMenu) && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/40 backdrop-blur-md rounded-[40px] border border-dashed border-white/20">
             <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
                <LayoutDashboard className="text-slate-300" size={32} />
             </div>
             <h3 className="text-2xl font-black text-slate-900 mb-2">Tính năng đang phát triển</h3>
             <p className="text-slate-500 font-bold max-w-sm text-center">Chúng tôi đang nỗ lực hoàn thiện tính năng này để mang lại trải nghiệm tốt nhất cho bạn.</p>
          </div>
        )}

        {/* Exam Preview Modal */}
        {(showPreview && previewExam) || (viewingExamId && viewingExam) ? (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-8">
             <motion.div 
               initial={{ opacity: 0, y: 20, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               className="bg-white/95 backdrop-blur-3xl w-full max-w-4xl h-[85vh] rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-4 border-white/40 border-t-white/80 border-l-white/60 flex flex-col overflow-hidden"
             >
                <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                         <FileText size={28} />
                      </div>
                      <div>
                         <h2 className="text-3xl font-black text-slate-900">{(previewExam || viewingExam)?.title}</h2>
                         <p className="text-slate-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                           {(previewExam || viewingExam)?.category} • {(previewExam || viewingExam)?.className} • {(previewExam || viewingExam)?.duration} Phút
                         </p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          setShowPreview(false);
                          setViewingExamId(null);
                        }}
                        className="px-8 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all"
                      >
                        {viewingExamId ? 'Đóng' : 'Hủy bỏ'}
                      </button>
                      {!viewingExamId && (
                        <button 
                           onClick={handleSaveExam}
                           className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2"
                        >
                           <Save size={20} /> Lưu đề kiểm tra
                        </button>
                      )}
                   </div>
                </div>

                <div className="p-10 flex-1 overflow-y-auto custom-scrollbar space-y-10">
                   <div className="flex items-center justify-center gap-8 py-4 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 text-indigo-700">
                      <div className="text-center">
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Tổng cộng</p>
                         <p className="text-2xl font-black">{(previewExam || viewingExam)?.questions.length} Câu</p>
                      </div>
                      <div className="w-px h-8 bg-indigo-200"></div>
                      <div className="text-center">
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Môn học</p>
                         <p className="text-lg font-black">{(previewExam || viewingExam)?.category}</p>
                      </div>
                   </div>

                   <div className="space-y-8 pb-10">
                      {(previewExam || viewingExam)?.questions.map((q, idx) => (
                        <div key={q.id} className="p-8 bg-slate-50 rounded-3xl border border-slate-100 border-l-8 border-l-indigo-500 relative group">
                           <div className="absolute top-6 right-8 opacity-0 group-hover:opacity-100 transition-all">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                q.difficulty === 'recognition' ? 'bg-emerald-100 text-emerald-700' :
                                q.difficulty === 'understanding' ? 'bg-blue-100 text-blue-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {q.difficulty === 'recognition' ? 'Nhận biết' : q.difficulty === 'understanding' ? 'Thông hiểu' : 'Vận dụng'}
                              </span>
                           </div>
                           <h4 className="text-xl font-black text-slate-800 mb-6 flex gap-4">
                              <span className="text-indigo-600 font-black">Câu {idx + 1}:</span>
                              {q.content}
                           </h4>
                           
                           {q.options && q.options.length > 0 && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} className={`p-4 rounded-xl border flex items-center gap-4 ${opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${opt === q.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        {String.fromCharCode(65 + oIdx)}
                                     </div>
                                     <span className="font-bold">{opt}</span>
                                     {opt === q.correctAnswer && <CheckCircle2 size={16} className="ml-auto" />}
                                  </div>
                                ))}
                             </div>
                           )}

                           {!q.options && (
                              <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-4">
                                 <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Đáp án đúng:</span>
                                 <span className="font-black text-indigo-600">{q.correctAnswer}</span>
                              </div>
                           )}
                           
                           <p className="mt-4 text-[10px] text-slate-400 font-black uppercase tracking-widest">Loại: {q.type}</p>
                        </div>
                      ))}
                   </div>
                </div>
             </motion.div>
          </div>
        ) : null}

        {/* Admin Change Teacher Password Modal */}
        {editingTeacherPasswordId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white w-full max-w-md p-10 rounded-[40px] shadow-2xl space-y-8"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                  <Key size={40} />
                </div>
                <h3 className="text-3xl font-black text-slate-900">Đổi mật khẩu</h3>
                <p className="text-slate-400 font-bold text-sm mt-3 uppercase tracking-widest">
                  Đổi mật khẩu cho: {teachers.find(t => t.id === editingTeacherPasswordId)?.fullName}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mật khẩu mới</label>
                <input 
                  type="password" 
                  placeholder="Nhập mật khẩu mới..."
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono text-lg"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <button 
                  onClick={() => {
                    if (!newPasswordValue) {
                      alert('Vui lòng nhập mật khẩu mới!');
                      return;
                    }
                    setTeachers(teachers.map(t => 
                      t.id === editingTeacherPasswordId ? { ...t, password: newPasswordValue } : t
                    ));
                    setEditingTeacherPasswordId(null);
                    alert('Đã đổi mật khẩu thành công!');
                  }}
                  className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl transition-all uppercase tracking-widest text-lg"
                >
                  Cập nhật mật khẩu
                </button>
                <button 
                  onClick={() => setEditingTeacherPasswordId(null)}
                  className="w-full py-5 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest"
                >
                  Hủy bỏ
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Submission Detail Modal */}
        {viewingSpecificSubmissionId && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[70] flex items-center justify-center p-8">
             <motion.div 
               initial={{ opacity: 0, y: 20, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               className="bg-white/95 backdrop-blur-3xl w-full max-w-4xl h-[85vh] rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-4 border-white/40 border-t-white/80 border-l-white/60 flex flex-col overflow-hidden"
             >
                {(() => {
                   const submission = mySubmissions.find(s => s.id === viewingSpecificSubmissionId);
                   const assignment = myAssignments.find(a => a.id === submission?.assignmentId);
                   const exam = myExams.find(e => e.id === assignment?.examId);
                   const student = myClasses.flatMap(c => c.students).find(s => s.id === submission?.studentId);
                   
                   return (
                     <>
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                           <div className="flex items-center gap-6">
                              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                                 <FileText size={28} />
                              </div>
                              <div>
                                 <h2 className="text-3xl font-black text-slate-900">Chi tiết bài làm: {student?.name}</h2>
                                 <p className="text-slate-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                   {exam?.title} • {new Date(submission?.submittedAt || 0).toLocaleString('vi-VN')}
                                 </p>
                              </div>
                           </div>
                           <button 
                             onClick={() => setViewingSpecificSubmissionId(null)}
                             className="px-8 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest"
                           >
                             Đóng
                           </button>
                        </div>

                        <div className="p-10 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                           <div className="flex gap-12">
                              <div className="text-center">
                                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Điểm số</p>
                                 <p className="text-3xl font-black text-indigo-700">{submission?.score.toFixed(1)}</p>
                              </div>
                              <div className="text-center">
                                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Thời gian làm</p>
                                 <p className="text-xl font-black text-indigo-700">
                                   {submission ? Math.round((submission.submittedAt - submission.startedAt) / 60000) : 0} Phút
                                 </p>
                              </div>
                              <div className="text-center">
                                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Kết quả</p>
                                 <p className="text-xl font-black text-indigo-700">
                                   {submission?.answers.filter((ans, idx) => ans === exam?.questions[idx]?.correctAnswer).length} / {exam?.questions.length} câu đúng
                                 </p>
                              </div>
                           </div>
                        </div>

                        <div className="p-10 flex-1 overflow-y-auto custom-scrollbar space-y-10">
                           <div className="space-y-8 pb-10">
                              {exam?.questions.map((q, idx) => {
                                const studentAnswer = submission?.answers[idx];
                                const isCorrect = studentAnswer === q.correctAnswer;
                                
                                return (
                                  <div key={q.id} className={`p-8 rounded-3xl border ${isCorrect ? 'bg-emerald-50 border-emerald-100 border-l-8 border-l-emerald-500' : 'bg-red-50 border-red-100 border-l-8 border-l-red-500'} relative group`}>
                                     <div className="absolute top-6 right-8">
                                        <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                           {isCorrect ? 'Đúng' : 'Sai'}
                                        </span>
                                     </div>

                                     <h4 className="text-xl font-black text-slate-800 mb-6 flex items-start gap-4 pr-32">
                                        <span className={isCorrect ? 'text-emerald-600' : 'text-red-500'}>Câu {idx + 1}:</span>
                                        <div className="flex-1">
                                          {q.content}
                                          <div className="mt-3">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                              q.difficulty === 'recognition' ? 'bg-emerald-100 text-emerald-700' :
                                              q.difficulty === 'understanding' ? 'bg-blue-100 text-blue-700' :
                                              'bg-purple-100 text-purple-700'
                                            }`}>
                                              {q.difficulty === 'recognition' ? 'Nhận biết' : q.difficulty === 'understanding' ? 'Thông hiểu' : 'Vận dụng'}
                                            </span>
                                          </div>
                                        </div>
                                     </h4>

                                     <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[100px]">Học sinh chọn:</span>
                                          <div className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${isCorrect ? 'text-emerald-700 bg-emerald-100/50' : 'text-red-700 bg-red-100/50'}`}>
                                            {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                            {studentAnswer || '(Trống)'}
                                          </div>
                                        </div>

                                        {!isCorrect && (
                                          <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[100px]">Đáp án đúng:</span>
                                            <div className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2">
                                              <CheckCircle2 size={16} />
                                              {q.correctAnswer}
                                            </div>
                                          </div>
                                        )}
                                     </div>
                                  </div>
                                );
                              })}
                           </div>
                        </div>
                     </>
                   );
                })()}
             </motion.div>
          </div>
        )}

        {/* Assignment Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white/80 backdrop-blur-2xl w-full max-w-lg p-10 rounded-[48px] shadow-2xl space-y-8 border border-white/20"
             >
                <div className="text-center">
                   <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                      <BarChart3 size={40} />
                   </div>
                   <h3 className="text-3xl font-black text-slate-900 font-serif italic">Giao bài tập</h3>
                   <p className="text-slate-400 font-bold text-sm mt-3 uppercase tracking-widest">Thiết lập thông báo giao bài cho lớp</p>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Chọn lớp học</label>
                      <select 
                        value={assignForm.classId}
                        onChange={(e) => setAssignForm({...assignForm, classId: e.target.value, studentIds: []})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700"
                      >
                        <option value="">-- Chọn lớp học --</option>
                        {myClasses.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Giao cho</label>
                      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                         <button 
                           type="button"
                           onClick={() => setAssignForm({...assignForm, targetType: 'class', studentIds: []})}
                           className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${assignForm.targetType === 'class' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                           Cả lớp
                         </button>
                         <button 
                           type="button"
                           onClick={() => setAssignForm({...assignForm, targetType: 'specific_students'})}
                           className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${assignForm.targetType === 'specific_students' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                           Học sinh cụ thể
                         </button>
                      </div>
                   </div>

                   {assignForm.targetType === 'specific_students' && assignForm.classId && (
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Chọn học sinh</label>
                         <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                            {classes.find(c => c.id === assignForm.classId)?.students.map(student => (
                               <label 
                                 key={student.id}
                                 className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${assignForm.studentIds.includes(student.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-50 hover:border-indigo-100'}`}
                               >
                                  <input 
                                    type="checkbox"
                                    className="hidden"
                                    checked={assignForm.studentIds.includes(student.id)}
                                    onChange={() => {
                                       const newIds = assignForm.studentIds.includes(student.id)
                                         ? assignForm.studentIds.filter(id => id !== student.id)
                                         : [...assignForm.studentIds, student.id];
                                       setAssignForm({...assignForm, studentIds: newIds});
                                    }}
                                  />
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${assignForm.studentIds.includes(student.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                     {student.name.charAt(0)}
                                  </div>
                                  <div className="flex-1">
                                     <p className="font-black text-slate-900 text-sm leading-none mb-1">{student.name}</p>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">@{student.username}</p>
                                  </div>
                                  {assignForm.studentIds.includes(student.id) && <CheckCircle2 size={16} className="text-indigo-600" />}
                               </label>
                            ))}
                         </div>
                         {assignForm.studentIds.length > 0 && (
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest text-center">
                               Đã chọn {assignForm.studentIds.length} học sinh
                            </p>
                         )}
                      </div>
                   )}

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Hạn nộp bài</label>
                      <input 
                        type="date"
                        value={assignForm.dueDate}
                        onChange={(e) => setAssignForm({...assignForm, dueDate: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Số lần làm bài tối đa</label>
                      <input 
                        type="number"
                        min="1"
                        max="10"
                        value={assignForm.attempts}
                        onChange={(e) => setAssignForm({...assignForm, attempts: parseInt(e.target.value)})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700"
                      />
                   </div>
                </div>

                <div className="flex flex-col gap-4">
                   <button 
                     onClick={handleAssignExam}
                     className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-widest text-lg"
                   >
                     Giao bài ngay
                   </button>
                   <button 
                     onClick={() => setShowAssignModal(false)}
                     className="w-full py-5 bg-slate-100 text-slate-500 font-black rounded-3xl hover:bg-slate-200 transition-all uppercase tracking-widest"
                   >
                     Hủy bỏ
                   </button>
                </div>
             </motion.div>
          </div>
        )}

        {/* Global Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 backdrop-blur-2xl w-full max-w-sm p-8 rounded-[32px] shadow-2xl text-center border border-white/20"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Xác nhận xóa?</h3>
              <p className="text-slate-500 font-bold text-sm mb-8 px-4">
                {confirmDelete.type === 'class' 
                  ? 'Hành động này sẽ xóa vĩnh viễn lớp học và tất cả dữ liệu học sinh đính kèm.' 
                  : confirmDelete.type === 'exam'
                  ? 'Bạn có chắc chắn muốn xóa đề kiểm tra này không?'
                  : 'Bạn có chắc chắn muốn xóa học sinh này khỏi danh sách lớp?'}
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    if (confirmDelete.type === 'class') handleDeleteClass(confirmDelete.id);
                    else if (confirmDelete.type === 'exam') handleDeleteExam(confirmDelete.id);
                    else if (confirmDelete.secondaryId) handleDeleteStudent(confirmDelete.id, confirmDelete.secondaryId);
                  }}
                  className="w-full py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all uppercase tracking-widest shadow-lg shadow-red-500/20"
                >
                  Đồng ý xóa
                </button>
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="w-full py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest"
                >
                  Quay lại
                </button>
              </div>
            </motion.div>
          </div>
        )}
        <AppFooter onAuthor={onAuthor} onTerms={onTerms} />
      </main>
    </div>
  );
}

// Dashboard Component for Students
function StudentDashboard({
  loggedInUser,
  studentClassId,
  exams,
  assignments,
  submissions,
  setSubmissions,
  setClasses,
  onLogout,
  classes,
  onAuthor,
  onTerms
}: {
  loggedInUser: Student,
  studentClassId: string,
  exams: Exam[],
  assignments: Assignment[],
  submissions: Submission[],
  setSubmissions: Dispatch<SetStateAction<Submission[]>>,
  setClasses: Dispatch<SetStateAction<SchoolClass[]>>,
  onLogout: () => void,
  classes: SchoolClass[],
  onAuthor: () => void,
  onTerms: () => void
}) {
  const [activeView, setActiveView] = useState<'overview' | 'assignments'>('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [examStartedAt, setExamStartedAt] = useState<number>(0);
  const [skippedIndices, setSkippedIndices] = useState<number[]>([]);
  const [fireworksTrigger, setFireworksTrigger] = useState(0);

  const studentClass = classes.find(c => c.id === studentClassId);
  const currentStudent = studentClass?.students.find(s => s.id === loggedInUser.id) || loggedInUser;
   const studentAssignments = assignments.filter(a => {
     if (a.classId !== studentClassId) return false;
     if (a.targetType === 'class' || !a.targetType) return true;
     return a.studentIds?.includes(loggedInUser.id);
   });
  const studentSubmissions = submissions.filter(s => s.studentId === loggedInUser.id);

  const activeAssignment = assignments.find(a => a.id === activeAssignmentId);
  const activeExam = activeAssignment ? exams.find(e => e.id === activeAssignment.examId) : null;

  const handleStartExam = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;
    
    const attempts = studentSubmissions.filter(s => s.assignmentId === assignmentId).length;
    if (attempts >= assignment.attempts) {
      alert('Bạn đã hết lượt làm bài cho đề thi này!');
      return;
    }

    setPendingAssignmentId(assignmentId);
  };

  const confirmStartExam = () => {
    if (!pendingAssignmentId) return;
    const assignment = assignments.find(a => a.id === pendingAssignmentId);
    if (!assignment) return;

    setActiveAssignmentId(pendingAssignmentId);
    setAnswers(new Array(exams.find(e => e.id === assignment.examId)?.questions.length || 0).fill(null));
    setCurrentQuestionIdx(0);
    setIsFinished(false);
    setLastScore(null);
    setExamStartedAt(Date.now());
    setPendingAssignmentId(null);
    setSkippedIndices([]);
  };

  const handleSkipQuestion = () => {
    if (!activeExam) return;
    if (!skippedIndices.includes(currentQuestionIdx)) {
      setSkippedIndices([...skippedIndices, currentQuestionIdx]);
    }
    if (currentQuestionIdx < activeExam.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    }
  };

  const handleSubmitExam = () => {
    if (!activeAssignment || !activeExam) return;
    const startTime = examStartedAt;
    const endTime = Date.now();
    const durationMinutes = (endTime - startTime) / (1000 * 60);

    let correctCount = 0;
    activeExam.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = (correctCount / activeExam.questions.length) * 10;
    const submission: Submission = {
      id: Date.now().toString(),
      assignmentId: activeAssignment.id,
      studentId: loggedInUser.id,
      answers: [...answers],
      score: score,
      submittedAt: Date.now(),
      startedAt: examStartedAt
    };

    // Calculate Points
    let pointsToAdd = 100; // Base points for completion
    pointsToAdd += Math.round(score * 10);
    if (score === 10) pointsToAdd += 50; // Bonus for perfect score

    // Calculate New Badges
    const newBadges: string[] = [];
    const currentSubmissions = [...studentSubmissions, submission];
    
    if (currentSubmissions.length === 1) newBadges.push('first_step');
    if (score === 10) newBadges.push('perfect_score');
    if (durationMinutes < 5) newBadges.push('fast_learner');
    if (currentSubmissions.length === 5) newBadges.push('consistency');
    if (score === 10 && activeExam.category === 'Toán') newBadges.push('math_wizard');

    const pointsToAddValue = isNaN(pointsToAdd) ? 100 : pointsToAdd;

    // Update Student Data in Global state
    setClasses(prevClasses => prevClasses.map(c => {
      if (c.id === studentClassId) {
        return {
          ...c,
          students: c.students.map(s => {
            if (s.id === loggedInUser.id) {
              const currentBadges = s.badges || [];
              const uniqueNewBadges = newBadges.filter(b => !currentBadges.includes(b));
              return {
                ...s,
                points: (s.points || 0) + pointsToAddValue,
                badges: [...currentBadges, ...uniqueNewBadges]
              };
            }
            return s;
          })
        };
      }
      return c;
    }));

    setSubmissions(prev => [...(prev || []), submission]);
    setLastScore(score);
    setIsFinished(true);
    setFireworksTrigger(prev => prev + 1);
  };

  const getBestScore = (assignmentId: string) => {
    const relevant = studentSubmissions.filter(s => s.assignmentId === assignmentId);
    if (relevant.length === 0) return null;
    return Math.max(...relevant.map(s => s.score));
  };

  if (activeAssignmentId && activeExam) {
    if (isFinished) {
      return (
        <div 
          className="min-h-screen flex items-center justify-center p-6 bg-cover bg-center bg-no-repeat bg-fixed relative overflow-hidden"
          style={{ backgroundImage: "url('/background.jpg')" }}
        >
           {/* Framer-Motion Fireworks & Confetti Celebration Overlay */}
           <Fireworks triggerKey={fireworksTrigger} />

           {/* Soft backdrop overlay */}
           <div className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px] pointer-events-none" />

           <motion.div 
             initial={{ opacity: 0, scale: 0.85, y: 30 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             transition={{ type: "spring", stiffness: 260, damping: 20 }}
             className="bg-white/95 backdrop-blur-2xl rounded-[48px] p-8 sm:p-12 max-w-2xl w-full text-center shadow-2xl border border-white/80 relative z-10"
           >
              {/* Animated celebratory trophy badge */}
              <motion.div 
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 320, damping: 15 }}
                className="w-24 h-24 bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 text-amber-900 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-400/30"
              >
                 <Trophy size={48} className="drop-shadow-sm" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-700 text-xs font-black uppercase tracking-wider mb-3 shadow-xs">
                  <Sparkles size={15} className="text-emerald-500" />
                  <span>Nộp bài thi thành công!</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Chúc mừng bạn nhỏ! 🎉</h2>
                <p className="text-slate-600 font-medium mb-8">
                  Bạn đã hoàn thành bài tập: <br/> 
                  <span className="text-indigo-600 font-bold text-lg">{activeExam.title}</span>
                </p>
              </motion.div>
              
              {/* Score Display Card */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="bg-gradient-to-b from-indigo-50/70 to-slate-50 rounded-[36px] p-8 mb-8 border-2 border-indigo-100 flex flex-col items-center justify-center relative overflow-hidden shadow-sm"
              >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                 <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 relative z-10">Điểm số của bạn</p>
                 <div className="flex items-baseline justify-center gap-2 relative z-10">
                   <p className="text-7xl sm:text-8xl font-black text-indigo-600 leading-none drop-shadow-sm">
                      {typeof lastScore === 'number' ? lastScore.toFixed(1) : '0.0'}
                   </p>
                   <span className="text-2xl font-bold text-indigo-300">/ 10</span>
                 </div>

                 {/* Animated Stars */}
                 <div className="mt-5 flex gap-2.5">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const isFilled = typeof lastScore === 'number' && lastScore >= s * 2;
                      return (
                        <motion.div
                          key={s}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.55 + s * 0.08, type: 'spring', stiffness: 350, damping: 15 }}
                        >
                          <Star 
                            size={26} 
                            className={isFilled ? "fill-amber-400 text-amber-400 filter drop-shadow-md" : "text-slate-200"} 
                          />
                        </motion.div>
                      );
                    })}
                 </div>

                 {typeof lastScore === 'number' && (
                   <p className="mt-4 text-xs font-bold text-slate-600">
                     {lastScore >= 9 ? '🌟 Xuất sắc! Bạn làm bài rất xuất sắc và thông minh!' :
                      lastScore >= 7 ? '👏 Làm tốt lắm! Tiếp tục phát huy trong các bài tập tới nhé!' :
                      lastScore >= 5 ? '💪 Bạn đã hoàn thành rất nỗ lực! Cố gắng luyện tập thêm nhé!' :
                      '🌱 Hãy xem lại kiến thức và tự tin thử sức ở các bài tập sau nhé!'}
                   </p>
                 )}
              </motion.div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <button 
                   onClick={() => setFireworksTrigger(prev => prev + 1)}
                   className="py-4 px-6 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:brightness-105 text-white font-black rounded-2xl shadow-lg shadow-amber-500/25 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                 >
                   <Sparkles size={18} /> Bắn pháo hoa ăn mừng 🎆
                 </button>

                 <button 
                   onClick={() => {
                     setActiveAssignmentId(null);
                     setIsFinished(false);
                     setLastScore(null);
                     setAnswers([]);
                     setCurrentQuestionIdx(0);
                     setSkippedIndices([]);
                     setActiveView('overview');
                   }}
                   className="py-4 px-6 bg-indigo-600 hover:bg-slate-900 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/25 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                 >
                   Trở về trang chủ <LayoutDashboard size={18} />
                 </button>
              </div>
           </motion.div>
        </div>
      );
    }

    const currentQuestion = activeExam.questions[currentQuestionIdx];

    return (
      <div 
        className="min-h-screen flex flex-col font-sans overflow-hidden bg-cover bg-center bg-no-repeat bg-fixed relative"
        style={{ backgroundImage: "url('/background.jpg')" }}
      >
         {/* Exam Header */}
       <header className="bg-white/85 backdrop-blur-xl border-b border-white/40 px-8 py-6 flex justify-between items-center sticky top-0 z-40 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border-t-white/20">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <BookOpen size={20} />
               </div>
               <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">{activeExam.title}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeExam.category} • {activeExam.className}</p>
               </div>
            </div>
            
            <div className="flex items-center gap-6">
               <div className="flex flex-col items-end">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian làm bài</p>
                  <div className="flex items-center gap-2 text-indigo-600 font-mono font-black text-xl">
                    <Clock size={16} />
                    <span>{activeExam.duration}:00</span>
                  </div>
               </div>
               <div className="h-10 w-px bg-slate-100 hidden sm:block"></div>
               <button 
                 onClick={() => {
                   if (confirm('Bạn có chắc chắn muốn thoát khi chưa hoàn thành bài tập dở dang?')) {
                     setActiveAssignmentId(null);
                   }
                 }}
                 className="px-5 py-3 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
               >
                 Thoát
               </button>
            </div>
         </header>

         <div className="flex flex-1 relative overflow-hidden">
            {/* Left Sidebar: Progress */}
            <aside className="w-80 bg-white/60 backdrop-blur-xl border-r border-slate-100/20 p-8 hidden lg:flex flex-col gap-8 overflow-y-auto">
               <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Mục lục câu hỏi</h3>
                  <div className="grid grid-cols-4 gap-3">
                     {activeExam.questions.map((_, qIdx) => {
                       const isCurrent = qIdx === currentQuestionIdx;
                       const isAnswered = answers[qIdx] !== null && answers[qIdx] !== undefined && answers[qIdx] !== '';
                       const isSkipped = skippedIndices.includes(qIdx);
                       
                       let bgColor = 'bg-slate-50 text-slate-400 border-slate-100';
                       if (isCurrent) bgColor = 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 ring-4 ring-indigo-50';
                       else if (isAnswered) bgColor = 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-100';
                       else if (isSkipped) bgColor = 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-100';

                       return (
                         <button
                           key={qIdx}
                           onClick={() => setCurrentQuestionIdx(qIdx)}
                           className={`w-full aspect-square rounded-xl border flex items-center justify-center font-black text-xs transition-all hover:scale-105 active:scale-95 ${bgColor}`}
                         >
                           {qIdx + 1}
                         </button>
                       );
                     })}
                  </div>
               </div>

               <div className="mt-auto pt-8 border-t border-slate-50">
                  <div className="bg-slate-50 rounded-2xl p-6 flex flex-col gap-4">
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase">Đã hoàn thành</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase">Đã bỏ qua</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase">Chưa làm</span>
                     </div>
                  </div>

                  <button
                    onClick={() => {
                      const answeredCount = answers.filter(a => a !== null && a !== undefined && a !== '').length;
                      const unansweredCount = activeExam.questions.length - answeredCount;
                      if (unansweredCount > 0) {
                        if (confirm(`Bạn còn ${unansweredCount} câu chưa điền đáp án. Bạn có muốn nộp bài tập ngay bây giờ không?`)) {
                          handleSubmitExam();
                        }
                      } else {
                        handleSubmitExam();
                      }
                    }}
                    className="w-full mt-4 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trophy size={16} /> Nộp bài tập
                  </button>
               </div>
            </aside>

            {/* Main Workspace */}
            <main className="flex-1 bg-transparent overflow-y-auto">
               <div className="max-w-3xl mx-auto p-8 md:p-16 h-full flex flex-col">
                  <motion.div 
                     key={currentQuestionIdx}
                     initial={{ opacity: 0, y: 30 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="flex-1"
                  >
                     <div className="flex items-center justify-between mb-8">
                        <span className="px-5 py-2 bg-white/40 backdrop-blur-sm text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-2">
                            <Stars size={12} />
                           {currentQuestion.difficulty === 'recognition' ? 'Nhận biết' : currentQuestion.difficulty === 'understanding' ? 'Thông hiểu' : 'Vận dụng'}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           Câu {currentQuestionIdx + 1} / {activeExam.questions.length}
                        </span>
                     </div>

                     <h3 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight mb-12 italic font-serif">
                        {currentQuestion.content}
                     </h3>

                     {currentQuestion.options ? (
                       <div className="grid grid-cols-1 gap-4">
                          {currentQuestion.options.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              onClick={() => {
                                const newAnswers = [...answers];
                                newAnswers[currentQuestionIdx] = opt;
                                setAnswers(newAnswers);
                                if (skippedIndices.includes(currentQuestionIdx)) {
                                  setSkippedIndices(skippedIndices.filter(i => i !== currentQuestionIdx));
                                }
                              }}
                              className={`w-full p-6 md:p-8 rounded-[2.5rem] border-2 text-left transition-all flex items-center gap-6 group ${
                                answers[currentQuestionIdx] === opt 
                                ? 'border-indigo-600 bg-white/70 backdrop-blur-md shadow-[0_20px_50px_rgba(79,70,229,0.2)] -translate-y-2 border-t-white/40 border-l-white/20' 
                                : 'border-white/20 hover:border-indigo-100 bg-white/40 backdrop-blur-sm shadow-[0_10px_20px_rgba(0,0,0,0.03)] border-t-white/30 border-l-white/10 hover:-translate-y-1 hover:shadow-xl'
                              }`}
                            >
                               <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-xl transition-all shadow-sm ${
                                  answers[currentQuestionIdx] === opt ? 'bg-indigo-600 text-white rotate-6' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-100'
                               }`}>
                                  {String.fromCharCode(65 + oIdx)}
                               </div>
                               <span className={`text-xl font-bold ${answers[currentQuestionIdx] === opt ? 'text-indigo-900' : 'text-slate-700'}`}>{opt}</span>
                               {answers[currentQuestionIdx] === opt && (
                                 <div className="ml-auto w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                   <Check size={16} strokeWidth={4} />
                                 </div>
                               )}
                            </button>
                          ))}
                       </div>
                     ) : (
                        <div className="space-y-4">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Nhập kho báu của bạn vào đây:</p>
                           <input 
                              type="text"
                              className="w-full p-10 bg-white/50 backdrop-blur-xl border-2 border-white/30 rounded-[3rem] text-2xl font-black focus:border-indigo-600 outline-none transition-all shadow-[0_20px_50px_rgba(0,0,0,0.05)] focus:shadow-[0_45px_100px_rgba(79,70,229,0.15)] border-t-white/50 border-l-white/40 placeholder:text-slate-300"
                              placeholder="Tràn đầy tự tin gõ vào đây..."
                              value={answers[currentQuestionIdx] || ''}
                              onChange={(e) => {
                                const newAnswers = [...answers];
                                newAnswers[currentQuestionIdx] = e.target.value;
                                setAnswers(newAnswers);
                                if (skippedIndices.includes(currentQuestionIdx)) {
                                  setSkippedIndices(skippedIndices.filter(i => i !== currentQuestionIdx));
                                }
                              }}
                            />
                         </div>
                      )}
                  </motion.div>

                  {/* Navigation Bar */}
                  <div className="mt-16 pt-10 border-t border-slate-100/50 flex items-center justify-between">
                     <div className="flex gap-4">
                        <button 
                          onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
                          disabled={currentQuestionIdx === 0}
                          className="w-16 h-16 bg-white/40 backdrop-blur-sm border-2 border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-indigo-100 transition-all disabled:opacity-30 active:scale-95 shadow-sm"
                          title="Câu trước"
                        >
                          <ArrowLeft size={24} />
                        </button>
                        
                        <button 
                          onClick={handleSkipQuestion}
                          className="px-8 h-16 bg-white/40 backdrop-blur-sm border-2 border-rose-100/50 text-rose-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 active:scale-95"
                        >
                          <HelpCircle size={18} /> Bỏ qua
                        </button>
                     </div>

                     {currentQuestionIdx < activeExam.questions.length - 1 ? (
                        <button 
                          onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                          className="px-10 h-16 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 hover:bg-slate-900 hover:translate-y-[-2px] active:scale-95 flex items-center gap-4"
                        >
                          Tiếp theo <ArrowRight size={20} />
                        </button>
                     ) : (
                        <button 
                          onClick={handleSubmitExam}
                          className="px-10 h-16 bg-emerald-500 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-100 hover:bg-emerald-600 hover:translate-y-[-2px] active:scale-95 flex items-center gap-4"
                        >
                          Nộp bài thưởng <Trophy size={20} />
                        </button>
                     )}
                  </div>
               </div>
            </main>
         </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col font-sans relative overflow-x-hidden bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
       {/* Background Accents / subtle protective overlay */}
       <div className="absolute inset-0 bg-white/25 backdrop-blur-[1px] pointer-events-none"></div>

       {/* Student Header */}
       <header className="bg-white/90 backdrop-blur-md border-b border-white/60 p-6 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setActiveView('overview')}>
             <div className="w-12 h-12 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-indigo-100 group-hover:rotate-6 transition-all ring-4 ring-indigo-50">
                <LayoutDashboard size={24} />
             </div>
             <div>
                <span className="block text-slate-900 font-black text-xl tracking-tighter leading-none uppercase">Digital</span>
                <span className="block text-indigo-600 font-extrabold text-xl tracking-tighter leading-none uppercase">Education</span>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <nav className="hidden lg:flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-[2rem] border border-slate-200/50">
                <button 
                  onClick={() => setActiveView('overview')}
                  className={`px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    activeView === 'overview' 
                    ? 'bg-white/60 backdrop-blur-md text-indigo-700 shadow-lg shadow-indigo-200/50 translate-y-[-2px] border border-white/20' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 shadow-sm transition-all active:scale-95'
                  }`}
                >
                   <Sparkles size={14} /> Tổng quan 💎
                </button>
                <button 
                  onClick={() => setActiveView('assignments')}
                  className={`px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    activeView === 'assignments' 
                    ? 'bg-white/60 backdrop-blur-md text-indigo-700 shadow-lg shadow-indigo-200/50 translate-y-[-2px] border border-white/20' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 shadow-sm transition-all active:scale-95'
                  }`}
                >
                   <BookOpen size={14} /> Bài tập ({studentAssignments.length}) 🎒
                </button>
             </nav>
             
             <div className="h-10 w-px bg-slate-100 mx-2 hidden md:block"></div>

             <div className="flex items-center gap-3 pr-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="w-12 h-12 bg-white/60 backdrop-blur-md border border-slate-100 rounded-2xl flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all group shadow-sm active:scale-95"
                    title="Thông báo"
                  >
                    <Bell size={20} className={showNotifications ? 'text-indigo-600' : ''} />
                    <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full transition-transform group-hover:scale-125"></div>
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-[calc(100%+16px)] right-0 w-80 bg-white rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.2)] border-2 border-slate-50 p-6 z-[200] cursor-default"
                        onClick={(e) => e.stopPropagation()}
                      >
                         <div className="flex justify-between items-center mb-6">
                            <div>
                              <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Thông báo mới</h3>
                              <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Cập nhật hôm nay</p>
                            </div>
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-black">2 MỚI</span>
                         </div>
                         <div className="space-y-4">
                            <div className="flex gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/20 group/item hover:bg-indigo-50 transition-colors cursor-pointer">
                               <div className="text-3xl group-hover/item:scale-110 transition-transform">🎒</div>
                               <div className="flex-1 min-w-0">
                                  <h4 className="font-black text-slate-900 text-sm">Bài tập mới!</h4>
                                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed">Thầy cô vừa giao bài tập mới cho lớp mình đấy.</p>
                                  <span className="text-[9px] text-slate-300 font-black uppercase mt-1.5 block">Vừa xong</span>
                               </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-white hover:bg-slate-50 transition-colors rounded-2xl border border-transparent hover:border-slate-100 cursor-pointer group/item">
                               <div className="text-3xl group-hover/item:scale-110 transition-transform">💎</div>
                               <div className="flex-1 min-w-0">
                                  <h4 className="font-black text-slate-900 text-sm">Thưởng điểm</h4>
                                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed">Bạn vừa nhận được 100 điểm thưởng.</p>
                                  <span className="text-[9px] text-slate-300 font-black uppercase mt-1.5 block">2 giờ trước</span>
                                </div>
                             </div>
                          </div>
                          <button 
                            onClick={() => setShowNotifications(false)}
                            className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                          >
                            Đã xem hết
                          </button>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
                <div className="text-right hidden sm:block">
                   <div className="flex items-center gap-2 justify-end">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-[0_8px_20px_rgba(79,70,229,0.3)] border-t border-white/30 flex items-center gap-1.5"
                      >
                         <Sparkles size={10} className="text-amber-300" />
                         {currentStudent.points || 0} Điểm
                      </motion.div>
                      <span className="px-2 py-0.5 bg-amber-100/80 backdrop-blur-sm text-amber-600 rounded-md text-[8px] font-black uppercase tracking-widest border border-amber-200 shadow-sm">Level {Math.floor((currentStudent.points || 0) / 1000) + 1}</span>
                      <p className="text-sm font-black text-slate-900 ml-1">{loggedInUser.name}</p>
                   </div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{studentClass?.name}</p>
                </div>
                <button 
                  onClick={onLogout}
                  className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all group relative border border-rose-100/50 shadow-sm"
                  title="Thoát tài khoản"
                >
                   <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                </button>
             </div>
          </div>
       </header>

       <main className="flex-1 p-8 md:p-12 max-w-7xl w-full mx-auto relative z-10">
          {activeView === 'overview' ? (
            <div className="space-y-12">
               {/* Hero Banner Section */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                  <div className="lg:col-span-2 space-y-8">
                     <motion.div
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                     >
                        <h1 className="text-6xl font-black text-slate-900 leading-tight">
                           Lớn khôn cùng <br />
                           <span className="text-indigo-600 italic font-serif">DIGITAL EDUCATION! 🚀</span>
                        </h1>
                        <p className="mt-6 text-slate-500 font-extrabold text-xl max-w-md leading-relaxed">
                           Cố gắng học tập để thu thập thật nhiều huy hiệu và điểm thưởng nhé {loggedInUser.name}!
                        </p>
                        
                        <div className="flex flex-wrap gap-4 mt-8">
                           <motion.div 
                             whileHover={{ scale: 1.05, y: -5 }}
                             className="px-8 py-5 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border-2 border-white shadow-[0_20px_40px_rgba(0,0,0,0.05)] border-t-white/80 border-l-white/60 flex items-center gap-5 group"
                           >
                              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 group-hover:rotate-12 transition-transform">
                                 <Sparkles size={28} />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Kho báu của bạn</p>
                                 <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-900">{currentStudent.points || 0}</span>
                                    <span className="text-xs font-black text-indigo-500 uppercase">Điểm</span>
                                 </div>
                              </div>
                           </motion.div>

                           <motion.div 
                             whileHover={{ scale: 1.05, y: -5 }}
                             className="px-8 py-5 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border-2 border-white shadow-[0_20px_40px_rgba(0,0,0,0.05)] border-t-white/80 border-l-white/60 flex items-center gap-5 group"
                           >
                              <div className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-amber-900 shadow-xl shadow-amber-100 group-hover:rotate-[-12deg] transition-transform">
                                 <Trophy size={28} />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Danh hiệu hiện tại</p>
                                 <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-900">Cấp {Math.floor((currentStudent.points || 0) / 1000) + 1}</span>
                                 </div>
                              </div>
                           </motion.div>
                        </div>
                     </motion.div>

                     <div className="flex gap-4">
                        <div className="px-8 py-5 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-100 flex items-center gap-4 group cursor-pointer hover:scale-105 transition-all">
                           <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                              <Trophy className="text-white" size={24} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Điểm của bạn</p>
                              <p className="text-2xl font-black">{currentStudent.points || 0}</p>
                           </div>
                        </div>

                        <div className="px-8 py-5 bg-white/80 backdrop-blur-md border-2 border-slate-50 rounded-[2rem] shadow-sm flex items-center gap-4 group cursor-pointer hover:border-indigo-100 transition-all hover:shadow-lg">
                           <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:rotate-12 transition-transform">
                              <Medal size={24} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Huy hiệu</p>
                              <p className="text-2xl font-black text-slate-900">{currentStudent.badges?.length || 0}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Avatar Card */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group hidden lg:block"
                  >
                     <div className="absolute inset-0 bg-indigo-600 rounded-[4rem] rotate-6 group-hover:rotate-3 transition-all duration-500"></div>
                     <div className="relative bg-white/60 backdrop-blur-xl p-4 rounded-[4rem] shadow-2xl overflow-hidden aspect-square border-8 border-white/20 group-hover:rotate-[-3deg] transition-all duration-500">
                        <img 
                          src={currentStudent.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${loggedInUser.username}`} 
                          className="w-full h-full object-cover rounded-[3rem] bg-white/20" 
                          alt="Học sinh" 
                        />
                        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-all"></div>
                        
                        {/* Status Floaties */}
                        <div className="absolute top-8 right-8 bg-emerald-500 w-6 h-6 rounded-full border-4 border-white animate-pulse"></div>
                     </div>
                  </motion.div>
               </div>

               {/* Stats Bento Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { label: 'Bài đã làm', val: studentSubmissions.length, icon: Sparkles, color: 'text-blue-500', bg: 'bg-blue-50', unit: 'BÀI' },
                    { label: 'Điểm TB', val: studentSubmissions.length > 0 ? (studentSubmissions.reduce((acc, s) => acc + s.score, 0) / studentSubmissions.length).toFixed(1) : '0', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', unit: '/ 10' },
                    { label: 'Bạn đồng hành', val: studentClass?.students.length || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', unit: 'BẠN' },
                    { label: 'Hạng lớp', val: [...(studentClass?.students || [])].sort((a,b) => (b.points||0) - (a.points||0)).findIndex(s => s.id === loggedInUser.id) + 1, icon: Hash, color: 'text-rose-500', bg: 'bg-rose-50', unit: 'HẠNG' }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border-2 border-white/20 shadow-xl shadow-slate-200/20 flex flex-col gap-6 group hover:border-indigo-100 transition-all">
                       <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <stat.icon size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                          <div className="flex items-baseline gap-1">
                             <span className="text-3xl font-black text-slate-900">{stat.val}</span>
                             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{stat.unit}</span>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>

               {/* Badges Collection with Tooltip effect */}
                <div className="bg-white/60 backdrop-blur-xl p-12 rounded-[4rem] border-2 border-white/20 shadow-xl shadow-slate-200/20 relative overflow-hidden group/collection">
                   <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover/collection:scale-110 transition-transform duration-1000">
                      <Trophy size={200} />
                   </div>
                   <div className="flex justify-between items-center mb-10 relative z-10">
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 italic font-serif">Bộ sưu tập huy hiệu 🎖️</h3>
                        <p className="text-slate-400 font-bold text-sm mt-1">Càng học nhiều, bộ sưu tập càng rực rỡ!</p>
                      </div>
                      <div className="px-6 py-2 bg-white/40 backdrop-blur-sm text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                         Ưu tú • Level {Math.floor((currentStudent.points || 0) / 500) + 1}
                      </div>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 relative z-10">
                      {BADGES.map((badge) => {
                         const isEarned = currentStudent.badges?.includes(badge.id);
                         return (
                            <motion.div 
                               key={badge.id} 
                               whileHover={isEarned ? { scale: 1.1, rotate: [0, -5, 5, 0] } : {}}
                               className={`group/badge p-6 rounded-[2.5rem] border-2 text-center transition-all relative flex flex-col items-center gap-3 border-t-white/40 border-l-white/20 ${
                                 isEarned 
                                 ? `${badge.color} border-transparent shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:shadow-[0_24px_48px_rgba(0,0,0,0.2)] hover:-translate-y-2` 
                                 : 'bg-white/10 backdrop-blur-sm border-white/10 grayscale opacity-40 shadow-inner'
                               }`}
                            >
                               <div className="text-5xl mb-2 drop-shadow-md">{badge.icon}</div>
                               <p className="text-[10px] font-black uppercase tracking-tight text-slate-900 leading-none">{badge.name}</p>
                               {isEarned && (
                                 <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white border-4 border-white shadow-sm">
                                    <Check size={12} strokeWidth={4} />
                                 </div>
                               )}
                               
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-4 bg-slate-900 text-white rounded-2xl text-[10px] font-bold opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-20 shadow-2xl">
                                  <p className="text-indigo-300 mb-1 uppercase tracking-widest">{badge.name}</p>
                                  <p className="leading-relaxed opacity-80">{badge.description}</p>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                               </div>
                            </motion.div>
                         );
                      })}
                   </div>
                </div>

                {/* Additional Section: Recent Submissions / Ranking */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
                   <div className="bg-white/60 backdrop-blur-xl p-12 rounded-[4rem] border-2 border-white/20 shadow-xl shadow-slate-200/20 flex flex-col">
                      <div className="flex items-center justify-between mb-8">
                         <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                           <Clock className="text-indigo-600" /> Hoạt động gần đây
                         </h3>
                         <button onClick={() => setActiveView('assignments')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Tất cả bài tập</button>
                      </div>
                      
                      <div className="space-y-4 flex-1">
                         {studentSubmissions.length > 0 ? (
                           [...studentSubmissions].sort((a,b) => b.submittedAt - a.submittedAt).slice(0, 3).map((sub, sIdx) => {
                             const assignment = assignments.find(a => a.id === sub.assignmentId);
                             const exam = exams.find(e => e.id === assignment?.examId);
                             return (
                               <div key={sIdx} className="p-6 bg-white/20 backdrop-blur-sm rounded-[2.5rem] border border-white/10 flex items-center justify-between group hover:bg-white/40 hover:border-indigo-100 hover:shadow-md transition-all">
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-white/40 backdrop-blur-sm rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                                        <BookOpen size={20} />
                                     </div>
                                     <div>
                                        <p className="text-sm font-black text-slate-900">{exam?.title || 'Bài tập đã xóa'}</p>
                                        <p className="text-[10px] font-black text-slate-400">{new Date(sub.submittedAt).toLocaleDateString('vi-VN')} • {exam?.category}</p>
                                     </div>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-xl font-black text-indigo-600">{sub.score.toFixed(1)}</p>
                                     <p className="text-[10px] font-black text-slate-400 uppercase">Điểm</p>
                                  </div>
                               </div>
                             );
                           })
                         ) : (
                           <div className="h-full flex flex-col items-center justify-center text-center py-8">
                              <p className="text-slate-400 font-bold">Chưa có hoạt động nào gần đây.</p>
                              <button onClick={() => setActiveView('assignments')} className="mt-4 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Bắt đầu học ngay!</button>
                           </div>
                         )}
                      </div>
                   </div>

                   <div className="bg-indigo-700/90 backdrop-blur-3xl p-12 rounded-[4rem] shadow-[0_45px_100px_rgba(79,70,229,0.4)] text-white overflow-hidden relative group border-4 border-white/20 border-t-white/40 border-l-white/30">
                      <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-1000 rotate-12">
                         <Trophy size={200} />
                      </div>
                      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-[80px]"></div>
                      
                      <div className="relative z-10 h-full flex flex-col">
                         <div className="flex items-center justify-between mb-10">
                            <h3 className="text-3xl font-black italic font-serif">Bảng vàng lớp {studentClass?.name} 🏆</h3>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-inner">
                               <Stars size={20} className="text-amber-300" />
                            </div>
                         </div>

                         <div className="space-y-4 flex-1">
                            {[...(studentClass?.students || [])]
                              .sort((a,b) => (b.points||0) - (a.points||0))
                              .slice(0, 6)
                              .map((s, idx) => {
                                const isCurrentUser = s.id === loggedInUser.id;
                                return (
                                  <motion.div 
                                    key={s.id} 
                                    whileHover={{ x: 10, scale: 1.02 }}
                                    className={`flex items-center justify-between p-5 rounded-[2.5rem] transition-all relative overflow-hidden group/item ${
                                      isCurrentUser 
                                      ? 'bg-white/30 border-2 border-white/40 backdrop-blur-md shadow-xl' 
                                      : 'hover:bg-white/10 border-2 border-transparent hover:border-white/10'
                                    }`}
                                  >
                                     <div className="flex items-center gap-5">
                                        <div className="relative">
                                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg relative z-10 transition-transform group-hover/item:scale-110 ${
                                              idx === 0 ? 'bg-amber-400 text-amber-900 shadow-amber-500/50 rotate-3' : 
                                              idx === 1 ? 'bg-slate-300 text-slate-900 shadow-slate-400/30 -rotate-3' : 
                                              idx === 2 ? 'bg-orange-400 text-orange-900 shadow-orange-500/40 rotate-6' : 
                                              'bg-white/10 text-white'
                                           }`}>
                                              {idx + 1}
                                           </div>
                                           {idx === 0 && <div className="absolute -top-3 -left-3 text-2xl animate-bounce z-20">👑</div>}
                                        </div>

                                        <div className="flex items-center gap-4">
                                           <div className="w-12 h-12 rounded-2xl border-2 border-white/30 overflow-hidden shadow-md flex-shrink-0 bg-white/20">
                                              <img 
                                                src={s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.username}`} 
                                                alt={s.name} 
                                                className="w-full h-full object-cover" 
                                              />
                                           </div>
                                           <div>
                                              <span className={`font-black text-base flex items-center gap-2 ${isCurrentUser ? 'text-white' : 'text-indigo-100'}`}>
                                                {s.name} {isCurrentUser && <span className="px-2 py-0.5 bg-white/20 rounded-md text-[8px] uppercase tracking-tighter">Bạn</span>}
                                              </span>
                                              <div className="flex items-center gap-1 mt-0.5">
                                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                                 <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Level {Math.floor((s.points || 0) / 500) + 1}</span>
                                              </div>
                                           </div>
                                        </div>
                                     </div>

                                     <div className="text-right pr-2">
                                        <div className="flex flex-col">
                                           <span className="font-black text-2xl tracking-tighter leading-none">{s.points || 0}</span>
                                           <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50">ĐIỂM</span>
                                        </div>
                                     </div>
                                     
                                     {isCurrentUser && (
                                       <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:item:translate-x-full transition-transform duration-1000"></div>
                                     )}
                                  </motion.div>
                                );
                              })}
                         </div>
                         
                         {/* Footer encouragement */}
                         <div className="mt-8 flex items-center justify-center p-4 bg-white/10 rounded-3xl border border-white/5 backdrop-blur-sm">
                            <p className="text-xs font-bold text-indigo-100 flex items-center gap-2">
                               <Zap size={14} className="text-amber-300" /> 
                               Cố gắng để thăng hạng cao hơn nhé!
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
            </div>
          ) : (
            <div className="space-y-12">
               <div className="flex justify-between items-center">
                  <h2 className="text-4xl font-black text-slate-900 italic font-serif leading-none">Bài tập về nhà 🎒</h2>
                  <div className="px-6 py-3 bg-white/40 backdrop-blur-sm border-2 border-white/10 rounded-2xl shadow-sm">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{studentAssignments.length} Bài đang mở</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {studentAssignments.map((assignment, idx) => {
                    const exam = exams.find(e => e.id === assignment.examId);
                    const classSubmissions = studentSubmissions.filter(s => s.assignmentId === assignment.id);
                    const bestScore = getBestScore(assignment.id);
                    const isCompleted = classSubmissions.length >= assignment.attempts;
                    
                    return (
                      <div 
                        key={assignment.id} 
                        className={`bg-white/60 backdrop-blur-xl rounded-[3rem] border-2 border-white/30 p-10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] border-t-white/50 border-l-white/40 transition-all relative group flex flex-col hover:border-indigo-100 hover:shadow-[0_45px_100px_-20px_rgba(0,0,0,0.2)] hover:translate-y-[-12px]`}
                      >
                         <div className="flex justify-between items-start mb-8">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 ${
                              isCompleted ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'
                            }`}>
                               {isCompleted ? <CheckCircle2 size={32} /> : <BookOpen size={32} />}
                            </div>
                            {bestScore !== null && (
                               <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-black text-sm border border-amber-100">
                                  {bestScore.toFixed(1)} / 10
                               </div>
                            )}
                         </div>

                         <div className="flex-1">
                            <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">{exam?.title}</h3>
                            <div className="flex flex-wrap gap-2 mb-8">
                               <span className="px-4 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">{exam?.category}</span>
                               <span className="px-4 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">{exam?.duration} phút</span>
                            </div>

                            <div className="mb-10 text-[10px] font-black">
                               <div className="flex justify-between items-center mb-2">
                                  <span className="text-slate-400 uppercase tracking-widest">Tiến trình thử</span>
                                  <span className="text-indigo-600">{classSubmissions.length} / {assignment.attempts}</span>
                               </div>
                               <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${(classSubmissions.length / assignment.attempts) * 100}%` }}
                                  ></div>
                               </div>
                            </div>
                         </div>

                         <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                               <Calendar size={14} />
                               Hết hạn: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                            </div>
                            <button 
                              onClick={() => handleStartExam(assignment.id)}
                              disabled={isCompleted}
                              className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                                isCompleted 
                                ? 'bg-slate-50 text-slate-300 cursor-not-allowed' 
                                : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-lg active:scale-95'
                              }`}
                            >
                               {isCompleted ? 'Hoàn thành' : 'Vào bài'}
                            </button>
                         </div>
                      </div>
                    );
                  })}

                  {studentAssignments.length === 0 && (
                    <div className="col-span-full py-24 text-center bg-white/40 backdrop-blur-xl rounded-[48px] border-2 border-dashed border-white/20">
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                        <MessageSquare className="w-10 h-10 text-slate-200" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-3">Chưa có bài tập nào</h3>
                      <p className="text-slate-400 font-bold max-w-sm mx-auto">Giáo viên của bạn chưa giao bài tập nào cho lớp {studentClass?.name}.</p>
                    </div>
                  )}
               </div>
            </div>
          )}
       </main>
       
       <footer className="p-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] bg-white/40 backdrop-blur-md border-t border-white/10">
          © 2026 DIGITAL EDUCATION • Academic Excellence 💖 Developer By LOVE LE
       </footer>

       {/* Welcome Start Modal */}
       {pendingAssignmentId && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
           <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setPendingAssignmentId(null)}
           />
           <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white w-full max-w-lg rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col items-center text-center p-12 border-2 border-slate-50 z-10"
           >
              <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-indigo-500/20 to-purple-600/10 -z-10"></div>
               <motion.div 
                 animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute top-6 left-6 text-indigo-200"
               >
                 <Rocket size={48} />
               </motion.div>
               <motion.div 
                 animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
                 transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                 className="absolute top-12 right-8 text-purple-200"
               >
                 <Trophy size={40} />
               </motion.div>
              
              <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 shadow-inner mb-8 relative z-10 border-4 border-white mt-4">
                 <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}><Sparkles size={48} /></motion.div>
              </div>

              <div className="relative z-10 w-full">
                 <h2 className="text-3xl font-black text-slate-900 mb-4 italic font-serif">Sẵn sàng chưa, {loggedInUser.name}! 🚀</h2>
                 <p className="text-slate-500 font-bold mb-8 text-lg">
                    Chúc bạn làm bài thật tốt và đạt điểm cao nhất nhé! Hãy tự tin chinh phục mọi thử thách. ✨
                 </p>

                 <div className="bg-indigo-50/50 w-full rounded-[3rem] p-8 mb-10 flex flex-col gap-5 border border-indigo-100/50 backdrop-blur-sm shadow-inner">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <span>Bài tập</span>
                       <span className="text-indigo-600 text-right max-w-[60%]">{exams.find(e => e.id === assignments.find(a => a.id === pendingAssignmentId)?.examId)?.title}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <span>Thời gian</span>
                       <span className="text-slate-900">{exams.find(e => e.id === assignments.find(a => a.id === pendingAssignmentId)?.examId)?.duration} phút</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <span>Số câu hỏi</span>
                       <span className="text-slate-900">{exams.find(e => e.id === assignments.find(a => a.id === pendingAssignmentId)?.examId)?.questions.length} câu</span>
                    </div>
                 </div>

                 <div className="flex flex-col gap-4">
                    <button 
                       onClick={confirmStartExam}
                       className="w-full py-6 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-[2.5rem] font-black text-base uppercase tracking-[0.15em] shadow-2xl shadow-indigo-200 hover:from-indigo-700 hover:to-indigo-800 transition-all flex items-center justify-center gap-4 group active:scale-95"
                    >
                       Bắt đầu chinh phục <ArrowRight size={18} />
                    </button>
                    <button 
                       onClick={() => setPendingAssignmentId(null)}
                       className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
                    >
                       Cần thêm thời gian ôn tập
                    </button>
                 </div>
              </div>
           </motion.div>
         </div>
        )}
        <AppFooter onAuthor={onAuthor} onTerms={onTerms} />
     </div>
  );
}

export default function App() {
  const [role, setRole] = useState<LoginRole>('student');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [userRole, setUserRole] = useState<LoginRole | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<Student | null>(null);
  const [loggedInTeacher, setLoggedInTeacher] = useState<Teacher | null>(null);
  const [studentClassId, setStudentClassId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerRole, setRegisterRole] = useState<'teacher' | 'student'>('teacher');
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    workUnit: '',
    teachingClasses: '',
    username: '',
    password: '',
    confirmPassword: '',
    email: ''
  });
  
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('eduvision_teachers');
    const parsed = saved ? JSON.parse(saved) : [];
    if (parsed.length === 0) {
      return [{
        id: 't1',
        fullName: 'Cô Giáo Mẫu',
        username: 'gv123',
        password: '123',
        email: 'mau@eduvision.vn',
        workUnit: 'Trường Tiểu học Chu Văn An',
        teachingClasses: 'Khối 1, 2'
      }];
    }
    return parsed;
  });

  useEffect(() => {
    localStorage.setItem('eduvision_teachers', JSON.stringify(teachers));
  }, [teachers]);

  // State for all classes and students, moved up to App level
  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    const saved = localStorage.getItem('eduvision_classes');
    const parsed = saved ? JSON.parse(saved) : [];
    if (parsed.length === 0) {
      return [{
        id: 'class-sample-1',
        name: 'Lớp 1A (Mẫu)',
        teacherId: 't1', // Match with sample teacher
        students: [
          { id: 's1', name: 'Nguyễn Văn An', username: 'an123', password: '123', points: 1500, badges: ['first_step'] },
          { id: 's2', name: 'Trần Thị Bình', username: 'binh123', password: '123', points: 1200, badges: [] }
        ]
      }];
    }
    return parsed;
  });

  // Save classes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('eduvision_classes', JSON.stringify(classes));
  }, [classes]);

  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('eduvision_exams');
    const parsed = saved ? JSON.parse(saved) : [];
    
    // Nếu chưa có đề nào, thêm các đề mẫu để giáo viên tham khảo
    if (parsed.length === 0) {
      const currentTime = Date.now();
      const sampleExams: Exam[] = [
        {
          id: 'template-math-1',
          title: 'Đề ôn tập mẫu: Phép cộng trong phạm vi 10',
          className: 'Khối lớp 1',
          duration: 15,
          category: 'Toán',
          createdAt: currentTime,
          questions: [
            {
              id: 'q1',
              type: 'Trắc nghiệm',
              content: 'Kết quả của phép tính 5 + 3 là:',
              options: ['6', '7', '8', '9'],
              correctAnswer: '8',
              difficulty: 'recognition'
            },
            {
              id: 'q2',
              type: 'Trắc nghiệm',
              content: 'Số nào cộng với 4 để được kết quả là 10?',
              options: ['4', '5', '6', '7'],
              correctAnswer: '6',
              difficulty: 'understanding'
            },
            {
              id: 'q3',
              type: 'Trắc nghiệm',
              content: 'Nam có 3 cái kẹo, Lan cho Nam thêm 4 cái nữa. Hỏi Nam có tất cả mấy cái kẹo?',
              options: ['5 cái', '6 cái', '7 cái', '8 cái'],
              correctAnswer: '7 cái',
              difficulty: 'application'
            }
          ]
        },
        {
          id: 'template-english-1',
          title: 'Unit 1: Hello - Tuyển tập từ vựng',
          className: 'Khối lớp 1',
          duration: 10,
          category: 'Tiếng Anh',
          createdAt: currentTime - 3600000,
          questions: [
            {
              id: 'e1',
              type: 'Trắc nghiệm',
              content: '"Xin chào" trong tiếng Anh là gì?',
              options: ['Hello', 'Goodbye', 'Thank you', 'Sorry'],
              correctAnswer: 'Hello',
              difficulty: 'recognition'
            },
            {
              id: 'e2',
              type: 'Trắc nghiệm',
              content: 'Khi gặp cô giáo vào buổi sáng, em nên chào như thế nào?',
              options: ['Good evening', 'Good morning', 'Good night', 'Goodbye'],
              correctAnswer: 'Good morning',
              difficulty: 'understanding'
            }
          ]
        }
      ];
      return sampleExams;
    }
    return parsed;
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('eduvision_assignments');
    const parsed = saved ? JSON.parse(saved) : [];
    if (parsed.length === 0) {
      return [{
        id: 'assignment-sample-1',
        examId: 'template-math-1',
        classId: 'class-sample-1',
        dueDate: new Date(Date.now() + 604800000).toISOString(),
        attempts: 2,
        assignedAt: Date.now()
      }];
    }
    return parsed;
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('eduvision_submissions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('eduvision_exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('eduvision_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('eduvision_submissions', JSON.stringify(submissions));
  }, [submissions]);
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Logic đăng nhập cho giáo viên
    if (role === 'teacher') {
      const teacher = teachers.find(t => t.username === userId && t.password === password);
      // Giữ lại fallback admin nếu muốn, hoặc chỉ dùng teachers
      if (teacher || (userId === 'admin' && password === '123456')) {
        setIsLoggedIn(true);
        setUserRole('teacher');
        setLoggedInTeacher(teacher || {
          id: 'admin',
          fullName: 'Quản trị viên Hệ thống',
          username: 'admin',
          password: 'password',
          email: 'admin@eduvision.vn',
          workUnit: 'EduVision HQ',
          teachingClasses: 'Toàn bộ'
        });
        setError('');
      } else {
        setError('Sai tên đăng nhập hoặc mật khẩu giáo viên!');
      }
    } else {
      // Logic cho học sinh: Tìm kiếm trong danh sách mà giáo viên đã tạo
      let foundStudent: Student | null = null;
      let foundClassId: string | null = null;
      
      for (const schoolClass of classes) {
        const student = schoolClass.students.find(
          s => s.username === userId && s.password === password
        );
        if (student) {
          foundStudent = student;
          foundClassId = schoolClass.id;
          break;
        }
      }
      
      if (foundStudent && foundClassId) {
        setIsLoggedIn(true);
        setUserRole('student');
        setLoggedInUser(foundStudent);
        setStudentClassId(foundClassId);
        setError('');
      } else {
        setError('Tài khoản hoặc mật khẩu học sinh không chính xác!');
      }
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setLoggedInUser(null);
    setLoggedInTeacher(null);
    setStudentClassId(null);
    setUserId('');
    setPassword('');
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (registerForm.password !== registerForm.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (registerRole === 'teacher') {
      if (teachers.some(t => t.username === registerForm.username)) {
        alert('Tên tài khoản giáo viên đã tồn tại!');
        return;
      }

      const newTeacher: Teacher = {
        id: Date.now().toString(),
        fullName: registerForm.fullName,
        workUnit: registerForm.workUnit,
        teachingClasses: registerForm.teachingClasses,
        username: registerForm.username,
        password: registerForm.password,
        email: registerForm.email
      };

      setTeachers([...teachers, newTeacher]);
      setIsLoggedIn(true);
      setUserRole('teacher');
      setLoggedInTeacher(newTeacher);
      alert('Chào mừng thầy/cô ' + newTeacher.fullName + '! Tài khoản giáo viên đã được kích hoạt.');
    } else {
      // Logic register for student
      // Find or create a "Lớp Tự Do" for independent students
      let communityClass = classes.find(c => c.name === 'Lớp Tự Do');
      let updatedClasses = [...classes];
      
      const newStudent: Student = {
        id: 's' + Date.now().toString(),
        name: registerForm.fullName,
        username: registerForm.username,
        password: registerForm.password,
        points: 0,
        badges: []
      };

      if (!communityClass) {
        communityClass = {
          id: 'c-community',
          name: 'Lớp Tự Do',
          grade: 'Cộng đồng',
          teacherId: 'admin',
          students: [newStudent]
        };
        updatedClasses.push(communityClass);
      } else {
        communityClass.students.push(newStudent);
        updatedClasses = updatedClasses.map(c => c.id === 'c-community' ? communityClass! : c);
      }

      setClasses(updatedClasses);
      setIsLoggedIn(true);
      setUserRole('student');
      setLoggedInUser(newStudent);
      setStudentClassId(communityClass.id);
      alert('Chào bạn ' + newStudent.name + '! Chào mừng bạn gia nhập cộng đồng học tập.');
    }

    setShowRegister(false);
    setRegisterForm({
      fullName: '',
      workUnit: '',
      teachingClasses: '',
      username: '',
      password: '',
      confirmPassword: '',
      email: ''
    });
  };

  // Nếu đã đăng nhập và là giáo viên, hiển thị Dashboard 2
  if (isLoggedIn && userRole === 'teacher') {
    return <TeacherDashboard 
      onLogout={handleLogout} 
      classes={classes} 
      setClasses={setClasses}
      exams={exams}
      setExams={setExams}
      assignments={assignments}
      setAssignments={setAssignments}
      submissions={submissions}
      setSubmissions={setSubmissions}
      loggedInTeacher={loggedInTeacher}
      teachers={teachers}
      setTeachers={setTeachers}
      onAuthor={() => setShowAuthorModal(true)}
      onTerms={() => setShowTermsModal(true)}
    />;
  }

  // Nếu là học sinh đã đăng nhập
  if (isLoggedIn && userRole === 'student' && loggedInUser && studentClassId) {
    return (
      <StudentDashboard 
        loggedInUser={loggedInUser}
        studentClassId={studentClassId}
        exams={exams}
        assignments={assignments}
        submissions={submissions}
        setSubmissions={setSubmissions}
        setClasses={setClasses}
        onLogout={handleLogout}
        classes={classes}
        onAuthor={() => setShowAuthorModal(true)}
        onTerms={() => setShowTermsModal(true)}
      />
    );
  }

  return (
    <div 
      id="login-page" 
      className="min-h-screen font-sans flex flex-col justify-between p-6 relative overflow-hidden bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      {/* Light protective overlay so children's illustration is vivid yet content is crystal clear */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] pointer-events-none"></div>

      {/* Top Navigation for Landing Page */}
      <header className="max-w-6xl w-full mx-auto py-3 px-6 bg-white/90 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20 text-white">
            <GraduationCap size={22} />
          </div>
          <div>
            <span className="block text-slate-900 font-extrabold text-base tracking-tight leading-none uppercase">Digital Edu</span>
            <span className="block text-slate-400 font-semibold text-[11px] tracking-normal mt-0.5">Cổng Dạy & Học Số</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setRegisterRole('teacher');
              setShowRegister(true);
            }}
            className="px-4 py-2 bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl shadow-xs transition-all active:scale-95 text-xs"
          >
            Đăng ký tài khoản
          </button>
        </div>
      </header>

      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 py-8 lg:py-12">
        {/* Left Side: Product Value & Features */}
        <div className="lg:col-span-7 space-y-8 pr-0 lg:pr-8 bg-white/85 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/60 shadow-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100/80 rounded-full text-indigo-700 text-xs font-bold tracking-wide">
            <Sparkles size={14} />
            <span>Nền tảng giao bài tập về nhà trực tuyến thế hệ mới</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              💖 Học Thông Minh trong <span className="text-indigo-600">Kỷ Nguyên Số</span>
            </h1>
            <p className="text-base text-slate-600 font-normal max-w-xl leading-relaxed">
              Học để biết, học để làm, học để tự khẳng định mình, học để cùng chung sống.
            </p>
          </div>

          {/* Value Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <div className="p-4 bg-white/90 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <FileUp size={16} />
              </div>
              <h4 className="font-bold text-slate-900 text-xs mb-1">Tải đề từ Word</h4>
              <p className="text-[11px] text-slate-500 leading-normal">Nhận diện câu hỏi trắc nghiệm, đúng/sai, tự luận từ .docx</p>
            </div>
            <div className="p-4 bg-white/90 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                <BarChart3 size={16} />
              </div>
              <h4 className="font-bold text-slate-900 text-xs mb-1">Chấm điểm tự động</h4>
              <p className="text-[11px] text-slate-500 leading-normal">Báo cáo phổ điểm, độ phân hóa và tiến độ từng học sinh</p>
            </div>
            <div className="p-4 bg-white/90 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                <Award size={16} />
              </div>
              <h4 className="font-bold text-slate-900 text-xs mb-1">Tích điểm thi đua</h4>
              <p className="text-[11px] text-slate-500 leading-normal">Huy hiệu thành tích và phần thưởng động viên học tập</p>
            </div>
          </div>
        </div>

        {/* Right Side: Modern Login Form */}
        <div className="lg:col-span-5">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-900/5 p-7 sm:p-9 relative"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Đăng nhập</h2>
              <p className="text-slate-500 text-xs mt-1">Chọn vai trò để truy cập không gian học tập</p>
            </div>

            {/* Role Switcher */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
              <button
                 type="button"
                 onClick={() => { setRole('student'); setError(''); }}
                 className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                   role === 'student' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                 }`}
              >
                 <Users size={14} /> Học Sinh
              </button>
              <button
                 type="button"
                 onClick={() => { setRole('teacher'); setError(''); }}
                 className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                   role === 'teacher' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                 }`}
              >
                  <GraduationCap size={14} /> Giáo Viên
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {role === 'teacher' ? 'Tên đăng nhập' : 'Mã số / Tên học sinh'}
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    required
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-xs text-slate-900 placeholder:text-slate-400"
                    placeholder={role === 'teacher' ? 'Ví dụ: gv123 hoặc admin' : 'Ví dụ: khoi1 hoặc lananh'}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700">Mật khẩu</label>
                  <button 
                    type="button" 
                    onClick={() => alert('Mật khẩu mẫu của các tài khoản: Cô Linh (123), Học sinh (123), Admin (admin123)')}
                    className="text-[11px] font-medium text-indigo-600 hover:underline"
                  >
                    Xem mật khẩu mẫu
                  </button>
                </div>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-xs text-slate-900 placeholder:text-slate-400"
                    placeholder="Nhập mật khẩu"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 text-xs font-medium p-3 rounded-xl flex items-center gap-2 border border-rose-200/80">
                   <XCircle size={15} /> {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all active:scale-[0.98] text-xs uppercase tracking-wider mt-2"
              >
                Đăng nhập vào hệ thống
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setRegisterRole(role);
                    setShowRegister(true);
                  }}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Đăng ký ngay
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <AppFooter 
        onAuthor={() => setShowAuthorModal(true)} 
        onTerms={() => setShowTermsModal(true)} 
        className="max-w-6xl w-full mx-auto pt-4 bg-white/85 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm"
      />

      {/* Teacher Registration Modal - Modern Pop */}
      <AnimatePresence>
        {showRegister && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-white/90 backdrop-blur-3xl w-full max-w-4xl rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh] border-4 border-white/40 border-t-white/80 border-l-white/60"
            >
            <div className="p-10 border-b-2 border-white/10 flex justify-between items-center bg-blue-600/90 backdrop-blur-md text-white">
              <div>
                <h3 className="text-3xl font-black tracking-tight">
                  {registerRole === 'teacher' ? 'Trở thành Người hướng dẫn 🎓' : 'Tham gia cùng bạn bè 👫'}
                </h3>
                <p className="text-blue-100 font-extrabold text-sm uppercase tracking-widest mt-1 opacity-80">
                  {registerRole === 'teacher' ? 'Kiến tạo tương lai cho mầm non đất nước' : 'Khám phá tri thức, kết nối tương lai'}
                </p>
              </div>
              <button 
                onClick={() => setShowRegister(false)}
                className="w-12 h-12 bg-white/10 hover:bg-white text-white hover:text-blue-600 rounded-2xl transition-all flex items-center justify-center"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-10 overflow-y-auto space-y-10 no-scrollbar">
              {/* Role Toggle in Registration */}
              <div className="flex p-2 bg-slate-100 rounded-[2.5rem] w-full max-w-sm mx-auto gap-2 border-2 border-slate-50 shadow-inner">
                <button
                  type="button"
                  onClick={() => setRegisterRole('student')}
                  className={`flex-1 py-4 rounded-[2rem] font-black text-[10px] transition-all flex items-center justify-center gap-2 ${
                    registerRole === 'student' ? 'bg-white text-blue-700 shadow-xl' : 'text-slate-400 hover:bg-white/50'
                  }`}
                >
                  <Users size={14} /> HỌC SINH
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterRole('teacher')}
                  className={`flex-1 py-4 rounded-[2rem] font-black text-[10px] transition-all flex items-center justify-center gap-2 ${
                    registerRole === 'teacher' ? 'bg-white text-blue-700 shadow-xl' : 'text-slate-400 hover:bg-white/50'
                  }`}
                >
                  <GraduationCap size={14} /> GIÁO VIÊN
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { label: 'Họ và tên của bạn', placeholder: 'VD: Nguyễn Văn A', val: 'fullName', show: true },
                  { label: 'Trường học của bạn', placeholder: 'VD: Tiểu học Ánh Dương', val: 'workUnit', show: registerRole === 'teacher' },
                  { label: 'Lớp đang phụ trách', placeholder: 'VD: Lớp 1A', val: 'teachingClasses', show: registerRole === 'teacher' },
                  { label: 'Địa chỉ Email', placeholder: 'thayco@example.com', val: 'email', show: registerRole === 'teacher' },
                  { label: registerRole === 'teacher' ? 'Tên đăng nhập mới' : 'Mã số học sinh mới', placeholder: 'minh_nguyen_123', val: 'username', show: true }
                ].filter(f => f.show).map((field) => (
                  <div key={field.val} className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{field.label}</label>
                    <input 
                      type={field.val === 'email' ? 'email' : 'text'} 
                      required
                      value={(registerForm as any)[field.val]}
                      onChange={(e) => setRegisterForm({...registerForm, [field.val]: e.target.value})}
                      className="w-full px-6 py-4 bg-white/40 backdrop-blur-sm border-2 border-white/10 rounded-[1.5rem] focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none font-bold text-slate-900 transition-all shadow-sm"
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[
                   { label: 'Mật khẩu bí mật', val: 'password' },
                   { label: 'Nhập lại mật khẩu', val: 'confirmPassword' }
                 ].map((field) => (
                   <div key={field.val} className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{field.label}</label>
                    <input 
                      type="password" 
                      required
                      value={(registerForm as any)[field.val]}
                      onChange={(e) => setRegisterForm({...registerForm, [field.val]: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none font-bold text-slate-900 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                 ))}
              </div>

              <div className="pt-8">
                <button 
                  type="submit"
                  className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] shadow-xl hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-widest text-sm"
                >
                   🚀 Bắt đầu hành trình ngay!
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Author Modal */}
      {showAuthorModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xl z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-3xl w-full max-w-lg rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col border-4 border-white/40 border-t-white/80 border-l-white/60"
          >
            <div className="p-8 border-b-2 border-white/10 flex justify-between items-center bg-blue-600 backdrop-blur-md text-white">
              <h3 className="text-2xl font-black">Thông tin tác giả ✍️</h3>
              <button 
                onClick={() => setShowAuthorModal(false)} 
                className="w-10 h-10 bg-white/10 hover:bg-white text-white hover:text-blue-600 rounded-xl flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-10 text-center space-y-6">
              <div className="w-24 h-24 bg-blue-100 rounded-[2rem] mx-auto flex items-center justify-center text-blue-600 shadow-inner">
                <GraduationCap size={48} />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">Developer LOVE LE</h4>
                <p className="text-slate-500 font-bold italic">Teacher & Developer</p>
              </div>
              <p className="text-slate-600 font-medium leading-relaxed">
                Chào bạn! Mình là LOVE LE, tác giả của ứng dụng DIGITAL EDUCATION. Hệ thống này được xây dựng với mong muốn đem lại trải nghiệm học tập hiện đại, thú vị và đầy cảm hứng cho các bạn nhỏ.
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xl z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-3xl w-full max-w-2xl rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col border-4 border-white/40 border-t-white/80 border-l-white/60"
          >
            <div className="p-8 border-b-2 border-white/10 flex justify-between items-center bg-emerald-600 backdrop-blur-md text-white">
              <h3 className="text-2xl font-black">Điều khoản sử dụng 📜</h3>
              <button 
                onClick={() => setShowTermsModal(false)} 
                className="w-10 h-10 bg-white/10 hover:bg-white text-white hover:text-emerald-600 rounded-xl flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-10 overflow-y-auto max-h-[60vh] no-scrollbar space-y-8">
              <section className="space-y-3">
                <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Shield size={20} className="text-emerald-500" />
                  1. Tôn trọng người dùng
                </h4>
                <p className="text-slate-600 font-medium ml-7">Ứng dụng DIGITAL EDUCATION cam kết bảo mật thông tin cá nhân của học sinh và thầy cô theo đúng quy định.</p>
              </section>
              <section className="space-y-3">
                <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  2. Trách nhiệm học tập
                </h4>
                <p className="text-slate-600 font-medium ml-7">Mỗi học sinh cần có trách nhiệm tự thực hiện các bài thi của mình. Chúng mình khuyến khích tính trung thực trong học tập.</p>
              </section>
              <section className="space-y-3">
                <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Zap size={20} className="text-emerald-500" />
                  3. Nội dung & Bản quyền
                </h4>
                <p className="text-slate-600 font-medium ml-7">Toàn bộ nội dung câu hỏi và giao diện thuộc bản quyền của hệ thống DIGITAL EDUCATION. Nghiêm cấm hành vi sao chép cho mục đích thương mại.</p>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
