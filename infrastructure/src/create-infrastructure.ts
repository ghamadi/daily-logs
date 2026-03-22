import type { Database } from '@db/client/create-db';

import { DrizzleEventsRepository } from './repositories/events/drizzle-events-repository';
import { DrizzleUsersRepository } from './repositories/users/drizzle-users-repository';
import { DrizzleWorkspacesRepository } from './repositories/workspaces/drizzle-workspaces-repository';

export function createInfrastructure(db: Database) {
  return {
    eventsRepository: new DrizzleEventsRepository(db),
    usersRepository: new DrizzleUsersRepository(db),
    workspacesRepository: new DrizzleWorkspacesRepository(db),
  };
}
