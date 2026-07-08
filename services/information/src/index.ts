/**
 * Information Engine Service
 *
 * Responsible for receiving, normalizing and storing incoming information.
 * This is the L1 (Input) layer of the Howard AIOS eight-layer architecture.
 */

export { InformationService, InformationNotFoundError, InformationValidationError } from './service';
export { PrismaInformationRepository } from './repository';
export type { InformationRepository } from './repository';
export {
  CreateInformationSchema,
  UpdateInformationSchema,
  InformationQuerySchema,
  SourceTypeValues,
  InformationStatusValues,
} from './types';
export type {
  Information,
  SourceType,
  InformationStatus,
  CreateInformationInput,
  UpdateInformationInput,
  InformationQuery,
} from './types';
