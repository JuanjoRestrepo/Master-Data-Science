-- Query C:
-- Obtener la lista de profesores que dictan cursos en dos carreras
-- diferentes. Se deben obtener los siguientes datos: el nombre completo
-- del profesor, el nombre del curso que dicta y el nombre de la carrera a
-- la que pertenece el curso. Pista: averigua cómo funciona la sentencia WITH.

WITH Profesores_Multiples_Carreras AS (
    SELECT
        u.id_usuario AS id_profesor,
        u.nombre || ' ' || u.apellido AS nombre_completo_profesor
    FROM
        Usuarios u
    INNER JOIN Calendario_Cursos cal ON u.id_usuario = cal.id_profesor
    INNER JOIN Cursos_Carreras cc ON cal.id_curso = cc.id_curso
    GROUP BY
        u.id_usuario, u.nombre, u.apellido
    HAVING
        COUNT(DISTINCT cc.id_carrera) = 2
)
SELECT DISTINCT
    pmc.nombre_completo_profesor,
    c.ID_CURSO AS id_curso,
    c.nombre AS nombre_curso,
    ca.nombre AS nombre_carrera
FROM
    Profesores_Multiples_Carreras pmc
INNER JOIN Calendario_Cursos cal ON pmc.id_profesor = cal.id_profesor
INNER JOIN Cursos c ON cal.id_curso = c.id_curso
INNER JOIN Cursos_Carreras cc ON cal.id_curso = cc.id_curso
INNER JOIN Carreras ca ON cc.id_carrera = ca.ID_CARRERA
ORDER BY
    pmc.nombre_completo_profesor,id_curso;
