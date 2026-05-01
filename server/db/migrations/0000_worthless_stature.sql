CREATE TABLE `agent_chats` (
	`id` text PRIMARY KEY NOT NULL,
	`messages` text NOT NULL,
	`fingerprint` text NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`estimated_cost` real DEFAULT 0 NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `agent_chats_fingerprint_idx` ON `agent_chats` (`fingerprint`);