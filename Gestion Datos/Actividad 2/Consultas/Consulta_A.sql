-- Query A:
-- Listar todos los cursos ofrecidos en la carrera de Ingeniería de
-- Sistemas. Para este caso se debe tener en cuenta que un mismo curso
-- puede ser dictado por profesores diferentes, en salones diferentes y en
-- horarios diferentes. Se deben obtener los siguientes datos: el nombre
-- del curso, el nombre completo del profesor que dicta el curso, el salón
-- en que se dicta el curso y la hora en la que se dicta del curso.

SELECT
    car.nombre AS carrera_nombre,
    carr.semestre,
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
