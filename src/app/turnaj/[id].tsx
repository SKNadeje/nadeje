import { SafeAreaView, View, Text, Pressable, StyleSheet, ScrollView, TextInput, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { getObrazek } from '../../lib/tymy';

type Zapas = {
  id: string;
  domaci: string;
  hoste: string;
  datum: string;
  stav: string;
  vysledek_domaci: number | null;
  vysledek_hoste: number | null;
};

const TURNAJ_MAP: Record<string, string> = {
  'ms-hokej': 'MS Hokej',
  'ms-fotbal': 'MS Fotbal',
  'me-fotbal': 'ME Fotbal',
  'zimni-olympiada': 'Zimní Olympiáda',
  'letni-olympiada': 'Letní Olympiáda',
  'extraliga': 'Tipsport Extraliga',
  'chance-liga': 'Chance Liga',
  'champions-league': 'Champions League',
};

export default function Turnaj() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [zapasy, setZapasy] = useState<Zapas[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipy, setTipy] = useState<Record<string, { domaci: string; hoste: string; strelec: string }>>({});
  const [ulozeno, setUlozeno] = useState<Record<string, boolean>>({});

  const turnajNazev = TURNAJ_MAP[id as string] || (id as string);

  useEffect(() => { nactiZapasy(); }, [id]);

  async function nactiZapasy() {
    setLoading(true);
    const { data } = await supabase
      .from('zapasy')
      .select('*')
      .eq('turnaj', turnajNazev)
      .order('datum', { ascending: true });
    setZapasy(data || []);
    setLoading(false);
  }

  async function odeslat(zapasId: string) {
    const tip = tipy[zapasId];
    if (!tip?.domaci || !tip?.hoste) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('tipy').upsert({
      zapas_id: zapasId,
      user_id: user.id,
      tip_domaci: parseInt(tip.domaci),
      tip_hoste: parseInt(tip.hoste),
      tip_strelec: tip.strelec || null,
    });
    if (!error) setUlozeno(prev => ({ ...prev, [zapasId]: true }));
  }

  const formatDatum = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }) + ' · ' +
      d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← ZPĚT</Text>
        </Pressable>
        <Text style={s.eyebrow}>SK NADĚJE</Text>
        <Text style={s.title}>{turnajNazev.toUpperCase()}</Text>

        {loading && <Text style={s.info}>Načítám zápasy…</Text>}
        {!loading && zapasy.length === 0 && <Text style={s.info}>Zatím žádné zápasy. Admin je přidá.</Text>}

        {zapasy.map(z => {
          const maVysledek = z.vysledek_domaci !== null && z.vysledek_hoste !== null;
          return (
            <View key={z.id} style={s.card}>
              <Text style={s.datum}>{formatDatum(z.datum)}</Text>

              {maVysledek && (
                <View style={s.vysledekBadge}>
                  <Text style={s.vysledekText}>VÝSLEDEK {z.vysledek_domaci}:{z.vysledek_hoste}</Text>
                </View>
              )}

              <View style={s.zapasRow}>
                <View style={s.tym}>
                  {getObrazek(z.domaci) ? (
                    <Image source={{ uri: getObrazek(z.domaci)! }} style={s.vlajka} resizeMode="contain" />
                  ) : (
                    <View style={s.vlajkaPlaceholder} />
                  )}
                  <Text style={s.tymNazev}>{z.domaci}</Text>
                </View>

                <View style={s.vsKruh}>
                  <Text style={s.vsText}>VS</Text>
                </View>

                <View style={s.tym}>
                  {getObrazek(z.hoste) ? (
                    <Image source={{ uri: getObrazek(z.hoste)! }} style={s.vlajka} resizeMode="contain" />
                  ) : (
                    <View style={s.vlajkaPlaceholder} />
                  )}
                  <Text style={s.tymNazev}>{z.hoste}</Text>
                </View>
              </View>

              {!maVysledek && (
                <>
                  <View style={s.tipRow}>
                    <View style={s.tipBlock}>
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
                    <Text style={s.tipDvtecka}>:</Text>
                    <View style={s.tipBlock}>
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

                  <TextInput
                    style={s.strelecInput}
                    placeholder="Střelec (nepovinné)"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={tipy[z.id]?.strelec || ''}
                    onChangeText={v => setTipy(prev => ({ ...prev, [z.id]: { ...prev[z.id], strelec: v } }))}
                  />

                  <Pressable
                    style={({ pressed }) => [s.btn, ulozeno[z.id] && s.btnUlozeno, pressed && { opacity: 0.8 }]}
                    onPress={() => odeslat(z.id)}
                  >
                    <Text style={s.btnText}>{ulozeno[z.id] ? '✓ TIP ULOŽEN' : 'ULOŽIT TIP'}</Text>
                  </Pressable>
                </>
              )}
            </View>
          );
        })}
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
  title: { color: '#F0C040', fontSize: 24, fontWeight: '900', letterSpacing: 1, marginTop: 4, marginBottom: 24 },
  info: { color: 'rgba(255,255,255,0.4)', fontSize: 15, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(184,151,42,0.2)', padding: 20, marginBottom: 16 },
  datum: { color: '#B8972A', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 16, textAlign: 'center' },
  vysledekBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: '#2A7A3A', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  vysledekText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  zapasRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  tym: { flex: 1, alignItems: 'center', gap: 10 },
  vlajka: { width: 72, height: 48, borderRadius: 8 },
  vlajkaPlaceholder: { width: 72, height: 48, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
  tymNazev: { color: '#F0C040', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  vsKruh: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,180,220,0.15)', borderWidth: 1.5, borderColor: 'rgba(0,180,220,0.4)', alignItems: 'center', justifyContent: 'center' },
  vsText: { color: '#00B4DC', fontSize: 13, fontWeight: '900' },
  tipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 },
  tipBlock: { alignItems: 'center' },
  tipInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(184,151,42,0.35)', paddingHorizontal: 20, paddingVertical: 14, color: '#F0C040', fontSize: 24, fontWeight: '900', textAlign: 'center', width: 80 },
  tipDvtecka: { color: '#F0C040', fontSize: 28, fontWeight: '900' },
  strelecInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(184,151,42,0.2)', paddingHorizontal: 16, paddingVertical: 12, color: '#F0C040', fontSize: 14, marginBottom: 14, textAlign: 'center' },
  btn: { backgroundColor: '#B8972A', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#F0C040' },
  btnUlozeno: { backgroundColor: '#2A7A3A', borderColor: '#4CAF50' },
  btnText: { color: '#080C1A', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
});