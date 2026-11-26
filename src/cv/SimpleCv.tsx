// Modelo simples para portais de vaga (ATS): uma coluna, Helvetica, nada de enfeite.
import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Dictionary } from "@/i18n/dictionary";
import { linkLabel, type Resume } from "./resume";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, lineHeight: 1.35, color: "#111111", paddingHorizontal: 40, paddingVertical: 34 },
  name: { fontFamily: "Helvetica-Bold", fontSize: 20, lineHeight: 1.2 },
  role: { fontFamily: "Helvetica-Bold", fontSize: 9, marginTop: 3 },
  contact: { fontSize: 8.5, marginTop: 3 },
  link: { color: "#111111", textDecoration: "underline" },
  title: { fontFamily: "Helvetica-Bold", fontSize: 11, textTransform: "uppercase", borderBottomWidth: 1, borderBottomColor: "#111111", paddingBottom: 2, marginTop: 12, marginBottom: 5 },
  bold: { fontFamily: "Helvetica-Bold" },
  meta: { fontSize: 8.5, color: "#555555" },
  bullet: { flexDirection: "row", marginTop: 1.5, paddingLeft: 6 },
  dot: { width: 9 },
  item: { flex: 1 },
  line: { marginBottom: 3 },
});

const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.bullet} wrap={false}>
      <Text style={s.dot}>•</Text>
      <Text style={s.item}>{children}</Text>
    </View>
  );
}

function Title({ children }: { children: string }) {
  return (
    <Text style={s.title} minPresenceAhead={30}>
      {children}
    </Text>
  );
}

export default function SimpleCv({ resume, dict }: { resume: Resume; dict: Dictionary }) {
  const { profile, cv } = resume;
  const t = dict.cv;
  const contacts: { text: string; href?: string }[] = [
    ...(cv.location ? [{ text: cv.location }] : []),
    ...(cv.phone ? [{ text: cv.phone }] : []),
    { text: profile.email, href: `mailto:${profile.email}` },
    { text: linkLabel(profile.linkedinUrl), href: profile.linkedinUrl },
    { text: linkLabel(profile.githubUrl), href: profile.githubUrl },
  ];

  return (
    <Document title={`${cv.fullName} — CV`} author={cv.fullName} language={cv.locale === "en" ? "en" : "pt-BR"}>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{cv.fullName}</Text>
        <Text style={s.role}>{profile.role}</Text>
        <Text style={s.contact}>
          {contacts.map((c, i) => (
            <Text key={c.text}>
              {i > 0 ? " · " : ""}
              {c.href ? <Link src={c.href} style={s.link}>{c.text}</Link> : c.text}
            </Text>
          ))}
        </Text>

        <Title>{t.summary}</Title>
        <Text>
          {profile.summary}
          {cv.closing.length > 0 ? " " + cv.closing.map((x) => x.text).join("") : ""}
        </Text>

        {resume.experiences.length > 0 && <Title>{t.experience}</Title>}
        {resume.experiences.map((e) => (
          <View key={e.id} style={{ marginBottom: 6 }}>
            <Text style={s.bold}>{e.role} · {e.company}</Text>
            <Text style={s.meta}>{e.period} · {e.location}</Text>
            {e.bullets.map((b) => (
              <Bullet key={b}>{b}</Bullet>
            ))}
          </View>
        ))}

        {resume.projects.length > 0 && <Title>{t.projects}</Title>}
        {resume.projects.map((p) => (
          <Bullet key={p.id}>
            <Text style={s.bold}>{p.title}</Text>
            {p.stack.length > 0 ? ` (${p.stack.join(", ")})` : ""}: {lowerFirst(p.description)}
            {p.url ? " " : ""}
            {p.url ? <Link src={p.url} style={s.link}>{linkLabel(p.url)}</Link> : null}
          </Bullet>
        ))}

        {cv.skillGroups.length > 0 && <Title>{t.skills}</Title>}
        {cv.skillGroups.map((g) => {
          const known = g.items.filter((x) => !x.learning).map((x) => x.name);
          const learning = g.items.filter((x) => x.learning).map((x) => x.name);
          return (
            <Text key={g.group} style={s.line}>
              <Text style={s.bold}>{g.group}:</Text>
              {known.length ? ` ${known.join(", ")}.` : ""}
              {learning.length ? ` ${t.learningPrefix}: ${learning.join(", ")}.` : ""}
            </Text>
          );
        })}

        {resume.education.length > 0 && <Title>{t.education}</Title>}
        {resume.education.map((e) => (
          <Text key={e.id} style={s.line}>
            <Text style={s.bold}>{e.course}</Text> · {e.school} · {e.note ? `${e.note}, ` : ""}{e.period}
          </Text>
        ))}

        {cv.languages.length > 0 && <Title>{t.languages}</Title>}
        {cv.languages.length > 0 && <Text>{cv.languages.map((l) => `${l.name} (${lowerFirst(l.level)})`).join(" · ")}</Text>}
      </Page>
    </Document>
  );
}
