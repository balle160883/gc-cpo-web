"use client";

import { useEffect, useState } from "react";
import { HandCoins, CheckCircle, XCircle, Clock, AlertTriangle, Loader2, User, FileDown, MessageSquare } from "lucide-react";
import { fetchPromesasPendientes, fetchAllGestores } from "@/lib/api";
import * as XLSX from 'xlsx';

export default function PromesasPage() {
  const [promesas, setPromesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [gestores, setGestores] = useState<any[]>([]);
  const [selectedGestor, setSelectedGestor] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      setIsAdmin(user.rol === 'admin');
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAllGestores().then(setGestores).catch(console.error);
    }
  }, [isAdmin]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchPromesasPendientes(selectedGestor, startDate, endDate);
        setPromesas(data);
      } catch (error) {
        console.error("Error loading promises:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedGestor, startDate, endDate]);

  const safeFormatDate = (dateStr: any, fallback = 'N/A') => {
    if (!dateStr) return fallback;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? fallback : date.toLocaleDateString('es-MX');
  };

  const handleExportExcel = () => {
    const dataToExport = promesas.map(p => ({
      'No. Socio': p.socio_id,
      'Cuenta': p.num_cuenta,
      'Socio Titular': p.prestamos_datos?.socios_datos?.nombre_completo || 'N/A',
      'Sujeto Visitado': p.nombre_visitado || p.prestamos_datos?.socios_datos?.nombre_completo || 'Socio Desconocido',
      'Tipo de Sujeto': p.sujeto_tipo || 'Socio',
      'Origen Promesa': p.is_informal ? 'Bitácora / Gestión' : 'Promesa Formal',
      'Monto': p.monto || 0,
      'Fecha Programada': safeFormatDate(p.fecha_pago),
      'Inicio Gestión': safeFormatDate(p.fecha_inicio_gestion),
      'Gestor': p.gestor_nombre || p.gestor_id,
      'Comentarios/Nota': p.descripcion || 'Sin comentarios registrados',
      'Estado': p.is_informal ? 'Pendiente' : p.estado,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Promesas");
    const fileName = `Promesas_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const totalMonto = promesas.reduce((acc, p) => acc + (p.monto || 0), 0);
  const totalVencidas = promesas.filter(p => new Date(p.fecha_pago) < new Date()).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda de Promesas</h1>
          <p className="text-slate-500 text-sm">Seguimiento de compromisos de pago registrados por los gestores.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase ml-2">Inicio:</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs font-bold text-slate-700 focus:outline-none bg-transparent cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase ml-2">Fin:</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs font-bold text-slate-700 focus:outline-none bg-transparent cursor-pointer"
            />
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase ml-2">Gestor:</span>
              <select 
                value={selectedGestor}
                onChange={(e) => setSelectedGestor(e.target.value)}
                className="text-xs font-bold text-slate-700 focus:outline-none bg-transparent cursor-pointer"
              >
                <option value="">Todos</option>
                {gestores.map(g => (
                  <option key={g.gestor_id} value={g.gestor_name}>{g.gestor_name}</option>
                ))}
              </select>
            </div>
          )}

          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            disabled={promesas.length === 0}
          >
            <FileDown size={16} />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center p-4 border-blue-100 bg-blue-50/30">
          <div className="text-slate-400 text-[10px] uppercase font-bold mb-1 tracking-wider">Promesas Pendientes</div>
          <div className="text-3xl font-black text-slate-900">{promesas.length}</div>
          <div className="text-blue-600 text-xs font-bold mt-1">${totalMonto.toLocaleString()}</div>
        </div>
        <div className="card text-center p-4 border-red-100 bg-red-50/30">
          <div className="text-slate-400 text-[10px] uppercase font-bold mb-1 tracking-wider">Vencidas Hoy</div>
          <div className="text-3xl font-black text-red-600">{totalVencidas}</div>
          <div className="text-red-400 text-xs font-bold mt-1">Requiere atención</div>
        </div>
        <div className="card text-center p-4 border-emerald-100 bg-emerald-50/30">
          <div className="text-slate-400 text-[10px] uppercase font-bold mb-1 tracking-wider">Efectividad Global</div>
          <div className="text-3xl font-black text-emerald-600">--</div>
          <div className="text-emerald-500 text-xs font-bold mt-1">Sincronizado</div>
        </div>
      </div>

      <div className="card shadow-sm border-slate-100">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-tight">
            <HandCoins size={18} className="text-blue-600" />
            Calendario de Compromisos
          </h3>
        </div>
        
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-medium">Cargando agenda...</p>
          </div>
        ) : promesas.length === 0 ? (
          <div className="py-20 text-center">
            <Clock className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-500 font-medium">No hay promesas de pago pendientes.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {promesas.map((p) => {
              const isExpired = new Date(p.fecha_pago) < new Date();
              return (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                      p.is_informal ? 'bg-amber-100 text-amber-600' :
                      isExpired ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {p.is_informal ? <MessageSquare size={20} /> : 
                       isExpired ? <AlertTriangle size={20} /> : <Clock size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-900">
                          {p.nombre_visitado || p.prestamos_datos?.socios_datos?.nombre_completo || 'Socio Desconocido'}
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          (p.sujeto_tipo || 'Socio') === 'Socio' ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {p.sujeto_tipo || 'Socio'}
                        </span>
                        {p.is_informal && (
                          <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Bitácora
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-3">
                        <span>Socio: <span className="text-slate-700 font-bold">{p.socio_id}</span></span>
                        <span>Cuenta: <span className="text-slate-700 font-bold">{p.num_cuenta}</span></span>
                        {isAdmin && (
                           <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 flex items-center gap-1">
                             <User size={10} /> {p.gestor_nombre || p.gestor_id}
                           </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-8">
                    <div className="max-w-[200px]">
                      {p.descripcion && (
                        <div className="text-xs text-slate-600 font-medium italic mb-1 line-clamp-1">
                          "{p.descripcion}"
                        </div>
                      )}
                      <div className="font-black text-slate-900">${(p.monto || 0).toLocaleString()}</div>
                      
                      <div className={`text-[10px] font-bold uppercase tracking-tighter ${
                        p.is_informal ? 'text-amber-600' :
                        isExpired ? 'text-red-600 underline' : 'text-slate-400'
                      }`}>
                        {p.is_informal ? `REGISTRADA: ${new Date(p.fecha_pago).toLocaleDateString()}` :
                         isExpired ? 'VENCIDA' : `PAGO: ${new Date(p.fecha_pago).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-300 transition-colors border border-transparent hover:border-emerald-100">
                        <CheckCircle size={20} />
                      </button>
                      <button className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-300 transition-colors border border-transparent hover:border-red-100">
                        <XCircle size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
