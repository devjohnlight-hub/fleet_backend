import { AdminAuditService } from './admin-audit.service';
import { FirestoreService } from '../../../infrastructure/firebase/firestore.service';
import { StaffRole, StaffUser } from '../../domain/entities/staff-role';

const actor: StaffUser = {
  id: 'staff-1',
  email: 'ops@zira.ci',
  role: StaffRole.SUPPORT,
  requestId: 'req-12345678',
};

describe('AdminAuditService', () => {
  const add = jest.fn().mockResolvedValue({ id: 'log-1' });
  const firestore = {
    collection: jest.fn(() => ({ add })),
  } as unknown as FirestoreService;
  const service = new AdminAuditService(firestore);

  beforeEach(() => add.mockClear());

  const written = () => add.mock.calls[0][0] as Record<string, unknown>;

  describe('masquage des données sensibles', () => {
    it('masque les clés sensibles, quelle que soit la casse ou la profondeur', async () => {
      await service.log(actor, {
        action: 'test',
        targetType: 'client',
        targetId: 'c1',
        result: 'success',
        before: {
          traccarPassword: 'pwd',
          fcmToken: 'fcm',
          nested: { apiSecret: 's', PrivateKey: 'k', name: 'Alice' },
          files: [{ signedUrl: 'https://signed', label: 'carte grise' }],
        },
      });

      expect(written().before).toEqual({
        traccarPassword: '[REDACTED]',
        fcmToken: '[REDACTED]',
        nested: {
          apiSecret: '[REDACTED]',
          PrivateKey: '[REDACTED]',
          name: 'Alice',
        },
        files: [{ signedUrl: '[REDACTED]', label: 'carte grise' }],
      });
    });

    it('ne laisse aucune valeur sensible dans le document écrit', async () => {
      await service.log(actor, {
        action: 'test',
        targetType: 'client',
        targetId: 'c1',
        result: 'success',
        after: { refreshToken: 'SECRET-1', deep: { password: 'SECRET-2' } },
      });
      expect(JSON.stringify(written())).not.toMatch(/SECRET-/);
    });

    it('conserve les valeurs non sensibles et retire les undefined', async () => {
      await service.log(actor, {
        action: 'test',
        targetType: 'device',
        targetId: '42',
        result: 'success',
        after: { disabled: true, count: 0, note: null, skipped: undefined },
      });
      expect(written().after).toEqual({ disabled: true, count: 0, note: null });
    });
  });

  it("enregistre l'acteur, la cible et le requestId", async () => {
    await service.log(actor, {
      action: 'device.disable',
      targetType: 'device',
      targetId: '42',
      result: 'success',
      reason: 'Boîtier volé',
    });
    expect(written()).toMatchObject({
      actorUid: 'staff-1',
      actorEmail: 'ops@zira.ci',
      actorRole: StaffRole.SUPPORT,
      requestId: 'req-12345678',
      action: 'device.disable',
      targetType: 'device',
      targetId: '42',
      result: 'success',
      reason: 'Boîtier volé',
    });
  });

  describe('record()', () => {
    const entry = {
      action: 'device.disable',
      targetType: 'device',
      targetId: '42',
      reason: 'motif',
      before: { disabled: false },
    };

    it("consigne un succès avec l'état après et renvoie le résultat", async () => {
      const result = await service.record(actor, entry, async () => ({
        result: 'ok',
        after: { disabled: true },
      }));
      expect(result).toBe('ok');
      expect(written()).toMatchObject({
        result: 'success',
        before: { disabled: false },
        after: { disabled: true },
        error: null,
      });
    });

    it("consigne un échec avec le message d'erreur et relance l'erreur", async () => {
      await expect(
        service.record(actor, entry, async () => {
          throw new Error('Traccar indisponible');
        }),
      ).rejects.toThrow('Traccar indisponible');
      expect(written()).toMatchObject({
        result: 'failure',
        after: null,
        error: 'Traccar indisponible',
      });
    });
  });
});
