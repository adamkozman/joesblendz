import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const settings = sqliteTable('settings', { id: integer('id').primaryKey(), value: text('value').notNull() });
export const services = sqliteTable('services', {
 id: text('id').primaryKey(), name: text('name').notNull(), description: text('description').notNull(),
 duration: integer('duration').notNull(), price: integer('price').notNull(), active: integer('active').notNull().default(1),
});
export const availability = sqliteTable('availability', {
 id: text('id').primaryKey(), start: integer('start').notNull(), end: integer('end').notNull(),
}, t => [index('availability_start_idx').on(t.start)]);
export const bookings = sqliteTable('bookings', {
 id: text('id').primaryKey(), tokenHash: text('token_hash').notNull().unique(),
 serviceId: text('service_id').notNull(), serviceName: text('service_name').notNull(),
 currency: text('currency').notNull().default('CAD'), timezone: text('timezone').notNull().default('America/Toronto'), location: text('location').notNull().default(''), price: integer('price').notNull(), start: integer('start').notNull(), end: integer('end').notNull(),
 name: text('name').notNull(), email: text('email').notNull(), phone: text('phone').notNull(),
 note: text('note').notNull(), status: text('status').notNull().default('confirmed'), created: integer('created').notNull(),
}, t => [index('bookings_time_idx').on(t.start,t.end,t.status)]);
export const limits = sqliteTable('limits', { key: text('key').primaryKey(), count: integer('count').notNull(), expires: integer('expires').notNull() });


export const ownerSessions = sqliteTable('owner_sessions', { tokenHash:text('token_hash').primaryKey(), expires:integer('expires').notNull(), passwordTag:text('password_tag').notNull() });
