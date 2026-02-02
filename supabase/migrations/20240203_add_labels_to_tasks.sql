alter table tasks add column if not exists labels text[] default '{}';
