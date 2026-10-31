/**
 * Tests de parcours de bout en bout (Playwright).
 * Usage : BASE_URL=http://localhost:3000 USER_EMAIL=... USER_PW=... PARTNER_EMAIL=... PARTNER_PW=... ADMIN_EMAIL=... ADMIN_PW=... node tests/e2e.mjs
 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const results = [];
const step = async (name, fn) => {
  try { await fn(); results.push(["✅", name]); console.log("✅", name); }
  catch (e) { results.push(["❌", name, String(e.message).split("\n")[0]]); console.log("❌", name, "—", String(e.message).split("\n")[0]); }
};
const expectText = async (page, text, timeout = 30000) => (typeof text === "string" ? page.getByText(text, { exact: false }) : page.getByText(text)).first().waitFor({ timeout });

async function login(page, email, pw) {
  await page.goto(`${BASE}/connexion`);
  await page.fill("#email", email);
  await page.fill("#password", pw);
  await page.click("button[type=submit]");
  await page.waitForURL(/tableau-de-bord|onboarding/, { timeout: 20000 });
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR" }); // smartphone
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await step("Accueil : hero, piliers et opportunités", async () => {
  await page.goto(BASE);
  await expectText(page, "Trouver un financement");
  await expectText(page, "Un écosystème, cinq piliers");
  await expectText(page, "Opportunités récentes");
});
await step("Recherche instantanée d'opportunités", async () => {
  await page.goto(`${BASE}/opportunites`);
  await page.fill("input[type=search]", "irrigation");
  await page.waitForURL(/q=irrigation/, { timeout: 20000, waitUntil: "commit" });
  await expectText(page, "Jeunes Maraîchers");
});
await step("Fiche opportunité démo clairement identifiée", async () => {
  await page.goto(`${BASE}/opportunites/20000000-0000-4000-a000-000000000001`);
  await expectText(page, "Opportunité de démonstration");
  await expectText(page, "Critères d'éligibilité");
});
await step("Accès protégé : redirection vers connexion", async () => {
  await page.goto(`${BASE}/tableau-de-bord`);
  await page.waitForURL(/connexion/);
});
await step("Connexion agripreneur", async () => login(page, process.env.USER_EMAIL, process.env.USER_PW));
await step("Tableau de bord personnalisé + recommandations", async () => {
  await page.goto(`${BASE}/tableau-de-bord`);
  await expectText(page, "Recommandées pour vous");
  await expectText(page, "Profil complété");
});
await step("Score de compatibilité sur une fiche", async () => {
  await page.goto(`${BASE}/opportunites/20000000-0000-4000-a000-000000000001`);
  await expectText(page, "Correspondance avec votre profil");
});
await step("Enregistrer / retirer une opportunité (favori)", async () => {
  await page.goto(`${BASE}/opportunites/20000000-0000-4000-a000-000000000004`);
  const btn = page.getByRole("button", { name: /Enregistr/ });
  const before = await btn.getAttribute("aria-pressed");
  await btn.click();
  await page.waitForTimeout(1500);
  await page.reload();
  const after = await page.getByRole("button", { name: /Enregistr/ }).getAttribute("aria-pressed");
  if (before === after) throw new Error("état du favori inchangé");
});
await step("Démarrer une candidature et ajouter un document", async () => {
  await page.goto(`${BASE}/opportunites/20000000-0000-4000-a000-000000000007`);
  const btn = page.getByRole("button", { name: /Préparer ma candidature/ });
  if (await btn.count()) await btn.click(); else await page.getByRole("link", { name: /Suivre ma candidature/ }).click();
  await page.waitForURL(/candidatures\//, { timeout: 15000 });
  writeFileSync("/tmp/agb-test.pdf", "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");
  await page.fill("#docname", "Pièce test");
  await page.setInputFiles("#file", "/tmp/agb-test.pdf");
  await page.getByRole("button", { name: /Ajouter/ }).click();
  await expectText(page, "Document ajouté");
});
await step("Mettre à jour le statut de candidature (soumis → partagé avec l'organisme)", async () => {
  if (await page.locator("#status").isDisabled()) return; // déjà géré par l'organisme (exécution précédente)
  await page.selectOption("#status", "soumis");
  await page.fill("#motivation", "Présentation de test du projet maraîcher.");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expectText(page, /Candidature (marquée comme soumise|enregistrée)/);
});
await step("AgriAcademy : suivre toutes les leçons, réussir le quiz, obtenir le certificat", async () => {
  await page.goto(`${BASE}/academy/agriculture-durable-sols`);
  for (let i = 0; i < 5; i++) {
    const cont = page.getByRole("link", { name: /Continuer/ });
    const start = page.getByRole("button", { name: /Commencer la formation/ });
    if (await start.count()) { await start.click(); await page.waitForTimeout(1500); await page.reload(); }
    if (!(await cont.count())) break;
    await cont.click();
    await page.waitForURL(/lecon/);
    const done = page.getByRole("button", { name: /Marquer comme terminée/ });
    if (await done.count()) { await done.click(); await page.waitForURL(/academy\/agriculture-durable-sols(\/lecon|$)/, { timeout: 15000 }); }
    await page.goto(`${BASE}/academy/agriculture-durable-sols`);
  }
  await page.getByRole("link", { name: /Quiz final/ }).click();
  await page.waitForURL(/quiz/);
  const groups = page.locator("fieldset");
  const n = await groups.count();
  for (let i = 0; i < n; i++) await groups.nth(i).locator("input[type=radio]").first().check();
  await page.getByRole("button", { name: /Valider mes réponses/ }).click();
  await expectText(page, "quiz réussi");
  await page.goto(`${BASE}/academy/agriculture-durable-sols`);
  const claim = page.getByRole("button", { name: /Obtenir mon certificat/ });
  if (await claim.count()) await claim.click();
  await page.getByRole("link", { name: /Voir mon certificat/ }).click();
  await expectText(page, "Certificat de réussite");
});
await step("AgriMarket : publier une annonce", async () => {
  await page.goto(`${BASE}/tableau-de-bord/annonces/nouvelle`);
  await page.fill("#title", `Mangues Kent — test e2e ${Date.now()}`);
  await page.selectOption("#category_id", { index: 2 });
  await page.fill("#price_fcfa", "500");
  await page.fill("#quantity", "100");
  await page.getByRole("button", { name: /Publier l'annonce/ }).click();
  await page.waitForURL(/market\/.+publie=1/, { timeout: 20000 });
  await expectText(page, "Votre annonce est en ligne");
});
await step("AgriMarket : contacter un vendeur (messagerie)", async () => {
  await page.goto(`${BASE}/market`);
  await page.getByRole("link", { name: /Oignons violets/ }).first().click();
  await page.getByRole("button", { name: /Envoyer un message/ }).click();
  await page.getByRole("button", { name: /^Envoyer$/ }).click();
  await page.waitForURL(/messages\//, { timeout: 15000 });
  await expectText(page, "toujours disponible");
});
await step("AgriCommunity : publier, aimer, commenter", async () => {
  await page.goto(`${BASE}/communaute`);
  await page.fill("#post-content", "Test e2e : quel est le meilleur moment pour semer le niébé ?");
  await page.getByRole("button", { name: /^Publier$/ }).click();
  await expectText(page, "Publication partagée");
  await page.goto(`${BASE}/communaute/post/60000000-0000-4000-a000-000000000003`);
  await page.fill("textarea[name=content]", "Merci pour ce rappel (test e2e).");
  await page.getByRole("button", { name: /^Publier$/ }).click();
  await expectText(page, "Merci pour ce rappel");
});
await step("Filtre anti-arnaque", async () => {
  await page.goto(`${BASE}/communaute`);
  await page.fill("#post-content", "Envoie moi de l'argent et ton code Wave pour gagner 100000 FCFA par jour");
  await page.getByRole("button", { name: /^Publier$/ }).click();
  await expectText(page, "arnaque");
});
await step("Paramètres : export des données personnelles", async () => {
  await page.goto(`${BASE}/tableau-de-bord/parametres`);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Exporter mes données/ }).click()]);
  if (!dl.suggestedFilename().endsWith(".json")) throw new Error("fichier inattendu");
});
await step("Un agripreneur n'accède pas à l'administration", async () => {
  await page.goto(`${BASE}/admin`);
  await page.waitForURL(/tableau-de-bord\?erreur=acces/);
});

// --- Partenaire ---
const p2 = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
await step("Connexion partenaire + candidature reçue", async () => {
  await login(p2, process.env.PARTNER_EMAIL, process.env.PARTNER_PW);
  await p2.goto(`${BASE}/partenaire/candidatures`);
  await expectText(p2, "Awa Diop");
});
await step("Partenaire : examiner et accepter une candidature", async () => {
  await p2.getByRole("link", { name: /Awa Diop/ }).first().click();
  await p2.selectOption("#status", "en_examen");
  await p2.fill("#note", "Dossier reçu, entretien à planifier (test).");
  await p2.getByRole("button", { name: /Mettre à jour et notifier/ }).click();
  await expectText(p2, "Statut mis à jour");
});
await step("Partenaire : export CSV", async () => {
  const res = await p2.request.get(`${BASE}/api/partenaire/export`);
  const body = await res.text();
  if (!res.ok() || !body.includes("Opportunité")) throw new Error(`HTTP ${res.status()}`);
});
let createdTitle = `Appel test e2e ${Date.now()}`;
await step("Partenaire : publier une opportunité (soumise à validation)", async () => {
  await p2.goto(`${BASE}/partenaire/opportunites/nouvelle`);
  await p2.fill("#title", createdTitle);
  await p2.selectOption("#category_id", { index: 1 });
  await p2.fill("#description", "Description détaillée de l'appel à projets de test pour la validation e2e.");
  await p2.fill("#deadline", new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10));
  await p2.fill("#required_documents", "Pièce d'identité\nBusiness plan");
  await p2.getByRole("button", { name: /Soumettre pour validation/ }).click();
  await p2.waitForURL(/ok=soumise/, { timeout: 60000 });
});
await step("L'opportunité soumise n'est pas encore publique", async () => {
  const r = await p2.request.get(`${BASE}/opportunites?q=${encodeURIComponent("test e2e")}`);
  if ((await r.text()).includes(createdTitle)) throw new Error("visible avant validation");
});

// --- Admin ---
const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
await step("Admin : valider et publier l'opportunité", async () => {
  await login(p3, process.env.ADMIN_EMAIL, process.env.ADMIN_PW);
  await p3.goto(`${BASE}/admin/opportunites?statut=pending_review`);
  const card = p3.locator("div.p-4", { hasText: createdTitle }).first();
  await card.getByRole("button", { name: /Valider la décision/ }).click();
  await expectText(p3, "Décision enregistrée");
});
await step("Opportunité publiée visible publiquement", async () => {
  await page.goto(`${BASE}/opportunites?q=${encodeURIComponent("e2e")}`);
  await expectText(page, createdTitle);
});
await step("Admin : statistiques et utilisateurs", async () => {
  await p3.goto(`${BASE}/admin`);
  await expectText(p3, "Dashboard administrateur");
  await p3.goto(`${BASE}/admin/utilisateurs`);
  await expectText(p3, "agripreneur@demo.agribridge.sn");
});
await step("Agripreneur notifié du changement de statut", async () => {
  await page.goto(`${BASE}/tableau-de-bord/notifications`);
  await expectText(page, "Mise à jour de votre candidature");
});

await browser.close();
const failed = results.filter((r) => r[0] === "❌").length;
console.log(`\n${results.length - failed}/${results.length} parcours réussis.`);
if (errors.length) console.log("Erreurs JS navigateur :", [...new Set(errors)].slice(0, 5));
writeFileSync(process.env.REPORT ?? "/tmp/agb-e2e.json", JSON.stringify({ results, errors }, null, 2));
process.exit(failed ? 1 : 0);
