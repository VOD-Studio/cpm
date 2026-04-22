-- 009 回滚：删除火山引擎模型

DELETE FROM models WHERE provider_id = (SELECT id FROM providers WHERE slug='volcengine');
