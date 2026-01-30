
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Appointment, Profile, ClinicConfig, PaymentMethod } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Settings, 
  Star, 
  RefreshCcw, 
  Clock,
  Plus,
  CreditCard,
  Users,
  LayoutGrid,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface DoctorDashboardProps {
  profile: Profile;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ profile }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinicConfig, setClinicConfig] = useState<ClinicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'appointments' | 'settings'>('appointments');
  const [isCreating, setIsCreating] = useState(false);
  const [clients, setClients] = useState<Profile[]>([]);
  
  // Form para creación manual
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newAptTitle, setNewAptTitle] = useState('');
  const [newAptDesc, setNewAptDesc] = useState('');
  const [newAptDate, setNewAptDate] = useState('');
  const [newAptTime, setNewAptTime] = useState('09:00');

  useEffect(() => {
    fetchAppointments();
    fetchClinicConfig();
    fetchClients();
  }, []);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, client:profiles(*)')
      .order('scheduled_at', { ascending: false });

    if (!error) setAppointments(data || []);
    setLoading(false);
  };

  const fetchClinicConfig = async () => {
    const { data, error } = await supabase
      .from('clinic_config')
      .select('*')
      .single();
    if (!error) setClinicConfig(data);
  };

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client');
    if (!error) setClients(data || []);
  };

  const toggleClinicStatus = async () => {
    if (!clinicConfig) return;
    const { error } = await supabase
      .from('clinic_config')
      .update({ is_open: !clinicConfig.is_open })
      .eq('id', clinicConfig.id);

    if (!error) fetchClinicConfig();
  };

  const handleAction = async (aptId: string, status: string, rating?: number) => {
    const updateData: any = { status };
    if (rating !== undefined) updateData.client_rating = rating;

    const { error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', aptId);

    if (!error) fetchAppointments();
  };

  const handleRescheduleTomorrow = async (apt: Appointment) => {
    const tomorrow = new Date(apt.scheduled_at);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { error } = await supabase
      .from('appointments')
      .update({ 
        scheduled_at: tomorrow.toISOString(),
        status: 'rescheduled'
      })
      .eq('id', apt.id);

    if (!error) {
      alert(`La cita de ${apt.client?.first_name} ha sido reprogramada para mañana.`);
      fetchAppointments();
    }
  };

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const scheduledAt = new Date(`${newAptDate}T${newAptTime}`).toISOString();

    const { error } = await supabase
      .from('appointments')
      .insert({
        client_id: selectedClientId,
        title: newAptTitle,
        description: newAptDesc,
        payment_method: 'N/A',
        scheduled_at: scheduledAt,
        status: 'confirmed'
      });

    if (!error) {
      setIsCreating(false);
      fetchAppointments();
      alert('Cita agendada manualmente.');
    }
  };

  const stats = {
    total: appointments.length,
    today: appointments.filter(a => new Date(a.scheduled_at).toDateString() === new Date().toDateString()).length,
    requests: appointments.filter(a => a.status === 'request').length
  };

  return (
    <div className="space-y-10">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-slate-400 block mb-1">Citas Totales</span>
            <span className="text-4xl font-black text-slate-900">{stats.total}</span>
          </div>
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <LayoutGrid className="w-7 h-7" />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-slate-400 block mb-1">Citas para Hoy</span>
            <span className="text-4xl font-black text-slate-900">{stats.today}</span>
          </div>
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
            <Calendar className="w-7 h-7" />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-slate-400 block mb-1">Solicitudes Pendientes</span>
            <span className="text-4xl font-black text-blue-600">{stats.requests}</span>
          </div>
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
            <AlertCircle className="w-7 h-7" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b pb-6">
        <div className="flex gap-4">
          <button 
            onClick={() => setTab('appointments')}
            className={`px-6 py-2.5 rounded-full font-bold transition-all ${tab === 'appointments' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Agenda Diaria
          </button>
          <button 
            onClick={() => setTab('settings')}
            className={`px-6 py-2.5 rounded-full font-bold transition-all ${tab === 'settings' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Configuración Clínica
          </button>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Plus className="w-5 h-5" /> Nueva Cita
        </button>
      </div>

      {tab === 'appointments' ? (
        <div className="grid gap-6">
          {appointments.length > 0 ? (
            appointments.map((apt) => (
              <div key={apt.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 group hover:border-blue-200 transition-all">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-50 px-4 py-2 rounded-2xl text-center min-w-[100px]">
                      <span className="text-xs font-black uppercase text-slate-400 block">Hora</span>
                      <span className="text-lg font-bold text-slate-900">{new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{apt.client?.first_name} {apt.client?.last_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                          apt.status === 'request' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                          {apt.status}
                        </span>
                        <span className="text-sm font-medium text-slate-400">• {apt.title}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{apt.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  {apt.status !== 'finished' && apt.status !== 'cancelled' && (
                    <>
                      <button 
                        onClick={() => handleAction(apt.id, 'confirmed')}
                        className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-all"
                        title="Confirmar"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => handleAction(apt.id, 'finished')}
                        className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
                        title="Finalizar"
                      >
                        <TrendingUp className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => handleRescheduleTomorrow(apt)}
                        className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all"
                        title="Mañana"
                      >
                        <RefreshCcw className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => handleAction(apt.id, 'cancelled')}
                        className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"
                        title="Cancelar"
                      >
                        <XCircle className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  {apt.status === 'finished' && (
                    <div className="flex items-center gap-1 bg-yellow-50 px-4 py-2 rounded-2xl">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${apt.client_rating >= s ? 'text-yellow-500 fill-current' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-6" />
              <p className="text-slate-400 font-bold text-xl">No hay citas programadas hoy.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm max-w-2xl">
          <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
            <Settings className="text-blue-600 w-7 h-7" /> Estado de la Clínica
          </h2>
          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <div>
              <span className="text-lg font-bold block text-slate-900">Visibilidad de Agenda</span>
              <p className="text-sm text-slate-500 mt-1">
                {clinicConfig?.is_open 
                  ? "Los pacientes pueden agendar citas confirmadas automáticamente." 
                  : "Nuevas citas entrarán como solicitudes para tu revisión."}
              </p>
            </div>
            <button 
              onClick={toggleClinicStatus}
              className={`w-16 h-8 rounded-full relative transition-all ${clinicConfig?.is_open ? 'bg-green-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${clinicConfig?.is_open ? 'left-9' : 'left-1'}`} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Creación Manual */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-10 space-y-6 animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl font-black text-slate-900">Nueva Cita Directa</h2>
            <form onSubmit={handleManualCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Paciente</label>
                <select 
                  required 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Seleccionar de la lista...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Motivo</label>
                <input 
                  required 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej. Tratamiento de Conducto"
                  value={newAptTitle}
                  onChange={e => setNewAptTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Fecha</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newAptDate}
                    onChange={e => setNewAptDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Hora</label>
                  <input 
                    type="time" 
                    required 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newAptTime}
                    onChange={e => setNewAptTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all">Crear Cita</button>
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
