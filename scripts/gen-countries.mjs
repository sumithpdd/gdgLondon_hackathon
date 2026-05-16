import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const subs = {
  "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
  "United States of America": "United States",
  "Russian Federation": "Russia",
  "Korea, Republic of": "South Korea",
  "Korea, Democratic People's Republic of": "North Korea",
  "Iran, Islamic Republic of": "Iran",
  "Venezuela, Bolivarian Republic of": "Venezuela",
  "Bolivia, Plurinational State of": "Bolivia",
  "Tanzania, United Republic of": "Tanzania",
  "Moldova, Republic of": "Moldova",
  "Micronesia, Federated States of": "Micronesia",
  "Netherlands, Kingdom of the": "Netherlands",
  "Congo, Democratic Republic of the": "DR Congo",
  "Lao People's Democratic Republic": "Laos",
  "Syrian Arab Republic": "Syria",
  "Taiwan, Province of China": "Taiwan",
  "Palestine, State of": "Palestine",
};

const url =
  "https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/slim-2/slim-2.json";

https
  .get(url, (res) => {
    let d = "";
    res.on("data", (c) => (d += c));
    res.on("end", () => {
      const j = JSON.parse(d);
      const names = j.map((x) => subs[x.name] || x.name);
      const uniq = [...new Set(names)].sort((a, b) => a.localeCompare(b));
      const out = `/** ISO-derived country names (friendly short forms where helpful). */\nexport const COUNTRY_OPTIONS = ${JSON.stringify(uniq, null, 2)} as const;\n\nexport type CountryName = (typeof COUNTRY_OPTIONS)[number];\n`;
      const suffix = `
const LEGACY_COUNTRY: Record<string, string> = {
  "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
  UK: "United Kingdom",
  "U.K.": "United Kingdom",
  USA: "United States",
  US: "United States",
  "U.S.A.": "United States",
};

const list = COUNTRY_OPTIONS as readonly string[];

/** Normalize stored country string to a value that matches \`COUNTRY_OPTIONS\` when possible. */
export function resolveCountryForSelect(saved: string | undefined): string {
  if (!saved?.trim()) return "";
  const t = saved.trim();
  if (list.includes(t)) return t;
  const mapped = LEGACY_COUNTRY[t];
  if (mapped && list.includes(mapped)) return mapped;
  const lower = t.toLowerCase();
  const byLower = list.find((n) => n.toLowerCase() === lower);
  return byLower ?? t;
}

/** Options for a select, including the current value if it is not in the canonical list (legacy free text). */
export function countrySelectOptions(current: string): string[] {
  const v = current.trim();
  const out = new Set<string>(list as unknown as string[]);
  if (v) out.add(v);
  return Array.from(out).sort((a, b) => a.localeCompare(b));
}
`;
      const target = path.join(__dirname, "..", "lib", "countries.ts");
      fs.writeFileSync(target, out + suffix, "utf8");
      console.log("Wrote", target, uniq.length, "countries");
    });
  })
  .on("error", (e) => {
    console.error(e);
    process.exit(1);
  });
