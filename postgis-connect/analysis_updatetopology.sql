-- FUNCTION: postgres.analysis_updatetopologycharacter varying

-- DROP FUNCTION postgres.analysis_updatetopologycharacter varying;

CREATE OR REPLACE FUNCTION postgres.analysis_updatetopology(
	tbl character varying)
    RETURNS character varying
    LANGUAGE 'plpgsql'
    COST 100.0
    VOLATILE STRICT 
AS $function$

BEGIN   
    --添加起点id
    execute 'ALTER TABLE postgres.' || tbl || ' ADD COLUMN IF NOT EXISTS rmap_source integer';
    --添加终点id
    execute 'ALTER TABLE postgres.' || tbl || ' ADD COLUMN IF NOT EXISTS rmap_target integer';
    --添加权重值
    execute 'ALTER TABLE postgres.' || tbl || ' ADD COLUMN IF NOT EXISTS rmap_length double precision';
    --为source字段创建索引
    execute 'CREATE INDEX IF NOT EXISTS rmap_source_idx ON postgres.' || tbl || '("rmap_source")';
    --为target字段创建索引
    execute 'CREATE INDEX IF NOT EXISTS rmap_target_idx ON postgres.' || tbl || '("rmap_target")';
    --为目标表创建拓扑布局，即为source和target字段赋值
    execute 'select public.pgr_createTopology(''postgres.' || tbl || ''',0.00000001, ''shape'', ''objectid'', ''rmap_source'', ''rmap_target'')';
    --为length赋值，geom为几何类型的字段，可能为shape、the_geom
    execute 'update postgres.' || tbl || ' set rmap_length = public.st_length(shape)';
    --执行完成
    RETURN 'OK';
END


$function$;

ALTER FUNCTION postgres.analysis_updatetopology(character varying)
    OWNER TO postgres;
