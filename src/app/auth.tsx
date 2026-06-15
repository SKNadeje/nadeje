import { SafeAreaView, View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<'register' | 'login'>('register');

  const isLogin = mode === 'login';

  async function handleRegister() {
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !nickname.trim() || !email.trim() || !password.trim()) {
      setError('Vyplň prosím všechna pole.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, nickname },
      },
    });
    setLoading(false);
    if (err) setError(err.message);
    else setSuccess(true);
  }

  async function handleLogin() {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Vyplň e-mail a heslo.');
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.session) {
      router.replace('/home');
    }
  }

  if (success) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.successBox}>
          <Text style={s.successIcon}>✅</Text>
          <Text style={s.successTitle}>Registrace proběhla!</Text>
          <Text style={s.successText}>Zkontroluj svůj e-mail a potvrď účet. Pak se přihlas.</Text>
          <Pressable style={s.cta} onPress={() => { setSuccess(false); setMode('login'); }}>
            <Text style={s.ctaText}>PŘIHLÁSIT SE</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.eyebrow}>SK NADĚJE</Text>
          <Text style={s.title}>{isLogin ? 'PŘIHLÁŠENÍ' : 'REGISTRACE'}</Text>
          <View style={s.form}>
            {!isLogin && (
              <>
                <View style={s.row}>
                  <View style={[s.field, { flex: 1 }]}>
                    <Text style={s.label}>JMÉNO</Text>
                    <TextInput style={s.input} placeholder="Jan" placeholderTextColor="rgba(255,255,255,0.25)" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
                  </View>
                  <View style={[s.field, { flex: 1 }]}>
                    <Text style={s.label}>PŘÍJMENÍ</Text>
                    <TextInput style={s.input} placeholder="Novák" placeholderTextColor="rgba(255,255,255,0.25)" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
                  </View>
                </View>
                <View style={s.field}>
                  <Text style={s.label}>HERNÍ NICKNAME</Text>
                  <TextInput style={s.input} placeholder="SuperTipér99" placeholderTextColor="rgba(255,255,255,0.25)" value={nickname} onChangeText={setNickname} autoCapitalize="none" />
                </View>
              </>
            )}
            <View style={s.field}>
              <Text style={s.label}>E-MAIL</Text>
              <TextInput style={s.input} placeholder="jan@example.com" placeholderTextColor="rgba(255,255,255,0.25)" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>
            <View style={s.field}>
              <Text style={s.label}>HESLO</Text>
              <TextInput style={s.input} placeholder="••••••••" placeholderTextColor="rgba(255,255,255,0.25)" value={password} onChangeText={setPassword} secureTextEntry />
            </View>
            {error && <Text style={s.error}>{error}</Text>}
            <Pressable style={({ pressed }) => [s.cta, pressed && { opacity: 0.85 }]} onPress={isLogin ? handleLogin : handleRegister} disabled={loading}>
              <Text style={s.ctaText}>{loading ? 'Chvíli strpení…' : isLogin ? 'PŘIHLÁSIT SE' : 'ZAREGISTROVAT SE'}</Text>
            </Pressable>
            <Pressable style={s.toggle} onPress={() => setMode(isLogin ? 'register' : 'login')}>
              <Text style={s.toggleText}>
                {isLogin ? 'Nemám účet — ' : 'Už mám účet — '}
                <Text style={s.toggleLink}>{isLogin ? 'Registrace' : 'Přihlásit se'}</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#080C1A' },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  eyebrow: { color: '#B8972A', fontSize: 12, fontWeight: '700', letterSpacing: 3, marginBottom: 8 },
  title: { color: '#F0C040', fontSize: 32, fontWeight: '900', letterSpacing: 1, marginBottom: 36 },
  form: { gap: 14 },
  row: { flexDirection: 'row', gap: 12 },
  field: { gap: 6 },
  label: { color: '#B8972A', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(184,151,42,0.35)', paddingHorizontal: 16, paddingVertical: 14, color: '#F0C040', fontSize: 15 },
  error: { color: '#FF6B6B', fontSize: 13, textAlign: 'center' },
  cta: { backgroundColor: '#B8972A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#F0C040' },
  ctaText: { color: '#080C1A', fontSize: 15, fontWeight: '800', letterSpacing: 2 },
  toggle: { paddingVertical: 12, alignItems: 'center' },
  toggleText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  toggleLink: { color: '#F0C040', fontWeight: '700' },
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 16, backgroundColor: '#080C1A' },
  successIcon: { fontSize: 48 },
  successTitle: { color: '#F0C040', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  successText: { color: 'rgba(255,255,255,0.5)', fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
