'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { importAvales } from '@/lib/api';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const data = await importAvales(file);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Importación Masiva de Avales</h1>
        <p className="text-slate-500 font-medium">Sube archivos Excel (.xlsx) para actualizar las asignaciones de avales en el sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className={`
            relative group border-2 border-dashed rounded-3xl p-12 transition-all duration-300
            ${file ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50/50'}
          `}>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`
                w-20 h-20 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110
                ${file ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-slate-100 text-slate-400'}
              `}>
                {file ? <FileText size={40} /> : <Upload size={40} />}
              </div>
              
              <div className="space-y-1">
                <p className="text-lg font-black text-slate-800">
                  {file ? file.name : 'Haz clic o arrastra tu archivo Excel'}
                </p>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                  {file ? `${(file.size / 1024).toFixed(2)} KB` : 'Formatos soportados: .xlsx'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`
              w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3
              ${!file || uploading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white shadow-xl shadow-blue-900/20 hover:bg-blue-700 hover:-translate-y-1'}
            `}
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Procesando archivo...
              </>
            ) : (
              <>
                <Upload size={20} />
                Iniciar Importación
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <div className="text-sm font-bold">{error}</div>
            </div>
          )}

          {result && result.success && (
            <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-xl space-y-6 animate-in zoom-in duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">¡Importación Exitosa!</h3>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Proceso completado correctamente</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Registros</div>
                  <div className="text-2xl font-black text-slate-900">{result.totalProcesados}</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="text-[10px] font-black text-emerald-600 uppercase mb-1">Insertados/Actualizados</div>
                  <div className="text-2xl font-black text-emerald-700">{result.insertados}</div>
                </div>
              </div>

              {result.gestoresNoEncontrados.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertCircle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Gestores no encontrados en BD</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.gestoresNoEncontrados.map((g: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-lg border border-orange-100 uppercase">
                        {g}
                      </span>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium italic">Nota: Los registros de estos gestores no se importaron porque el nombre no coincide exactamente con el catálogo de usuarios.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-lg font-black flex items-center gap-2">
              <Info className="text-blue-400" size={20} />
              Requisitos del Archivo
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2"></div>
                <p className="text-xs text-slate-300 font-medium">El archivo debe ser formato <span className="font-bold text-white">.xlsx</span> (Excel moderno).</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2"></div>
                <p className="text-xs text-slate-300 font-medium">Debe contener las columnas: <span className="font-bold text-white">NoCUENTA, NOMBRE AVAL, DOMICILIO, GESTOR DOMICILIARIO</span>.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2"></div>
                <p className="text-xs text-slate-300 font-medium">Los nombres de los gestores en el Excel deben coincidir con los registrados en el sistema.</p>
              </li>
            </ul>
          </div>

          <div className="p-6 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group">
            <div className="relative z-10 space-y-2">
              <h4 className="font-black uppercase tracking-tighter text-blue-100">Ayuda Rápida</h4>
              <p className="text-sm font-bold leading-tight">¿Tienes dudas sobre el formato del archivo?</p>
              <button className="pt-2 text-[10px] font-black uppercase tracking-widest text-white underline underline-offset-4 decoration-2">
                Descargar Plantilla (Próximamente)
              </button>
            </div>
            <Upload className="absolute -right-4 -bottom-4 text-blue-500 opacity-30 rotate-12 transition-transform duration-500 group-hover:scale-125" size={120} />
          </div>
        </div>
      </div>
    </div>
  );
}
