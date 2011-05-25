--        Map Simplification Program - func.sql
-- 				-> Last Modification : June 30, 2005 - 09:58:08 AM 

--        Copyright (c) 2005 PIERRE Laurent <laurent.pierre@edf.fr>, GARZILLI Damien <garzilld@esiee.fr>

--        This program is free software; you can redistribute it and/or modify
--        it under the terms of the GNU General Public License as published by
--        the Free Software Foundation; either version 2 of the License, or
--        (at your option) any later version.
--      
--        This program is distributed in the hope that it will be useful,
--        but WITHOUT ANY WARRANTY; without even the implied warranty of
--        MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
--        GNU Library General Public License for more details.
--      
--        You should have received a copy of the GNU General Public License
--        along with this program; if not, write to the Free Software
--        Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.

-- function vertex
-- @param : table name, x coordinate as float, y coordinate as float
-- @return : the id of row created in the vertex table
-- Function: vertex(tablename text, float8, float8)

-- DROP FUNCTION vertex(tablename text, float8, float8);

CREATE OR REPLACE FUNCTION vertex(tablename text, seq text, x float8, y float8)
  RETURNS int4 AS
$BODY$
declare
	cx integer ;
	cy integer ;
	resId integer;	
	rec RECORD;
begin	
	cx := round(x);
	cy := round(y);

	FOR rec IN EXECUTE ('SELECT id FROM ' || tablename  || ' WHERE x = ' || cx || ' AND y = ' || cy) LOOP
		resId := rec.id;
	END LOOP;

	if resId is null then
		resId := nextval(seq);
		EXECUTE('INSERT INTO ' || tablename || ' (id,x,y,nref,simplif) VALUES (' || resId || ',' || cx || ',' || cy || ', 1,true)');
	else
		EXECUTE('UPDATE ' || tablename || ' SET nref = nref + 1 WHERE id = ' || resId);
	end if;
	return resId;
end;
$BODY$
  LANGUAGE 'plpgsql' VOLATILE;
ALTER FUNCTION vertex(tablename text, seq text, x float8, y float8) OWNER TO postgres;
