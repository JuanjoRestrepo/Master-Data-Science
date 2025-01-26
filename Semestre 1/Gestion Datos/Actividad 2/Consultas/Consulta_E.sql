-- Query E. 
-- Listar los estudiantes que se han inscrito a un curso determinado. 
-- Se deben obtener los siguientes datos: el nombre completo del estudiante y el nombre del curso.

   SELECT distinct
   cc.id_curso,
    c.nombre AS nombre_curso,
    u.nombre || ' ' || u.apellido AS nombre_estudiante
FROM
    USUARIOS u
INNER JOIN Cursos_Estudiantes ce ON u.id_usuario = ce.id_usuario
INNER JOIN Calendario_Cursos cc ON ce.id_calendario = cc.id_calendario
INNER JOIN Cursos c ON cc.id_curso = c.id_curso
WHERE
    c.id_curso= :idcurso
    order by nombre_estudiante;