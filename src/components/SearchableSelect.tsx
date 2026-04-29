import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
}

export default function SearchableSelect({ options, value, onChange, placeholder = "Seleccionar...", label }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = (options || []).filter(opt => {
    if (!opt) return false;
    return opt.toLowerCase().includes((query || '').toLowerCase());
  });

  return (
    <div className="relative" ref={wrapperRef}>
      {label && <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">{label}</label>}
      <div 
        className="flex items-center justify-between w-full px-3 py-2 bg-gray-50 border border-surface-border rounded-xl cursor-pointer hover:border-gray-300 transition-colors"
        onClick={() => { setIsOpen(!isOpen); setQuery(''); }}
      >
        <span className="text-sm text-gray-700 font-medium truncate">{value || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-surface-border shadow-xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-surface-border bg-gray-50/50">
            <div className="relative">
              <Search className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-surface-border rounded outline-none focus:border-envi-azul"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">No hay resultados</p>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt}
                  className={`px-3 py-2 text-xs rounded cursor-pointer flex items-center justify-between ${
                    opt === value ? 'bg-envi-azul/10 text-envi-azul font-bold' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                >
                  {opt}
                  {opt === value && <Check className="w-3 h-3" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
