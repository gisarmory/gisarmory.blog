
-- buffer函数
CREATE OR REPLACE FUNCTION "postgres"."f_buffer"("in_geojson" text, "in_buffer" float8, "in_type" int4)
  RETURNS SETOF "pg_catalog"."text" AS $BODY$DECLARE
    v_inGeom "public"."geometry";
		v_bufferGeom "public"."geometry";
		v_result text;
BEGIN
	-- 1是测地线方法，2是欧式方法
	if in_type = 1 THEN
			-- geojson字符串转几何对象
			select St_geomfromgeojson(in_geojson) into v_inGeom;
			-- 进行缓冲
			select ST_Buffer(v_inGeom :: geography,in_buffer) into v_bufferGeom;
			-- 把缓冲后的图形转成geojson
			SELECT st_asgeojson(v_bufferGeom) into v_result;

	ELSEIF in_type = 2 THEN
			-- geojson字符串转几何对象
			select St_geomfromgeojson(in_geojson) into v_inGeom;
			-- 定义坐标
			select ST_SetSRID(v_inGeom, 4326) into v_inGeom;
			-- 坐标转换，转为投影坐标
			select ST_Transform(v_inGeom, 3857) into v_inGeom;
			-- 进行缓冲
			select ST_Buffer(v_inGeom,in_buffer) into v_bufferGeom;
			-- 坐标转换，转为wgs84坐标
			SELECT ST_Transform(v_bufferGeom,4326) into v_bufferGeom;
			-- 把几何图形转成geojson
			SELECT st_asgeojson(v_bufferGeom) into v_result;
			
	END IF;

	RETURN next v_result;
END
$BODY$
  LANGUAGE 'plpgsql' VOLATILE COST 100
 ROWS 1000
;
