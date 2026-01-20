-- Query D 
-- Para un estudiante en particular, obtener el listado de cursos que puede matricular. 
-- Para este caso particular se debe tener en cuenta que los cursos se dictan en semestres 
-- diferentes, pertenecen a carreras diferentes y un estudiante no puede matricular un curso 
-- que ya se encuentre matriculado. Se deben obtener los siguientes datos: el nombre del curso, 
-- el nombre de la carrera a la que pertenece y el semestre en el que se ubica. 
-- Pista: averigua el uso de la sentencia NOT EXISTS. 

WITH CarrerasEstudiante AS (
    SELECT id_carrera,id_usuario
    FROM Carreras_Estudiantes
    WHERE id_usuario = :id_estudiante
),
CursosMatriculados AS (
    SELECT cal.id_curso
    FROM Cursos_Estudiantes ce
    INNER JOIN Calendario_Cursos cal ON ce.ID_CALENDARIO = cal.ID_CALENDARIO
    WHERE ce.id_usuario = :id_estudiante
)
SELECT 
    u.nombre || ' ' || u.apellido AS nombre_estudiante,
    cc.ID_CURSO,
    c.nombre AS nombre_curso,
    ca.nombre AS nombre_carrera,
    cc.semestre
FROM
    usuarios u
INNER JOIN CarrerasEstudiante ce ON u.id_usuario = ce.id_usuario
INNER JOIN Carreras ca ON ce.id_carrera = ca.id_carrera
INNER JOIN Cursos_Carreras cc ON ca.id_carrera = cc.id_carrera
INNER JOIN Cursos c ON cc.id_curso = c.id_curso
WHERE
    NOT EXISTS (
        SELECT 1 FROM CursosMatriculados cm WHERE c.id_curso = cm.id_curso
    )
AND u.id_usuario = :id_estudiante
order by cc.SEMESTRE;

-- punto E. Listar los estudiantes que se han inscrito a un curso determinado. Se deben obtener los siguientes datos: el nombre completo del estudiante y el nombre del curso.

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
