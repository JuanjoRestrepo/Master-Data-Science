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
INNER JOIN Calendario_Cursos calendario ON prof.id = calendario.id_profesor
INNER JOIN Cursos curso ON calendario.id_curso = curso.id_curso
INNER JOIN Facultades fac ON curso.id_facultad = fac.id
WHERE
    fac.nombre LIKE '%Humanidades%'  -- Aquí usamos el nombre para mayor legibilidad
ORDER BY
    prof.nombre, prof.apellido, curso.nombre;

