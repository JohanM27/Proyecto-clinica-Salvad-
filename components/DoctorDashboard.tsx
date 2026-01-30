
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Appointment, Profile, ClinicConfig, PaymentMethod, WorkingHours } from '../types';
// Import CreditCard from lucide-react
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Settings, 
  Star, 
  RefreshCcw, 
  AlertCircle,
  Clock,
  ExternalLink,
  Plus,
  CreditCard
} from 'lucide-react';

interface DoctorDashboardProps {
  profile: Profile;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ profile }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinicConfig, setClinicConfig] = useState<ClinicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'appointments' | 'settings'>('appointments');
  
  // Create appointment state
  const [isCreating, setIsCreating] = useState(false);
  const [clients, setClients] = useState<Profile[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newAptTitle, setNewAptTitle] = useState('');
  const [newAptDesc, setNewAptDesc] = useState('');
  const [newAptDate, setNewAptDate] = useState('');
  const [newAptTime, setNewAptTime] = useState('09:00');
  const [newAptPayment, setNewAptPayment] = useState<PaymentMethod>('N/A');

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

  const updateWorkingHours = async (day: string, field: 'enabled' | 'start' | 'end', value: any) => {
    if (!clinicConfig) return;
    const newHours = { ...clinicConfig.working_hours };
    newHours[day] = { ...newHours[day], [field]: value };
    
    const { error } = await supabase
      .from('clinic_config')
      .update({ working_hours: newHours })
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

    if (!error) {
      if (status === 'finished') {
        const apt = appointments.find(a => a.id === aptId);
        alert(`Cita Finalizada. Un correo de confirmación de pago ha sido enviado a ${apt?.client?.email}`);
      }
      fetchAppointments();
    }
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
      alert(`La cita de ${apt.client?.first_name} ha sido reprogramada para mañana a la misma hora.`);
      fetchAppointments();
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    const scheduledAt = new Date(`${newAptDate}T${newAptTime}`).toISOString();

    const { error } = await supabase
      .from('appointments')
      .insert({
        client_id: selectedClientId,
        title: newAptTitle,
        description: newAptDesc,
        payment_method: newAptPayment,
        scheduled_at: scheduledAt,
        status: 'confirmed'
      });

    if (!error) {
      setIsCreating(false);
      setNewAptTitle('');
      setNewAptDesc('');
      fetchAppointments();
      alert('Cita creada exitosamente por el Doctor.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Panel de Control de Carmen</h2>
          <p className="text-slate-500">Gestión de agenda y estado de la clínica.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTab('appointments')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'appointments' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Agenda
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'settings' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Configuración
          </button>
        </div>
      </div>

      {tab === 'appointments' ? (
        <>
          {/* Quick Actions */}
          <div className="flex justify-end">
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" /> Nueva Cita Manual
            </button>
          </div>

          {/* Appointments List */}
          <div className="grid gap-4">
            {appointments.length > 0 ? (
              appointments.map((apt) => (
                <div key={apt.id} className="bg-white p-6 rounded-3xl border shadow-sm overflow-hidden flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{apt.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        apt.status === 'request' ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {apt.status === 'request' ? 'SOLICITUD' : apt.status}
                      </span>
                    </div>
                    <div className="space-y-1 mb-4">
                      <p className="text-sm font-bold text-slate-700">Paciente: <span className="font-normal text-slate-600">{apt.client?.first_name} {apt.client?.last_name} ({apt.client?.email})</span></p>
                      <p className="text-sm text-slate-600">{apt.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-400">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(apt.scheduled_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> {apt.payment_method}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:w-auto w-full border-t md:border-t-0 pt-4 md:pt-0">
                    {apt.status !== 'finished' && apt.status !== 'cancelled' && (
                      <>
                        <button
                          onClick={() => handleAction(apt.id, 'finished')}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                          title="Finalizar Cita"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleAction(apt.id, 'cancelled')}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                          title="Cancelar Cita"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRescheduleTomorrow(apt)}
                          className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
                          title="Reprogramar para Mañana"
                        >
                          <RefreshCcw className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    
                    {apt.status === 'finished' && (
                      <div className="flex items-center gap-1 bg-yellow-50 p-2 rounded-lg">
                        <span className="text-xs font-bold text-yellow-600 mr-1">Calificar:</span>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleAction(apt.id, 'finished', s)}
                            className={`${apt.client_rating >= s ? 'text-yellow-500' : 'text-slate-300'}`}
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-slate-400">No hay citas registradas.</div>
            )}
          </div>
        </>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Clinic Toggle */}
          <div className="bg-white p-8 rounded-3xl border shadow-sm">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Estado de la Clínica
            </h3>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
              <div>
                <span className="text-sm font-bold block">Visibilidad de la Tienda</span>
                <span className={`text-xs ${clinicConfig?.is_open ? 'text-green-600' : 'text-red-600'} font-black`}>
                  {clinicConfig?.is_open ? 'ABIERTA' : 'CERRADA'}
                </span>
              </div>
              <button
                onClick={toggleClinicStatus}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${clinicConfig?.is_open ? 'bg-green-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${clinicConfig?.is_open ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              * Si está cerrada, todas las nuevas citas entrarán como solicitudes pendientes de aprobación.
            </p>
          </div>

          {/* Working Hours */}
          <div className="bg-white p-8 rounded-3xl border shadow-sm">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Horario Semanal
            </h3>
            <div className="space-y-4">
              {clinicConfig && Object.entries(clinicConfig.working_hours).map(([day, config]: [string, any]) => (
                <div key={day} className="flex flex-col gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold capitalize">{day}</span>
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => updateWorkingHours(day, 'enabled', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  {config.enabled && (
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={config.start}
                        onChange={(e) => updateWorkingHours(day, 'start', e.target.value)}
                        className="text-xs px-2 py-1 border rounded-lg"
                      />
                      <span className="text-xs text-slate-400 self-center">a</span>
                      <input
                        type="time"
                        value={config.end}
                        onChange={(e) => updateWorkingHours(day, 'end', e.target.value)}
                        className="text-xs px-2 py-1 border rounded-lg"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manual Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 space-y-6">
            <h2 className="text-2xl font-bold">Nueva Cita (Doctor)</h2>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold">Paciente</label>
                <select 
                  required
                  className="w-full px-4 py-2 border rounded-xl"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Seleccionar Paciente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold">Título</label>
                <input required className="w-full px-4 py-2 border rounded-xl" value={newAptTitle} onChange={e => setNewAptTitle(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold">Fecha</label>
                  <input type="date" required className="w-full px-4 py-2 border rounded-xl" value={newAptDate} onChange={e => setNewAptDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold">Hora</label>
                  <input type="time" required className="w-full px-4 py-2 border rounded-xl" value={newAptTime} onChange={e => setNewAptTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold">Método de Pago (Opcional)</label>
                <select className="w-full px-4 py-2 border rounded-xl" value={newAptPayment} onChange={e => setNewAptPayment(e.target.value as PaymentMethod)}>
                  <option value="N/A">Omitir / N/A</option>
                  <option value="BAC">BAC</option>
                  <option value="Occidente">Occidente</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">Crear Cita</button>
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
