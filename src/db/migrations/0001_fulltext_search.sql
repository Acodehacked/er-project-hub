-- Custom SQL migration: Drizzle cannot declare MySQL FULLTEXT indexes,
-- so we add it here. Used by the repository search (MATCH ... AGAINST).
ALTER TABLE `projects` ADD FULLTEXT INDEX `projects_search_ft` (`title`, `abstract`);
