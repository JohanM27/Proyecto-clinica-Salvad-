
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Appointment, Profile, ClinicConfig, PaymentMethod } from '../types';
import { Calendar as CalendarIcon, Clock, CreditCard, Users, Plus, CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

interface ClientDashboardProps {
  profile: Profile;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ profile }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinicConfig, setClinicConfig] = useState<ClinicConfig | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BAC');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [attendees, setAttendees] = useState<string[]>([]);
  const [newAttendee, setNewAttendee] = useState('');

  useEffect(() => {
    fetchAppointments();
    fetchClinicConfig();
  }, []);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', profile.id)
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

  const handleAddAttendee = () => {
    if (newAttendee.trim()) {
      setAttendees([...attendees, newAttendee.trim()]);
      setNewAttendee('');
    }
  };

  const removeAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      const status = clinicConfig?.is_open ? 'pending' : 'request';

      const { error } = await supabase
        .from('appointments')
        .insert({
          client_id: profile.id,
          title,
          description,
          payment_method: paymentMethod,
          attendees,
          scheduled_at: scheduledAt,
          status
        });

      if (error) throw error;
      
      setIsBooking(false);
      resetForm();
      fetchAppointments();
      alert(status === 'request' ? 'La clínica está cerrada. Su solicitud ha sido enviada.' : 'Cita agendada con éxito.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPaymentMethod('BAC');
    setDate('');
    setTime('09:00');
    setAttendees([]);
    setNewAttendee('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'request': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'finished': return 'text-slate-600 bg-slate-50 border-slate-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      case 'rescheduled': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'request': return 'Solicitud (Clínica Cerrada)';
      case 'finished': return 'Finalizada';
      case 'cancelled': return 'Cancelada';
      case 'rescheduled': return 'Reprogramada';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mis Citas</h2>
          <p className="text-slate-500">Gestiona tus consultas odontológicas con la Dra. Carmen.</p>
        </div>
        <button
          onClick={() => setIsBooking(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Agendar Nueva Cita
        </button>
      </div>

      {!clinicConfig?.is_open && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex gap-3 text-orange-800">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            <strong>Aviso:</strong> La clínica se encuentra actualmente cerrada. Puedes enviar una <strong>solicitud de cita</strong> y el equipo se pondrá en contacto contigo pronto.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {loading && appointments.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Cargando citas...</div>
        ) : appointments.length > 0 ? (
          appointments.map((apt) => (
            <div key={apt.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-slate-900">{apt.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(apt.status)}`}>
                      {getStatusLabel(apt.status)}
                    </span>
                  </div>
                  <p className="text-slate-600 mb-4 line-clamp-2">{apt.description}</p>
                  
                  <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-blue-500" />
                      {new Date(apt.scheduled_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      {new Date(apt.scheduled_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                      {apt.payment_method}
                    </div>
                    {apt.attendees?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        Acompañantes: {apt.attendees.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white py-16 text-center rounded-3xl border-2 border-dashed border-slate-200">
            <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No tienes citas programadas.</p>
          </div>
        )}
      </div>

      {isBooking && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-8 py-6 border-b flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-slate-900">Agendar Cita</h2>
              <button onClick={() => setIsBooking(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleBook} className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Título de la cita</label>
                  <input
                    type="text"
                    placeholder="Ej. Limpieza Dental"
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Método de Pago</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="BAC">BAC</option>
                    <option value="Occidente">Occidente</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Descripción</label>
                <textarea
                  placeholder="Explica brevemente el motivo de tu visita..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none shadow-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Fecha</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-slate-900"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Hora</label>
                  <input
                    type="time"
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-slate-900"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 block">Acompañantes / Terceros</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nombre del acompañante"
                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    value={newAttendee}
                    onChange={(e) => setNewAttendee(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAttendee())}
                  />
                  <button
                    type="button"
                    onClick={handleAddAttendee}
                    className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 shadow-md transition-all"
                  >
                    Añadir
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Yo</div>
                  {attendees.map((name, i) => (
                    <div key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium flex items-center gap-2">
                      {name}
                      <button type="button" onClick={() => removeAttendee(i)} className="text-slate-400 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Procesando...' : clinicConfig?.is_open ? 'Confirmar Cita' : 'Enviar Solicitud'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;