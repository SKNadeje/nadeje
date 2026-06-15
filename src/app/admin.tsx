import { SafeAreaView, View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

const TURNAJE = [
  'MS Hokej', 'MS Fotbal', 'ME Fotbal', 'Zimní Olympiáda',
  'Letní Olympiáda', 'Tipsport Extraliga', 'Chance Liga', 'Champions League'
];

export default function Admin() {
  const [turnaj, setTurnaj] = useState('MS Hokej');
  const [domaci, setDomaci] = useState('');
  const [hoste, setHoste] = useState('');
  const [datum, setDatum] = useState('');
  const [cas, setCas] = useState('');
  const [loading, setLoading] = useState(false);

  async function pridatZapas() {
    if (!domaci.trim() || !hoste.trim() || !datum.trim() || !cas.trim()) {
      Alert.alert('Chyba', 'Vyplň všechna pole.');
      return;
    }
    setLoading(true);
    const datumCas = new Date(`${datum}T${cas}:00`);
    const { error } = await supabase.from('zapasy').insert({
      turnaj,
      domaci,
      hoste,
      datum: datumCas.toISOString(),
    });
    setLoading(false);
    if (error) {
      Alert.alert('Chyba', error.message);
    } else {
      Alert.alert('Hotovo', 'Zápas byl přidán!');
      setDomaci('');
      setHoste('');
      setDatum('');
      setCas('');
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.eyebrow}>SK NADĚJE</Text>
        <Text style={s.title}>ADMIN</Text>
        <Text style={s.section}>PŘIDAT ZÁPAS</Text>

        <Text style={s.label}>TURNAJ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={s.pills}>
            {TURNAJE.map(t => (
              <Pressable key={t} style={[s.pill, turnaj === t && s.pillActive]} onPress={() => setTurnaj(t)}>
                <Text style={[s.pillText, turnaj === t && s.pillTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={s.label}>DOMÁCÍ</Text>
        <TextInput style={s.input} placeholder="Česko" placeholderTextColor="rgba(255,255,255,0.25)" value={domaci} onChangeText={setDomaci} />

        <Text style={s.label}>HOSTÉ</Text>
        <TextInput style={s.input} placeholder="Slovensko" placeholderTextColor="rgba(255,255,255,0.25)" value={hoste} onChangeText={setHoste} />

        <Text style={s.label}>DATUM (RRRR-MM-DD)</Text>
        <TextInput style={s.input} placeholder="2025-05-10" placeholderTextColor="rgba(255,255,255,0.25)" value={datum} onChangeText={setDatum} keyboardType="numeric" />

        <Text style={s.label}>ČAS (HH:MM)</Text>
        <TextInput style={s.input} placeholder="20:05" placeholderTextColor="rgba(255,255,255,0.25)" value={cas} onChangeText={setCas} keyboardType="numeric" />

        <Pressable style={({ pressed }) => [s.cta, pressed && { opacity: 0.85 }]} onPress={pridatZapas} disabled={loading}>
          <Text style={s.ctaText}>{loading ? 'Ukládám…' : 'PŘIDAT ZÁPAS'}</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#080C1A' },
  scroll: { padding: 24, paddingBottom: 60 },
  eyebrow: { color: '#B8972A', fontSize: 11, fontWeight: '700', letterSpacing: 3 },
  title: { color: '#F0C040', fontSize: 28, fontWeight: '900', letterSpacing: 1, marginBottom: 24 },
  section: { color: '#B8972A', fontSize: 13, fontWeight: '700', letterSpacing: 2, marginBottom: 16 },
  label: { color: '#B8972A', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(184,151,42,0.35)', paddingHorizontal: 16, paddingVertical: 14, color: '#F0C040', fontSize: 15, marginBottom: 14 },
  pills: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(184,151,42,0.3)', backgroundColor: 'rgba(255,255,255,0.04)' },
  pillActive: { backgroundColor: '#B8972A', borderColor: '#F0C040' },
  pillText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: '#080C1A' },
  cta: { backgroundColor: '#B8972A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#F0C040' },
  ctaText: { color: '#080C1A', fontSize: 15, fontWeight: '800', letterSpacing: 2 },
});
