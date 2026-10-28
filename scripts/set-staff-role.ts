/**
 * Attribue (ou retire) un rôle staff backoffice à un compte Firebase existant.
 *
 * Usage :
 *   node --env-file=.env -r ts-node/register scripts/set-staff-role.ts <email> <role|none>
 *
 * Rôles : super_admin | support | billing | viewer | none (retire l'accès)
 */
import * as admin from 'firebase-admin';
import {
  STAFF_ROLE_CLAIM,
  isStaffRole,
} from '../src/core/domain/entities/staff-role';

async function main() {
  const [email, role] = process.argv.slice(2);

  if (!email || !role || (role !== 'none' && !isStaffRole(role))) {
    console.error(
      'Usage: set-staff-role.ts <email> <super_admin|support|billing|viewer|none>',
    );
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });

  const user = await admin.auth().getUserByEmail(email);
  const claims = { ...(user.customClaims ?? {}) };

  if (role === 'none') {
    delete claims[STAFF_ROLE_CLAIM];
  } else {
    claims[STAFF_ROLE_CLAIM] = role;
  }

  await admin.auth().setCustomUserClaims(user.uid, claims);
  // Force une reconnexion pour que le nouveau claim soit pris en compte
  await admin.auth().revokeRefreshTokens(user.uid);

  console.log(
    `${email} (${user.uid}) → ${role === 'none' ? 'accès staff retiré' : role}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
