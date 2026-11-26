// Modelo visual: barra lateral preta + coluna principal, reproduzindo o currículo feito à mão.
import { Circle, Document, Link, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { Dictionary } from "@/i18n/dictionary";
import { linkLabel, wrapLink, type Resume, type Segment } from "./resume";

const INK = "#111111";
const SIDE_W = 196;
const ICONS = {
  location: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z",
  phone: "M15.5 1h-8A2.5 2.5 0 0 0 5 3.5v17A2.5 2.5 0 0 0 7.5 23h8a2.5 2.5 0 0 0 2.5-2.5v-17A2.5 2.5 0 0 0 15.5 1zm-4 21a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4.5-4H7V4h9v14z",
  email: "M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z",
  linkedin:
    "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z",
  github:
    "M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .32.21.69.82.57A12 12 0 0 0 12 .3Z",
};

const s = StyleSheet.create({
  // A margem de cima e de baixo fica na página: assim vale também da página 2 em diante.
  page: { flexDirection: "row", fontFamily: "Inter", fontSize: 8.5, color: INK, lineHeight: 1.35, paddingTop: 24, paddingBottom: 24 },
  sideBg: { position: "absolute", top: 0, left: 0, bottom: 0, width: SIDE_W, backgroundColor: INK },
  side: { width: SIDE_W, paddingHorizontal: 22, color: "#ffffff" },
  main: { flex: 1, paddingHorizontal: 28 },
  monogram: { alignSelf: "center", width: 58, height: 58, borderRadius: 29, borderWidth: 1.6, borderColor: "#ffffff", justifyContent: "center", alignItems: "center", marginBottom: 14 },
  monogramText: { fontSize: 17, fontWeight: 700 },
  sideTitle: { fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", paddingBottom: 3, borderBottomWidth: 0.8, borderBottomColor: "#8a8a8a", marginTop: 12, marginBottom: 7 },
  contactRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  contactText: { fontSize: 7.8, marginLeft: 7 },
  group: { fontSize: 7.6, fontWeight: 700, marginTop: 3, marginBottom: 3 },
  chips: { flexDirection: "row", flexWrap: "wrap", marginBottom: 2 },
  chip: { fontSize: 6.8, borderWidth: 0.7, borderColor: "#ffffff", borderRadius: 7, paddingHorizontal: 5, paddingTop: 1.8, paddingBottom: 0.6, marginRight: 3, marginBottom: 3 },
  chipLearning: { borderStyle: "dashed", borderColor: "#9a9a9a", color: "#c8c8c8" },
  legend: { fontSize: 6.6, color: "#a8a8a8", marginTop: 3 },
  eduCourse: { fontSize: 7.8, fontWeight: 700 },
  eduMeta: { fontSize: 7.4, color: "#d0d0d0" },
  langRow: { flexDirection: "row", justifyContent: "space-between", fontSize: 7.8, marginTop: 4 },
  langBar: { height: 3, borderRadius: 1.5, backgroundColor: "#444444", marginTop: 3 },
  langFill: { height: 3, borderRadius: 1.5, backgroundColor: "#ffffff" },
  name1: { fontSize: 27, fontWeight: 900, lineHeight: 1.05 },
  name2: { fontSize: 27, fontWeight: 300, lineHeight: 1.1 },
  role: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", marginTop: 5, marginBottom: 7 },
  summary: { fontSize: 8.4, lineHeight: 1.45 },
  mainTitleRow: { flexDirection: "row", alignItems: "center", marginTop: 13, marginBottom: 8 },
  mainTitle: { fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginRight: 8 },
  rule: { flex: 1, height: 1.4, backgroundColor: INK },
  job: { flexDirection: "row", marginBottom: 7 },
  rail: { width: 14, alignItems: "center" },
  railLine: { position: "absolute", top: 4, bottom: -7, width: 1.2, backgroundColor: INK },
  jobBody: { flex: 1, paddingLeft: 6 },
  jobHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  jobRole: { fontSize: 9, fontWeight: 700 },
  period: { fontSize: 6.8, fontWeight: 700, color: "#ffffff", backgroundColor: INK, borderRadius: 6, paddingHorizontal: 5, paddingTop: 1.8, paddingBottom: 0.6 },
  jobMeta: { fontSize: 7.8, color: "#555555", marginBottom: 2 },
  bullet: { flexDirection: "row", marginTop: 1.5 },
  bulletText: { flex: 1, fontSize: 8.2 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { width: "48.5%", borderWidth: 0.8, borderColor: INK, borderRadius: 6, padding: 7, marginBottom: 7 },
  cardTitle: { fontSize: 8.6, fontWeight: 700, marginBottom: 2 },
  cardText: { fontSize: 7.8, marginBottom: 3 },
  stackChip: { fontSize: 6.6, color: "#ffffff", backgroundColor: INK, borderRadius: 5, paddingHorizontal: 4, paddingTop: 1.6, paddingBottom: 0.6, marginRight: 3, marginBottom: 3 },
  cardLink: { fontSize: 6.8, color: INK, textDecoration: "underline" },
});

function Icon({ d }: { d: string }) {
  return (
    <Svg width={8} height={8} viewBox="0 0 24 24">
      <Path d={d} fill="#ffffff" />
    </Svg>
  );
}

function Rich({ segments }: { segments: Segment[] }) {
  return segments.map((seg, i) => (
    <Text key={i} style={seg.bold ? { fontWeight: 700 } : undefined}>
      {seg.text}
    </Text>
  ));
}

// Triângulo "▸" desenhado: a Inter não tem esse caractere.
function Arrow() {
  return (
    <Svg width={8} height={9} viewBox="0 0 8 9">
      <Path d="M2 3 L5 4.75 L2 6.5 Z" fill={INK} />
    </Svg>
  );
}

function MainTitle({ children }: { children: string }) {
  return (
    <View style={s.mainTitleRow} wrap={false} minPresenceAhead={40}>
      <Text style={s.mainTitle}>{children}</Text>
      <View style={s.rule} />
    </View>
  );
}

export default function VisualCv({ resume, dict }: { resume: Resume; dict: Dictionary }) {
  const { profile, cv } = resume;
  const t = dict.cv;
  const contacts = [
    cv.location && { icon: ICONS.location, text: cv.location },
    cv.phone && { icon: ICONS.phone, text: cv.phone },
    { icon: ICONS.email, text: profile.email, href: `mailto:${profile.email}` },
    { icon: ICONS.linkedin, text: linkLabel(profile.linkedinUrl), href: profile.linkedinUrl },
    { icon: ICONS.github, text: linkLabel(profile.githubUrl), href: profile.githubUrl },
  ].filter(Boolean) as { icon: string; text: string; href?: string }[];

  return (
    <Document title={`${cv.fullName} — CV`} author={cv.fullName} language={cv.locale === "en" ? "en" : "pt-BR"}>
      <Page size="A4" style={s.page}>
        <View style={s.sideBg} fixed />
        <View style={s.side}>
          <View style={s.monogram}>
            <Text style={s.monogramText}>{cv.initials}</Text>
          </View>

          <Text style={s.sideTitle}>{t.contact}</Text>
          {contacts.map((c) => (
            <View key={c.text} style={s.contactRow}>
              <Icon d={c.icon} />
              {c.href ? (
                <Link src={c.href} style={[s.contactText, { color: "#ffffff", textDecoration: "none" }]}>{c.text}</Link>
              ) : (
                <Text style={s.contactText}>{c.text}</Text>
              )}
            </View>
          ))}

          <Text style={s.sideTitle}>{t.skills}</Text>
          {cv.skillGroups.map((g) => (
            <View key={g.group} wrap={false}>
              <Text style={s.group}>{g.group}</Text>
              <View style={s.chips}>
                {g.items.map((it) => (
                  <Text key={it.name} style={it.learning ? [s.chip, s.chipLearning] : s.chip}>{it.name}</Text>
                ))}
              </View>
            </View>
          ))}
          {cv.hasLearning && <Text style={s.legend}>{t.learningLegend}</Text>}

          {resume.education.length > 0 && <Text style={s.sideTitle}>{t.education}</Text>}
          {resume.education.map((e) => (
            <View key={e.id} style={{ marginBottom: 6 }} wrap={false}>
              <Text style={s.eduCourse}>{e.course}</Text>
              <Text style={s.eduMeta}>{e.note ? `${e.school} · ${e.note}` : e.school}</Text>
              <Text style={s.eduMeta}>{e.period}</Text>
            </View>
          ))}

          {cv.languages.length > 0 && <Text style={s.sideTitle}>{t.languages}</Text>}
          {cv.languages.map((l) => (
            <View key={l.name} wrap={false}>
              <View style={s.langRow}>
                <Text>{l.name}</Text>
                {/* Na barra lateral só cabe o nível curto: o que vem antes de ":" */}
                <Text>{l.level.split(":")[0].trim()}</Text>
              </View>
              <View style={s.langBar}>
                <View style={[s.langFill, { width: `${(Math.min(5, Math.max(1, l.proficiency)) / 5) * 100}%` }]} />
              </View>
            </View>
          ))}
        </View>

        <View style={s.main}>
          <Text style={s.name1}>{cv.nameLines[0]}</Text>
          {cv.nameLines[1] ? <Text style={s.name2}>{cv.nameLines[1]}</Text> : null}
          <Text style={s.role}>{profile.role}</Text>
          <Text style={s.summary}>
            {profile.summary}
            {cv.closing.length > 0 ? " " : ""}
            <Rich segments={cv.closing} />
          </Text>

          {resume.experiences.length > 0 && <MainTitle>{t.experience}</MainTitle>}
          {resume.experiences.map((e, i) => (
            <View key={e.id} style={s.job} wrap={false}>
              <View style={s.rail}>
                {i < resume.experiences.length - 1 && <View style={s.railLine} />}
                <Svg width={9} height={9} viewBox="0 0 10 10" style={{ marginTop: 2 }}>
                  <Circle cx={5} cy={5} r={4} fill={e.current ? INK : "#ffffff"} stroke={INK} strokeWidth={1.2} />
                </Svg>
              </View>
              <View style={s.jobBody}>
                <View style={s.jobHead}>
                  <Text style={s.jobRole}>{e.role}</Text>
                  <Text style={s.period}>{e.period}</Text>
                </View>
                <Text style={s.jobMeta}>{e.company} · {e.location}</Text>
                {e.bullets.map((b) => (
                  <View key={b} style={s.bullet}>
                    <Arrow />
                    <Text style={s.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {resume.projects.length > 0 && <MainTitle>{t.projects}</MainTitle>}
          <View style={s.grid}>
            {resume.projects.map((p) => (
              <View key={p.id} style={s.card} wrap={false}>
                <Text style={s.cardTitle}>{p.title}</Text>
                <Text style={s.cardText}>{p.metric ? `${p.description} ${p.metric}` : p.description}</Text>
                <View style={s.chips}>
                  {p.stack.map((x) => (
                    <Text key={x} style={s.stackChip}>{x}</Text>
                  ))}
                </View>
                {/* link longo quebra depois de uma "/" em vez de vazar da caixa */}
                {p.url && <Link src={p.url} style={s.cardLink}>{wrapLink(linkLabel(p.url), 40)}</Link>}
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
