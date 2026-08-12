/**
 * Composition root (docs/04-Architecture/52 §4): wires a `StorageAdapter`
 * into services, controllers, and the router to produce one request handler.
 * Used by both the GAS entrypoint (`main.ts`) and integration tests, so the
 * exact same wiring is exercised in both — the only difference is which
 * `StorageAdapter` (real Sheets vs. in-memory) is injected.
 */

import { createAuthController } from './controllers/authController';
import { createDashboardController } from './controllers/dashboardController';
import { createFamilyController } from './controllers/familyController';
import { createMaternalController } from './controllers/maternalController';
import { createReportsController } from './controllers/reportsController';
import { createTimelineController } from './controllers/timelineController';
import { createVitalsController } from './controllers/vitalsController';
import {
  createRouter,
  type ApiRequest,
  type ApiResponse,
  type AuthenticatedActor,
  type RouteHandler,
} from './controllers/router';
import { bytesToHex, hmacSha256, utf8ToBytes } from './lib/crypto';
import { MediaService } from './lib/media';
import { createInMemoryRateLimiter } from './lib/rateLimiter';
import { AuditService } from './services/AuditService';
import { AuthService } from './services/AuthService';
import { ContentService } from './services/ContentService';
import { DashboardService } from './services/DashboardService';
import { FamilyService } from './services/FamilyService';
import { MaternalService } from './services/MaternalService';
import { PregnancyService } from './services/PregnancyService';
import { ReportsService } from './services/ReportsService';
import { SessionService } from './services/SessionService';
import { TimelineService } from './services/TimelineService';
import { TrendService } from './services/TrendService';
import { VitalsService } from './services/VitalsService';

import type { Logger } from './lib/logging';
import type { StorageAdapter } from './adapters/StorageAdapter';

/** Public (unauthenticated) routes — every other route requires a valid session (docs/04-Architecture/57 §4–5). */
const PUBLIC_ROUTES = new Set(['POST /v1/auth/register', 'POST /v1/auth/login']);

const REGISTER_RATE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };
const LOGIN_RATE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };

export interface AppConfig {
  storage: StorageAdapter;
  logger: Logger;
  /** Server-side keyed-hash pepper for `email_hash` (Script Properties — docs/09-Security/124). */
  emailPepper: string;
}

export interface App {
  handle: (request: ApiRequest) => ApiResponse;
  services: {
    sessions: SessionService;
    audit: AuditService;
    auth: AuthService;
    family: FamilyService;
    maternal: MaternalService;
    pregnancy: PregnancyService;
    timeline: TimelineService;
    content: ContentService;
    trend: TrendService;
    vitals: VitalsService;
    reports: ReportsService;
    dashboard: DashboardService;
  };
}

/** Wires storage → services → controllers → router. */
export function buildApp(config: AppConfig): App {
  const { storage, logger, emailPepper } = config;

  const sessions = new SessionService(storage);
  const audit = new AuditService(storage, logger);
  const family = new FamilyService(storage);
  const maternal = new MaternalService(storage);
  const pregnancy = new PregnancyService(storage);
  const timeline = new TimelineService(storage);
  const content = new ContentService(storage);
  const trend = new TrendService();
  const vitals = new VitalsService(storage, timeline, trend);

  // Media signing key is derived from the email pepper (Script Property, docs/09-Security/124)
  // so no new required deployment secret is introduced; refs stay short-lived + backend-mediated (58).
  const mediaSigningSecret = bytesToHex(
    hmacSha256(utf8ToBytes(emailPepper), utf8ToBytes('media-signing')),
  );
  const reports = new ReportsService(storage, timeline, new MediaService(mediaSigningSecret));
  const dashboard = new DashboardService({ storage, timeline, trend, maternal, pregnancy });
  const auth = new AuthService({
    storage,
    sessions,
    audit,
    family,
    maternal,
    logger,
    emailPepper,
    registerLimiter: createInMemoryRateLimiter(REGISTER_RATE_LIMIT),
    loginLimiter: createInMemoryRateLimiter(LOGIN_RATE_LIMIT),
  });

  const resolveActor = (token: string): AuthenticatedActor => {
    const session = sessions.validate(token);
    const user = storage.get('User', session.user_id);
    if (!user) {
      // A session survived its owning user's disappearance — treat as invalid (fail closed, 52 §8).
      throw new Error('Session references a nonexistent user');
    }
    return {
      authenticated: true,
      userId: user.user_id,
      role: user.role,
      sessionId: session.session_id,
    };
  };

  const handlers: Record<string, RouteHandler> = {
    ...createAuthController({ auth }),
    ...createFamilyController({ family }),
    ...createMaternalController({ family, maternal, pregnancy, audit }),
    ...createTimelineController({ family, timeline, audit }),
    ...createVitalsController({ family, maternal, vitals, audit }),
    ...createReportsController({ family, maternal, reports, audit }),
    ...createDashboardController({ family, dashboard, audit }),
  };

  const handle = createRouter({
    logger,
    handlers,
    publicRoutes: PUBLIC_ROUTES,
    resolveActor,
  });

  return {
    handle,
    services: {
      sessions,
      audit,
      auth,
      family,
      maternal,
      pregnancy,
      timeline,
      content,
      trend,
      vitals,
      reports,
      dashboard,
    },
  };
}
