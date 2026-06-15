import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { StatusBar } from 'react-native';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';

// Logo: nastav na require('../assets/logo.png') jakmile ho nahraješ
const LOGO = require("../../assets/images/logo.png");

export default function Welcome() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'register' | 'login'>('register');

  async function handleRegister() {
    setError(null);
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Vyplň prosím všechna pole.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    setLoading(false);
    if (err) setError(err.message);
    // Po úspěšné registraci Supabase pošle ověřovací e-mail.
    // Přesměrování uděláme přes auth listener v _layout.tsx (přidáme příště).
  }

  async function handleLogin() {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Vyplň e-mail a heslo.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
  }

  const isLogin = mode === 'login';

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={s.logoWrap}>
            {LOGO ? (
              <Image source={LOGO} style={s.logo} resizeMode="contain" />
            ) : (
              <View style={s.logoPlaceholder}>
                <Text style={s.logoPlaceholderText}>LOGO</Text>
              </View>
            )}
            <Text style={s.appName}>TipParta</Text>
            <Text style={s.tagline}>Tipuj. Poraž partu. Opakuj.</Text>
          </View>

          {/* Formulář */}
          <View style={s.form}>
            {!isLogin && (
              <View style={s.field}>
                <Text style={s.label}>JMÉNO</Text>
                <TextInput
                  style={s.input}
                  placeholder="Tvoje jméno"
                  placeholderTextColor="rgba(245,241,230,0.3)"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            )}

            <View style={s.field}>
              <Text style={s.label}>E-MAIL</Text>
              <TextInput
                style={s.input}
                placeholder="jan@example.com"
                placeholderTextColor="rgba(245,241,230,0.3)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>HESLO</Text>
              <TextInput
                style={s.input}
                placeholder="••••••••"
                placeholderTextColor="rgba(245,241,230,0.3)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={isLogin ? handleLogin : handleRegister}
              />
            </View>

            {error && <Text style={s.error}>{error}</Text>}

            <Pressable
              style={({ pressed }) => [s.cta, pressed && { opacity: 0.85 }]}
              onPress={isLogin ? handleLogin : handleRegister}
              disabled={loading}
            >
              <Text style={s.ctaText}>
                {loading
                  ? 'Chvíli strpení…'
                  : isLogin
                  ? 'Přihlásit se'
                  : 'Zaregistrovat se'}
              </Text>
            </Pressable>

            <Pressable style={s.toggle} onPress={() => setMode(isLogin ? 'register' : 'login')}>
              <Text style={s.toggleText}>
                {isLogin ? 'Nemám účet — ' : 'Už mám účet — '}
                <Text style={s.toggleLink}>
                  {isLogin ? 'Zaregistrovat se' : 'Přihlásit se'}
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.pitch },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
    justifyContent: 'center',
  },

  logoWrap: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  logo: { width: 100, height: 100, borderRadius: 24, marginBottom: 16 },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(245,241,230,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoPlaceholderText: {
    color: 'rgba(245,241,230,0.25)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  appName: {
    color: colors.cream,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: { color: colors.sage, fontSize: 15, marginTop: 4 },

  form: { gap: 12 },
  field: { gap: 6 },
  label: {
    color: colors.sage,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.pitchDeep,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.cream,
    fontSize: 15,
  },

  error: {
    color: '#FF6B6B',
    fontSize: 13,
    textAlign: 'center',
  },

  cta: {
    backgroundColor: colors.coral,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 6,
  },
  ctaText: { color: '#3A0E04', fontSize: 17, fontWeight: '800' },

  toggle: { paddingVertical: 8, alignItems: 'center' },
  toggleText: { color: colors.sage, fontSize: 14 },
  toggleLink: { color: colors.cream, fontWeight: '600' },
});
