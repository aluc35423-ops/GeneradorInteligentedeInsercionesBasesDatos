CREATE DATABASE school;

USE school;

CREATE TABLE alumnos(
    alumnos_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    telefono VARCHAR(20)
);

CREATE TABLE profesor(
    profesor_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    telefono VARCHAR(20),
    especialidad ENUM('matematicas', 'programacion', 'ingles') NOT NULL
);

CREATE TABLE salon(
    salon_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    profesor_id INT,
    alumnos_id INT,
    grupo VARCHAR(25),
    estatus TINYINT NOT NULL,
    CONSTRAINT chk_estatus_salon CHECK (estatus IN (0, 1))
);

ALTER TABLE salon ADD CONSTRAINT FOREIGN KEY (profesor_id) REFERENCES profesor (profesor_id);
ALTER TABLE salon ADD CONSTRAINT FOREIGN KEY (alumnos_id) REFERENCES alumnos (alumnos_id);