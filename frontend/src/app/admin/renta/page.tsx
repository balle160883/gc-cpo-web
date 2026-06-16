"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  CreditCard, 
  Search, 
  Plus, 
  Calendar, 
  User, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Save,
  Mail
} from "lucide-react";
import { fetchRentas, upsertRenta } from "@/lib/api";

export default function RentaPage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rentas, setRentas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedRenta, setSelectedRenta] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        if (user.rol === 'superadmin') {
          setIsSuperAdmin(true);
        } else {
          // Si no es superadmin, redirigir o mostrar error
          window.location.href = '/';
        }
      } catch (e) {
        console.error("Error parsing user info:", e);
      }
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchRentas();
      setRentas(data);
    } catch (error) {
      console.error("Error loading rent data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  const stats = useMemo(() => {
    const total = rentas.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
    const active = rentas.filter(r => r.status === 'activo').length;
    const expired = rentas.filter(r => r.status === 'vencido' || r.status === 'bloqueado').length;
    return { total, active, expired, count: rentas.length };
  }, [rentas]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return rentas;
    const s = searchTerm.toLowerCase();
    return rentas.filter(r => r.cliente_email.toLowerCase().includes(s));
  }, [rentas, searchTerm]);

  const handleRegisterPayment = (renta: any) => {
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    
    setSelectedRenta({
      ...renta,
      fecha_ultimo_pago: new Date().toISOString().split('T')[0],
      proximo_vencimiento: nextDate.toISOString().split('T')[0],
      status: 'activo'
    });
    setShowModal(true);
  };

  const setPlan = (monto: number) => {
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    
    setSelectedRenta({
      ...selectedRenta,
      monto,
      fecha_ultimo_pago: new Date().toISOString().split('T')[0],
      proximo_vencimiento: nextDate.toISOString().split('T')[0],
      status: 'activo'
    });
  };

  const onSave = async () => {
    if (!selectedRenta || !selectedRenta.cliente_email) {
      alert("El email del cliente es obligatorio");
      return;
    }
    setSaving(true);
    try {
      await upsertRenta(selectedRenta);
      await loadData();
      setShowModal(false);
    } catch (error) {
       console.error("Error saving rent info:", error);
       alert("Error al guardar la información de renta");
    } finally {
      setSaving(false);
    }
  };

  const getPlanBadge = (monto: number) => {
    if (monto === 3500) return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-md border border-blue-200">PLAN BASE</span>;
    if (monto === 6500) return <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-black rounded-md border border-purple-200">PLAN PRO</span>;
    if (monto === 1500) return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black rounded-md border border-slate-200">LEGACY (CPO)</span>;
    return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-md border border-amber-200">PERSONALIZADO</span>;
  };

  if (!isMounted || !isSuperAdmin) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-200">
              <CreditCard size={24} />
            </div>
            Gestión de Renta Mensual SaaS
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Panel de control exclusivo para el Superadministrador. Gestiona cobros y accesos de clientes.
          </p>
        </div>
        <button 
          onClick={() => {
            setSelectedRenta({ cliente_email: '', monto: 3500, status: 'activo' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus size={18} />
          Nuevo Cliente SaaS
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card relative overflow-hidden group border-none shadow-lg bg-white p-6 rounded-2xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingreso Mensual Proyectado</p>
          <h2 className="text-3xl font-black text-slate-900 mt-2">
            ${stats.total.toLocaleString('es-MX')}
          </h2>
          <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-xs">
            <TrendingUp size={14} /> Consolidado Global
          </div>
        </div>
        
        <div className="card border-none shadow-lg bg-white p-6 rounded-2xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clientes Activos</p>
          <h2 className="text-3xl font-black text-emerald-600 mt-2">{stats.active}</h2>
          <div className="mt-4 flex items-center gap-2 text-slate-400 font-bold text-xs uppercase">
            <CheckCircle2 size={14} className="text-emerald-500" /> Al corriente
          </div>
        </div>

        <div className="card border-none shadow-lg bg-white p-6 rounded-2xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencidos / Bloqueados</p>
          <h2 className="text-3xl font-black text-rose-600 mt-2">{stats.expired}</h2>
          <div className="mt-4 flex items-center gap-2 text-slate-400 font-bold text-xs uppercase">
            <AlertCircle size={14} className="text-rose-500" /> Requieren Atención
          </div>
        </div>

        <div className="card border-none shadow-lg bg-white p-6 rounded-2xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Clientes (Despachos)</p>
          <h2 className="text-3xl font-black text-slate-900 mt-2">{stats.count}</h2>
          <div className="mt-4 flex items-center gap-2 text-slate-400 font-bold text-xs uppercase">
            <User size={14} className="text-slate-400" /> Instalaciones Activas
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-slate-900 border-none shadow-2xl p-4 rounded-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por email del cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border-none rounded-lg py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden border-none shadow-xl bg-white rounded-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente / Despacho</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estatus</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Último Pago</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimiento</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center">
                  <Loader2 className="animate-spin mx-auto text-indigo-600 mb-2" size={32} />
                  <span className="text-slate-500 font-bold">Cargando registros contables...</span>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-slate-400 font-medium italic">
                  No se encontraron clientes que coincidan con la búsqueda.
                </td>
              </tr>
            ) : filteredData.map((renta, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <Mail size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-700">{renta.cliente_email}</span>
                      {renta.cliente_email.includes('oblatos') && (
                        <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-tighter">Socio Fundador (CPO)</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getPlanBadge(Number(renta.monto))}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border ${
                    renta.status === 'activo' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    {renta.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                  {renta.fecha_ultimo_pago ? new Date(renta.fecha_ultimo_pago).toLocaleDateString('es-MX') : 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-700">
                   <div className="flex items-center gap-2">
                    <Clock size={14} className={new Date(renta.proximo_vencimiento) < new Date() ? 'text-rose-500' : 'text-indigo-500'} />
                    {renta.proximo_vencimiento ? new Date(renta.proximo_vencimiento).toLocaleDateString('es-MX') : 'Pendiente'}
                   </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-black text-slate-900">${Number(renta.monto).toLocaleString('es-MX')}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                     <button 
                      onClick={() => handleRegisterPayment(renta)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 rounded-lg transition-all text-xs font-bold"
                     >
                        <Save size={14} />
                        Registrar Pago
                     </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit/New Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Calendar className="text-indigo-600" />
                {selectedRenta?.id ? 'Renovar Suscripción' : 'Nueva Licencia SaaS'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {!selectedRenta?.id && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button 
                    onClick={() => setPlan(3500)}
                    className={`p-2 rounded-xl border-2 text-center transition-all ${selectedRenta?.monto === 3500 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}
                  >
                    <div className="text-[10px] font-black uppercase">Plan Base</div>
                    <div className="text-lg font-black">$3,500</div>
                  </button>
                  <button 
                    onClick={() => setPlan(6500)}
                    className={`p-2 rounded-xl border-2 text-center transition-all ${selectedRenta?.monto === 6500 ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-100 text-slate-400'}`}
                  >
                    <div className="text-[10px] font-black uppercase">Plan Pro</div>
                    <div className="text-lg font-black">$6,500</div>
                  </button>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email del Cliente / Despacho</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="email" 
                    value={selectedRenta?.cliente_email}
                    disabled={!!selectedRenta?.id}
                    onChange={(e) => setSelectedRenta({...selectedRenta, cliente_email: e.target.value})}
                    className="w-full bg-slate-50 border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-slate-700"
                    placeholder="ejemplo@caja-popular.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto de Renta (MXN)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    value={selectedRenta?.monto}
                    onChange={(e) => setSelectedRenta({...selectedRenta, monto: Number(e.target.value)})}
                    className="w-full bg-slate-50 border-slate-200 rounded-xl py-2.5 pl-8 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-black text-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Último Pago</label>
                  <input 
                    type="date" 
                    value={selectedRenta?.fecha_ultimo_pago}
                    onChange={(e) => setSelectedRenta({...selectedRenta, fecha_ultimo_pago: e.target.value})}
                    className="w-full bg-slate-50 border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Próx. Vencimiento</label>
                  <input 
                    type="date" 
                    value={selectedRenta?.proximo_vencimiento}
                    onChange={(e) => setSelectedRenta({...selectedRenta, proximo_vencimiento: e.target.value})}
                    className="w-full bg-slate-50 border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado del Servicio</label>
                <select 
                  value={selectedRenta?.status}
                  onChange={(e) => setSelectedRenta({...selectedRenta, status: e.target.value})}
                  className="w-full bg-slate-50 border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                >
                  <option value="activo">✅ Servicio Activo</option>
                  <option value="vencido">⚠️ Pago Pendiente</option>
                  <option value="bloqueado">🚫 Acceso Suspendido</option>
                </select>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={onSave}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95"
              >
                {saving ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Guardando...
                  </div>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
