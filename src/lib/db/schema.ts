import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  bigserial, 
  boolean, 
  numeric, 
  date, 
  jsonb,
  bigint,
  primaryKey
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// NextAuth Tables
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  password: text('password'),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: bigint('expires_at', { mode: 'number' }),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  providerProviderAccountId: primaryKey({ columns: [table.provider, table.providerAccountId] }),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
}, (table) => ({
  identifierToken: primaryKey({ columns: [table.identifier, table.token] }),
}));

// ============================================================================
// Application Tables
// ============================================================================

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  assignedBrokerId: uuid('assigned_broker_id'),
  companySize: text('company_size'),
  industry: text('industry'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const shippers = pgTable('shippers', {
  id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phoneNumber: text('phone_number'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const ntsUsers = pgTable('nts_users', {
  id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['admin', 'user'] }).notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phoneNumber: text('phone_number'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const quotes = pgTable('quotes', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  shipperId: uuid('shipper_id').notNull().references(() => shippers.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  assignedBrokerId: uuid('assigned_broker_id').references(() => ntsUsers.id, { onDelete: 'set null' }),
  
  // Origin
  originCity: text('origin_city'),
  originState: text('origin_state'),
  originZip: text('origin_zip'),
  
  // Destination
  destinationCity: text('destination_city'),
  destinationState: text('destination_state'),
  destinationZip: text('destination_zip'),
  
  // Details
  freightType: text('freight_type'),
  shipmentItems: jsonb('shipment_items'),
  
  // Pricing
  price: numeric('price', { precision: 10, scale: 2 }),
  carrierPay: numeric('carrier_pay', { precision: 10, scale: 2 }),
  
  // Dates
  dueDate: date('due_date'),
  pickupDate: date('pickup_date'),
  
  // Status
  status: text('status', { enum: ['pending', 'priced', 'accepted', 'rejected'] }).default('pending'),
  
  // Notes
  notes: text('notes'),
  specialInstructions: text('special_instructions'),
  
  // Metadata
  isComplete: boolean('is_complete').default(false),
  isArchived: boolean('is_archived').default(false),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const orders = pgTable('orders', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  quoteId: bigserial('quote_id', { mode: 'number' }).unique().references(() => quotes.id, { onDelete: 'set null' }),
  
  // User references
  shipperId: uuid('shipper_id').notNull().references(() => shippers.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  assignedBrokerId: uuid('assigned_broker_id').notNull().references(() => ntsUsers.id, { onDelete: 'restrict' }),
  
  // Snapshot of quote data
  originCity: text('origin_city'),
  originState: text('origin_state'),
  originZip: text('origin_zip'),
  destinationCity: text('destination_city'),
  destinationState: text('destination_state'),
  destinationZip: text('destination_zip'),
  
  freightType: text('freight_type'),
  shipmentItems: jsonb('shipment_items'),
  
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  carrierPay: numeric('carrier_pay', { precision: 10, scale: 2 }),
  deposit: numeric('deposit', { precision: 10, scale: 2 }),
  
  dueDate: date('due_date'),
  pickupDate: date('pickup_date'),
  deliveryDate: date('delivery_date'),
  
  // Order-specific
  status: text('status', { 
    enum: ['pending', 'carrier_assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'] 
  }).default('pending'),
  
  carrierName: text('carrier_name'),
  carrierContact: text('carrier_contact'),
  trackingNumber: text('tracking_number'),
  
  notes: text('notes'),
  specialInstructions: text('special_instructions'),
  
  acceptedAt: timestamp('accepted_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const editRequests = pgTable('edit_requests', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  quoteId: bigserial('quote_id', { mode: 'number' }).notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  requestedBy: uuid('requested_by').notNull().references(() => shippers.id),
  requestedChanges: jsonb('requested_changes').notNull(),
  reason: text('reason'),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).default('pending'),
  reviewedBy: uuid('reviewed_by').references(() => ntsUsers.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  message: text('message').notNull(),
  type: text('type'),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const documents = pgTable('documents', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  fileName: text('file_name'),
  fileType: text('file_type'),
  fileUrl: text('file_url'),
  templateId: bigserial('template_id', { mode: 'number' }),
  isFavorite: boolean('is_favorite').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const templates = pgTable('templates', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  context: text('context'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const editHistory = pgTable('edit_history', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  quoteId: bigserial('quote_id', { mode: 'number' }).references(() => quotes.id, { onDelete: 'cascade' }),
  orderId: bigserial('order_id', { mode: 'number' }).references(() => orders.id, { onDelete: 'cascade' }),
  editedBy: uuid('edited_by').notNull().references(() => users.id),
  changes: jsonb('changes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// Relations (for joins)
// ============================================================================

export const shippersRelations = relations(shippers, ({ one, many }) => ({
  user: one(users, {
    fields: [shippers.id],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [shippers.companyId],
    references: [companies.id],
  }),
  quotes: many(quotes),
  orders: many(orders),
}));

export const ntsUsersRelations = relations(ntsUsers, ({ one }) => ({
  user: one(users, {
    fields: [ntsUsers.id],
    references: [users.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  shipper: one(shippers, {
    fields: [quotes.shipperId],
    references: [shippers.id],
  }),
  company: one(companies, {
    fields: [quotes.companyId],
    references: [companies.id],
  }),
  assignedBroker: one(ntsUsers, {
    fields: [quotes.assignedBrokerId],
    references: [ntsUsers.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  quote: one(quotes, {
    fields: [orders.quoteId],
    references: [quotes.id],
  }),
  shipper: one(shippers, {
    fields: [orders.shipperId],
    references: [shippers.id],
  }),
  company: one(companies, {
    fields: [orders.companyId],
    references: [companies.id],
  }),
  assignedBroker: one(ntsUsers, {
    fields: [orders.assignedBrokerId],
    references: [ntsUsers.id],
  }),
}));
