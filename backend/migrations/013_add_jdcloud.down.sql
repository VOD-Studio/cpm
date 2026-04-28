-- 013 回滚：删除京东云模型和平台

DELETE FROM models WHERE provider_id = (SELECT id FROM providers WHERE slug='jdcloud');
DELETE FROM providers WHERE slug = 'jdcloud';
