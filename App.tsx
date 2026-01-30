
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Profile } from './types';
import Auth from './components/Auth';
import ClientDashboard from './components/ClientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import { LogOut, Activity, ChevronRight, ShieldCheck, HeartPulse, Clock } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowAuth(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Landing Page if not logged in
  if (!session && !showAuth) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="text-blue-600 w-8 h-8" />
              <span className="text-xl font-extrabold tracking-tighter text-slate-900">SALVADÓ <span className="text-blue-600">DENTAL</span></span>
            </div>
            <button 
              onClick={() => setShowAuth(true)}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all"
            >
              Iniciar Sesión
            </button>
          </div>
        </nav>

        <section className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-bold rounded-full">Dra. Carmen Salvadó - Odontología Integral</span>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight">
                Tu sonrisa merece el <span className="text-blue-600">mejor cuidado.</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-xl">
                Agenda tu cita en línea hoy mismo y experimenta una atención odontológica de primer nivel en un ambiente cómodo y profesional.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setShowAuth(true)}
                  className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-blue-100"
                >
                  Agendar mi Cita <ChevronRight className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <HeartPulse className="text-blue-500 w-6 h-6" />
                  <span className="text-sm font-medium text-slate-700">+1,500 Pacientes Felices</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
              <img 
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=2070" 
                alt="Clínica Dental" 
                className="rounded-[2.5rem] shadow-2xl border-8 border-white relative z-10"
              />
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-24 px-6">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Seguridad Garantizada</h3>
              <p className="text-slate-500">Protocolos de esterilización estrictos y tecnología de vanguardia.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Horarios Flexibles</h3>
              <p className="text-slate-500">Atendemos de Lunes a Sábado. Revisa nuestra disponibilidad en vivo.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <Activity className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Atención Integral</h3>
              <p className="text-slate-500">Desde limpiezas preventivas hasta ortodoncia y estética dental.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!session && showAuth) {
    return <Auth onBack={() => setShowAuth(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Activity className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              SALVADÓ <span className="text-blue-600">DENTAL</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-slate-900">{profile?.first_name} {profile?.last_name}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{profile?.role}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-3 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all text-slate-400"
              title="Cerrar Sesión"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {profile?.role === 'doctor' ? (
          <DoctorDashboard profile={profile} />
        ) : (
          <ClientDashboard profile={profile!} />
        )}
      </main>
      
      <footer className="bg-white border-t py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-600 w-6 h-6" />
            <span className="text-lg font-bold text-slate-900">Salvadó Dental</span>
          </div>
          <div className="text-center text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} Clínica Dental Salvadó. Dra. Carmen. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
