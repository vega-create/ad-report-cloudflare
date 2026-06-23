// 下載 PDF 共用工具
// 優先用 html2pdf 一鍵下載；若失敗（例如函式庫載入失敗、內容渲染問題），依 fallback 模式處理。
//
// opts.fallback:
//   'print'  （預設）→ 失敗時改用瀏覽器原生列印（可選「另存為 PDF」），適合白底的報告/提案
//   'reload' → 失敗時提示使用者重新整理重試，適合深色主題的分析/日曆（列印會一片黑不適用）
//   'none'   → 只跳通用錯誤訊息
export async function downloadPdf(element, filename, opts = {}) {
  const { fallback = 'print', orientation = 'portrait' } = opts
  if (!element) {
    if (fallback === 'print') window.print()
    else alert('找不到可下載的內容，請重新整理頁面後再試一次。')
    return
  }
  try {
    const html2pdf = (await import('html2pdf.js')).default
    await html2pdf().set({
      margin: [15, 15, 15, 15],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: false, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    }).from(element).save()
  } catch (e) {
    console.error('html2pdf 下載失敗:', e)
    if (fallback === 'print') {
      alert('一鍵下載失敗，將改用瀏覽器列印。\n請在跳出的視窗把「目的地」選成「另存為 PDF」再按儲存即可。')
      window.print()
    } else {
      alert('PDF 下載失敗。通常是頁面開太久造成，請按 Cmd+Shift+R（Windows 為 Ctrl+Shift+R）強制重新整理後再試一次。')
    }
  }
}
