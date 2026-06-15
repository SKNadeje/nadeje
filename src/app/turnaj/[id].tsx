import { SafeAreaView, View, Text, Pressable, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

type Zapas = {
  id: string;
  domaci: string;
  hoste: string;
  datum: string;
  stav: string;
};

export default function Turnaj() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [zapasy, setZapasy] = useState<Zapas[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipy, setTipy] = useState<Record<string, { domaci: string; hoste: string; strelec: string }>>({});

  const nazev = (id as string).replace(/-/g, ' ').toUpperCase();

  useEffect(() => {
    nactiZapasy();
  }, [id]);

  async function nactiZapasy() {
    setLoading(true);
    const turnajMap: Record<string, string> = {
      'ms-hokej': 'MS Hokej',
      'ms-fotbal': 'MS Fotbal',
      'me-fotbal': 'ME Fotbal',
      'zimni-olympiada': 'Zimní Olympiáda',
      'letni-olympiada': 'Letní Olympiáda',
      'extraliga': 'Tipsport Extraliga',
      'chance-liga': 'Chance Liga',
      'champions-league': 'Champions League',
    };
    const { data } = await supabase
      .from('zapasy')
      .select('*')
      .eq('turnaj', turnajMap[id as string] || nazev)
      .eq('stav', 'nadchazejici')
      .order('datum', { ascending: true });
    setZapasy(data || []);
    setLoading(false);
  }

  async function odeslat(zapasId: string) {
    const tip = tipy[zapasId];
    if (!tip?.domaci || !tip?.hoste) {
      Alert.alert('Chyba', 'Vyplň tip skóre.');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('tipy').upsert({
      zapas_id: zapasId,
      user_id: user.id,
      tip_domaci: parseInt(tip.domaci),
      tip_hoste: parseInt(tip.hoste),
      tip_strelec: tip.strelec || null,
    });

    if (error) Alert.alert('Chyba', error.message);
    else Alert.alert('Hotovo', 'Tip byl uložen!');
  }

  const formatDatum = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }) + ' ' +
      d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← ZPĚT</Text>
        </Pressable>
        <Text style={s.eyebrow}>SK NADĚJE</Text>
        <Text style={s.title}>{nazev}</Text>

        {loading && <Text style={s.info}>Načítám zápasy…</Text>}
        {!loading && zapasy.length === 0 && (
          <Text style={s.info}>Zatím žádné zápasy. Admin je přidá.</Text>
        )}

        {zapasy.map(z => (
          <View key={z.id} style={s.card}>
            <Text style={s.datum}>{formatDatum(z.datum)}</Text>
            <Text style={s.zapas}>{z.domaci} vs {z.hoste}</Text>

            <View style={s.tipRow}>
              <View style={s.tipBlock}>
                <Text style={s.tipLabel}>{z.domaci}</Text>
                <TextInput
                  style={s.tipInput}
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  keyboardType="numeric"
                  maxLength={2}
                  value={tipy[z.id]?.domaci || ''}
                  onChangeText={v => setTipy(prev => ({ ...prev, [z.id]: { ...prev[z.id], domaci: v } }))}
                />
              </View>
              <Text style={s.vs}>:</Text>
              <View style={s.tipBlock}>
                <Text style={s.tipLabel}>{z.hoste}</Text>
                <TextInput
                  style={s.tipInput}
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  keyboardType="numeric"
                  maxLength={2}
                  value={tipy[z.id]?.hoste || ''}
                  onChangeText={v => setTipy(prev => ({ ...prev, [z.id]: { ...prev[z.id], hoste: v } }))}
                />
              </View>
            </View>

            <Text style={s.tipLabel}>STŘELEC (nepovinné)</Text>
            <TextInput
              style={[s.tipInput, { width: '100%', marginBottom: 12 }]}
              placeholder="Příjmení střelce"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={tipy[z.id]?.strelec || ''}
              onChangeText={v => setTipy(prev => ({ ...prev, [z.id]: { ...prev[z.id], strelec: v } }))}
            />

            <Pressable style={({ pressed }) => [s.btn, pressed && { opacity: 0.8 }]} onPress={() => odeslat(z.id)}>
              <Text style={s.btnText}>ULOŽIT TIP</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#080C1A' },
  scroll: { padding: 20, paddingBottom: 60 },
  back: { marginBottom: 16 },
  backText: { color: '#B8972A', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  eyebrow: { color: '#B8972A', fontSize: 11, fontWeight: '700', letterSpacing: 3 },
  title: { color: '#F0C040', fontSize: 26, fontWeight: '900', letterSpacing: 1, marginTop: 4, marginBottom: 24 },
  info: { color: 'rgba(255,255,255,0.4)', fontSize: 15, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(184,151,42,0.25)', padding: 16, marginBottom: 16 },
  datum: { color: '#B8972A', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  zapas: { color: '#F0C040', fontSize: 18, fontWeight: '900', marginBottom: 16 },
  tipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 },
  tipBlock: { alignItems: 'center', gap: 4 },
  tipLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  tipInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(184,151,42,0.35)', paddingHorizontal: 16, paddingVertical: 12, color: '#F0C040', fontSize: 20, fontWeight: '900', textAlign: 'center', width: 70 },
  vs: { color: '#F0C040', fontSize: 24, fontWeight: '900' },
  btn: { backgroundColor: '#B8972A', borderRadius: 10, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#F0C040' },
  btnText: { color: '#080C1A', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
});
