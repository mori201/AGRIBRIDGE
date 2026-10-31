import { test } from "node:test";
import assert from "node:assert/strict";
import { computeMatch, rankOpportunities } from "../src/lib/matching.ts";

const base = {
  regions: ["thies"],
  sectors: ["maraichage"],
  beneficiary_types: ["agripreneur"],
  project_stages: ["demarrage"],
  amount_min: 500000,
  amount_max: 3000000,
  deadline: "2099-01-01",
  required_documents: ["CNI"],
};

test("profil parfaitement compatible = 100 %, niveau fort", () => {
  const r = computeMatch({ role: "agripreneur", region: "thies", sectors: ["maraichage"], project_stage: "demarrage", funding_amount: 1000000 }, base);
  assert.equal(r.score, 100);
  assert.equal(r.level, "forte");
  assert.ok(r.criteria.every((c) => c.state === "met"));
});

test("région non éligible => niveau faible même si le reste correspond", () => {
  const r = computeMatch({ role: "agripreneur", region: "dakar", sectors: ["maraichage"], project_stage: "demarrage", funding_amount: 1000000 }, base);
  assert.equal(r.level, "faible");
  assert.equal(r.criteria.find((c) => c.key === "region")?.state, "missing");
});

test("profil vide : critères inconnus, pas de score trompeur", () => {
  const r = computeMatch({}, base);
  assert.equal(r.score, 0);
  assert.ok(r.criteria.every((c) => c.state === "unknown"));
  assert.ok(r.nextSteps.some((s) => s.includes("Complétez votre profil")));
});

test("national couvre toutes les régions", () => {
  const r = computeMatch({ region: "matam" }, { ...base, regions: ["national"] });
  assert.equal(r.criteria.find((c) => c.key === "region")?.state, "met");
});

test("critères déclaratifs (jeunes/femmes) placés en « à vérifier »", () => {
  const r = computeMatch({ role: "agripreneur" }, { ...base, beneficiary_types: ["agripreneur", "jeunes"] });
  assert.ok(r.toVerify.some((t) => t.includes("âge")));
  assert.equal(r.criteria.find((c) => c.key === "beneficiary")?.state, "met");
});

test("opportunité clôturée exclue du classement", () => {
  const ranked = rankOpportunities({ region: "thies" }, [{ ...base, deadline: "2000-01-01" }, base]);
  assert.equal(ranked.length, 1);
});

test("montant hors fourchette => critère manquant", () => {
  const r = computeMatch({ funding_amount: 50000000 }, base);
  assert.equal(r.criteria.find((c) => c.key === "amount")?.state, "missing");
});
