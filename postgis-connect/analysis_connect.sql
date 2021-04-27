-- FUNCTION: postgres.analysis_connectcharacter varying, double precision, double precision, double precision, double precision, double precision

-- DROP FUNCTION postgres.analysis_connectcharacter varying, double precision, double precision, double precision, double precision, double precision;

CREATE OR REPLACE FUNCTION postgres.analysis_connect(
	tbl character varying,
	startx double precision,
	starty double precision,
	endx double precision,
	endy double precision,
	differ double precision)
    RETURNS SETOF pipe 
    LANGUAGE 'plpgsql'
    COST 100.0
    VOLATILE     ROWS 1000.0
AS $function$

DECLARE

    v_startTarget integer;--距离起点最近点   
    v_endSource integer;--距离终点最近点 
    v_SRID integer;-- 获取当前坐标系SRID
    v_startPoint VARCHAR (255);--选择的起点
    v_endPoint VARCHAR (255);--选择的终点

BEGIN

    -- 获取当前坐标系SRID
    execute 'select ST_SRID(the_geom) from '||tbl||'_vertices_pgr where id=1' into v_SRID;
    -- 定义起点坐标
    v_startPoint = 'public.ST_GeomFromText(''point('||startx||' '||starty||')'','||v_SRID||')';
    -- 定义终点坐标
    v_endPoint = 'public.ST_GeomFromText(''point('||endx||' '||endy||')'','||v_SRID||')';

    --查询离起点最近的点,differ为容差值
    execute 'select id  from '||tbl||'_vertices_pgr where   
            public.ST_DWithin(the_geom,'||v_startPoint||','||differ||')   
            order by public.ST_Distance(the_geom,'||v_startPoint||') limit 1'  
            into v_startTarget;   
    --查询离终点最近的点  
    execute 'select id  from '||tbl||'_vertices_pgr where   
            public.ST_DWithin(the_geom,'||v_endPoint||','||differ||')   
            order by public.ST_Distance(the_geom,'||v_endPoint||') limit 1'  
            into v_endSource;

    --如果没找到最近的点，就返回null   
    if (v_startTarget is null) or (v_endSource is null) then   
        if (v_startTarget is null) THEN
          raise notice '没有找到起点';
        end if;
        if (v_endSource is null) THEN
          raise notice '没有找到终点';
        end if;
        v_startTarget=0; 
        v_endSource=0;   
    end if ;

    RETURN  QUERY 
        execute 'SELECT  b.* 
                FROM public.pgr_kdijkstraPath(
                ''SELECT objectid as id, pgr_source as source, pgr_target as target, pgr_length as cost 
                FROM '||tbl||' where shape is not null'','    
                ||v_startTarget||', '||'array['||v_endSource||'] , false, false    
                ) a, '||tbl||' b    
                WHERE a.id3=b.objectid
                ORDER by id1';

END 


$function$;

ALTER FUNCTION postgres.analysis_connect(character varying, double precision, double precision, double precision, double precision, double precision)
    OWNER TO postgres;
