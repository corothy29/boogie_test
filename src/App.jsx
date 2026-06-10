import React, { useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Home, Receipt, Settings, Bell, User, Search, AlertCircle, CheckCircle2, ChevronDown, 
  Wallet, Filter, Upload, FileSpreadsheet, FileText, X, Loader2, RefreshCw, Plus
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const cashFlowData = [
  { month: '1월', 수입: 4500, 지출: 3200, 잔액: 12000 },
  { month: '2월', 수입: 5200, 지출: 3800, 잔액: 13400 },
  { month: '3월', 수입: 4800, 지출: 6500, 잔액: 11700 },
  { month: '4월', 수입: 6100, 지출: 4200, 잔액: 13600 },
  { month: '5월', 수입: 5900, 지출: 4800, 잔액: 14700 },
  { month: '6월', 수입: 2000, 지출: 1500, 잔액: 15200 },
];

const demoTransactions = [
  { id: 1, date: '2026-06-10 14:30', merchant: '토스페이먼츠(주)', type: 'in', amount: 2500000, aiTag: '매출', confidence: 0.98, status: '분류 완료' },
  { id: 2, date: '2026-06-09 10:15', merchant: '구글클라우드', type: 'out', amount: 420000, aiTag: '지급수수료', confidence: 0.95, status: '분류 완료' },
  { id: 3, date: '2026-06-08 19:30', merchant: '배달의민족', type: 'out', amount: 68000, aiTag: '복리후생비', confidence: 0.65, status: '확인 필요' },
  { id: 4, date: '2026-06-08 14:00', merchant: '국세청(법인세)', type: 'out', amount: 3500000, aiTag: '세금과공과', confidence: 0.99, status: '분류 완료' },
  { id: 5, date: '2026-06-07 11:20', merchant: '쿠팡(주)', type: 'out', amount: 125000, aiTag: '소모품비', confidence: 0.55, status: '확인 필요' },
];

// 🌟 파일 변환 헬퍼 함수
async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [uploadStep, setUploadStep] = useState(0);
  const [draftTx, setDraftTx] = useState({ date: '', merchant: '', amount: '', aiTag: '', type: 'out' });
  const [showSuccessToast, setShowSuccessToast] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const formatCurrency = (value) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(Number(value) || 0);

  const actionRequiredCount = transactions.filter(tx => tx.status === '확인 필요').length;
  const filteredTransactions = transactions.filter(tx => 
    tx.merchant.includes(searchTerm) || tx.aiTag.includes(searchTerm)
  );

  const handleLoadDemoData = () => {
    setTransactions(demoTransactions);
    setShowSuccessToast('시뮬레이션 데모 데이터가 로드되었습니다.');
    setTimeout(() => setShowSuccessToast(''), 3000);
  };

  // 🌟 기능: 실제 Gemini AI 연동 영수증 분석
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadStep(2); // 로딩 화면
    setErrorMessage('');

    try {
      // 환경변수에서 키를 가져와 API 클라이언트 초기화
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const imagePart = await fileToGenerativePart(file);
      
      // IFRS/K-GAAP 기반 계정과목 분류 프롬프트
      const prompt = `
        이 영수증 이미지를 분석해서 다음 정보를 정확히 추출해줘:
        1. merchant: 상호명 (가게 이름)
        2. amount: 총 결제 금액 (숫자만 입력)
        3. aiTag: 회계 계정과목 (예: 복리후생비, 소모품비, 여비교통비, 접대비, 지급수수료 등 가장 알맞은 것 1개)
        
        반드시 마크다운 코드블럭(\`\`\`json 등) 없이 순수 JSON 객체 형태로만 답변해.
        형식: {"merchant": "가게이름", "amount": 15000, "aiTag": "계정과목"}
      `;

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();
      
      // JSON 파싱 (마크다운 찌꺼기가 묻어올 경우 제거)
      const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const extractedData = JSON.parse(cleanJsonStr);

      const now = new Date();
      const formattedDate = `${now.getFullYear()}-06-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      setDraftTx({
        date: formattedDate,
        merchant: extractedData.merchant || '알 수 없음',
        amount: String(extractedData.amount || 0),
        aiTag: extractedData.aiTag || '분류 불가',
        type: 'out'
      });
      
      setUploadStep(3); // 검수 화면으로 이동

    } catch (error) {
      console.error("AI 분석 에러:", error);
      setUploadStep(1);
      setErrorMessage("AI 분석 중 오류가 발생했습니다. API 키나 이미지를 확인해주세요.");
    }
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    const newTransaction = {
      id: Date.now(),
      date: draftTx.date,
      merchant: draftTx.merchant,
      type: draftTx.type,
      amount: parseInt(draftTx.amount, 10),
      aiTag: draftTx.aiTag,
      confidence: 1, 
      status: '분류 완료'
    };
    
    setTransactions([newTransaction, ...transactions]);
    setUploadStep(0);
    setShowSuccessToast('새로운 거래 내역이 장부에 기록되었습니다.');
    setTimeout(() => setShowSuccessToast(''), 3000);
    setActiveTab('transactions');
  };

  const handleDownloadCSV = () => {
    if(transactions.length === 0) return alert("다운로드할 데이터가 없습니다.");
    const headers = ['날짜', '거래처', '분류', '구분', '금액', '상태'];
    const csvData = transactions.map(tx => {
      const typeStr = tx.type === 'in' ? '입금' : '출금';
      return `${tx.date},${tx.merchant},${tx.aiTag},${typeStr},${tx.amount},${tx.status}`;
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n' + csvData.join('\n');
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "부기_재무거래내역.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- UI 렌더링 영역 (이전과 동일, 업로드 모달만 변경) ---
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
      </nav>
      <div className="p-6 border-t border-slate-800">
        <button onClick={handleLoadDemoData} className="w-full flex items-center justify-center gap-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 py-2 rounded-lg text-sm transition">
          <RefreshCw size={14} /> 시뮬레이션 데이터 로드
        </button>
      </div>
    </div>
  );

  const renderTopbar = () => (
    <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 print:hidden">
      <h1 className="text-2xl font-bold text-slate-800">
        {activeTab === 'dashboard' && '재무 대시보드'}
        {activeTab === 'transactions' && 'AI 거래 내역'}
      </h1>
      <div className="flex items-center gap-4">
        <button onClick={() => { setUploadStep(1); setErrorMessage(''); }} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition">
          <Plus size={16} /> 실물 영수증 AI 분석
        </button>
      </div>
    </div>
  );

  const renderDashboardView = () => (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-end print:hidden">
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition shadow-sm">
          <FileText size={16} className="text-indigo-600" /> 보고서 (PDF)
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">총 보유 현금</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{formatCurrency(152000000)}</h2>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">예상 런웨이 (Runway)</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span className="w-4 h-4 bg-emerald-500 rounded-full inline-block"></span> 12.5개월
          </h2>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">처리된 거래 건수</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{transactions.length}건</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">현금흐름 추이</h3>
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
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">AI Action Items </h3>
          <div className="space-y-4 flex-1">
            {transactions.length === 0 ? (
               <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center h-full text-slate-500">데이터가 없습니다.</div>
            ) : actionRequiredCount > 0 ? (
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex gap-4 cursor-pointer hover:bg-orange-100 transition" onClick={() => setActiveTab('transactions')}>
                <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-orange-900 text-sm">{actionRequiredCount}건의 내역 확인 요망</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-4">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                <div><p className="font-semibold text-emerald-900 text-sm">모든 내역 분류 완료</p></div>
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
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="거래처 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64" 
            />
          </div>
          <button onClick={handleDownloadCSV} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm">
            <FileSpreadsheet size={16} className="text-emerald-600" /> 엑셀 다운로드
          </button>
        </div>
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                <th className="p-4 w-12 text-center"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="p-4">날짜</th>
                <th className="p-4">거래처</th>
                <th className="p-4 text-right">금액</th>
                <th className="p-4 w-64">계정 과목</th>
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
                      <div className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 text-sm font-medium">{tx.aiTag}</div>
                    ) : (
                      <div className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-300 text-sm font-medium">{tx.aiTag}?</div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {tx.status === '분류 완료' ? (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">완료</span>
                    ) : (
                      <button onClick={() => setTransactions(transactions.map(t => t.id === tx.id ? { ...t, status: '분류 완료' } : t))} className="text-xs font-bold text-white bg-amber-500 px-3 py-1 rounded-full hover:bg-amber-600">확정하기</button>
                    )}
                  </td>
                </tr>
              ))}
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
        </main>
      </div>

      {uploadStep > 0 && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-[500px] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {uploadStep === 1 ? '실물 영수증 AI 분석' : uploadStep === 2 ? 'AI 비전 분석 중...' : 'AI 추출 결과 확인'}
              </h3>
              <button onClick={() => setUploadStep(0)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className="p-6">
              {errorMessage && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium">{errorMessage}</div>}
              
              {uploadStep === 1 && (
                <label className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition flex flex-col items-center justify-center p-12 cursor-pointer group">
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <Upload size={28} className="text-indigo-500" />
                  </div>
                  <p className="text-slate-700 font-medium text-center">클릭하여 영수증 이미지를 선택하세요</p>
                  <p className="text-slate-400 text-sm mt-2 text-center">Gemini 1.5 Flash 엔진이 즉시 분석합니다.</p>
                </label>
              )}

              {uploadStep === 2 && (
                <div className="flex flex-col items-center justify-center p-12">
                  <Loader2 size={40} className="text-indigo-600 animate-spin mb-4" />
                  <p className="text-slate-800 font-bold text-lg">AI가 영수증의 글자를 판독하고 있습니다...</p>
                </div>
              )}

              {uploadStep === 3 && (
                <form onSubmit={handleSaveDraft} className="space-y-4">
                  <div className="bg-indigo-50 text-indigo-700 p-3 rounded-lg text-sm font-medium mb-4 flex items-center gap-2">
                    <CheckCircle2 size={16} /> AI가 추출한 내역입니다. 수정 후 확정해주세요.
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">날짜</label>
                      <input type="text" value={draftTx.date} onChange={(e) => setDraftTx({...draftTx, date: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">구분</label>
                      <select value={draftTx.type} onChange={(e) => setDraftTx({...draftTx, type: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg text-sm">
                        <option value="out">출금 (지출)</option>
                        <option value="in">입금 (수입)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">상호명</label>
                    <input type="text" value={draftTx.merchant} onChange={(e) => setDraftTx({...draftTx, merchant: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">금액 (원)</label>
                      <input type="number" value={draftTx.amount} onChange={(e) => setDraftTx({...draftTx, amount: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">계정과목 (AI 제안)</label>
                      <input type="text" value={draftTx.aiTag} onChange={(e) => setDraftTx({...draftTx, aiTag: e.target.value})} className="w-full border border-emerald-300 bg-emerald-50 p-2 rounded-lg text-sm font-bold text-emerald-700" />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                    <button type="button" onClick={() => setUploadStep(0)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold transition">취소</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition">장부에 기록하기</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <p className="font-medium">{showSuccessToast}</p>
        </div>
      )}
    </div>
  );
}