import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../../lib/auth.js';

describe('hashPassword / verifyPassword', () => {
  it("hash différent du texte brut", async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toBe('secret123');
  });

  it("vérifie un mot de passe correct", async () => {
    const hash = await hashPassword('secret123');
    expect(await verifyPassword('secret123', hash)).toBe(true);
  });

  it("rejette un mot de passe incorrect", async () => {
    const hash = await hashPassword('secret123');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it("ne throw pas sur un hash invalide", async () => {
    expect(await verifyPassword('secret', 'invalid-hash')).toBe(false);
  });
});

describe('signToken / verifyToken', () => {
  it("génère un token non vide", () => {
    expect(signToken('user-id-123')).toBeTruthy();
  });

  it("vérifie un token valide et retourne le userId", () => {
    const token = signToken('abc');
    expect(verifyToken(token)).toEqual(expect.objectContaining({ userId: 'abc' }));
  });

  it("retourne null pour un token invalide", () => {
    expect(verifyToken('invalid')).toBeNull();
  });

  it("retourne null pour une chaîne vide", () => {
    expect(verifyToken('')).toBeNull();
  });
});
