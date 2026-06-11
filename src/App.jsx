import React, { useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Home, Receipt, Settings, Bell, Search, AlertCircle, CheckCircle2, ChevronDown, 
  Wallet, Filter, Upload, FileSpreadsheet, FileText, X, Loader2, RefreshCw, Plus, PieChart as ChartIcon, FileSignature
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- 차트 및 시스템 코어 정적 더미 데이터 정의 ---
const cashFlowData = [
  { month: '1월', 수입: 4500, 지출: 3200, 잔액: 12000 },
  { month: '2월', 수입: 5200, 지출: 3800, 잔액: 13400 },
  { month: '3월', 수입: 4800, 지출: 6500, 잔액: 11700 },
  { month: '4월', 수입: 6100, 지출: 4200, 잔액: 13600 },
  { month: '5월', 수입: 5900, 지출: 4800, 잔액: 14700 },
  { month: '6월', 수입: 2000, 지출: 1500, 잔액: 15200 },
];

const expenseRatioData = [
  { name: '인건비', value: 4500000, color: '#4f46e5' }, 
  { name: '지급임차료', value: 2200000, color: '#0ea5e9' }, 
  { name: '지급수수료', value: 1500000, color: '#10b981' }, 
  { name: '복리후생비', value: 800000, color: '#f59e0b' }, 
  { name: '기타소모품', value: 500000, color: '#64748b' }, 
];

const demoTransactions = [
  { id: 1, date: '2026-06-10 14:30', merchant: '토스페이먼츠(주)', type: 'in', amount: 2500000, aiTag: '매출', confidence: 0.98, status: '분류 완료' },
  { id: 2, date: '2026-06-09 10:15', merchant: '구글클라우드', type: 'out', amount: 420000, aiTag: '지급수수료', confidence: 0.95, status: '분류 완료' },
  { id: 3, date: '2026-06-08 19:30', merchant: '배달의민족', type: 'out', amount: 68000, aiTag: '복리후생비', confidence: 0.65, status: '확인 필요' },
  { id: 4, date: '2026-06-08 14:00', merchant: '국세청(법인세)', type: 'out', amount: 3500000, aiTag: '세금과공과', confidence: 0.99, status: '분류 완료' },
  { id: 5, date: '2026-06-07 11:20', merchant: '쿠팡(주)', type: 'out', amount: 125000, aiTag: '소모품비', confidence: 0.55, status: '확인 필요' },
];

const demoInvoices = [
  { id: 1, date: '2026-06-01', client: '(주)스타트업컴퍼니', amount: 5500000, type: '매출', status: '발행 완료' },
  { id: 2, date: '2026-06-05', client: '패스트캠퍼스', amount: 1100000, type: '매입', status: '수취 완료' },
  { id: 3, date: '2026-06-10', client: '(주)토스', amount: 3300000, type: '매출', status: '발행 대기' },
];

// --- AI 비동기 바이너리 가공 버퍼 브릿지 헬퍼 함수 ---
async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
}

export default function App() {
  // --- 전역 마스터 상태 인스턴스 정의 수립 ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [uploadStep, setUploadStep] = useState(0);
  const [draftTx, setDraftTx] = useState({ date: '', merchant: '', amount: '', aiTag: '', type: 'out' });
  const [showSuccessToast, setShowSuccessToast] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // --- 통화 포맷팅 엔진 기능 및 세이프가드 수치 제어 ---
  const formatCurrency = (value) => {
    const safeValue = Number(value) || 0;
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(safeValue);
  };

  const actionRequiredCount = transactions.filter(tx => tx.status === '확인 필요').length;
  const filteredTransactions = transactions.filter(tx => 
    tx.merchant.includes(searchTerm) || tx.aiTag.includes(searchTerm)
  );

  // --- 핵심 오퍼레이션 비즈니스 핸들러 영역 ---
  const handleLoadDemoData = () => {
    setTransactions(demoTransactions);
    setSearchTerm('');
    setUploadStep(0);
    setErrorMessage('');
    setShowSuccessToast('시뮬레이션 데모 데이터가 장부에 바인딩되었습니다.');
    setTimeout(() => setShowSuccessToast(''), 3000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadStep(2);
    setErrorMessage('');

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === '여기에_복사한_API_키를_넣으세요' || apiKey.trim() === '') {
      setErrorMessage("AI API 키 환경변수가 누락되었습니다. 프로젝트 최상위 루트의 .env 파일 설정을 검수하십시오.");
      setUploadStep(1);
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
      const imagePart = await fileToGenerativePart(file);
      
      const prompt = `이 영수증 실물 이미지를 초정밀 OCR 분석하여 상업 금융 거래 정보를 정확하게 추출해라. 결과물 출력 시 다른 설명용 문장이나 마크다운 백틱 서식 기호(지정구문)를 완전히 배제하고, 오직 자바스크립트 JSON.parse 명령어가 즉각 수용 가능한 단 하나의 순수 JSON 단일 객체 문자열 형태로만 리턴해라. 출력 양식 스키마 포맷 필수 규칙: {"merchant": "영수증 내 발행 가맹점 실제 상호명 스트링", "amount": 25500, "aiTag": "회계법 기준에 의거하여 가장 적합한 회계 계정과목 명칭 텍스트 (반드시 '복리후생비', '소모품비', '지급임차료', '여비교통비' 중 매칭율이 가장 정교한 항목 딱 1개만을 선택하여 한글로 출력)"}`;
      
      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();
      console.log("Gemini raw response:", responseText);

      const cleanJsonStr = responseText
        .replace(/```json/g, '')
        .replace(/```JSON/g, '')
        .replace(/```/g, '')
        .trim();

      const jsonMatch = cleanJsonStr.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error(`Gemini가 JSON 객체를 반환하지 않았습니다. 실제 응답: ${cleanJsonStr}`);
      }

      let extractedData;

      try {
        extractedData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        throw new Error(`JSON 파싱 실패. 실제 응답: ${jsonMatch[0]}`);
      }

      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      setDraftTx({
        date: formattedDate,
        merchant: extractedData.merchant || '알 수 없음 가맹점',
        amount: String(extractedData.amount || 0),
        aiTag: extractedData.aiTag || '복리후생비',
        type: 'out'
      });
      setUploadStep(3);
    } catch (error) {
      console.error("AI 원격 분석 파이프라인 장애 예외 포착:", error);
      setUploadStep(1);
      setErrorMessage(`AI 분석 실패: ${error?.message || "알 수 없는 오류"}`);
    }
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    const cleanAmount = parseInt(draftTx.amount, 10);
    
    const newTransaction = {
      id: Date.now(),
      date: draftTx.date,
      merchant: draftTx.merchant,
      type: draftTx.type,
      amount: isNaN(cleanAmount) ? 0 : cleanAmount,
      aiTag: draftTx.aiTag,
      confidence: 1.00,
      status: '분류 완료'
    };
    
    setTransactions((prev) => [newTransaction, ...prev]);
    setUploadStep(0);
    setErrorMessage('');
    setShowSuccessToast('새로운 실물 거래 데이터가 장부에 영구 기록되었습니다.');
    setTimeout(() => setShowSuccessToast(''), 3000);
    setActiveTab('transactions');
  };

  const handleDownloadCSV = () => {
    if (transactions.length === 0) {
      alert("엑셀 내보내기를 집행할 원장 거래 내역 데이터가 존재하지 않습니다.");
      return;
    }

    const escapeCSV = (value) => {
      const stringValue = String(value ?? '');
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const headers = ['날짜', '거래처', '분류', '구분', '금액', '상태'];
    const rows = transactions.map((tx) => {
      const typeStr = tx.type === 'in' ? '입금(매출)' : '출금(지출)';
      return [tx.date, tx.merchant, tx.aiTag, typeStr, tx.amount, tx.status].map(escapeCSV).join(',');
    });

    const csvContent = `\uFEFF${headers.map(escapeCSV).join(',')}\n${rows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '부기_AI_재무거래원장내역_수출본.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // --- 공통 LNB / GNB 서브 레이아웃 렌더링 세션 함수 (순정 일반함수 구조화) ---
  const renderNavItem = ({ tab, icon: Icon, label, badge }) => (
    <button 
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeTab === tab ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
    >
      <Icon size={20} /> 
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
          {badge}
        </span>
      )}
    </button>
  );

  const renderSidebar = () => (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-20 print:hidden">
      <div className="p-6 flex items-center gap-3 text-white font-bold text-2xl tracking-tight border-b border-slate-800">
        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
          <Wallet size={20} className="text-white" />
        </div>
        <span>Boogie</span>
      </div>
      <nav className="flex-1 px-4 space-y-1.5 mt-6">
        {renderNavItem({ tab: 'dashboard', icon: Home, label: '대시보드', badge: 0 })}
        {renderNavItem({ tab: 'transactions', icon: Receipt, label: 'AI 거래 내역', badge: actionRequiredCount })}
        {renderNavItem({ tab: 'reports', icon: ChartIcon, label: '재무 보고서', badge: 0 })}
        {renderNavItem({ tab: 'invoices', icon: FileSignature, label: '세금계산서', badge: 0 })}
        {renderNavItem({ tab: 'integrations', icon: Settings, label: '연동 및 설정', badge: 0 })}
      </nav>
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <button 
          onClick={handleLoadDemoData} 
          className="w-full flex items-center justify-center gap-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 py-2.5 px-4 rounded-xl text-sm font-semibold transition shadow-inner"
        >
          <RefreshCw size={14} className="" /> 
          <span>시뮬레이션 데이터 로드</span>
        </button>
      </div>
    </div>
  );

  const renderTopbar = () => (
    <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 print:hidden">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight">
        {activeTab === 'dashboard' && '재무 분석 대시보드'}
        {activeTab === 'transactions' && 'AI 실시간 거래 원장'}
        {activeTab === 'reports' && '월간 지출 분석 리포트'}
        {activeTab === 'invoices' && '국세청 전자 세금계산서 연동'}
        {activeTab === 'integrations' && '연동 인프라 환경설정'}
      </h1>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => { setUploadStep(1); setErrorMessage(''); }} 
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition active:scale-95 shadow-md shadow-slate-900/10"
        >
          <Plus size={16} /> 
          <span>영수증/증빙 업로드</span>
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1"></div>
        <button className="p-2 text-slate-400 hover:text-slate-600 relative rounded-xl hover:bg-slate-50 transition">
          <Bell size={22} />
          {actionRequiredCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
        </button>
      </div>
    </div>
  );

  // --- 개별 가상 탭 뷰 영역 함수 구현 세션 ---
  const renderDashboardView = () => (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">총 보유 가용 현금</p>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(152000000)}</h2>
          </div>
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-2">↑ 전월 영업 현금흐름 대비 3.4% 증가</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">안정 한계 런웨이 (Runway)</p>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full inline-block shadow-sm shadow-emerald-500/50"></span> 
              <span>12.5 개월</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400">현재 연소율(Burn Rate) 기준 자금 생존 한계 기한</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">처리 원장 총 볼륨</p>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{transactions.length} 건</h2>
          </div>
          <p className="text-xs text-slate-400">당월 수집 처리 완료 및 미분류 검수 건 총합</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-800">재무 현금흐름 및 자금 보유고 추이</h3>
            <span className="text-xs text-slate-400">단위: 백만 원 (M)</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.00}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `${val/1000}M`} />
                <Tooltip formatter={(value) => formatCurrency(value * 10000)} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontSize: '13px' }} />
                <Area type="monotone" dataKey="잔액" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" name="가용 현금 잔액" />
                <Line type="monotone" dataKey="수입" stroke="#10b981" strokeWidth={2} dot={false} name="영업 수입" />
                <Line type="monotone" dataKey="지출" stroke="#ef4444" strokeWidth={2} dot={false} name="운영 지출" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>AI 가속 태스크 가이드</span>
          </h3>
          <div className="flex-1 flex flex-col justify-center">
            {transactions.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center h-full text-slate-400 space-y-3">
                <AlertCircle size={32} className="opacity-30" />
                <p className="text-sm font-medium leading-relaxed">원장 데이터가 비어있습니다.<br/>좌측 최하단 단추를 눌러<br/>시뮬레이션을 구동하십시오.</p>
              </div>
            ) : actionRequiredCount > 0 ? (
              <div 
                onClick={() => setActiveTab('transactions')}
                className="p-5 bg-orange-50 rounded-2xl border border-orange-100 flex flex-col justify-between h-full cursor-pointer hover:bg-orange-100/70 transition group shadow-sm"
              >
                <div className="flex gap-4">
                  <AlertCircle className="text-orange-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" size={22} />
                  <div>
                    <p className="font-bold text-orange-900 text-sm">{actionRequiredCount}건의 영수증 내역 검수 요망</p>
                    <p className="text-orange-700 text-xs mt-1.5 leading-relaxed">인공지능이 영수증 문자 판독 후 계정과목 분류 매칭율을 확신하지 못했습니다. 대표자 최종 검수 승인이 요구됩니다.</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600 mt-4 block text-right group-hover:translate-x-1 transition-transform">즉시 승인하러 가기 →</span>
              </div>
            ) : (
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-4 items-start h-full">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={22} />
                <div>
                  <p className="font-bold text-emerald-900 text-sm">모든 재무 증빙 분류 완결</p>
                  <p className="text-emerald-700 text-xs mt-1.5 leading-relaxed">미승인 처리된 아날로그 증빙이 없습니다. 모든 비용 과목이 완벽한 무결 등급 신뢰도로 장부에 편입되었습니다.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTransactionsView = () => (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="거래처 상호명 또는 계정과목 실시간 검색..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-80 bg-white shadow-inner" 
            />
          </div>
          <button 
            onClick={handleDownloadCSV} 
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition shadow-sm active:scale-95"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" /> 
            <span>엑셀 다운로드 (CSV)</span>
          </button>
        </div>
        
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="p-4 pl-6">작성 일자 및 시각</th>
                <th className="p-4">증빙 거래처 상호</th>
                <th className="p-4 text-right">거래 금액</th>
                <th className="p-4 pl-8">AI 비용 과목 태그</th>
                <th className="p-4 text-center pr-6">오퍼레이션 상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/40 transition group">
                  <td className="p-4 pl-6 text-slate-500 font-mono">{tx.date}</td>
                  <td className="p-4 font-semibold text-slate-900">{tx.merchant}</td>
                  <td className={`p-4 text-right font-black tracking-tight ${tx.type === 'in' ? 'text-indigo-600' : 'text-slate-900'}`}>
                    {tx.type === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  <td className="p-4 pl-8">
                    {tx.status === '분류 완료' ? (
                      <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 text-xs font-bold">
                        {tx.aiTag}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-300 text-xs font-bold animate-pulse">
                        {tx.aiTag}? (검수 요망)
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center pr-6">
                    {tx.status === '분류 완료' ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                        장부 반영 완료
                      </span>
                    ) : (
                      <button 
                        onClick={() => setTransactions((prev) => prev.map(t => t.id === tx.id ? { ...t, status: '분류 완료' } : t))} 
                        className="text-xs font-black text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition"
                      >
                        확정하기
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-slate-400 font-medium">
                    조회된 내역이 없습니다. 하단 시뮬레이션 버튼을 누르거나 새 영수증을 업로드해 장부를 보강하십시오.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReportsView = () => (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <p className="text-sm font-medium text-slate-500">리포트 인쇄 미디어 엔진 활성화 단추</p>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-600/10"
        >
          <FileText size={16} /> 
          <span>리포트 PDF / 출력 실행</span>
        </button>
      </div>

      <div className="border border-slate-200 bg-white rounded-3xl p-8 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto print:border-none print:shadow-none">
        <div className="flex flex-col items-center justify-center p-4">
          <div className="h-80 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={expenseRatioData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={85} 
                  outerRadius={120} 
                  paddingAngle={4} 
                  dataKey="value"
                >
                  {expenseRatioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">당월 지출 총액</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{formatCurrency(9500000)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center space-y-5">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">회계 비용 항목별 지출 중량 분포</h3>
          <div className="space-y-3.5">
            {expenseRatioData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                  <span className="font-semibold text-slate-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(item.value)}</span>
                  <span className="text-xs font-black text-slate-400 w-10 text-right bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                    {Math.round((item.value / 9500000) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInvoicesView = () => (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">국세청 전자세금계산서 발행 내역 명세</h3>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">홈택스 API 실시간 연동 중</span>
        </div>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="p-4 pl-6">신고 작성 일자</th>
              <th className="p-4">구분</th>
              <th className="p-4">공급 거래처 사업자 명칭</th>
              <th className="p-4 text-right">공급가액 및 세액 총합</th>
              <th className="p-4 text-center pr-6">발행 국세청 신고 상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {demoInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50/30 transition">
                <td className="p-4 pl-6 text-slate-500 font-mono">{inv.date}</td>
                <td className="p-4">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${inv.type === '매출' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                    {inv.type}
                  </span>
                </td>
                <td className="p-4 font-medium text-slate-900">{inv.client}</td>
                <td className="p-4 text-right font-bold text-slate-900 font-mono">{formatCurrency(inv.amount)}</td>
                <td className="p-4 text-center pr-6">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${inv.status === '발행 대기' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- 메인 마스터 루트 컴포넌트 마운트 스크립트 ---
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-900 selection:bg-indigo-500 selection:text-white">
      {renderSidebar()}
      
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        {renderTopbar()}
        <main className="flex-1 overflow-auto">
          {activeTab === 'dashboard' && renderDashboardView()}
          {activeTab === 'transactions' && renderTransactionsView()}
          {activeTab === 'reports' && renderReportsView()}
          {activeTab === 'invoices' && renderInvoicesView()}
          {activeTab === 'integrations' && (
            <div className="p-16 text-center text-slate-400 max-w-md mx-auto mt-20 space-y-4">
              <Settings size={48} className="mx-auto text-slate-300 opacity-60 animate-spin" style={{ animationDuration: '4s' }} />
              <p className="text-base font-bold text-slate-700 mt-4">오픈뱅킹 및 홈택스 연동 준비 중</p>
              <p className="text-xs leading-relaxed text-slate-400">금융결제원 보안 API 인프라 게이트웨이 승인 및 기업용 법인 공동인증서 연동 규격을 구축 중인 스크린입니다.</p>
            </div>
          )}
        </main>
      </div>

      {/* --- 핵심 비즈니스: 인공지능 멀티모달 인식 상태 제어 모달 스크린 --- */}
      {uploadStep > 0 && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-[520px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {uploadStep === 1 && '실물 장부 증빙 AI 영수증 판독'}
                {uploadStep === 2 && 'AI 멀티모달 비전 OCR 분석 중'}
                {uploadStep === 3 && 'AI 자동 판독 원장 기록 최종 검수'}
              </h3>
              <button 
                onClick={() => setUploadStep(0)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-auto max-h-[80vh]">
              {errorMessage && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-200 flex items-start gap-2.5 leading-relaxed">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
              
              {uploadStep === 1 && (
                <label className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition flex flex-col items-center justify-center p-12 cursor-pointer group shadow-inner">
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload size={24} className="text-indigo-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">영수증 파일(이미지) 선택</p>
                  <p className="text-xs text-slate-400 mt-2 text-center leading-relaxed">
                    구글 Gemini 1.5 Flash 멀티모달 엔진 인터페이스가<br/>상호명, 실거래 금액, 회계 계정과목을 즉시 가공 추출합니다.
                  </p>
                </label>
              )}

              {uploadStep === 2 && (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <Loader2 size={44} className="text-indigo-600 animate-spin mb-4" />
                  <p className="text-base font-bold text-slate-800">인공지능 비전 OCR 텍스트 판독 중...</p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">영수증 이미지 이진 행렬 스트림 변환 및 단어 패턴을 임베딩하여<br/>회계 규격에 맞게 매핑 파싱을 가공 중입니다. 잠시만 기다리십시오.</p>
                </div>
              )}

              {uploadStep === 3 && (
                <form onSubmit={handleSaveDraft} className="space-y-4 text-sm">
                  <div className="p-3.5 bg-indigo-50 text-indigo-800 text-xs font-semibold rounded-xl border border-indigo-100 leading-relaxed flex items-start gap-2">
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                    <span>AI 판독이 완결되었습니다. 장부에 전사 편입하기 전 실거래 원장 스펙을 보정하거나 확정하십시오.</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">증빙 전사 일자</label>
                      <input 
                        type="text" 
                        value={draftTx.date} 
                        onChange={(e) => setDraftTx({...draftTx, date: e.target.value})} 
                        className="w-full border border-slate-300 p-2.5 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">자금 거래 구분</label>
                      <select 
                        value={draftTx.type} 
                        onChange={(e) => setDraftTx({...draftTx, type: e.target.value})} 
                        className="w-full border border-slate-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="out">출금 (운영지출)</option>
                        <option value="in">입금 (영업매출)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">가맹점 상호명 (적요)</label>
                    <input 
                      type="text" 
                      value={draftTx.merchant} 
                      onChange={(e) => setDraftTx({...draftTx, merchant: e.target.value})} 
                      className="w-full border border-slate-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">합계 결제금액 (원)</label>
                      <input 
                        type="number" 
                        value={draftTx.amount} 
                        onChange={(e) => setDraftTx({...draftTx, amount: e.target.value})} 
                        className="w-full border border-slate-300 p-2.5 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">비용 계정과목 (AI 제안)</label>
                      <input 
                        type="text" 
                        value={draftTx.aiTag} 
                        onChange={(e) => setDraftTx({...draftTx, aiTag: e.target.value})} 
                        className="w-full border border-emerald-300 bg-emerald-50/60 p-2.5 rounded-xl text-sm font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5 mt-6">
                    <button 
                      type="button" 
                      onClick={() => setUploadStep(0)} 
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition active:scale-95"
                    >
                      과정 취소
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition active:scale-95 shadow-md shadow-indigo-600/10"
                    >
                      검수 확정 장부기록
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- 글로벌 인디케이션 시스템: 오퍼레이션 완결 피드백 토스트 알림 --- */}
      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-6 duration-300 z-50 border border-slate-800">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <p className="text-sm font-semibold tracking-tight">{showSuccessToast}</p>
        </div>
      )}
    </div>
  );
}