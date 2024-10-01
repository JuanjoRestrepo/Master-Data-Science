-- Query A:
-- Listar todos los cursos ofrecidos en la carrera de Ingeniería de
-- Sistemas. Para este caso se debe tener en cuenta que un mismo curso
-- puede ser dictado por profesores diferentes, en salones diferentes y en
-- horarios diferentes. Se deben obtener los siguientes datos: el nombre
-- del curso, el nombre completo del profesor que dicta el curso, el salón
-- en que se dicta el curso y la hora en la que se dicta del curso.

SELECT
    car.nombre AS carrera_nombre,
    carr.semestre, -- cursos_carreras 
    cal.id_curso,
    cur.nombre AS curso_nombre,
    cal.dia,
    cal.hora_inicio,
    cal.hora_fin,
    prof.nombre || ' ' || prof.apellido AS profesor_completo,
    salon.nombre AS nombre_salon
    
FROM
    Cursos cur
INNER JOIN 
    Cursos_Carreras carr ON cur.id_curso = carr.id_curso
INNER JOIN 
    Calendario_Cursos cal ON cur.id_curso = cal.id_curso
INNER JOIN 
    Salones salon ON cal.id_salon = salon.id_salon
INNER JOIN 
    Usuarios prof ON cal.id_profesor = prof.id_usuario
INNER JOIN 
    Carreras car ON carr.id_carrera = car.id_carrera
WHERE
    car.nombre = 'Ingeniería de Sistemas'
ORDER BY
    carrera_nombre, curso_nombre, cal.hora_inicio;
    
------------------------------------------------------------------------

--Query B: 
-- Obtener la lista de profesores que dictan cursos pertenecientes a la
-- facultad de Humanidades. Se deben obtener los siguientes datos: el
-- nombre completo del profesor y el nombre del curso que dicta..

SELECT 
    fac.nombre AS facultad_nombre,
    curso.nombre AS curso_nombre,
    prof.nombre || ' ' || prof.apellido AS profesor_completo
FROM
    Usuarios prof
INNER JOIN 
    Calendario_Cursos calendario ON prof.id_usuario = calendario.id_profesor
INNER JOIN 
    Cursos curso ON calendario.id_curso = curso.id_curso
INNER JOIN 
    Facultades fac ON curso.id_facultad = fac.id_facultad
WHERE
    fac.nombre LIKE '%Humanidades%'  -- Aquí usamos el nombre para mayor legibilidad
ORDER BY
    prof.nombre, prof.apellido, curso.nombre;

------------------------------------------------------------------------

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

------------------------------------------------------------------------

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









