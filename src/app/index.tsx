import { SafeAreaView, View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

const LOGO = require('../../assets/images/logo.png');

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <View style={s.container}>

        <Text style={s.eyebrow}>SK NADĚJE PRESENTS</Text>

        <Image source={LOGO} style={s.logo} resizeMode="contain" />

        <View style={s.textBlock}>
          <Text style={s.sub}>SÁZKOVÁ KANCELÁŘ</Text>
          <Text style={s.title}>PŘÁTELSKÁ{'\n'}TIPOVAČKA</Text>
          <Text style={s.desc}>Tipuj zápasy · Sbírej body · Poraz partu</Text>
        </View>

        <Pressable
          style={({ pressed }) => [s.cta, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/auth')}
        >
          <Text style={s.ctaText}>⚽  VSTOUPIT</Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#080C1A' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  eyebrow: {
    color: '#B8972A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
  },
  logo: {
    width: 220,
    height: 220,
  },
  textBlock: { alignItems: 'center', gap: 8 },
  sub: {
    color: '#B8972A',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: '#F0C040',
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: 1,
  },
  desc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 4,
  },
  cta: {
    backgroundColor: '#B8972A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderWidth: 1,
    borderColor: '#F0C040',
  },
  ctaText: {
    color: '#080C1A',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
