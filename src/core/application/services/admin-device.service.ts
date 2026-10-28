import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirestoreService } from '../../../infrastructure/firebase/firestore.service';
import { TraccarHttpClient } from '../../../infrastructure/traccar/traccar-http.client';
import { TraccarDevice } from '../../domain/entities/traccar-device.entity';
import { TraccarPosition } from '../../domain/entities/traccar-position.entity';
import { StaffUser } from '../../domain/entities/staff-role';
import { TraccarDeviceService } from './traccar-device.service';
import { TraccarPositionService } from './traccar-position.service';
import { AdminAuditService } from './admin-audit.service';
import {
  AdminDevicePositionsQueryDto,
  AdminDevicesQueryDto,
} from '../dtos/admin-devices-query.dto';
import {
  AdminLinkDeviceDto,
  AdminUpdateDeviceDto,
} from '../dtos/admin-mutations.dto';

const DEFAULT_LIMIT = 50;
const MAX_POSITIONS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
// Limite Firestore pour l'opérateur 'in'
const FIRESTORE_IN_CHUNK = 30;

export type DeviceIssue =
  | 'NO_VEHICLE'
  | 'MULTIPLE_VEHICLES'
  | 'UNIQUE_ID_MISMATCH'
  | 'OWNER_NOT_FOUND'
  | 'OWNER_NOT_LINKED_TRACCAR'
  | 'OWNER_NO_TRACCAR_PERMISSION';

export type OrphanVehicleReason = 'DEVICE_NOT_FOUND' | 'DEVICE_NOT_IN_CLIENT_ACCOUNT';

// Projections Firestore : on ne lit jamais traccarPassword / fcmToken
interface VehicleSummary {
  id: string;
  label: string | null;
  plate: string | null;
  ownerId: string | null;
  deviceId: number | null;
  uniqueId: string | null;
}

interface ClientSummary {
  id: string;
  email: string | null;
  name: string | null;
  traccarUserId: number | null;
}

export interface AdminDeviceItem {
  id: number;
  name: string;
  uniqueId: string;
  model: string | null;
  category: string | null;
  disabled: boolean;
  status: string | null;
  lastUpdate: string | null;
  lastSeenAgeSeconds: number | null;
  vehicle: Omit<VehicleSummary, 'deviceId'> | null;
  client: Omit<ClientSummary, 'traccarUserId'> | null;
  issues: DeviceIssue[];
}

export interface AdminDeviceList {
  items: AdminDeviceItem[];
  nextCursor: string | null;
  hasMore: boolean;
  // Uniquement sur la première page
  orphanVehicles?: { vehicle: VehicleSummary; reason: OrphanVehicleReason }[];
}

export interface DeviceEditableFields extends Record<string, unknown> {
  name: string;
  uniqueId: string;
  disabled: boolean;
  groupId: number | null;
  phone: string | null;
  model: string | null;
  contact: string | null;
  category: string | null;
}

export interface DeviceMutationResult {
  deviceId: number;
  changed: boolean;
  device: DeviceEditableFields;
}

export interface DeviceLinkResult {
  deviceId: number;
  vehicleId: string;
  ownerId: string;
  changed: boolean;
}

export interface AdminDeviceDetail extends AdminDeviceItem {
  phone: string | null;
  contact: string | null;
  groupId: number | null;
  attributes: Record<string, unknown>;
  lastPosition: TraccarPosition | null;
}

export class AdminDeviceService {
  constructor(
    private readonly firestoreService: FirestoreService,
    private readonly traccarDeviceService: TraccarDeviceService,
    private readonly traccarPositionService: TraccarPositionService,
    private readonly traccarClient: TraccarHttpClient,
    private readonly auditService: AdminAuditService,
  ) {}

  async list(query: AdminDevicesQueryDto): Promise<AdminDeviceList> {
    const limit = query.limit ?? DEFAULT_LIMIT;

    let devices: TraccarDevice[];
    let vehicles: VehicleSummary[];
    if (query.clientId) {
      const client = await this.findClient(query.clientId);
      if (!client) throw new NotFoundException('Client introuvable');
      devices =
        client.traccarUserId === null
          ? []
          : await this.traccar(() =>
              this.traccarDeviceService.findAll({ userId: client.traccarUserId! }),
            );
      vehicles = (await this.findVehiclesByOwner(query.clientId)).filter(
        (v) => v.deviceId !== null,
      );
    } else {
      [devices, vehicles] = await Promise.all([
        this.traccar(() => this.traccarDeviceService.findAll({ all: true })),
        this.findVehiclesWithDevice(),
      ]);
    }

    const vehiclesByDevice = this.groupByDeviceId(vehicles);
    const clients = await this.findClients(
      vehicles.map((v) => v.ownerId).filter((id): id is string => !!id),
    );

    const now = Date.now();
    const staleBefore = query.staleBefore ? Date.parse(query.staleBefore) : null;
    const cursor = query.cursor ? Number(query.cursor) : null;

    const filtered = devices
      .map((device) =>
        this.toItem(device, vehiclesByDevice.get(device.getId()) ?? [], clients, now),
      )
      .filter((item) => {
        if (query.status && item.status !== query.status) return false;
        if (query.disabled !== undefined && item.disabled !== query.disabled) return false;
        if (query.unlinked !== undefined && (item.vehicle === null) !== query.unlinked) return false;
        if (query.neverSeen !== undefined && (item.lastUpdate === null) !== query.neverSeen) return false;
        if (staleBefore !== null && item.lastUpdate !== null && Date.parse(item.lastUpdate) >= staleBefore) return false;
        return true;
      })
      .sort((a, b) => a.id - b.id);

    const remaining = cursor === null ? filtered : filtered.filter((i) => i.id > cursor);
    const items = remaining.slice(0, limit);
    const hasMore = remaining.length > limit;

    const result: AdminDeviceList = {
      items,
      nextCursor: hasMore ? String(items[items.length - 1].id) : null,
      hasMore,
    };

    if (cursor === null) {
      const deviceIds = new Set(devices.map((d) => d.getId()));
      const reason: OrphanVehicleReason = query.clientId
        ? 'DEVICE_NOT_IN_CLIENT_ACCOUNT'
        : 'DEVICE_NOT_FOUND';
      result.orphanVehicles = vehicles
        .filter((v) => !deviceIds.has(v.deviceId!))
        .map((vehicle) => ({ vehicle, reason }));
    }

    return result;
  }

  async findOne(deviceId: number): Promise<AdminDeviceDetail> {
    const device = await this.getDeviceOrThrow(deviceId);
    const vehicles = await this.findVehiclesByDeviceId(deviceId);
    const clients = await this.findClients(
      vehicles.map((v) => v.ownerId).filter((id): id is string => !!id),
    );
    const item = this.toItem(device, vehicles, clients, Date.now());

    const owner = vehicles[0]?.ownerId ? clients.get(vehicles[0].ownerId) : undefined;
    const [lastPosition, ownerDevices] = await Promise.all([
      device.getPositionId() === null
        ? Promise.resolve([] as TraccarPosition[])
        : this.traccar(() =>
            this.traccarPositionService.findAll({ id: device.getPositionId()! }),
          ),
      owner?.traccarUserId == null
        ? Promise.resolve(null)
        : this.traccar(() =>
            this.traccarDeviceService.findAll({ userId: owner.traccarUserId! }),
          ),
    ]);

    if (ownerDevices && !ownerDevices.some((d) => d.getId() === deviceId)) {
      item.issues.push('OWNER_NO_TRACCAR_PERMISSION');
    }

    return {
      ...item,
      phone: device.getPhone(),
      contact: device.getContact(),
      groupId: device.getGroupId(),
      attributes: device.getAttributes(),
      lastPosition: lastPosition[0] ?? null,
    };
  }

  async findPositions(
    deviceId: number,
    query: AdminDevicePositionsQueryDto,
  ): Promise<TraccarPosition[]> {
    const from = Date.parse(query.from);
    const to = Date.parse(query.to);
    if (to <= from) {
      throw new BadRequestException('"to" doit être postérieur à "from"');
    }
    if (to - from > MAX_POSITIONS_WINDOW_MS) {
      throw new BadRequestException('Fenêtre limitée à 7 jours');
    }

    await this.getDeviceOrThrow(deviceId);
    return this.traccar(() =>
      this.traccarPositionService.findAll({
        deviceId,
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
      }),
    );
  }

  async update(
    staff: StaffUser,
    deviceId: number,
    dto: AdminUpdateDeviceDto,
  ): Promise<DeviceMutationResult> {
    const { reason, ...changes } = dto;
    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('Aucun champ à modifier');
    }

    const device = await this.getDeviceOrThrow(deviceId);
    const before = this.editableFields(device);

    return this.auditService.record(
      staff,
      { action: 'device.update', targetType: 'device', targetId: String(deviceId), reason, before },
      async () => {
        const updated = await this.putDevice(device, changes);
        if (updated.getUniqueId() !== device.getUniqueId()) {
          await this.syncVehicleUniqueId(deviceId, updated.getUniqueId());
        }
        const after = this.editableFields(updated);
        return { result: { deviceId, changed: true, device: after }, after };
      },
    );
  }

  async setDisabled(
    staff: StaffUser,
    deviceId: number,
    disabled: boolean,
    reason: string,
  ): Promise<DeviceMutationResult> {
    const device = await this.getDeviceOrThrow(deviceId);
    const before = this.editableFields(device);
    if (device.isDisabled() === disabled) {
      return { deviceId, changed: false, device: before };
    }

    return this.auditService.record(
      staff,
      {
        action: disabled ? 'device.disable' : 'device.enable',
        targetType: 'device',
        targetId: String(deviceId),
        reason,
        before: { disabled: device.isDisabled() },
      },
      async () => {
        const after = this.editableFields(await this.putDevice(device, { disabled }));
        return {
          result: { deviceId, changed: true, device: after },
          after: { disabled: after.disabled },
        };
      },
    );
  }

  async link(
    staff: StaffUser,
    deviceId: number,
    dto: AdminLinkDeviceDto,
  ): Promise<DeviceLinkResult> {
    const device = await this.getDeviceOrThrow(deviceId);

    const vehicleRef = this.firestoreService.collection('vehicles').doc(dto.vehicleId);
    const vehicle = await vehicleRef.get();
    if (!vehicle.exists) throw new NotFoundException('Véhicule introuvable');
    if (vehicle.get('ownerId') !== dto.ownerId) {
      throw new BadRequestException('Le véhicule n\'appartient pas à ce client');
    }

    const client = await this.findClient(dto.ownerId);
    if (!client) throw new NotFoundException('Client introuvable');
    if (client.traccarUserId === null) {
      throw new BadRequestException('Le client n\'a pas de compte Traccar');
    }

    // On ne déplace jamais implicitement un rattachement existant
    const vehicleDeviceId = (vehicle.get('deviceId') as number | null | undefined) ?? null;
    if (vehicleDeviceId !== null && vehicleDeviceId !== deviceId) {
      throw new ConflictException(`Véhicule déjà rattaché au device ${vehicleDeviceId}`);
    }
    const otherVehicles = (await this.findVehiclesByDeviceId(deviceId)).filter(
      (v) => v.id !== dto.vehicleId,
    );
    if (otherVehicles.length > 0) {
      throw new ConflictException(`Device déjà rattaché au véhicule ${otherVehicles[0].id}`);
    }

    const ownerDevices = await this.traccar(() =>
      this.traccarDeviceService.findAll({ userId: client.traccarUserId! }),
    );
    const hasPermission = ownerDevices.some((d) => d.getId() === deviceId);
    const before = {
      vehicleDeviceId,
      vehicleUniqueId: (vehicle.get('uniqueId') as string | null | undefined) ?? null,
      ownerHasTraccarPermission: hasPermission,
    };

    const result = { deviceId, vehicleId: dto.vehicleId, ownerId: dto.ownerId };
    if (hasPermission && vehicleDeviceId === deviceId && before.vehicleUniqueId === device.getUniqueId()) {
      return { ...result, changed: false };
    }

    return this.auditService.record(
      staff,
      { action: 'device.link', targetType: 'device', targetId: String(deviceId), reason: dto.reason, before },
      async () => {
        if (!hasPermission) {
          await this.traccar(() =>
            this.traccarClient.linkDeviceToUser(client.traccarUserId!, deviceId),
          );
        }
        await vehicleRef.update({ deviceId, uniqueId: device.getUniqueId() });
        return {
          result: { ...result, changed: true },
          after: {
            vehicleDeviceId: deviceId,
            vehicleUniqueId: device.getUniqueId(),
            ownerHasTraccarPermission: true,
          },
        };
      },
    );
  }

  // Traccar remplace l'objet entier sur PUT : on renvoie toujours le device complet
  private async putDevice(
    device: TraccarDevice,
    changes: Partial<DeviceEditableFields>,
  ): Promise<TraccarDevice> {
    return this.traccar(() =>
      this.traccarDeviceService.update(device.getId(), {
        name: device.getName(),
        uniqueId: device.getUniqueId(),
        disabled: device.isDisabled(),
        groupId: device.getGroupId() ?? 0,
        phone: device.getPhone(),
        model: device.getModel(),
        contact: device.getContact(),
        category: device.getCategory(),
        attributes: device.getAttributes(),
        ...changes,
      }),
    );
  }

  private async syncVehicleUniqueId(deviceId: number, uniqueId: string): Promise<void> {
    const vehicles = await this.findVehiclesByDeviceId(deviceId);
    await Promise.all(
      vehicles.map((v) =>
        this.firestoreService.collection('vehicles').doc(v.id).update({ uniqueId }),
      ),
    );
  }

  private editableFields(device: TraccarDevice): DeviceEditableFields {
    return {
      name: device.getName(),
      uniqueId: device.getUniqueId(),
      disabled: device.isDisabled(),
      groupId: device.getGroupId(),
      phone: device.getPhone(),
      model: device.getModel(),
      contact: device.getContact(),
      category: device.getCategory(),
    };
  }

  private toItem(
    device: TraccarDevice,
    vehicles: VehicleSummary[],
    clients: Map<string, ClientSummary>,
    now: number,
  ): AdminDeviceItem {
    const issues: DeviceIssue[] = [];
    const vehicle = vehicles[0] ?? null;
    let client: ClientSummary | null = null;

    if (!vehicle) {
      issues.push('NO_VEHICLE');
    } else {
      if (vehicles.length > 1) issues.push('MULTIPLE_VEHICLES');
      if (vehicle.uniqueId !== device.getUniqueId()) issues.push('UNIQUE_ID_MISMATCH');
      client = vehicle.ownerId ? (clients.get(vehicle.ownerId) ?? null) : null;
      if (!client) issues.push('OWNER_NOT_FOUND');
      else if (client.traccarUserId === null) issues.push('OWNER_NOT_LINKED_TRACCAR');
    }

    const lastUpdate = device.getLastUpdate();
    return {
      id: device.getId(),
      name: device.getName(),
      uniqueId: device.getUniqueId(),
      model: device.getModel(),
      category: device.getCategory(),
      disabled: device.isDisabled(),
      status: device.getStatus(),
      lastUpdate,
      lastSeenAgeSeconds: lastUpdate
        ? Math.max(0, Math.floor((now - Date.parse(lastUpdate)) / 1000))
        : null,
      vehicle: vehicle
        ? {
            id: vehicle.id,
            label: vehicle.label,
            plate: vehicle.plate,
            ownerId: vehicle.ownerId,
            uniqueId: vehicle.uniqueId,
          }
        : null,
      client: client ? { id: client.id, email: client.email, name: client.name } : null,
      issues,
    };
  }

  private async getDeviceOrThrow(deviceId: number): Promise<TraccarDevice> {
    const devices = await this.traccar(() =>
      this.traccarDeviceService.findAll({ id: deviceId }),
    );
    if (devices.length === 0) throw new NotFoundException('Device introuvable');
    return devices[0];
  }

  private groupByDeviceId(vehicles: VehicleSummary[]): Map<number, VehicleSummary[]> {
    const map = new Map<number, VehicleSummary[]>();
    for (const v of vehicles) {
      if (v.deviceId === null) continue;
      map.set(v.deviceId, [...(map.get(v.deviceId) ?? []), v]);
    }
    return map;
  }

  private async findVehiclesWithDevice(): Promise<VehicleSummary[]> {
    return this.queryVehicles(
      this.firestoreService.collection('vehicles').where('deviceId', '!=', null),
    );
  }

  private async findVehiclesByOwner(ownerId: string): Promise<VehicleSummary[]> {
    return this.queryVehicles(
      this.firestoreService.collection('vehicles').where('ownerId', '==', ownerId),
    );
  }

  private async findVehiclesByDeviceId(deviceId: number): Promise<VehicleSummary[]> {
    return this.queryVehicles(
      this.firestoreService.collection('vehicles').where('deviceId', '==', deviceId),
    );
  }

  private async queryVehicles(query: admin.firestore.Query): Promise<VehicleSummary[]> {
    const snapshot = await query
      .select('label', 'plate', 'ownerId', 'deviceId', 'uniqueId')
      .get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      label: doc.get('label') ?? null,
      plate: doc.get('plate') ?? null,
      ownerId: doc.get('ownerId') ?? null,
      deviceId: doc.get('deviceId') ?? null,
      uniqueId: doc.get('uniqueId') ?? null,
    }));
  }

  private async findClient(uid: string): Promise<ClientSummary | null> {
    return (await this.findClients([uid])).get(uid) ?? null;
  }

  private async findClients(uids: string[]): Promise<Map<string, ClientSummary>> {
    const unique = [...new Set(uids)];
    const chunks: string[][] = [];
    for (let i = 0; i < unique.length; i += FIRESTORE_IN_CHUNK) {
      chunks.push(unique.slice(i, i + FIRESTORE_IN_CHUNK));
    }

    const snapshots = await Promise.all(
      chunks.map((chunk) =>
        this.firestoreService
          .collection('users')
          .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
          .select('email', 'name', 'traccarUserId')
          .get(),
      ),
    );

    const map = new Map<string, ClientSummary>();
    for (const doc of snapshots.flatMap((s) => s.docs)) {
      map.set(doc.id, {
        id: doc.id,
        email: doc.get('email') ?? null,
        name: doc.get('name') ?? null,
        traccarUserId: doc.get('traccarUserId') ?? null,
      });
    }
    return map;
  }

  // Une panne Traccar doit remonter en 502, pas en 500
  private async traccar<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (err) {
      throw new BadGatewayException(
        `Traccar indisponible : ${err instanceof Error ? err.message : 'erreur inconnue'}`,
      );
    }
  }
}
