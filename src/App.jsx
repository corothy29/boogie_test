import React, { useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Home, Receipt, Settings, Bell, User, Search, AlertCircle, CheckCircle2, ChevronDown, 
  CreditCard, Building2, Wallet, Filter, Upload, Download, FileSpreadsheet, FileText, X, Loader2
} from 'lucide-react';

// --- 더미 데이터 ---
const cashFlowData = [
  { month: '1월', 수입: 4500, 지출: 3200, 잔액: 12000 },
  { month: '2월', 수입: 5200, 지출: 3800, 잔액: 13400 },
  { month: '3월', 수입: 4800, 지출: 6500, 잔액: 11700 },
  { month: '4월', 수입: 6100, 지출: 4200, 잔액: 13600 },
  { month: '5월', 수입: 5900, 지출: 4800, 잔액: 14700 },
  { month: '6월', 수입: 2000, 지출: 1500, 잔액: 15200 },
];

const initialTransactions = [
  { id: 1, date: '2026-06-10 14:30', merchant: '토스페이먼츠(주)', type: 'in', amount: 2500000, aiTag: '매출', confidence: 0.98, status: '분류 완료' },
  { id: 2, date: '2026-06-09 10:15', merchant: '구글클라우드', type: 'out', amount: 420000, aiTag: '지급수수료', confidence: 0.95, status: '분류 완료' },
  { id: 3, date: '2026-06-08 19:30', merchant: '배달의민족', type: 'out', amount: 68000, aiTag: '복리후생비', confidence: 0.65, status: '확인 필요' },
  { id: 4, date: '2026-06-08 14:00', merchant: '국세청(법인세)', type: 'out', amount: 3500000, aiTag: '세금과공과', confidence: 0.99, status: '분류 완료' },
  { id: 5, date: '2026-06-07 11:20', merchant: '쿠팡(주)', type: 'out', amount: 125000, aiTag: '소모품비', confidence: 0.55, status: '확인 필요' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState(initialTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 모달 및 업로드 상태 관리
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const formatCurrency = (value) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);

  // 필요 조치 건수 계산
  const actionRequiredCount = transactions.filter(tx => tx.status === '확인 필요').length;
  // 필터링된 거래 내역
  const filteredTransactions = transactions.filter(tx => 
    tx.merchant.includes(searchTerm) || tx.aiTag.includes(searchTerm)
  );

  // 🌟 기능 1: 영수증/증빙 업로드 시뮬레이션
  const handleFileUpload = (e) => {
    e.preventDefault();
    setIsUploading(true);
    
    // AI가 분석하는 척 2초 대기
    setTimeout(() => {
      const newTransaction = {
        id: Date.now(),
        date: '2026-06-11 13:00',
        merchant: '(주)스타벅스코리아',
        type: 'out',
        amount: 25500,
        aiTag: '복리후생비',
        confidence: 0.92,
        status: '분류 완료'
      };
      
      setTransactions([newTransaction, ...transactions]);
      setIsUploading(false);
      setIsUploadModalOpen(false);
      
      // 성공 알림 띄우기
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      // 거래내역 탭으로 이동
      setActiveTab('transactions');
    }, 2000);
  };

  // 🌟 기능 2: 엑셀(CSV) 다운로드 기능
  const handleDownloadCSV = () => {
    const headers = ['날짜', '거래처', '분류', '구분', '금액', '상태'];
    const csvData = transactions.map(tx => {
      const typeStr = tx.type === 'in' ? '입금' : '출금';
      return `${tx.date},${tx.merchant},${tx.aiTag},${typeStr},${tx.amount},${tx.status}`;
    });
    
    // 한글 깨짐 방지를 위한 BOM 추가
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n' + csvData.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "부기_재무거래내역.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 🌟 기능 3: PDF 보고서 추출 (브라우저 인쇄 기능 활용)
  const handleDownloadPDF = () => {
    window.print();
  };

  // --- 렌더링 함수들 ---

  const renderSidebar = () => (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 print:hidden">
      <div className="p-6 flex items-center gap-3 text-white font-bold text-2xl tracking-tight">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
          <Wallet size={20} className="text-white" />
        </div>
        Boogie
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800'}`}>
          <Home size={20} /> 대시보드
        </button>
        <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'transactions' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800'}`}>
          <Receipt size={20} /> 거래 내역
          {actionRequiredCount > 0 && <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{actionRequiredCount}</span>}
        </button>
        <button onClick={() => setActiveTab('integrations')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'integrations' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800'}`}>
          <Settings size={20} /> 연동 및 설정
        </button>
      </nav>
    </div>
  );

  const renderTopbar = () => (
    <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 print:hidden">
      <h1 className="text-2xl font-bold text-slate-800">
        {activeTab === 'dashboard' && '재무 대시보드'}
        {activeTab === 'transactions' && 'AI 거래 내역'}
        {activeTab === 'integrations' && '연동 및 설정'}
      </h1>
      <div className="flex items-center gap-4">
        {/* 🌟 업로드 버튼 추가 */}
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition"
        >
          <Upload size={16} /> 영수증/증빙 업로드
        </button>
        <button className="p-2 text-slate-400 hover:text-slate-600 relative">
          <Bell size={24} />
          {actionRequiredCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
        </button>
      </div>
    </div>
  );

  const renderDashboardView = () => (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* 액션 바: PDF 보고서 다운로드 */}
      <div className="flex justify-end print:hidden">
        <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition shadow-sm">
          <FileText size={16} className="text-indigo-600" /> 월간 재무 보고서 (PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">총 보유 현금</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{formatCurrency(152000000)}</h2>
          <p className="text-sm text-emerald-600 flex items-center gap-1">↑ 전월 대비 3.4% 증가</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">예상 런웨이 (Runway)</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span className="w-4 h-4 bg-emerald-500 rounded-full inline-block"></span> 12.5개월
          </h2>
          <p className="text-sm text-slate-500">안정적인 현금흐름 유지 중</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">이번 달 현금 연소율 (Burn Rate)</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{formatCurrency(-500000)}</h2>
          <p className="text-sm text-slate-500">지출이 수입보다 약간 많습니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">현금흐름 및 잔액 추이</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `${val/1000}M`} />
                <Tooltip formatter={(value) => formatCurrency(value * 10000)} />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="잔액" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" name="총 잔액" />
                <Line type="monotone" dataKey="수입" stroke="#10b981" strokeWidth={2} dot={false} name="수입" />
                <Line type="monotone" dataKey="지출" stroke="#ef4444" strokeWidth={2} dot={false} name="지출" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col print:hidden">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            AI Action Items <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-md">할 일 {actionRequiredCount}개</span>
          </h3>
          <div className="space-y-4 flex-1">
            {actionRequiredCount > 0 ? (
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex gap-4 cursor-pointer hover:bg-orange-100 transition" onClick={() => setActiveTab('transactions')}>
                <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-orange-900 text-sm">{actionRequiredCount}건의 내역 분류가 필요합니다.</p>
                  <p className="text-orange-700 text-xs mt-1">AI가 계정과목을 확신하지 못했습니다. 확인 후 승인해주세요.</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-4">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-emerald-900 text-sm">모든 내역이 분류되었습니다!</p>
                  <p className="text-emerald-700 text-xs mt-1">추가로 확인할 내역이 없습니다.</p>
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
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="거래처, 적요 검색..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64" 
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
              <Filter size={16} /> 상태: 전체
            </button>
          </div>
          
          {/* 🌟 엑셀 다운로드 버튼 추가 */}
          <div className="flex gap-2">
            <button onClick={handleDownloadCSV} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm">
              <FileSpreadsheet size={16} className="text-emerald-600" /> 엑셀 다운로드
            </button>
            <button className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-sm">
              선택 항목 일괄 확정
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                <th className="p-4 w-12 text-center"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="p-4">날짜</th>
                <th className="p-4">거래처 (적요)</th>
                <th className="p-4 text-right">금액</th>
                <th className="p-4 w-64">AI 계정 태그</th>
                <th className="p-4 text-center">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition group">
                  <td className="p-4 text-center"><input type="checkbox" className="rounded border-slate-300" /></td>
                  <td className="p-4 text-sm text-slate-600">{tx.date}</td>
                  <td className="p-4 font-medium text-slate-900">{tx.merchant}</td>
                  <td className={`p-4 text-right font-bold ${tx.type === 'in' ? 'text-indigo-600' : 'text-slate-900'}`}>
                    {tx.type === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  <td className="p-4">
                    {tx.status === '분류 완료' ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 text-sm font-medium">
                        {tx.aiTag}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-md border border-amber-300 text-sm font-medium cursor-pointer hover:bg-amber-100 transition shadow-sm">
                        {tx.aiTag}? (확인요망) <ChevronDown size={14} className="opacity-50" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {tx.status === '분류 완료' ? (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">자동 분류됨</span>
                    ) : (
                      <button 
                        onClick={() => {
                          const updated = transactions.map(t => t.id === tx.id ? { ...t, status: '분류 완료', confidence: 1 } : t);
                          setTransactions(updated);
                        }}
                        className="text-xs font-bold text-white bg-amber-500 px-3 py-1 rounded-full hover:bg-amber-600 transition shadow-sm"
                      >
                        확정하기
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">검색 결과가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {renderSidebar()}
      <div className="flex-1 ml-64 flex flex-col">
        {renderTopbar()}
        <main className="flex-1 overflow-auto">
          {activeTab === 'dashboard' && renderDashboardView()}
          {activeTab === 'transactions' && renderTransactionsView()}
          {activeTab === 'integrations' && <div className="p-8 text-slate-500">연동 및 설정 화면 (준비 중)</div>}
        </main>
      </div>

      {/* 🌟 업로드 모달 컴포넌트 */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-[500px] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">영수증 및 증빙 업로드</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className="p-6">
              {!isUploading ? (
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition flex flex-col items-center justify-center p-12 cursor-pointer group"
                  onClick={handleFileUpload}
                >
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <Upload size={28} className="text-indigo-500" />
                  </div>
                  <p className="text-slate-700 font-medium text-center">클릭하거나 파일을 이곳에 드롭하세요</p>
                  <p className="text-slate-400 text-sm mt-2 text-center">지원 포맷: PDF, JPG, PNG (최대 10MB)</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12">
                  <Loader2 size={40} className="text-indigo-600 animate-spin mb-4" />
                  <p className="text-slate-800 font-bold text-lg">AI가 영수증을 분석하고 있습니다...</p>
                  <p className="text-slate-500 text-sm mt-2">금액과 계정과목을 추출하는 중입니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 성공 토스트 알림 */}
      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <p className="font-medium">영수증이 성공적으로 분석 및 등록되었습니다.</p>
        </div>
      )}
    </div>
  );
}