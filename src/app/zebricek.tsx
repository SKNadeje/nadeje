import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

const GOLD = '#F0C040', GOLD_DIM = '#B8972A', CREAM = '#F5F1E6', CYAN = '#35D0E0', MUTED = '#9DA8C0', PANEL = '#0E1530';
const MEDAILE = ['🥇', '🥈', '🥉'];

type Hrac = { nick: string; body: number };
type Medaile = { nick: string; g: number; s: number; b: number };

export default function Zebricek() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [perTurnaj, setPerTurnaj] = useState<Record<string, Hrac[]>>({});
  const [celkove, setCelkove] = useState<Medaile[]>([]);
  const [vybrano, setVybrano] = useState('CELKOVÉ');

  useEffect(() => { nacti(); }, []);

  async function nacti() {
    setLoading(true);
    const { data } = await supabase.from('tipy_nadeje').select('user_id, body_ziskane, profiles(nickname), zapasy(turnaj)');
    const turnaje: Record<string, Record<string, Hrac>> = {};
    (data || []).forEach((r: any) => {
      const turnaj = r.zapasy?.turnaj;
      if (!turnaj) return;
      const nick = r.profiles?.nickname || '???';
      if (!turnaje[turnaj]) turnaje[turnaj] = {};
      if (!turnaje[turnaj][r.user_id]) turnaje[turnaj][r.user_id] = { nick, body: 0 };
      turnaje[turnaj][r.user_id].body += r.body_ziskane || 0;
    });

    const perT: Record<string, Hrac[]> = {};
    const medaile: Record<string, Medaile> = {};
    Object.entries(turnaje).forEach(([turnaj, hraci]) => {
      const serazeni = Object.values(hraci).sort((a, b) => b.body - a.body);
      perT[turnaj] = serazeni;
      serazeni.forEach((h, i) => {
        if (h.body <= 0 || i > 2) return;
        if (!medaile[h.nick]) medaile[h.nick] = { nick: h.nick, g: 0, s: 0, b: 0 };
        if (i === 0) medaile[h.nick].g++;
        else if (i === 1) medaile[h.nick].s++;
        else medaile[h.nick].b++;
      });
    });

    const celk = Object.values(medaile).sort((a, b) => b.g - a.g || b.s - a.s || b.b - a.b);
    setPerTurnaj(perT);
    setCelkove(celk);
    setLoading(false);
  }

  const turnajeList = Object.keys(perTurnaj);
  const taby = ['CELKOVÉ', ...turnajeList];

  return (
    <LinearGradient colors={['#0B1230', '#070B1A', '#05080F']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll}>
          <Pressable onPress={() => router.back()} style={s.back}><Text style={s.backText}>← ZPĚT</Text></Pressable>
          <Text style={s.eyebrow}>SK NADĚJE</Text>
          <Text style={s.title}>ŽEBŘÍČEK</Text>

          {loading && <Text style={s.info}>Načítám…</Text>}

          {!loading && (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={s.pills}>
                  {taby.map(t => (
                    <Pressable key={t} style={[s.pill, vybrano === t && s.pillActive]} onPress={() => setVybrano(t)}>
                      <Text style={[s.pillText, vybrano === t && s.pillTextActive]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {vybrano === 'CELKOVÉ' ? (
                celkove.length === 0 ? <Text style={s.info}>Zatím žádné výsledky.</Text> : (
                  <View style={s.box}>
                    {celkove.map((m, i) => (
                      <View key={m.nick} style={[s.radek, i < 3 && s.radekTop]}>
                        <Text style={s.rank}>{i < 3 ? MEDAILE[i] : i + 1}</Text>
                        <Text style={s.nick}>{m.nick}</Text>
                        <Text style={s.medaileText}>🥇{m.g}  🥈{m.s}  🥉{m.b}</Text>
                      </View>
                    ))}
                  </View>
                )
              ) : (
                <View style={s.box}>
                  {(perTurnaj[vybrano] || []).map((h, i) => (
                    <View key={h.nick + i} style={[s.radek, i < 3 && s.radekTop]}>
                      <Text style={s.rank}>{i < 3 ? MEDAILE[i] : i + 1}</Text>
                      <Text style={s.nick}>{h.nick}</Text>
                      <Text style={s.body}>{h.body} b</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 60 },
  back: { marginBottom: 16 }, backText: { color: GOLD_DIM, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  eyebrow: { color: GOLD_DIM, fontSize: 11, fontWeight: '700', letterSpacing: 3 },
  title: { color: GOLD, fontSize: 24, fontWeight: '900', letterSpacing: 1, marginTop: 4, marginBottom: 20 },
  info: { color: 'rgba(255,255,255,0.4)', fontSize: 15, textAlign: 'center', marginTop: 40 },
  pills: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(240,192,64,0.3)', backgroundColor: 'rgba(255,255,255,0.04)' },
  pillActive: { backgroundColor: GOLD, borderColor: '#FFE08A' },
  pillText: { color: MUTED, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  pillTextActive: { color: '#080C1A' },
  box: { backgroundColor: PANEL, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(240,192,64,0.15)', padding: 8 },
  radek: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 10, borderRadius: 12, gap: 12 },
  radekTop: { backgroundColor: 'rgba(240,192,64,0.06)' },
  rank: { color: GOLD, fontSize: 16, fontWeight: '900', width: 30, textAlign: 'center' },
  nick: { color: CREAM, fontSize: 15, fontWeight: '700', flex: 1 },
  body: { color: '#5DCAA5', fontSize: 15, fontWeight: '900' },
  medaileText: { color: CREAM, fontSize: 13, fontWeight: '700' },
});
