import { BrowserWindowApi } from '@widget-js/core'
import { Minus, Square, X } from 'lucide-react'

export function WindowControls() {
  async function toggleMaximize() {
    if (await BrowserWindowApi.isMaximized()) {
      BrowserWindowApi.unmaximize()
    }
    else {
      BrowserWindowApi.maximize()
    }
  }
  return (
    <div className="flex items-center gap-2 fixed top-4 right-4 z-50">
      <button
        onClick={() => BrowserWindowApi.minimize()}
        className="cursor-pointer flex items-center justify-center w-4.5 h-4.5 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white transition-all shadow-sm hover:shadow-[0_0_8px_rgba(234,179,8,0.6)] [-webkit-app-region:no-drag]"
        title="Minimize"
      >
        <Minus className="h-3 w-3 font-bold" strokeWidth={2} />
      </button>
      <button
        onClick={toggleMaximize}
        className="cursor-pointer flex items-center justify-center w-4.5 h-4.5 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all shadow-sm hover:shadow-[0_0_8px_rgba(34,197,94,0.6)] [-webkit-app-region:no-drag]"
        title="Maximize"
      >
        <Square className="h-2.5 w-2.5" strokeWidth={2} />
      </button>
      <button
        onClick={() => BrowserWindowApi.close()}
        className="cursor-pointer flex items-center justify-center w-4.5 h-4.5 rounded-full bg-[#ed4f4a] hover:bg-red-600 text-white transition-all shadow-sm hover:shadow-[0_0_8px_rgba(239,68,68,0.6)] [-webkit-app-region:no-drag]"
        title="Close"
      >
        <X className="h-3 w-3" strokeWidth={2} />
      </button>
    </div>
  )
}
