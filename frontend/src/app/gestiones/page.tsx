"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Calendar, Phone, MapPin, CheckCircle2, Loader2, User, FileDown } from "lucide-react";
import { fetchInteracciones, fetchAllGestores } from "@/lib/api";
import * as XLSX from 'xlsx';

type GestionType = 'Todas' | 'Llamada' | 'Visita' | 'Mensaje';

export default function GestionesPage() {
  const [interacciones, setInteracciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [gestores, setGestores] = useState<any[]>([]);
  const [selectedGestor, setSelectedGestor] = useState<string>("");
  const [selectedType, setSelectedType] = useState<GestionType>('Todas');
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedSujeto, setSelectedSujeto] = useState<'Todos' | 'Socio' | 'Aval'>('Todos');
  const [selectedResultado, setSelectedResultado] = useState<string>("Todos");

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
        const data = await fetchInteracciones(selectedGestor, startDate, endDate);
        setInteracciones(data);
      } catch (error) {
        console.error("Error loading interactions:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedGestor, startDate, endDate]);

  const handleExportExcel = () => {
    const dataToExport = filteredInteracciones.map(item => {
      const sujetoExcel = getSujetoEfectivo(item);
      const esAvalExcel = sujetoExcel.startsWith('Aval');
      return {
        'Fecha': new Date(item.fecha_gestion).toLocaleString('es-MX'),
        'Tipo': item.tipo_gestion,
        'NoPrestamo': item.asignacion?.NoCUENTA || item.num_cuenta || 'N/A',
        'Socio ID': item.socio_id,
        'Nombre Socio': item.asignacion?.NOMBRE || '',
        'Nombre Aval': esAvalExcel ? (item.nombre_visitado || '') : '',
        'Nombre Visitado': item.nombre_visitado || item.asignacion?.NOMBRE || '',
        'Gestor': item.usuarios_gestor?.gestor || 'Sistema',
        'Sujeto Visitado': sujetoExcel,
        'Inicio Gestión': item.fecha_inicio_gestion ? new Date(item.fecha_inicio_gestion).toLocaleDateString('es-MX') : 'N/A',
        'Comentarios': item.descripcion || '',
        'Resultado': item.resultado || 'Exitoso'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gestiones");
    
    // Generar nombre de archivo con fecha
    const fileName = `Gestiones_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Función auxiliar para determinar el sujeto real basado en el comentario o el campo de la DB
  const getSujetoEfectivo = (item: any) => {
    const desc = item.descripcion || "";
    if (desc.startsWith('1-') || desc.startsWith('2-')) return 'Aval';
    if (desc.startsWith('0-')) return 'Socio';
    const rawSujeto = item.sujeto_tipo || 'Socio';
    if (rawSujeto.startsWith('Aval')) return 'Aval';
    return rawSujeto;
  };

  // Filtrar interacciones por tipo y sujeto en el frontend
  const filteredInteracciones = interacciones.filter(item => {
    const matchesType = selectedType === 'Todas' || item.tipo_gestion === selectedType;
    const sujetoEfectivo = getSujetoEfectivo(item);
    const matchesSujeto = selectedSujeto === 'Todos' || sujetoEfectivo === selectedSujeto;
    const matchesResultado = selectedResultado === 'Todos' || item.resultado === selectedResultado;
    return matchesType && matchesSujeto && matchesResultado;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Llamada': return <Phone size={18} />;
      case 'Visita': return <MapPin size={18} />;
      case 'Mensaje': return <MessageSquare size={18} />;
      default: return <Calendar size={18} />;
    }
  };

  const tabs: {id: GestionType, label: string}[] = [
    { id: 'Todas', label: 'Todas' },
    { id: 'Llamada', label: 'Llamadas' },
    { id: 'Visita', label: 'Visitas' },
    { id: 'Mensaje', label: 'Mensajes' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de Gestiones</h1>
          <p className="text-slate-500 text-sm">Registro cronológico de actividades de cobranza y contacto.</p>
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
                  <option key={g.gestor_id} value={g.gestor_id}>{g.gestor_name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase ml-2">Resultado:</span>
            <select 
              value={selectedResultado}
              onChange={(e) => setSelectedResultado(e.target.value)}
              className="text-xs font-bold text-slate-700 focus:outline-none bg-transparent cursor-pointer"
            >
              <option value="Todos">Todos</option>
              <option value="promesa_pago">Promesa de Pago</option>
              <option value="no_encontrado">No encontrado</option>
              <option value="ya_pago">Ya pagó</option>
              <option value="cambio_domicilio">Cambio domicilio</option>
              <option value="recibieron">Recibieron</option>
              <option value="por_localizar">Por localizar</option>
              <option value="reclamacion">Reclamación</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            disabled={filteredInteracciones.length === 0}
          >
            <FileDown size={16} />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="card !p-1 bg-slate-100/50">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                selectedType === tab.id 
                ? "bg-slate-900 text-white shadow-md" 
                : "text-slate-500 hover:text-slate-900 hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="h-8 w-px bg-slate-200 mx-4" />
          {['Todos', 'Socio', 'Aval'].map((sujeto) => (
            <button
              key={sujeto}
              onClick={() => setSelectedSujeto(sujeto as any)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                selectedSujeto === sujeto 
                ? "bg-blue-600 text-white shadow-md" 
                : "text-slate-500 hover:text-blue-600 hover:bg-white"
              }`}
            >
              {sujeto === 'Todos' ? 'Ambos Sujetos' : sujeto}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-4" size={40} />
          <p className="font-medium">Cargando historial de gestiones...</p>
        </div>
      ) : filteredInteracciones.length === 0 ? (
        <div className="py-20 text-center card bg-slate-50 border-dashed border-2">
          <MessageSquare className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-medium">No se encontraron gestiones registradas para {selectedType.toLowerCase()}.</p>
        </div>
      ) : (
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          {filteredInteracciones.map((item, i) => (
            <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-white group-[.is-active]:bg-blue-600 text-slate-400 group-[.is-active]:text-white shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-transform group-hover:scale-110">
                {getTypeIcon(item.tipo_gestion)}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] card !p-5 hover:border-blue-400 transition-all shadow-sm hover:shadow-md">
                <div className="flex items-center justify-between space-x-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      item.tipo_gestion === 'Llamada' ? 'bg-blue-400' : 
                      item.tipo_gestion === 'Visita' ? 'bg-emerald-400' : 'bg-purple-400'
                    }`}></span>
                    <div className="font-bold text-slate-900">{item.tipo_gestion} de Cobranza</div>
                  </div>
                  <time className="font-bold text-blue-600 text-[10px] bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {new Date(item.fecha_gestion).toLocaleString('es-MX', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </time>
                </div>
                <div className="text-slate-400 text-xs mb-4 font-bold uppercase tracking-tight flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                      <div>Socio: <span className="text-slate-700">{item.socio_id}</span></div>
                      <div>Cuenta: <span className="text-slate-700">{item.asignacion?.NoCUENTA || item.num_cuenta || 'N/A'}</span></div>
                      {item.fecha_inicio_gestion && (
                        <div className="bg-slate-100 px-2 py-0.5 rounded text-[9px] text-slate-500 font-bold border border-slate-200">
                          INICIO GESTIÓN: {new Date(item.fecha_inicio_gestion).toLocaleDateString('es-MX')}
                        </div>
                      )}
                    </div>
                   {getSujetoEfectivo(item).startsWith('Aval') ? (
                     <div className="flex flex-col gap-1 mt-1 border-t border-slate-100 pt-1">
                       {item.asignacion?.NOMBRE && (
                         <div className="flex items-center gap-1.5">
                           <User size={13} className="text-slate-400" />
                           <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">Socio</span>
                           <span className="text-slate-700 font-bold text-xs tracking-normal capitalize">
                             {item.asignacion.NOMBRE.toLowerCase()}
                           </span>
                         </div>
                       )}
                       {item.nombre_visitado && (
                         <div className="flex items-center gap-1.5">
                           <User size={13} className="text-blue-500" />
                           <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Aval</span>
                           <span className="text-slate-900 font-extrabold text-sm tracking-normal capitalize">
                             {item.nombre_visitado.toLowerCase()}
                           </span>
                         </div>
                       )}
                     </div>
                   ) : (
                     item.nombre_visitado && (
                       <div className="flex items-center gap-1.5 mt-1 border-t border-slate-100 pt-1">
                         <User size={14} className="text-blue-500" />
                         <span className="text-slate-900 font-extrabold text-sm tracking-normal capitalize">
                           {item.nombre_visitado.toLowerCase()}
                         </span>
                       </div>
                     )
                   )}
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 italic leading-relaxed">
                  <div className="flex items-center gap-2 mb-2 not-italic">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      getSujetoEfectivo(item) === 'Socio' ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {getSujetoEfectivo(item)}
                    </span>
                  </div>
                  "{item.descripcion || 'Sin comentarios registrados.'}"
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded-md border border-emerald-100 uppercase">
                    <CheckCircle2 size={12} /> {item.resultado || 'Exitoso'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 ml-auto">
                    <User size={12} className="text-blue-400" /> <span className="text-slate-600">{item.usuarios_gestor?.gestor || 'Sistema'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
